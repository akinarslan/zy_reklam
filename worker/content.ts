import servicesData from '../src/content/services.json';
import projectsData from '../src/content/projects.json';
import promotionsData from '../src/content/promotions.json';
import seoData from '../src/content/seo.json';
import siteData from '../src/content/site.json';

export type ServiceRecord = {
  groups: Array<{
    id: string;
    title: string;
    description: string;
    eyebrow: string;
    menuPreview: string[];
    services: Array<[string, string, string, string, string[]]>;
  }>;
};

export type ProjectPhoto = {
  id: string;
  category: string;
  title: string;
  alt: string;
  variants: Array<{ src: string; width: number; height: number }>;
};

export type ProjectVideo = {
  id: string;
  category: string;
  title: string;
  src: string;
  poster?: string;
  width: number;
  height: number;
  durationSeconds: number;
  type?: 'video';
  autoplay?: false;
  muted?: false;
  controls?: true;
};

export type ProjectRecord = {
  categories: Array<{ id: string; title: string; cover: string; description: string; examples: string; href: string }>;
  photos: ProjectPhoto[];
  videos: ProjectVideo[];
  disclaimer: string;
  [key: string]: unknown;
};

export type PromotionRecord = {
  categories: Array<{ id: string; title: string; cover: string; description: string; examples: string; href: string }>;
  photos: Array<{
    id: string;
    title: string;
    alt: string;
    category: string;
    section?: string | null;
    sourceFile?: string;
    sourceSHA256?: string;
    sourceWidth?: number;
    sourceHeight?: number;
    variants: Array<{ src: string; width: number; height: number; bytes?: number; sha256?: string }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type AdminContent = {
  site: typeof siteData.site;
  services: ServiceRecord;
  projects: ProjectRecord;
  promotions: PromotionRecord;
  seo: typeof seoData;
};

export type MediaTarget =
  | { kind: 'none' }
  | { kind: 'service'; serviceId: string; field: 'primary' | 'gallery'; index?: number }
  | { kind: 'project-image'; categoryId: string; photoId?: string }
  | { kind: 'promotion-image'; categoryId: string; photoId?: string }
  | { kind: 'project-video'; categoryId: string; videoId?: string; poster?: string; width?: number; height?: number; durationSeconds?: number };

export type UploadedMedia = {
  path: string;
  repoPath: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: 'image' | 'video';
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type PendingMedia = UploadedMedia & {
  stageKey: string;
  uploadedAt: string;
};

export type DeletedMedia = {
  path: string;
  repoPath: string;
  deletedAt: string;
};

export type AdminDraft = {
  version: 1;
  content: AdminContent;
  publishedContent: AdminContent;
  pendingMedia: PendingMedia[];
  deletedMedia: DeletedMedia[];
  updatedAt: string;
};

const initialContent = (): AdminContent => ({
  site: structuredClone(siteData.site),
  services: structuredClone(servicesData) as unknown as ServiceRecord,
  projects: structuredClone(projectsData) as unknown as ProjectRecord,
  promotions: structuredClone(promotionsData) as unknown as PromotionRecord,
  seo: structuredClone(seoData)
});

const mediaTitle = (filename: string): string => filename
  .replace(/-\d{8}-\d{6}-[a-f0-9]{8}\.[^.]+$/i, '')
  .replace(/\.[^.]+$/, '')
  .replaceAll('-', ' ');

export const createPublishedContent = (): AdminContent => initialContent();

export const createEmptyDraft = (): AdminDraft => {
  const content = createPublishedContent();
  return {
    version: 1,
    content,
    publishedContent: structuredClone(content),
    pendingMedia: [],
    deletedMedia: [],
    updatedAt: new Date().toISOString()
  };
};

export const isAdminContent = (value: unknown): value is AdminContent => {
  if (!value || typeof value !== 'object') return false;
  const content = value as Partial<AdminContent>;
  return !!content.site
    && Array.isArray(content.services?.groups)
    && Array.isArray(content.projects?.categories)
    && Array.isArray(content.projects?.photos)
    && Array.isArray(content.projects?.videos)
    && Array.isArray(content.promotions?.categories)
    && Array.isArray(content.promotions?.photos)
    && !!content.seo;
};

export const applyMediaTarget = (
  content: AdminContent,
  target: MediaTarget,
  media: UploadedMedia
): void => {
  if (target.kind === 'none') return;

  if (target.kind === 'service') {
    const service = content.services.groups.flatMap((group) => group.services).find(([id]) => id === target.serviceId);
    if (!service) throw new Error('Hizmet hedefi bulunamadı.');
    if (target.field === 'primary') {
      service[3] = media.path;
      return;
    }
    const gallery = service[4];
    if (target.index === undefined) gallery.push(media.path);
    else if (Number.isInteger(target.index) && target.index >= 0 && target.index < gallery.length) gallery[target.index] = media.path;
    else if (Number.isInteger(target.index) && target.index === gallery.length) gallery.push(media.path);
    else throw new Error('Hizmet galeri hedefi geçersiz.');
    return;
  }

  if (target.kind === 'project-image') {
    const category = content.projects.categories.find(({ id }) => id === target.categoryId);
    if (!category) throw new Error('Proje kategorisi bulunamadı.');
    const existing = target.photoId
      ? content.projects.photos.find(({ id, category: categoryId }) => id === target.photoId && categoryId === category.id)
      : undefined;
    if (target.photoId && !existing) throw new Error('Değiştirilecek proje görseli bulunamadı.');
    const id = media.filename.replace(/\.[^.]+$/, '');
    const photo: ProjectPhoto = {
      id,
      category: category.id,
      title: mediaTitle(media.filename),
      alt: mediaTitle(media.filename),
      variants: [
        { src: media.path, width: media.width ?? 960, height: media.height ?? 640 },
        { src: media.path, width: media.width ?? 960, height: media.height ?? 640 }
      ]
    };
    if (existing) {
      const wasCover = category.cover === existing.id;
      Object.assign(existing, photo);
      if (wasCover) category.cover = id;
    } else {
      content.projects.photos.push(photo);
    }
    return;
  }

  if (target.kind === 'promotion-image') {
    const category = content.promotions.categories.find(({ id }) => id === target.categoryId);
    if (!category) throw new Error('Promosyon kategorisi bulunamadı.');
    const existing = target.photoId
      ? content.promotions.photos.find(({ id, category: categoryId }) => id === target.photoId && categoryId === category.id)
      : undefined;
    if (target.photoId && !existing) throw new Error('Değiştirilecek promosyon görseli bulunamadı.');
    const id = media.filename.replace(/\.[^.]+$/, '');
    const photo = {
      id,
      title: mediaTitle(media.filename),
      alt: mediaTitle(media.filename),
      category: category.id,
      section: null,
      sourceFile: media.filename,
      sourceWidth: media.width ?? 960,
      sourceHeight: media.height ?? 640,
      variants: [
        { src: media.path, width: media.width ?? 960, height: media.height ?? 640 },
        { src: media.path, width: media.width ?? 960, height: media.height ?? 640 }
      ]
    };
    if (existing) {
      const wasCover = category.cover === existing.id;
      Object.assign(existing, photo);
      if (wasCover) category.cover = id;
    } else {
      content.promotions.photos.push(photo);
    }
    return;
  }

  const category = content.projects.categories.find(({ id }) => id === target.categoryId);
  if (!category || media.mediaType !== 'video') throw new Error('Video hedefi geçersiz.');
  if (target.poster && !/^\/assets\/[a-z0-9/_-]+\.(?:jpe?g|png|webp)$/i.test(target.poster)) {
    throw new Error('Video posteri geçersiz.');
  }
  const video: ProjectVideo = {
    id: media.filename.replace(/\.[^.]+$/, ''),
    category: category.id,
    title: mediaTitle(media.filename),
    src: media.path,
    ...(target.poster ? { poster: target.poster } : {}),
    width: target.width ?? 1280,
    height: target.height ?? 720,
    durationSeconds: target.durationSeconds ?? 0,
    type: 'video',
    autoplay: false,
    muted: false,
    controls: true
  };
  const existingVideo = target.videoId
    ? content.projects.videos.find(({ id, category: categoryId }) => id === target.videoId && categoryId === category.id)
    : undefined;
  if (target.videoId && !existingVideo) throw new Error('Değiştirilecek proje videosu bulunamadı.');
  if (existingVideo) Object.assign(existingVideo, video);
  else content.projects.videos.push(video);
};

export const getTargetService = (content: AdminContent, serviceId: string): { groupTitle: string; service: [string, string, string, string, string[]] } | null => {
  for (const group of content.services.groups) {
    const service = group.services.find(([id]) => id === serviceId);
    if (service) return { groupTitle: group.title, service };
  }
  return null;
};

export const collectMediaUsage = (content: AdminContent, path: string): string[] => {
  const uses: string[] = [];
  const match = (value: string): boolean => value === path;

  for (const group of content.services.groups) {
    for (const service of group.services) {
      if (match(service[3])) uses.push(`Hizmetler → ${group.title} → ${service[1]} → Ön görsel`);
      service[4].forEach((image, index) => {
        if (match(image)) uses.push(`Hizmetler → ${group.title} → ${service[1]} → Galeri ${index + 1}`);
      });
    }
  }

  for (const category of content.projects.categories) {
    for (const photo of content.projects.photos.filter(({ category: categoryId }) => categoryId === category.id)) {
      if (photo.variants.some(({ src }) => match(src))) uses.push(`Projeler → ${category.title} → ${photo.title}`);
    }
    for (const video of content.projects.videos.filter(({ category: categoryId }) => categoryId === category.id)) {
      if (match(video.src)) uses.push(`Projeler → ${category.title} → ${video.title}`);
      if (video.poster && match(video.poster)) uses.push(`Projeler → ${category.title} → ${video.title} → Poster`);
    }
  }

  for (const category of content.promotions.categories) {
    for (const photo of content.promotions.photos.filter(({ category: categoryId }) => categoryId === category.id)) {
      if (photo.variants.some(({ src }) => match(src))) uses.push(`Promosyonlar → ${category.title} → ${photo.title}`);
    }
  }

  const inspect = (value: unknown, pointer: string): void => {
    if (typeof value === 'string' && match(value)) uses.push(`İçerik → ${pointer}`);
    else if (Array.isArray(value)) value.forEach((entry, index) => inspect(entry, `${pointer}[${index}]`));
    else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, entry]) => inspect(entry, `${pointer}.${key}`));
    }
  };
  inspect(content.site, 'site');
  inspect(content.seo, 'seo');
  return [...new Set(uses)];
};
