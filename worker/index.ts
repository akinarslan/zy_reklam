import servicesData from '../src/content/services.json';
import projectsData from '../src/content/projects.json';
import promotionsData from '../src/content/promotions.json';
import seoData from '../src/content/seo.json';
import siteData from '../src/content/site.json';

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  GITHUB_TOKEN?: string;
};

type CloudflareContext = {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
};

type DraftState = {
  site: typeof siteData.site;
  services: typeof servicesData;
  projects: typeof projectsData;
  promotions: typeof promotionsData;
  seo: typeof seoData;
};

const contentState: DraftState = {
  site: structuredClone(siteData.site),
  services: structuredClone(servicesData),
  projects: structuredClone(projectsData),
  promotions: structuredClone(promotionsData),
  seo: structuredClone(seoData)
};

const mediaFiles = new Map<string, { path: string; mimeType: string; size: number; data: ArrayBuffer; uploadedAt: string; }>();
const SESSION_COOKIE = 'zy_admin_session';
const SESSION_TTL = 1000 * 60 * 60 * 8;

const safeJson = (value: unknown, init?: ResponseInit): Response => new Response(JSON.stringify(value), {
  ...init,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...(init?.headers ?? {})
  }
});

const decodeBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (digit) => digit.charCodeAt(0));
};

const encodeBase64Url = (value: Uint8Array): string => {
  let binary = '';
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const getSecretKey = async (secret: string) => {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(secret);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
};

const signMessage = async (secret: string, message: string): Promise<string> => {
  const key = await getSecretKey(secret);
  const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return encodeBase64Url(new Uint8Array(hash));
};

const createSessionCookie = async (username: string, secret: string): Promise<string> => {
  const payload = { username, expiresAt: Date.now() + SESSION_TTL };
  const encoded = btoa(JSON.stringify(payload));
  const signature = await signMessage(secret, encoded);
  return `${encoded}.${signature}`;
};

const parseCookies = (cookieHeader: string): Record<string, string> => {
  return Object.fromEntries(cookieHeader.split(';').flatMap((segment) => {
    const trimmed = segment.trim();
    if (!trimmed) {
      return [];
    }
    const [name, ...rest] = trimmed.split('=');
    if (!name || !rest.length) {
      return [];
    }
    return [[name, decodeURIComponent(rest.join('='))]];
  }));
};

const verifySession = async (request: Request, env: Env): Promise<{ authenticated: boolean; username?: string } | null> => {
  const secret = env.ADMIN_SESSION_SECRET || '';
  if (!secret) {
    return null;
  }

  const rawValue = parseCookies(request.headers.get('Cookie') || '')[SESSION_COOKIE];
  if (!rawValue) {
    return null;
  }

  const [payload, signature] = rawValue.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signMessage(secret, payload);
  if (expectedSignature !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(atob(payload)) as { username?: string; expiresAt?: number };
    if (!parsed.username || !parsed.expiresAt || Number(parsed.expiresAt) < Date.now()) {
      return null;
    }
    return { authenticated: true, username: parsed.username };
  } catch {
    return null;
  }
};

const parseJsonBody = async <T>(request: Request): Promise<T> => {
  const text = await request.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
};

const verifyPassword = async (password: string, hashString: string): Promise<boolean> => {
  const parts = hashString.split('$');
  if (parts.length !== 4 || parts[0] !== 'PBKDF2') {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = decodeBase64Url(parts[2]);
  const expectedHash = decodeBase64Url(parts[3]);

  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
  const derivedHash = new Uint8Array(derived);

  return derivedHash.length === expectedHash.length && Array.from(derivedHash).every((byte, index) => byte === expectedHash[index]);
};

const isSafeRelativePath = (input: string): boolean => {
  if (!input || input.startsWith('/') || input.startsWith('\\')) {
    return false;
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  })();

  if (decoded.includes('..') || decoded.includes('\\') || decoded.includes('%2e')) {
    return false;
  }

  const normalized = decoded.replace(/\\/g, '/');
  const allowedPrefixes = [
    'src/content/',
    'public/assets/services/',
    'public/assets/project-examples/',
    'public/assets/promotions/',
    'public/assets/showroom/'
  ];

  const forbidden = [
    /^\.github\//,
    /^worker\//,
    /^scripts\//,
    /^package\.json$/,
    /^wrangler\.jsonc$/,
    /^AGENTS\.md$/,
    /^ARCHITECTURE\.md$/,
    /^ROADMAP\.md$/,
    /^src\/.*\.(ts|css)$/
  ];

  const isAllowed = allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
  return isAllowed && !forbidden.some((pattern) => pattern.test(normalized));
};

const isSafeMediaPath = (input: string): boolean => {
  if (!isSafeRelativePath(input)) {
    return false;
  }

  let normalized: string;
  try {
    normalized = decodeURIComponent(input);
  } catch {
    return false;
  }
  return [
    'public/assets/services/',
    'public/assets/project-examples/',
    'public/assets/promotions/',
    'public/assets/showroom/'
  ].some((prefix) => normalized.startsWith(prefix));
};

const authRequired = async (request: Request, env: Env): Promise<Response | null> => {
  const session = await verifySession(request, env);
  if (!session || !session.authenticated) {
    return safeJson({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
};

const getGithubHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'zy-reklam-admin-worker'
});

const buildGitHubFiles = (payload: Record<string, unknown>) => {
  const files: Array<{ path: string; content: string; encoding: 'utf-8' | 'base64' }> = [];

  const addJson = (path: string, value: unknown) => {
    files.push({ path, content: `${JSON.stringify(value, null, 2)}\n`, encoding: 'utf-8' });
  };

  const addBinary = (path: string, base64Data: string) => {
    if (!isSafeMediaPath(path)) {
      throw new Error('Unsafe media path');
    }

    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(base64Data);
    if (!match) {
      throw new Error('Unsupported media data');
    }

    const extension = path.split('.').pop()?.toLowerCase();
    const expectedMime = extension === 'jpg' || extension === 'jpeg'
      ? 'image/jpeg'
      : extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : null;
    const bytes = atob(match[2]);
    if (match[1] !== expectedMime || bytes.length > 8 * 1024 * 1024) {
      throw new Error('Media type or size is invalid');
    }
    files.push({ path, content: match[2], encoding: 'base64' });
  };

  addJson('src/content/site.json', payload.site ?? contentState.site);
  addJson('src/content/services.json', payload.services ?? contentState.services);
  addJson('src/content/projects.json', payload.projects ?? contentState.projects);
  addJson('src/content/promotions.json', payload.promotions ?? contentState.promotions);
  addJson('src/content/seo.json', payload.seo ?? contentState.seo);

  const mediaMap = payload.media as Record<string, string> | undefined;
  if (mediaMap) {
    Object.entries(mediaMap).forEach(([path, value]) => {
      if (typeof value !== 'string') {
        throw new Error('Invalid media payload');
      }
      addBinary(path, value);
    });
  }

  return files;
};

const publishToGitHub = async (env: Env, payload: Record<string, unknown>): Promise<{ ok: boolean; sha?: string; error?: string }> => {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return { ok: false, error: 'GITHUB_TOKEN missing' };
  }

  const owner = 'akinarslan';
  const repo = 'zy_reklam';

  try {
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers: getGithubHeaders(token)
    });
    if (!refResponse.ok) {
      return { ok: false, error: `Unable to read GitHub main ref (${refResponse.status})` };
    }
    const refJson = await refResponse.json() as { object?: { sha?: string } };
    const baseSha = refJson.object?.sha;
    if (!baseSha) {
      return { ok: false, error: 'GitHub main ref missing SHA' };
    }

    const requestedBase = typeof payload.baseSha === 'string' ? payload.baseSha : '';
    if (requestedBase && requestedBase !== baseSha) {
      return { ok: false, error: `Fast-forward conflict. Current main SHA: ${baseSha}` };
    }

    const blobShas: Array<{ path: string; sha: string }> = [];
    const files = buildGitHubFiles(payload);

    for (const file of files) {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: { ...getGithubHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: file.content,
          encoding: file.encoding
        })
      });

      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: `Blob create failed: ${text}` };
      }

      const blobJson = await response.json() as { sha?: string };
      if (!blobJson.sha) {
        return { ok: false, error: 'Blob sha missing' };
      }

      blobShas.push({ path: file.path, sha: blobJson.sha });
    }

    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: { ...getGithubHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_tree: baseSha,
        tree: blobShas.map((entry) => ({
          path: entry.path,
          mode: '100644',
          type: 'blob',
          sha: entry.sha
        }))
      })
    });

    if (!treeResponse.ok) {
      const text = await treeResponse.text();
      return { ok: false, error: `Git tree create failed: ${text}` };
    }

    const treeJson = await treeResponse.json() as { sha?: string };
    if (!treeJson.sha) {
      return { ok: false, error: 'Tree sha missing' };
    }

    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: { ...getGithubHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: typeof payload.message === 'string' ? payload.message : 'Admin content sync via worker',
        tree: treeJson.sha,
        parents: [baseSha]
      })
    });

    if (!commitResponse.ok) {
      const text = await commitResponse.text();
      return { ok: false, error: `Commit create failed: ${text}` };
    }

    const commitJson = await commitResponse.json() as { sha?: string };
    if (!commitJson.sha) {
      return { ok: false, error: 'Commit sha missing' };
    }

    const refUpdateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: { ...getGithubHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commitJson.sha, force: false })
    });

    if (!refUpdateResponse.ok) {
      const text = await refUpdateResponse.text();
      return { ok: false, error: `Ref update failed: ${text}` };
    }

    return { ok: true, sha: commitJson.sha };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown publish error' };
  }
};

const handleApi = async (request: Request, env: Env): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie'
      }
    });
  }

  const url = new URL(request.url);

  if (url.pathname === '/api/admin/login') {
    if (request.method !== 'POST') {
      return safeJson({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.ADMIN_SESSION_SECRET) {
      return safeJson({ ok: false, error: 'Admin authentication secrets are not configured' }, { status: 503 });
    }

    const payload = await parseJsonBody<{ username?: string; password?: string }>(request);
    const username = env.ADMIN_USERNAME;
    if (payload.username !== username || !(await verifyPassword(payload.password || '', env.ADMIN_PASSWORD_HASH))) {
      return safeJson({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const cookieValue = await createSessionCookie(username, env.ADMIN_SESSION_SECRET);
    return new Response(JSON.stringify({ ok: true, username }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(cookieValue)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL / 1000)}`
      }
    });
  }

  if (url.pathname === '/api/admin/logout') {
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
      }
    });
  }

  if (url.pathname === '/api/admin/session') {
    const session = await verifySession(request, env);
    return safeJson({ authenticated: !!session?.authenticated, username: session?.username || null });
  }

  if (url.pathname === '/api/admin/content') {
    const unauthorized = await authRequired(request, env);
    if (unauthorized) {
      return unauthorized;
    }

    if (request.method === 'GET') {
      return safeJson({
        site: contentState.site,
        services: contentState.services,
        projects: contentState.projects,
        promotions: contentState.promotions,
        seo: contentState.seo
      });
    }

    if (request.method === 'PUT') {
      const payload = await parseJsonBody<Record<string, unknown>>(request);
      const section = String(payload.section || payload.key || '').trim();
      const incoming = payload.data as Record<string, unknown> | undefined;
      if (!section || !incoming) {
        return safeJson({ ok: false, error: 'section and data are required' }, { status: 400 });
      }

      if (section === 'site') {
        contentState.site = incoming as typeof contentState.site;
      } else if (section === 'services') {
        contentState.services = incoming as typeof contentState.services;
      } else if (section === 'projects') {
        contentState.projects = incoming as typeof contentState.projects;
      } else if (section === 'promotions') {
        contentState.promotions = incoming as typeof contentState.promotions;
      } else if (section === 'seo') {
        contentState.seo = incoming as typeof contentState.seo;
      } else {
        return safeJson({ ok: false, error: 'Unsupported content section' }, { status: 400 });
      }

      return safeJson({ ok: true, section, savedAt: new Date().toISOString() });
    }
  }

  if (url.pathname === '/api/admin/media') {
    const unauthorized = await authRequired(request, env);
    if (unauthorized) {
      return unauthorized;
    }

    if (request.method === 'GET') {
      return safeJson({ files: Array.from(mediaFiles.values()).map((file) => ({ path: file.path, mimeType: file.mimeType, size: file.size, uploadedAt: file.uploadedAt })) });
    }

    if (request.method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      const requestedPath = String(formData.get('path') || 'public/assets/admin-upload/untitled.webp');
      if (!(file instanceof File)) {
        return safeJson({ ok: false, error: 'Missing file upload' }, { status: 400 });
      }

      if (!isSafeMediaPath(requestedPath)) {
        return safeJson({ ok: false, error: 'Unsafe media path' }, { status: 400 });
      }

      const fileBuffer = await file.arrayBuffer();
      const extension = requestedPath.split('.').pop()?.toLowerCase() || '';
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (fileBuffer.byteLength > 8 * 1024 * 1024) {
        return safeJson({ ok: false, error: 'File exceeds 8 MB limit' }, { status: 400 });
      }
      if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.type)) {
        return safeJson({ ok: false, error: 'Unsupported media type' }, { status: 400 });
      }

      const normalized = requestedPath.replace(/^\//, '');
      mediaFiles.set(normalized, {
        path: normalized,
        mimeType: file.type,
        size: fileBuffer.byteLength,
        uploadedAt: new Date().toISOString(),
        data: fileBuffer
      });

      return safeJson({ ok: true, path: normalized, size: fileBuffer.byteLength });
    }

    if (request.method === 'DELETE') {
      const payload = await parseJsonBody<{ path?: string }>(request);
      const target = String(payload.path || '');
      if (!isSafeMediaPath(target)) {
        return safeJson({ ok: false, error: 'Unsafe media path' }, { status: 400 });
      }
      mediaFiles.delete(target);
      return safeJson({ ok: true, deleted: target });
    }
  }

  if (url.pathname === '/api/admin/publish') {
    const unauthorized = await authRequired(request, env);
    if (unauthorized) {
      return unauthorized;
    }

    if (request.method !== 'POST') {
      return safeJson({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    const payload = await parseJsonBody<Record<string, unknown>>(request);
    const publishResult = await publishToGitHub(env, payload);
    if (!publishResult.ok) {
      return safeJson({ ok: false, error: publishResult.error }, { status: 409 });
    }

    return safeJson({ ok: true, commitSha: publishResult.sha, message: 'Published to GitHub' });
  }

  if (url.pathname === '/api/admin/status') {
    const session = await verifySession(request, env);
    if (!session?.authenticated) {
      return safeJson({ authenticated: false });
    }

    return safeJson({
      authenticated: true,
      username: session.username,
      hasPendingDraft: mediaFiles.size > 0,
      lastCommit: null
    });
  }

  return env.ASSETS.fetch(request);
};

export default {
  async fetch(request: Request, env: Env, _ctx: CloudflareContext): Promise<Response> {
    try {
      return await handleApi(request, env);
    } catch (error) {
      console.error(error);
      return safeJson({ ok: false, error: error instanceof Error ? error.message : 'Unexpected server error' }, { status: 500 });
    }
  }
};
