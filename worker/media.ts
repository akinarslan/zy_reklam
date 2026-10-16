import {
  MEDIA_FOLDERS,
  MEDIA_LIMITS,
  isAllowedPublicMediaPath,
  isValidMediaSignature,
  mediaTypeForMime,
  mimeTypeForExtension,
  repoPathFromPublicPath,
  type MediaFolder,
  type MediaType
} from '../src/shared/admin-media';

export { MEDIA_FOLDERS, MEDIA_LIMITS, isAllowedPublicMediaPath, mediaTypeForMime, repoPathFromPublicPath };

export type ValidatedUpload = {
  mimeType: string;
  mediaType: MediaType;
  extension: string;
  limit: number;
};

export const validateUpload = (
  filename: string,
  declaredMimeType: string,
  size: number,
  signature: Uint8Array
): ValidatedUpload => {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const expectedMime = mimeTypeForExtension(extension);
  if (!expectedMime || expectedMime !== declaredMimeType.toLowerCase()) {
    throw new Error('Dosya uzantısı ve MIME türü eşleşmiyor veya desteklenmiyor.');
  }
  const mediaType = mediaTypeForMime(expectedMime);
  if (!mediaType) throw new Error('Desteklenmeyen medya türü.');
  const limit = mediaType === 'image' ? MEDIA_LIMITS.imageBytes : MEDIA_LIMITS.videoBytes;
  if (!Number.isSafeInteger(size) || size <= 0 || size > limit) {
    throw new Error(`Dosya boyutu ${mediaType === 'image' ? '8 MB' : '50 MB'} sınırını aşıyor veya boş.`);
  }
  if (!isValidMediaSignature(expectedMime, signature)) {
    throw new Error('Dosya içeriği bildirilen formatla eşleşmiyor.');
  }
  return { mimeType: expectedMime, mediaType, extension, limit };
};

const slug = (filename: string): string => {
  const transliterated = filename
    .replace(/[İı]/g, 'i')
    .replace(/[Ğğ]/g, 'g')
    .replace(/[Üü]/g, 'u')
    .replace(/[Şş]/g, 's')
    .replace(/[Öö]/g, 'o')
    .replace(/[Çç]/g, 'c')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return transliterated || 'medya';
};

export const createMediaPath = (
  folder: MediaFolder,
  originalFilename: string,
  now = new Date(),
  uniqueId = crypto.randomUUID().slice(0, 8)
): { path: string; repoPath: string; filename: string } => {
  const entry = MEDIA_FOLDERS[folder];
  const rawExtension = originalFilename.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = mimeTypeForExtension(rawExtension);
  if (!mimeType) throw new Error('Dosya uzantısı desteklenmiyor.');
  const baseName = originalFilename.replace(/\.[^.]+$/, '').split(/[\\/]/).pop() ?? '';
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const compactTimestamp = `${timestamp.slice(0, 8)}-${timestamp.slice(9, 15)}`;
  const filename = `${slug(baseName)}-${compactTimestamp}-${uniqueId}.${rawExtension}`;
  const path = `/assets/${entry.path}/${filename}`;
  const repoPath = repoPathFromPublicPath(path);
  if (!repoPath) throw new Error('Üretilen dosya yolu izinli değil.');
  return { path, repoPath, filename };
};

export const parseMediaFolder = (value: string): MediaFolder | null =>
  Object.hasOwn(MEDIA_FOLDERS, value) ? value as MediaFolder : null;

export const mediaFolderForPath = (path: string): MediaFolder | null => {
  if (!isAllowedPublicMediaPath(path)) return null;
  const folder = path.split('/')[2];
  return (Object.keys(MEDIA_FOLDERS) as MediaFolder[]).find((key) => MEDIA_FOLDERS[key].path === folder) ?? null;
};

export const previewContentType = (path: string): string | null => {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return mimeTypeForExtension(extension);
};
