export const MEDIA_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
  videoBytes: 50 * 1024 * 1024
} as const;

export const MEDIA_FOLDERS = {
  services: { path: 'services', label: 'Hizmet görselleri', mediaType: 'image' },
  projects: { path: 'project-examples', label: 'Proje görselleri', mediaType: 'image' },
  promotions: { path: 'promotions', label: 'Promosyon görselleri', mediaType: 'image' },
  showroom: { path: 'showroom', label: 'Showroom görselleri', mediaType: 'image' },
  videos: { path: 'videos', label: 'Videolar', mediaType: 'video' },
  uploads: { path: 'uploads', label: 'Diğer yüklemeler', mediaType: 'image' }
} as const;

export type MediaFolder = keyof typeof MEDIA_FOLDERS;
export type MediaType = 'image' | 'video';

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm'
};

export const mimeTypeForExtension = (extension: string): string | null =>
  MIME_BY_EXTENSION[extension.toLowerCase()] ?? null;

export const mediaTypeForMime = (mimeType: string): MediaType | null => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return null;
};

export const isAllowedPublicMediaPath = (path: string): boolean =>
  /^\/assets\/(?:services|project-examples|promotions|showroom|videos|uploads)\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|mp4|webm)$/i.test(path);

export const repoPathFromPublicPath = (path: string): string | null =>
  isAllowedPublicMediaPath(path) ? `public${path}` : null;

export const mediaFolderForPath = (path: string): MediaFolder | null => {
  if (!isAllowedPublicMediaPath(path)) return null;
  const folder = path.split('/')[2];
  return (Object.keys(MEDIA_FOLDERS) as MediaFolder[]).find((key) => MEDIA_FOLDERS[key].path === folder) ?? null;
};

export const isValidMediaSignature = (mimeType: string, bytes: Uint8Array): boolean => {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (mimeType === 'image/webp') {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  if (mimeType === 'video/mp4') {
    return bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
  }
  if (mimeType === 'video/webm') {
    return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }
  return false;
};

export const formatMediaSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} bayt`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
