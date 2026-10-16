import type { AdminDraft, DeletedMedia, MediaTarget, PendingMedia, UploadedMedia } from './content';
import { applyMediaTarget, collectMediaUsage, createEmptyDraft, createPublishedContent, isAdminContent } from './content';
import { publishDraftToGitHub } from './github';
import {
  MEDIA_FOLDERS,
  MEDIA_LIMITS,
  createMediaPath,
  isAllowedPublicMediaPath,
  mediaFolderForPath,
  parseMediaFolder,
  previewContentType,
  repoPathFromPublicPath,
  validateUpload
} from './media';

type KVNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
};

type R2ObjectBody = {
  body: ReadableStream<Uint8Array>;
  size: number;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata: (headers: Headers) => void;
};

type R2Bucket = {
  get: (key: string, options?: { range?: { offset: number; length: number } }) => Promise<R2ObjectBody | null>;
  put: (key: string, value: ReadableStream<Uint8Array>, options: {
    httpMetadata: { contentType: string };
    customMetadata: Record<string, string>;
  }) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
};

type MediaManifestEntry = {
  path: string;
  mimeType: string;
  size: number;
  mediaType: 'image' | 'video';
};

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ADMIN_DRAFTS?: KVNamespace;
  ADMIN_MEDIA_STAGING?: R2Bucket;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  GITHUB_TOKEN?: string;
};

type Session = { username: string; csrfToken: string; expiresAt: number };
type CloudflareContext = { waitUntil: (promise: Promise<unknown>) => void };

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const SESSION_COOKIE = 'zy_admin_session';
const SESSION_TTL = 1000 * 60 * 60 * 8;
const DRAFT_PREFIX = 'draft:v1:';
const PUBLISH_LOG_PREFIX = 'publish-log:v1:';
const MAX_DRAFT_BYTES = 2 * 1024 * 1024;
const MAX_PENDING_MEDIA_BYTES = 100 * 1024 * 1024;
const PUBLISH_LOG_LIMIT = 20;

const json = (value: unknown, status = 200, headers?: HeadersInit): Response => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(headers ?? {})
  }
});

const decodeBase64 = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (digit) => digit.charCodeAt(0));
};

const encodeBase64 = (value: Uint8Array): string => {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const getSessionKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

const signedPayload = async (payload: string, secret: string): Promise<string> => {
  const key = await getSessionKey(secret);
  return encodeBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const parseCookies = (header: string): Record<string, string> => Object.fromEntries(header.split(';').flatMap((segment) => {
  const [name, ...value] = segment.trim().split('=');
  if (!name || !value.length) return [];
  try {
    return [[name, decodeURIComponent(value.join('='))]];
  } catch {
    return [];
  }
}));

const encodeUtf8Base64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const createSession = async (username: string, secret: string): Promise<{ cookie: string; session: Session }> => {
  const session: Session = {
    username,
    csrfToken: crypto.randomUUID().replaceAll('-', ''),
    expiresAt: Date.now() + SESSION_TTL
  };
  const payload = encodeUtf8Base64(JSON.stringify(session));
  return { cookie: `${payload}.${await signedPayload(payload, secret)}`, session };
};

const verifySession = async (request: Request, env: Env): Promise<Session | null> => {
  if (!env.ADMIN_SESSION_SECRET) return null;
  const token = parseCookies(request.headers.get('Cookie') ?? '')[SESSION_COOKIE];
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const key = await getSessionKey(env.ADMIN_SESSION_SECRET);
  const signatureBytes = decodeBase64(signature);
  const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(payload));
  if (!valid) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(decodeBase64(payload))) as Session;
    if (!session.username || !session.csrfToken || !Number.isFinite(session.expiresAt) || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
};

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [algorithm, iterationText, saltText, hashText, extra] = storedHash.split('$');
  const iterations = Number(iterationText);
  if (algorithm !== 'PBKDF2' || extra !== undefined || !Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;
  const salt = decodeBase64(saltText);
  const expected = decodeBase64(hashText);
  if (salt.length < 16 || expected.length !== 32) return false;
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const digest = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256);
  const actual = new Uint8Array(digest);
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
};

const requireOrigin = (request: Request): void => {
  const origin = request.headers.get('Origin');
  if (!origin) throw new HttpError('Origin başlığı gerekli.', 403);
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) throw new HttpError('İstek kaynağı doğrulanamadı.', 403);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('İstek kaynağı doğrulanamadı.', 403);
  }
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new HttpError('Siteler arası istek reddedildi.', 403);
};

const requireSession = async (request: Request, env: Env): Promise<Session> => {
  const session = await verifySession(request, env);
  if (!session) throw new HttpError('Oturum açmanız gerekiyor.', 401);
  return session;
};

const requireCsrf = (request: Request, session: Session): void => {
  requireOrigin(request);
  if (request.headers.get('X-CSRF-Token') !== session.csrfToken) throw new HttpError('CSRF doğrulaması başarısız.', 403);
};

const readJson = async <T>(request: Request, maximumBytes = 2 * 1024 * 1024): Promise<T> => {
  const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
  if (declaredLength > maximumBytes) throw new HttpError('İstek gövdesi izin verilen boyutu aşıyor.', 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) throw new HttpError('İstek gövdesi izin verilen boyutu aşıyor.', 413);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError('Geçerli JSON gövdesi gerekli.', 400);
  }
};

const requireBindings = (env: Env): { drafts: KVNamespace; media: R2Bucket } => {
  if (!env.ADMIN_DRAFTS || !env.ADMIN_MEDIA_STAGING) {
    throw new HttpError('Admin KV ve R2 depolama binding’leri yapılandırılmamış.', 503);
  }
  return { drafts: env.ADMIN_DRAFTS, media: env.ADMIN_MEDIA_STAGING };
};

const draftKey = (username: string): string => `${DRAFT_PREFIX}${encodeURIComponent(username)}`;
const logKey = (username: string): string => `${PUBLISH_LOG_PREFIX}${encodeURIComponent(username)}`;

const loadDraft = async (env: Env, username: string): Promise<AdminDraft> => {
  const { drafts } = requireBindings(env);
  const stored = await drafts.get(draftKey(username));
  if (!stored) return createEmptyDraft();
  try {
    const draft = JSON.parse(stored) as AdminDraft;
    if (draft.version !== 1 || !isAdminContent(draft.content) || !Array.isArray(draft.pendingMedia) || !Array.isArray(draft.deletedMedia)) {
      throw new Error('Invalid draft document.');
    }
    if (!isAdminContent(draft.publishedContent)) draft.publishedContent = createPublishedContent();
    return draft;
  } catch {
    throw new HttpError('Kalıcı taslak okunamadı; kayıt biçimi geçersiz.', 500);
  }
};

const storeDraft = async (env: Env, username: string, draft: AdminDraft): Promise<void> => {
  const { drafts } = requireBindings(env);
  draft.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(draft);
  if (new TextEncoder().encode(serialized).byteLength > MAX_DRAFT_BYTES) {
    throw new HttpError('Taslak KV için çok büyük; büyük dosyalar medya staging deposunda tutulur.', 413);
  }
  await drafts.put(draftKey(username), serialized);
};

const loadPublishLog = async (env: Env, username: string): Promise<Array<{ timestamp: string; username: string; commitSha: string; message: string; url?: string }>> => {
  const { drafts } = requireBindings(env);
  const value = await drafts.get(logKey(username));
  if (!value) return [];
  try {
    const entries = JSON.parse(value) as Array<{ timestamp: string; username: string; commitSha: string; message: string; url?: string }>;
    if (!Array.isArray(entries)) throw new Error('Invalid log.');
    return entries.slice(0, PUBLISH_LOG_LIMIT);
  } catch {
    throw new HttpError('Yayın geçmişi kaydı okunamadı.', 500);
  }
};

const storePublishLog = async (
  env: Env,
  username: string,
  entry: { timestamp: string; username: string; commitSha: string; message: string; url?: string }
): Promise<void> => {
  const { drafts } = requireBindings(env);
  const entries = await loadPublishLog(env, username);
  await drafts.put(logKey(username), JSON.stringify([entry, ...entries].slice(0, PUBLISH_LOG_LIMIT)));
};

const loadMediaManifest = async (request: Request, env: Env): Promise<MediaManifestEntry[]> => {
  const manifestUrl = new URL('/admin-media-manifest.json', request.url);
  const response = await env.ASSETS.fetch(new Request(manifestUrl));
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new HttpError('Yayınlanmış medya envanteri üretim build’inde bulunamadı.', 503);
  }
  const manifest = await response.json() as { files?: MediaManifestEntry[] };
  if (!Array.isArray(manifest.files)) throw new HttpError('Medya envanteri biçimi geçersiz.', 500);
  return manifest.files.filter((item) => isAllowedPublicMediaPath(item.path));
};

const mediaUrlFromRepoPath = (repoPath: string): string => repoPath.replace(/^public/, '');

const getMediaFiles = async (request: Request, env: Env, username: string): Promise<Array<Record<string, unknown>>> => {
  const draft = await loadDraft(env, username);
  const manifest = await loadMediaManifest(request, env);
  const deleted = new Set(draft.deletedMedia.map(({ path }) => path));
  const byPath = new Map<string, Record<string, unknown>>();

  for (const item of manifest) {
    if (deleted.has(item.path)) continue;
    const usage = collectMediaUsage(draft.content, item.path);
    byPath.set(item.path, {
      ...item,
      folder: MEDIA_FOLDERS[mediaFolderForPath(item.path)!].label,
      pending: false,
      pendingDelete: false,
      previewUrl: item.path,
      usage
    });
  }

  for (const file of draft.pendingMedia) {
    byPath.set(file.path, {
      path: file.path,
      mimeType: file.mimeType,
      size: file.size,
      mediaType: file.mediaType,
      folder: MEDIA_FOLDERS[mediaFolderForPath(file.path)!].label,
      pending: true,
      pendingDelete: false,
      previewUrl: `/api/admin/media/preview?path=${encodeURIComponent(file.path)}`,
      usage: collectMediaUsage(draft.content, file.path)
    });
  }

  for (const item of draft.deletedMedia) {
    byPath.set(item.path, {
      path: item.path,
      mimeType: previewContentType(item.path),
      mediaType: previewContentType(item.path)?.startsWith('video/') ? 'video' : 'image',
      size: 0,
      folder: MEDIA_FOLDERS[mediaFolderForPath(item.path)!].label,
      pending: false,
      pendingDelete: true,
      previewUrl: item.path,
      usage: []
    });
  }
  return [...byPath.values()].sort((a, b) => String(a.path).localeCompare(String(b.path)));
};

const parseTarget = (text: string): MediaTarget => {
  if (!text) return { kind: 'none' };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new HttpError('Medya hedefi geçerli JSON değil.', 400);
  }
  if (!value || typeof value !== 'object' || typeof (value as { kind?: unknown }).kind !== 'string') {
    throw new HttpError('Medya hedefi eksik veya geçersiz.', 400);
  }
  const target = value as Record<string, unknown>;
  const nonEmpty = (field: string): string => {
    const fieldValue = target[field];
    if (typeof fieldValue !== 'string' || !fieldValue.trim()) throw new HttpError('Medya hedef alanı geçersiz.', 400);
    return fieldValue;
  };
  if (target.kind === 'none') return { kind: 'none' };
  if (target.kind === 'service') {
    const field = target.field;
    if (field !== 'primary' && field !== 'gallery') throw new HttpError('Hizmet görsel alanı geçersiz.', 400);
    const index = target.index;
    if (index !== undefined && (!Number.isInteger(index) || Number(index) < 0)) throw new HttpError('Galeri sırası geçersiz.', 400);
    return { kind: 'service', serviceId: nonEmpty('serviceId'), field, ...(index === undefined ? {} : { index: Number(index) }) };
  }
  if (target.kind === 'project-image' || target.kind === 'promotion-image') {
    const categoryId = nonEmpty('categoryId');
    const photoId = target.photoId;
    if (photoId !== undefined && (typeof photoId !== 'string' || !photoId)) throw new HttpError('Görsel kimliği geçersiz.', 400);
    return target.kind === 'project-image'
      ? { kind: 'project-image', categoryId, ...(typeof photoId === 'string' ? { photoId } : {}) }
      : { kind: 'promotion-image', categoryId, ...(typeof photoId === 'string' ? { photoId } : {}) };
  }
  if (target.kind === 'project-video') {
    const numberField = (field: string, fallback: number, maximum: number): number => {
      const fieldValue = target[field];
      if (fieldValue === undefined) return fallback;
      if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue) || fieldValue < 0 || fieldValue > maximum) {
        throw new HttpError(`Video ${field} değeri geçersiz.`, 400);
      }
      return fieldValue;
    };
    const poster = target.poster;
    if (poster !== undefined && typeof poster !== 'string') throw new HttpError('Video posteri geçersiz.', 400);
    const videoId = target.videoId;
    if (videoId !== undefined && (typeof videoId !== 'string' || !videoId.trim())) throw new HttpError('Video kimliği geçersiz.', 400);
    const width = numberField('width', 1280, 20_000);
    const height = numberField('height', 720, 20_000);
    const durationSeconds = numberField('durationSeconds', 0, 86_400);
    if (width < 1 || height < 1 || durationSeconds <= 0) throw new HttpError('Video ölçüleri ve süresi gerekli.', 400);
    return {
      kind: 'project-video',
      categoryId: nonEmpty('categoryId'),
      ...(typeof videoId === 'string' ? { videoId } : {}),
      ...(typeof poster === 'string' && poster ? { poster } : {}),
      width,
      height,
      durationSeconds
    };
  }
  throw new HttpError('Bu medya hedefi desteklenmiyor.', 400);
};

const assertTargetMatchesFolder = (target: MediaTarget, folder: string): void => {
  const expected = target.kind === 'service' ? 'services'
    : target.kind === 'project-image' ? 'project-examples'
      : target.kind === 'promotion-image' ? 'promotions'
        : target.kind === 'project-video' ? 'videos'
          : null;
  if (expected && expected !== folder) throw new HttpError('Seçilen medya klasörü içerik hedefiyle eşleşmiyor.', 400);
  if (target.kind === 'project-video' && folder !== 'videos') throw new HttpError('Video yalnızca video klasörüne yüklenebilir.', 400);
  if (target.kind === 'none' && folder === 'videos') return;
};

const validatePoster = async (
  request: Request,
  env: Env,
  draft: AdminDraft,
  poster: string | undefined
): Promise<void> => {
  if (!poster) return;
  if (!isAllowedPublicMediaPath(poster) || !/\.(?:jpe?g|png|webp)$/i.test(poster)) {
    throw new HttpError('Poster yalnızca izinli bir görsel medya dosyası olabilir.', 400);
  }
  if (draft.pendingMedia.some((item) => item.path === poster)) return;
  const manifest = await loadMediaManifest(request, env);
  if (!manifest.some((item) => item.path === poster && item.mediaType === 'image')) {
    throw new HttpError('Seçilen video posteri medya kütüphanesinde bulunamadı.', 400);
  }
};

const uploadMedia = async (request: Request, env: Env, username: string): Promise<Response> => {
  const { media } = requireBindings(env);
  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > MEDIA_LIMITS.videoBytes + 1024 * 1024) throw new HttpError('Yükleme 50 MB sınırını aşıyor.', 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError('Multipart form verisi okunamadı.', 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError('Yüklenecek dosya seçilmedi.', 400);
  const folder = parseMediaFolder(String(form.get('folder') ?? ''));
  if (!folder) throw new HttpError('Hedef klasör izinli değil.', 400);
  const target = parseTarget(String(form.get('target') ?? ''));
  assertTargetMatchesFolder(target, MEDIA_FOLDERS[folder].path);
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  let validated: ReturnType<typeof validateUpload>;
  try {
    validated = validateUpload(file.name, file.type, file.size, header);
  } catch (error) {
    throw new HttpError(error instanceof Error ? error.message : 'Yüklenen medya doğrulanamadı.', 400);
  }
  if (MEDIA_FOLDERS[folder].mediaType !== validated.mediaType) {
    throw new HttpError('Dosya türü seçilen klasörle eşleşmiyor.', 400);
  }
  const width = Number(form.get('width') ?? 0);
  const height = Number(form.get('height') ?? 0);
  if (validated.mediaType === 'image' && (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20_000 || height > 20_000)) {
    throw new HttpError('Görsel ölçüleri doğrulanamadı; önizleme yüklenmesini bekleyip yeniden deneyin.', 400);
  }
  const pathInfo = createMediaPath(folder, file.name);
  const uploaded: UploadedMedia = {
    ...pathInfo,
    mimeType: validated.mimeType,
    size: file.size,
    mediaType: validated.mediaType,
    ...(validated.mediaType === 'image' ? { width, height } : {})
  };
  const draft = await loadDraft(env, username);
  if (draft.pendingMedia.reduce((size, item) => size + item.size, 0) + file.size > MAX_PENDING_MEDIA_BYTES) {
    throw new HttpError('Taslak medya kotası 100 MB; önce bazı medyaları yayınlayın veya kaldırın.', 413);
  }
  if (target.kind === 'project-video') await validatePoster(request, env, draft, target.poster);
  try {
    applyMediaTarget(draft.content, target, uploaded);
  } catch (error) {
    throw new HttpError(error instanceof Error ? error.message : 'Medya hedefi uygulanamadı.', 400);
  }
  const stageKey = `drafts/${encodeURIComponent(username)}/${crypto.randomUUID()}`;
  await media.put(stageKey, file.stream(), {
    httpMetadata: { contentType: uploaded.mimeType },
    customMetadata: { username, path: uploaded.path, originalName: file.name, uploadedAt: new Date().toISOString() }
  });
  const pending: PendingMedia = { ...uploaded, stageKey, uploadedAt: new Date().toISOString() };
  draft.pendingMedia.push(pending);
  draft.deletedMedia = draft.deletedMedia.filter((item) => item.path !== uploaded.path);
  try {
    await storeDraft(env, username, draft);
  } catch (error) {
    await media.delete(stageKey);
    throw error;
  }
  return json({
    ok: true,
    path: uploaded.path,
    mimeType: uploaded.mimeType,
    size: uploaded.size,
    mediaType: uploaded.mediaType,
    pending: true
  }, 201);
};

const deleteMedia = async (request: Request, env: Env, username: string): Promise<Response> => {
  const { media } = requireBindings(env);
  const payload = await readJson<{ path?: string }>(request, 16 * 1024);
  const path = String(payload.path ?? '');
  const repoPath = repoPathFromPublicPath(path);
  const folder = mediaFolderForPath(path);
  if (!repoPath || !folder || folder === 'brand') throw new HttpError('Medya yolu silme izni dışında.', 400);

  const draft = await loadDraft(env, username);
  const usage = collectMediaUsage(draft.content, path);
  if (usage.length) {
    throw new HttpError(`Bu dosya şu içeriklerde kullanılıyor: ${usage.join('; ')}. Önce içerik bağlantısını kaldırın.`, 409);
  }

  const pending = draft.pendingMedia.find((item) => item.path === path);
  if (pending) {
    await media.delete(pending.stageKey);
    draft.pendingMedia = draft.pendingMedia.filter((item) => item.path !== path);
    draft.deletedMedia = draft.deletedMedia.filter((item) => item.path !== path);
    await storeDraft(env, username, draft);
    return json({ ok: true, deleted: path, staged: true });
  }

  const manifest = await loadMediaManifest(request, env);
  if (!manifest.some((item) => item.path === path)) throw new HttpError('Medya dosyası bulunamadı.', 404);
  if (!draft.deletedMedia.some((item) => item.path === path)) {
    const deleted: DeletedMedia = { path, repoPath, deletedAt: new Date().toISOString() };
    draft.deletedMedia.push(deleted);
    await storeDraft(env, username, draft);
  }
  return json({ ok: true, deleted: path, staged: false, pendingPublish: true });
};

const previewMedia = async (request: Request, env: Env, username: string): Promise<Response> => {
  const { media } = requireBindings(env);
  const path = new URL(request.url).searchParams.get('path') ?? '';
  if (!isAllowedPublicMediaPath(path)) throw new HttpError('Medya yolu izinli değil.', 400);
  const draft = await loadDraft(env, username);
  const pending = draft.pendingMedia.find((item) => item.path === path);
  if (!pending) throw new HttpError('Yalnızca oturumunuza ait bekleyen medya önizlenebilir.', 404);

  const rangeHeader = request.headers.get('Range');
  let range: { offset: number; length: number } | undefined;
  let rangeStart = 0;
  let rangeEnd = pending.size - 1;
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${pending.size}` } });
    rangeStart = Number(match[1]);
    rangeEnd = match[2] ? Number(match[2]) : pending.size - 1;
    if (rangeStart >= pending.size || rangeEnd < rangeStart) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${pending.size}` } });
    }
    rangeEnd = Math.min(rangeEnd, pending.size - 1);
    range = { offset: rangeStart, length: rangeEnd - rangeStart + 1 };
  }
  const object = await media.get(pending.stageKey, range ? { range } : undefined);
  if (!object) throw new HttpError('Staging dosyası bulunamadı.', 404);
  const responseHeaders = new Headers({
    'Content-Type': pending.mimeType,
    'Content-Length': String(range ? range.length : pending.size),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    'Content-Disposition': `inline; filename="${pending.filename}"`
  });
  if (range) responseHeaders.set('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${pending.size}`);
  return new Response(object.body, { status: range ? 206 : 200, headers: responseHeaders });
};

const saveContent = async (request: Request, env: Env, username: string): Promise<Response> => {
  const payload = await readJson<{ section?: string; key?: string; data?: unknown; content?: unknown }>(request);
  const draft = await loadDraft(env, username);
  if (payload.content !== undefined) {
    if (!isAdminContent(payload.content)) throw new HttpError('Taslak içerik şeması geçersiz.', 400);
    draft.content = payload.content;
  } else {
    const section = String(payload.section ?? payload.key ?? '');
    if (!['site', 'services', 'projects', 'promotions', 'seo'].includes(section) || payload.data === undefined) {
      throw new HttpError('Desteklenen bölüm ve içerik verisi gerekli.', 400);
    }
    const next = { ...draft.content, [section]: payload.data };
    if (!isAdminContent(next)) throw new HttpError('Taslak içerik şeması geçersiz.', 400);
    draft.content = next;
  }
  const reintroducedDelete = draft.deletedMedia.find(({ path }) => collectMediaUsage(draft.content, path).length > 0);
  if (reintroducedDelete) {
    throw new HttpError(`Silinmek üzere işaretlenen medya yeniden kullanılıyor: ${reintroducedDelete.path}`, 409);
  }
  await storeDraft(env, username, draft);
  return json({ ok: true, savedAt: draft.updatedAt, pendingMedia: draft.pendingMedia.length });
};

const publish = async (request: Request, env: Env, username: string): Promise<Response> => {
  if (!env.GITHUB_TOKEN) throw new HttpError('GITHUB_TOKEN yapılandırılmamış; yayınlama devre dışı.', 503);
  const payload = await readJson<{ message?: string }>(request, 16 * 1024);
  const message = String(payload.message ?? '').trim();
  if (!message || message.length > 120) throw new HttpError('Yayın commit mesajı 1–120 karakter olmalı.', 400);
  const draft = await loadDraft(env, username);
  const result = await publishDraftToGitHub(env, draft, username, message);
  if (!result.ok) return json({ ok: false, error: result.error, baseSha: result.baseSha }, result.conflict ? 409 : 502);
  if (!result.sha) throw new HttpError('GitHub commit SHA eksik.', 502);

  const warnings: string[] = [];
  try {
    await storePublishLog(env, username, {
      timestamp: new Date().toISOString(),
      username,
      commitSha: result.sha,
      message,
      ...(result.url ? { url: result.url } : {})
    });
  } catch (error) {
    const warning = `Commit kaydedildi, yayın geçmişi yazılamadı: ${error instanceof Error ? error.message : 'bilinmeyen hata'}`;
    warnings.push(warning);
    console.error(warning);
  }

  for (const file of draft.pendingMedia) {
    try {
      await env.ADMIN_MEDIA_STAGING?.delete(file.stageKey);
    } catch (error) {
      const warning = `Commit kaydedildi, staging temizliği başarısız (${file.filename}): ${error instanceof Error ? error.message : 'bilinmeyen hata'}`;
      warnings.push(warning);
      console.error(warning);
    }
  }
  const cleanDraft: AdminDraft = {
    version: 1,
    content: draft.content,
    publishedContent: structuredClone(draft.content),
    pendingMedia: [],
    deletedMedia: [],
    updatedAt: new Date().toISOString()
  };
  try {
    await storeDraft(env, username, cleanDraft);
  } catch (error) {
    const warning = `Commit kaydedildi, taslak sıfırlanamadı: ${error instanceof Error ? error.message : 'bilinmeyen hata'}`;
    warnings.push(warning);
    console.error(warning);
  }
  return json({
    ok: true,
    commitSha: result.sha,
    commitUrl: result.url ?? `https://github.com/akinarslan/zy_reklam/commit/${result.sha}`,
    baseSha: result.baseSha,
    cloudflareDeploy: 'GitHub commit oluşturuldu; Cloudflare Workers Builds durumunu bu Worker doğrudan doğrulamıyor.',
    warnings
  });
};

const handleApi = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname === '/api/admin/login') {
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
    requireOrigin(request);
    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.ADMIN_SESSION_SECRET) {
      throw new HttpError('Admin authentication secrets are not configured.', 503);
    }
    const payload = await readJson<{ username?: string; password?: string }>(request, 16 * 1024);
    const validPassword = await verifyPassword(payload.password ?? '', env.ADMIN_PASSWORD_HASH);
    if (payload.username !== env.ADMIN_USERNAME || !validPassword) throw new HttpError('Kullanıcı adı veya parola geçersiz.', 401);
    const created = await createSession(env.ADMIN_USERNAME, env.ADMIN_SESSION_SECRET);
    return json(
      { ok: true, username: created.session.username, csrfToken: created.session.csrfToken },
      200,
      { 'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(created.cookie)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL / 1000)}` }
    );
  }

  if (url.pathname === '/api/admin/session') {
    if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET' });
    const session = await verifySession(request, env);
    return json({
      authenticated: !!session,
      username: session?.username ?? null,
      csrfToken: session?.csrfToken ?? null
    });
  }

  if (!url.pathname.startsWith('/api/admin/')) return env.ASSETS.fetch(request);
  const session = await requireSession(request, env);
  if (request.method !== 'GET') requireCsrf(request, session);

  if (url.pathname === '/api/admin/logout') {
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
    return json({ ok: true }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` });
  }

  if (url.pathname === '/api/admin/draft' || url.pathname === '/api/admin/content') {
    if (request.method === 'GET') {
      const draft = await loadDraft(env, session.username);
      return json({
          ...draft.content,
          publishedContent: draft.publishedContent,
          pendingMedia: draft.pendingMedia.map((item) => {
            const { stageKey: _stageKey, ...metadata } = item;
            return metadata;
          }),
        deletedMedia: draft.deletedMedia,
        updatedAt: draft.updatedAt
      });
    }
    if (request.method === 'PUT') return saveContent(request, env, session.username);
    return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET, PUT' });
  }

  if (url.pathname === '/api/admin/media') {
    if (request.method === 'GET') {
      return json({ files: await getMediaFiles(request, env, session.username) });
    }
    if (request.method === 'POST') return uploadMedia(request, env, session.username);
    if (request.method === 'DELETE') return deleteMedia(request, env, session.username);
    return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET, POST, DELETE' });
  }

  if (url.pathname === '/api/admin/media/usage') {
    if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET' });
    const path = url.searchParams.get('path') ?? '';
    if (!isAllowedPublicMediaPath(path)) throw new HttpError('Medya yolu izinli değil.', 400);
    const draft = await loadDraft(env, session.username);
    return json({ path, usage: collectMediaUsage(draft.content, path) });
  }

  if (url.pathname === '/api/admin/media/preview') {
    if (request.method !== 'GET' && request.method !== 'HEAD') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET, HEAD' });
    const response = await previewMedia(request, env, session.username);
    if (request.method === 'HEAD') return new Response(null, { status: response.status, headers: response.headers });
    return response;
  }

  if (url.pathname === '/api/admin/publish') {
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
    return publish(request, env, session.username);
  }

  if (url.pathname === '/api/admin/publish-log') {
    if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET' });
    return json({ entries: await loadPublishLog(env, session.username) });
  }

  if (url.pathname === '/api/admin/status') {
    if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'GET' });
    const draft = await loadDraft(env, session.username);
    const log = await loadPublishLog(env, session.username);
    const sections: Array<keyof AdminDraft['content']> = ['site', 'services', 'projects', 'promotions', 'seo'];
    const changedSections = sections.filter((section) =>
      JSON.stringify(draft.content[section]) !== JSON.stringify(draft.publishedContent[section]));
    return json({
      authenticated: true,
      username: session.username,
      hasPendingDraft: changedSections.length > 0 || draft.pendingMedia.length > 0 || draft.deletedMedia.length > 0,
      pendingMedia: draft.pendingMedia.length,
      deletedMedia: draft.deletedMedia.length,
      changedSections,
      lastPublish: log[0] ?? null,
      maxPendingBytes: MAX_PENDING_MEDIA_BYTES,
      uploadLimits: MEDIA_LIMITS
    });
  }

  return json({ ok: false, error: 'Not found' }, 404);
};

export default {
  async fetch(request: Request, env: Env, _ctx: CloudflareContext): Promise<Response> {
    try {
      return await handleApi(request, env);
    } catch (error) {
      if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status);
      console.error('Admin Worker request failed:', error);
      return json({ ok: false, error: 'İstek tamamlanamadı; sunucu günlüklerini kontrol edin.' }, 500);
    }
  }
}
