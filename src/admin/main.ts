import servicesData from '../content/services.json';
import projectsData from '../content/projects.json';
import promotionsData from '../content/promotions.json';
import seoData from '../content/seo.json';
import siteData from '../content/site.json';
import { MEDIA_FOLDERS, MEDIA_LIMITS, formatMediaSize, type MediaFolder } from '../shared/admin-media';

type ContentState = {
  site: typeof siteData.site;
  services: typeof servicesData;
  projects: typeof projectsData;
  promotions: typeof promotionsData;
  seo: typeof seoData;
};

type ActionTarget = HTMLElement & { dataset: DOMStringMap; value?: string };
type MediaFile = {
  path: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  size: number;
  folder: string;
  pending: boolean;
  pendingDelete: boolean;
  previewUrl: string;
  usage: string[];
};
type PublishEntry = { timestamp: string; username: string; commitSha: string; message: string; url?: string };
type TargetOption = { value: string; label: string; folder: MediaFolder; currentPath?: string };

const state: ContentState = {
  site: structuredClone(siteData.site),
  services: structuredClone(servicesData),
  projects: structuredClone(projectsData),
  promotions: structuredClone(promotionsData),
  seo: structuredClone(seoData)
};

let currentUser: string | null = null;
let csrfToken: string | null = null;
let statusMessage = 'Yükleniyor...';
let navigationObserver: IntersectionObserver | null = null;
let mediaFiles: MediaFile[] = [];
let publishLog: PublishEntry[] = [];
let publishedBaseline: ContentState = structuredClone(state);
let lastPublish: PublishEntry | null = null;
let changedSections: string[] = [];
let draftHasChanges = false;
let uploadPreviewUrl: string | null = null;

const app = document.querySelector('#app');
if (!app) {
  throw new Error('Admin app root not found.');
}

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const setStatus = (message: string): void => {
  statusMessage = message;
  const box = document.querySelector('#status-box') as HTMLDivElement | null;
  if (box) {
    box.textContent = message;
  }
};

const sendJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (method !== 'GET' && method !== 'HEAD' && csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || 'İstek sırasında hata oluştu.');
  }
  return payload as T;
};

const api = {
  async session(): Promise<{ authenticated: boolean; username: string | null; csrfToken: string | null }> {
    return sendJson('/api/admin/session');
  },
  async login(username: string, password: string): Promise<{ ok: true; username: string; csrfToken: string }> {
    return sendJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  async logout(): Promise<void> {
    await sendJson('/api/admin/logout', { method: 'POST' });
  },
  async getContent(): Promise<ContentState> {
    const response = await sendJson<{
      site: typeof state.site;
      services: typeof state.services;
      projects: typeof state.projects;
      promotions: typeof state.promotions;
      seo: typeof state.seo;
      publishedContent: ContentState;
    }>('/api/admin/draft');
    publishedBaseline = response.publishedContent;
    return {
      site: response.site,
      services: response.services,
      projects: response.projects,
      promotions: response.promotions,
      seo: response.seo
    };
  },
  async saveDraft(): Promise<void> {
    await sendJson('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({ content: state })
    });
  },
  async getMedia(): Promise<MediaFile[]> {
    const response = await sendJson<{ files: MediaFile[] }>('/api/admin/media');
    return response.files;
  },
  async deleteMedia(path: string): Promise<{ ok: true; pendingPublish?: boolean }> {
    return sendJson('/api/admin/media', { method: 'DELETE', body: JSON.stringify({ path }) });
  },
  async publish(message: string): Promise<{ ok: boolean; commitSha?: string; commitUrl?: string; error?: string; cloudflareDeploy?: string; warnings?: string[] }> {
    return sendJson('/api/admin/publish', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },
  async getPublishLog(): Promise<PublishEntry[]> {
    const response = await sendJson<{ entries: PublishEntry[] }>('/api/admin/publish-log');
    return response.entries;
  },
  async getStatus(): Promise<{
    lastPublish: PublishEntry | null;
    hasPendingDraft: boolean;
    changedSections: string[];
    pendingMedia: number;
    deletedMedia: number;
  }> {
    return sendJson('/api/admin/status');
  },
  async uploadMedia(form: FormData, onProgress: (percent: number) => void): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('POST', '/api/admin/media');
      request.withCredentials = true;
      if (csrfToken) request.setRequestHeader('X-CSRF-Token', csrfToken);
      request.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onProgress(Math.floor((event.loaded / event.total) * 100));
      });
      request.addEventListener('load', () => {
        let response: { ok?: boolean; error?: string } = {};
        try {
          response = JSON.parse(request.responseText) as typeof response;
        } catch {
          reject(new Error('Sunucu geçerli JSON yanıtı vermedi.'));
          return;
        }
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(response.error || 'Medya yüklenemedi.'));
          return;
        }
        resolve();
      });
      request.addEventListener('error', () => reject(new Error('Yükleme sırasında ağ hatası oluştu.')));
      request.addEventListener('abort', () => reject(new Error('Medya yüklemesi iptal edildi.')));
      request.send(form);
    })
  }
};

const renderHome = (): string => `
  <div class="form-grid">
    <label class="field">
      <span>Sayfa başlığı</span>
      <input data-section="site" data-field="title" value="${escapeHtml(state.site.title)}" />
    </label>
    <label class="field field-wide">
      <span>Meta açıklama</span>
      <textarea data-section="site" data-field="description">${escapeHtml(state.site.description)}</textarea>
    </label>
  </div>
`;

const renderContact = (): string => `
  <div class="form-grid">
    <label class="field">
      <span>Telefon</span>
      <input data-section="site" data-field="phone" value="${escapeHtml(state.site.phone)}" />
    </label>
    <label class="field field-wide">
      <span>Adres</span>
      <textarea data-section="site" data-field="address">${escapeHtml(state.site.address)}</textarea>
    </label>
    <label class="field field-wide">
      <span>Instagram linki</span>
      <input data-section="site" data-field="instagram" value="${escapeHtml(state.site.instagram)}" />
    </label>
  </div>
`;

const renderFooter = (): string => `
  <div class="form-grid">
    <label class="field field-wide">
      <span>Footer metni</span>
      <input data-section="site" data-field="footerText" value="${escapeHtml(state.site.footerText)}" />
    </label>
  </div>
`;

const renderDashboard = (): string => {
  const serviceCount = state.services.groups.reduce((count, group) => count + group.services.length, 0);
  return `
    <div class="dashboard-stats">
      <article class="stat-card"><span>Hizmet</span><strong>${serviceCount}</strong></article>
      <article class="stat-card"><span>Proje kategorisi</span><strong>${state.projects.categories.length}</strong></article>
      <article class="stat-card"><span>Promosyon kategorisi</span><strong>${state.promotions.categories.length}</strong></article>
      <article class="stat-card"><span>Medya dosyası</span><strong>${mediaFiles.filter(({ pendingDelete }) => !pendingDelete).length}</strong></article>
    </div>
    <p class="panel-note">Taslak: ${draftHasChanges ? 'kaydedilmemiş değişiklik var' : changedSections.length ? `kaydedildi (${changedSections.join(', ')})` : 'değişiklik yok'} · ${mediaFiles.filter(({ pending }) => pending).length} yeni medya · ${mediaFiles.filter(({ pendingDelete }) => pendingDelete).length} silinecek medya.</p>
    <p class="panel-note">${lastPublish
      ? `Son yayın: ${escapeHtml(lastPublish.commitSha.slice(0, 7))} · ${escapeHtml(new Date(lastPublish.timestamp).toLocaleString('tr-TR'))}`
      : 'Henüz yayın kaydı bulunmuyor.'} Taslaklar sunucu tarafında KV’de saklanır.</p>
  `;
};

const targetOptions = (): TargetOption[] => {
  const options: TargetOption[] = [];
  for (const group of state.services.groups) {
    for (const service of group.services) {
      const [serviceId, title, , primaryImage, gallery = []] = service as [string, string, string, string, string[]];
      options.push({
        value: JSON.stringify({ kind: 'service', serviceId, field: 'primary' }),
        label: `Hizmet · ${group.title} · ${title} · Ön görsel`,
        folder: 'services',
        ...(primaryImage ? { currentPath: primaryImage } : {})
      });
      gallery.forEach((path, index) => options.push({
        value: JSON.stringify({ kind: 'service', serviceId, field: 'gallery', index }),
        label: `Hizmet · ${group.title} · ${title} · Galeri ${index + 1}`,
        folder: 'services',
        currentPath: path
      }));
      options.push({
        value: JSON.stringify({ kind: 'service', serviceId, field: 'gallery', index: gallery.length }),
        label: `Hizmet · ${group.title} · ${title} · Galeri ${gallery.length + 1} (ekle)`,
        folder: 'services'
      });
    }
  }
  for (const category of state.projects.categories) {
    const photos = state.projects.photos.filter((photo) => photo.category === category.id);
    photos.forEach((photo) => options.push({
      value: JSON.stringify({ kind: 'project-image', categoryId: category.id, photoId: photo.id }),
      label: `Proje · ${category.title} · ${photo.title}`,
      folder: 'projects',
      ...(photo.variants[0]?.src ? { currentPath: photo.variants[0].src } : {})
    }));
    options.push({
      value: JSON.stringify({ kind: 'project-image', categoryId: category.id }),
      label: `Proje · ${category.title} · Yeni görsel`,
      folder: 'projects'
    });
    state.projects.videos.filter((video) => video.category === category.id).forEach((video) => options.push({
      value: JSON.stringify({ kind: 'project-video', categoryId: category.id, videoId: video.id }),
      label: `Video · ${category.title} · ${video.title}`,
      folder: 'videos',
      currentPath: video.src
    }));
    options.push({
      value: JSON.stringify({ kind: 'project-video', categoryId: category.id }),
      label: `Video · ${category.title} · Yeni video`,
      folder: 'videos'
    });
  }
  for (const category of state.promotions.categories) {
    state.promotions.photos.filter((photo) => photo.category === category.id).forEach((photo) => options.push({
      value: JSON.stringify({ kind: 'promotion-image', categoryId: category.id, photoId: photo.id }),
      label: `Promosyon · ${category.title} · ${photo.title}`,
      folder: 'promotions',
      ...(photo.variants[0]?.src ? { currentPath: photo.variants[0].src } : {})
    }));
    options.push({
      value: JSON.stringify({ kind: 'promotion-image', categoryId: category.id }),
      label: `Promosyon · ${category.title} · Yeni görsel`,
      folder: 'promotions'
    });
  }
  for (const folder of Object.keys(MEDIA_FOLDERS) as MediaFolder[]) {
    options.push({
      value: JSON.stringify({ kind: 'none', folder }),
      label: `İçeriğe bağlama · ${MEDIA_FOLDERS[folder].label}`,
      folder
    });
  }
  return options;
};

const renderPublishHistory = (): string => publishLog.length
  ? `<ul class="publish-history">${publishLog.map((entry) => `<li><strong>${escapeHtml(entry.message)}</strong><span>${escapeHtml(entry.commitSha.slice(0, 7))} · ${escapeHtml(new Date(entry.timestamp).toLocaleString('tr-TR'))}</span>${entry.url ? `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">Commiti görüntüle</a>` : ''}</li>`).join('')}</ul>`
  : '<p class="panel-note">Yayın geçmişi henüz boş.</p>';

const renderMediaLibrary = (): string => {
  const options = targetOptions();
  const imageChoices = mediaFiles.filter(({ mediaType, pendingDelete }) => mediaType === 'image' && !pendingDelete);
  return `
    <form class="media-upload-form" id="media-upload-form">
      <h3>Yeni medya yükle</h3>
      <p>JPG, PNG veya WebP (en çok ${formatMediaSize(MEDIA_LIMITS.imageBytes)}); MP4 veya WebM (en çok ${formatMediaSize(MEDIA_LIMITS.videoBytes)}).</p>
      <div class="form-grid">
        <label class="field field-wide"><span>İçerik hedefi / klasör</span>
          <select id="upload-target" name="target">${options.map((option) => `<option value="${escapeHtml(option.value)}" data-folder="${option.folder}">${escapeHtml(option.label)}</option>`).join('')}</select>
        </label>
        <label class="field field-wide"><span>Dosya</span><input id="media-file" name="file" type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm" required /></label>
      </div>
      <label class="field video-poster-field"><span>Video posteri (isteğe bağlı)</span>
        <select id="video-poster"><option value="">Poster seçilmedi</option>${imageChoices.map((file) => `<option value="${escapeHtml(file.path)}">${escapeHtml(file.path)}${file.pending ? ' · taslak' : ''}</option>`).join('')}</select>
      </label>
      <div class="upload-preview" id="upload-preview" aria-live="polite">Dosya seçildiğinde önizleme burada görünür.</div>
      <input type="hidden" name="width" id="media-width" value="0" />
      <input type="hidden" name="height" id="media-height" value="0" />
      <input type="hidden" name="durationSeconds" id="media-duration" value="0" />
      <div class="upload-progress" id="upload-progress" role="status" aria-live="polite"></div>
      <button type="submit" class="primary-button">Yükle ve taslağa ekle</button>
    </form>
    <div class="media-grid">${mediaFiles.length ? mediaFiles.map((file) => `
      <article class="media-card${file.pendingDelete ? ' is-pending-delete' : ''}">
        <div class="media-preview">
          ${file.mediaType === 'video'
            ? `<video src="${escapeHtml(file.previewUrl)}" controls preload="metadata" aria-label="${escapeHtml(file.path)}"></video>`
            : `<img src="${escapeHtml(file.previewUrl)}" alt="${escapeHtml(file.path.split('/').pop() ?? 'Medya dosyası')}" loading="lazy" />`}
        </div>
        <div class="media-card-body">
          <strong>${escapeHtml(file.path.split('/').pop() ?? file.path)}</strong>
          <span>${escapeHtml(file.folder)} · ${escapeHtml(formatMediaSize(file.size))} · ${escapeHtml(file.mimeType)}</span>
          <code>${escapeHtml(file.path)}</code>
          ${file.pending ? '<span class="media-state">Taslak yüklemesi</span>' : ''}
          ${file.pendingDelete ? '<span class="media-state">Yayında silinmek üzere</span>' : ''}
          <div class="media-usage"><strong>Kullanıldığı yerler</strong>${file.usage.length ? `<ul>${file.usage.map((use) => `<li>${escapeHtml(use)}</li>`).join('')}</ul>` : '<span>İçerikte kullanılmıyor.</span>'}</div>
          <div class="media-card-actions">
            ${file.pendingDelete ? '' : `<button type="button" class="secondary-button" data-action="replace-media" data-path="${escapeHtml(file.path)}">Değiştir</button>`}
            ${file.pendingDelete ? '' : `<button type="button" class="danger-button" data-action="delete-media" data-path="${escapeHtml(file.path)}"${file.usage.length ? ' disabled title="Kullanımdayken silinemez"' : ''}>Sil</button>`}
          </div>
        </div>
      </article>`).join('') : '<p class="panel-note">Yayınlanmış veya taslak medya dosyası yok.</p>'}</div>
  `;
};

const renderServices = (): string => state.services.groups.map((group, groupIndex) => `
  <div class="service-group">
    <div class="panel-header"><div><h3>${escapeHtml(group.title)}</h3><p class="panel-subtitle">${escapeHtml(group.description)}</p></div></div>
    <div class="form-grid">
      <label class="field"><span>Grup başlığı</span><input data-section="services" data-kind="group" data-group-index="${groupIndex}" data-field="title" value="${escapeHtml(group.title)}" /></label>
      <label class="field"><span>Başlık etiketi</span><input data-section="services" data-kind="group" data-group-index="${groupIndex}" data-field="eyebrow" value="${escapeHtml(group.eyebrow)}" /></label>
      <label class="field" style="grid-column: 1 / -1;"><span>Açıklama</span><textarea data-section="services" data-kind="group" data-group-index="${groupIndex}" data-field="description">${escapeHtml(group.description)}</textarea></label>
      <label class="field" style="grid-column: 1 / -1;"><span>Menü önizlemesi</span><input data-section="services" data-kind="group" data-group-index="${groupIndex}" data-field="menuPreview" value="${escapeHtml(group.menuPreview.join(' · '))}" /></label>
    </div>
    ${group.services.map((service, serviceIndex) => {
      const [id, title, description, primaryImage, gallery = []] = service as [string, string, string, string, string[]];
      return `
        <div class="service-card">
          <h4>${escapeHtml(title)}</h4>
          <div class="mini-grid">
            <label class="field"><span>Hizmet adı</span><input data-section="services" data-kind="service" data-group-index="${groupIndex}" data-service-index="${serviceIndex}" data-field="title" value="${escapeHtml(title)}" /></label>
            <label class="field"><span>Slug</span><input data-section="services" data-kind="service" data-group-index="${groupIndex}" data-service-index="${serviceIndex}" data-field="id" value="${escapeHtml(id)}" /></label>
          </div>
          <label class="field"><span>Açıklama</span><textarea data-section="services" data-kind="service" data-group-index="${groupIndex}" data-service-index="${serviceIndex}" data-field="description">${escapeHtml(description)}</textarea></label>
          <label class="field"><span>Ön fotoğraf</span><input data-section="services" data-kind="service" data-group-index="${groupIndex}" data-service-index="${serviceIndex}" data-field="primaryImage" value="${escapeHtml(primaryImage)}" /></label>
          <div class="mini-grid">
            ${gallery.map((item, galleryIndex) => `
              <label class="field"><span>Galeri ${galleryIndex + 1}</span><input data-section="services" data-kind="service" data-group-index="${groupIndex}" data-service-index="${serviceIndex}" data-gallery-index="${galleryIndex}" data-field="gallery" value="${escapeHtml(item)}" /></label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('')}
  </div>
`).join('');

const renderProjects = (): string => `
  <div class="service-group">
    ${state.projects.categories.map((category, categoryIndex) => `
      <div class="category-card">
        <div class="mini-grid">
          <label class="field"><span>Kategori</span><input data-section="projects" data-kind="category" data-category-index="${categoryIndex}" data-field="title" value="${escapeHtml(category.title)}" /></label>
          <label class="field"><span>Kapak</span><input data-section="projects" data-kind="category" data-category-index="${categoryIndex}" data-field="cover" value="${escapeHtml(category.cover)}" /></label>
        </div>
        <label class="field"><span>Açıklama</span><textarea data-section="projects" data-kind="category" data-category-index="${categoryIndex}" data-field="description">${escapeHtml(category.description)}</textarea></label>
        <label class="field"><span>URL</span><input data-section="projects" data-kind="category" data-category-index="${categoryIndex}" data-field="href" value="${escapeHtml(category.href)}" /></label>
      </div>
    `).join('')}
  </div>
`;

const renderPromotions = (): string => `
  <div class="service-group">
    ${state.promotions.categories.map((category, categoryIndex) => `
      <div class="category-card">
        <div class="mini-grid">
          <label class="field"><span>Kategori</span><input data-section="promotions" data-kind="category" data-category-index="${categoryIndex}" data-field="title" value="${escapeHtml(category.title)}" /></label>
          <label class="field"><span>Kapak</span><input data-section="promotions" data-kind="category" data-category-index="${categoryIndex}" data-field="cover" value="${escapeHtml(category.cover)}" /></label>
        </div>
        <label class="field"><span>Açıklama</span><textarea data-section="promotions" data-kind="category" data-category-index="${categoryIndex}" data-field="description">${escapeHtml(category.description)}</textarea></label>
        <label class="field"><span>URL</span><input data-section="promotions" data-kind="category" data-category-index="${categoryIndex}" data-field="href" value="${escapeHtml(category.href)}" /></label>
      </div>
    `).join('')}
  </div>
`;

const renderLogin = (): string => `
  <div class="login-layout">
    <div class="panel" style="max-width: 480px; width: 100%;">
      <div class="panel-header"><div><h2>Admin Girişi</h2><p class="panel-subtitle">Yayın ve içerik yönetimi için giriş yapın.</p></div></div>
      <form id="login-form" class="form-grid">
        <label class="field" style="grid-column: 1 / -1;"><span>Kullanıcı adı</span><input name="username" type="text" required /></label>
        <label class="field" style="grid-column: 1 / -1;"><span>Şifre</span><input name="password" type="password" required /></label>
        <button type="submit" class="primary-button">Giriş Yap</button>
        <div class="status-box" id="status-box" role="status" aria-live="polite">${escapeHtml(statusMessage)}</div>
      </form>
    </div>
  </div>
`;

const flattenValues = (value: unknown, path = ''): Map<string, string> => {
  const result = new Map<string, string>();
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenValues(item, `${path}[${index}]`).forEach((entry, key) => result.set(key, entry)));
    return result;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => flattenValues(item, path ? `${path}.${key}` : key)
      .forEach((entry, itemPath) => result.set(itemPath, entry)));
    return result;
  }
  result.set(path || 'içerik', value === undefined ? '' : String(value));
  return result;
};

const clippedValue = (value: string): string => value.length > 100 ? `${value.slice(0, 97)}…` : value;

const contentDiff = (): string[] => {
  const before = flattenValues(publishedBaseline);
  const after = flattenValues(state);
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths].filter((path) => before.get(path) !== after.get(path)).map((path) =>
    `${path}: “${clippedValue(before.get(path) ?? '—')}” → “${clippedValue(after.get(path) ?? '—')}”`);
};

const fillPublishPreview = (): void => {
  const content = contentDiff();
  const contentList = app.querySelector<HTMLUListElement>('#publish-content-diff');
  const mediaList = app.querySelector<HTMLUListElement>('#publish-media-diff');
  if (contentList) contentList.innerHTML = content.length
    ? content.slice(0, 50).map((line) => `<li>${escapeHtml(line)}</li>`).join('') + (content.length > 50 ? `<li>ve ${content.length - 50} değişiklik daha</li>` : '')
    : '<li>Yayınlanmış içerikten farklı metin/veri yok.</li>';
  const mediaChanges = mediaFiles.filter(({ pending, pendingDelete }) => pending || pendingDelete);
  if (mediaList) mediaList.innerHTML = mediaChanges.length
    ? mediaChanges.map((file) => `<li>${file.pendingDelete ? 'Silinecek' : file.pending ? 'Eklenecek' : 'Değişecek'}: ${escapeHtml(file.path)}${file.usage.length ? ` · ${escapeHtml(file.usage.join(', '))}` : ''}</li>`).join('')
    : '<li>Medya dosyası değişikliği yok.</li>';
};

const renderApp = (): void => {
  navigationObserver?.disconnect();
  navigationObserver = null;

  if (!currentUser) {
    app.innerHTML = renderLogin();
    const form = document.querySelector('#login-form') as HTMLFormElement | null;
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const username = String(formData.get('username') || '');
      const password = String(formData.get('password') || '');
      try {
        const result = await api.login(username, password);
        currentUser = result.username;
        csrfToken = result.csrfToken;
        await loadContentFromApi();
        await loadAdminResources();
        renderApp();
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Giriş sırasında hata oluştu.');
      }
    });
    setStatus('Admin girişi gerekli.');
    return;
  }

  app.innerHTML = `
    <div class="admin-layout">
      <header class="admin-header">
        <div class="admin-topbar">
          <a class="brand-mark" href="#dashboard-panel" aria-label="ZY REKLAM yönetim paneli">
            <img src="/assets/brand/zy-reklam-wordmark.svg" alt="ZY REKLAM" />
            <span class="brand-divider" aria-hidden="true"></span>
            <span class="brand-caption">Yönetim Paneli</span>
          </a>
          <div class="header-account">
            <span class="account-indicator" aria-hidden="true"></span>
            <span>${escapeHtml(currentUser)}</span>
          </div>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="admin-navigation">
            <span class="menu-toggle-icon" aria-hidden="true"></span>
            <span class="menu-toggle-label">Menü</span>
          </button>
        </div>
        <nav class="admin-nav" id="admin-navigation" aria-label="Yönetim bölümleri">
          <button type="button" class="nav-dashboard" data-tone="dashboard" data-target="dashboard" aria-pressed="true">Dashboard</button>
          <button type="button" class="nav-home" data-tone="home" data-target="home" aria-pressed="false">Ana Sayfa</button>
          <button type="button" class="nav-services" data-tone="services" data-target="services" aria-pressed="false">Hizmetler</button>
          <button type="button" class="nav-projects" data-tone="projects" data-target="projects" aria-pressed="false">Projeler</button>
          <button type="button" class="nav-promotions" data-tone="promotions" data-target="promotions" aria-pressed="false">Promosyonlar</button>
          <button type="button" class="nav-showroom" data-tone="showroom" data-target="showroom" aria-pressed="false">3D Hero</button>
          <button type="button" class="nav-contact" data-tone="contact" data-target="contact" aria-pressed="false">İletişim</button>
          <button type="button" class="nav-footer" data-tone="footer" data-target="footer" aria-pressed="false">Footer</button>
          <button type="button" class="nav-seo" data-tone="seo" data-target="seo" aria-pressed="false">SEO</button>
          <button type="button" class="nav-media" data-tone="media" data-target="media" aria-pressed="false">Medya Kütüphanesi</button>
          <button type="button" class="nav-publishing" data-tone="publishing" data-target="publishing" aria-pressed="false">Yayınlama</button>
          <button type="button" class="nav-exit" data-action="logout">Çıkış</button>
        </nav>
      </header>
      <main class="admin-main">
        <div class="admin-content">
          <section class="panel section-panel section-dashboard" id="dashboard-panel">
            <div class="panel-header"><div><span class="section-kicker">GENEL BAKIŞ</span><h2>Dashboard</h2><p class="panel-subtitle">Yönetilen içeriklerin kısa özeti.</p></div></div>
            ${renderDashboard()}
          </section>
          <section class="panel section-panel section-home" id="home-panel">
            <div class="panel-header"><div><span class="section-kicker">ANA SAYFA</span><h2>Ana Sayfa</h2><p class="panel-subtitle">Ana sayfa başlığı ve açıklama alanları.</p></div></div>
            ${renderHome()}
          </section>
          <section class="panel section-panel section-services" id="services-panel">
            <div class="panel-header"><div><span class="section-kicker">HİZMET YÖNETİMİ</span><h2>Hizmetler</h2><p class="panel-subtitle">Her hizmet ve grup düzenlenebilir.</p></div></div>
            ${renderServices()}
          </section>
          <section class="panel section-panel section-projects" id="projects-panel">
            <div class="panel-header"><div><span class="section-kicker">PROJE KATALOĞU</span><h2>Projeler</h2><p class="panel-subtitle">Kategori ve örnek görünüm alanları.</p></div></div>
            ${renderProjects()}
          </section>
          <section class="panel section-panel section-promotions" id="promotions-panel">
            <div class="panel-header"><div><span class="section-kicker">KAMPANYA İÇERİĞİ</span><h2>Promosyonlar</h2><p class="panel-subtitle">Kategori ve promosyon içerikleri.</p></div></div>
            ${renderPromotions()}
          </section>
          <section class="panel section-panel section-showroom" id="showroom-panel">
            <div class="panel-header"><div><span class="section-kicker">GÖRSEL VİTRİN</span><h2>3D Hero</h2><p class="panel-subtitle">Hero sahnesinin mevcut görünümü ve yönetim kapsamı.</p></div></div>
            <div class="notice-card"><strong>Hero sahnesi bu panelden düzenlenmiyor.</strong><p>ZY REKLAM 3D sahnesi ana sayfanın hero alanında yer alır; bu panelde sahne için içerik düzenleme alanı bulunmamaktadır.</p></div>
          </section>
          <section class="panel section-panel section-contact" id="contact-panel">
            <div class="panel-header"><div><span class="section-kicker">İLETİŞİM BİLGİLERİ</span><h2>İletişim</h2><p class="panel-subtitle">Ziyaretçilerin ulaşacağı doğrulanmış iletişim alanları.</p></div></div>
            ${renderContact()}
          </section>
          <section class="panel section-panel section-footer" id="footer-panel">
            <div class="panel-header"><div><span class="section-kicker">SAYFA ALTI</span><h2>Footer</h2><p class="panel-subtitle">Sayfa altı imza ve bilgilendirme metni.</p></div></div>
            ${renderFooter()}
          </section>
          <section class="panel section-panel section-seo" id="seo-panel">
            <div class="panel-header"><div><span class="section-kicker">ARAMA GÖRÜNÜRLÜĞÜ</span><h2>SEO</h2><p class="panel-subtitle">Anahtar kelimeler ve sayfa meta düzeni.</p></div></div>
            <div class="form-grid">
              <label class="field"><span>Site adı</span><input data-section="seo" data-field="site.name" value="${escapeHtml(state.seo.site.name)}" /></label>
              <label class="field"><span>URL</span><input data-section="seo" data-field="site.url" value="${escapeHtml(state.seo.site.url)}" /></label>
              <label class="field"><span>Telefon</span><input data-section="seo" data-field="site.phone" value="${escapeHtml(state.seo.site.phone)}" /></label>
              <label class="field field-wide"><span>Primary keywords</span><textarea data-section="seo" data-field="primaryKeywords">${escapeHtml(state.seo.primaryKeywords.join('\n'))}</textarea></label>
            </div>
          </section>
          <section class="panel section-panel section-media" id="media-panel">
            <div class="panel-header"><div><span class="section-kicker">MEDYA ENVANTERİ</span><h2>Medya Kütüphanesi</h2><p class="panel-subtitle">Görsel ve videoları yükleyin, kullanım yerlerini inceleyin ve taslakta yönetin.</p></div></div>
            ${renderMediaLibrary()}
          </section>
          <section class="panel section-panel section-publishing" id="publishing-panel">
            <div class="panel-header"><div><span class="section-kicker">TASLAK VE YAYIN</span><h2>Yayınlama</h2><p class="panel-subtitle">Taslağı kalıcı olarak kaydedin veya değişiklikleri gözden geçirip GitHub’a yayınlayın.</p></div></div>
            <div class="status-box" id="status-box">${escapeHtml(statusMessage)}</div>
            <div class="publishing-actions">
              <button type="button" class="secondary-button" data-action="draft">Taslağı Kaydet</button>
              <button type="button" class="primary-button" data-action="publish">Yayınla</button>
            </div>
            <h3>Yayın geçmişi</h3>
            ${renderPublishHistory()}
          </section>
        </div>
      </main>
    </div>
    <dialog class="publish-dialog" id="publish-dialog" aria-labelledby="publish-dialog-title">
      <form method="dialog" class="publish-dialog-content">
        <h2 id="publish-dialog-title">Yayın önizlemesi</h2>
        <p>GitHub main dalına tek atomik commit olarak gönderilecek değişiklikleri doğrulayın.</p>
        <label class="field"><span>Commit mesajı</span><input id="publish-message" maxlength="120" value="Admin içerik güncellemesi" required /></label>
        <h3>İçerik değişiklikleri</h3>
        <ul id="publish-content-diff" class="publish-diff"></ul>
        <h3>Medya değişiklikleri</h3>
        <ul id="publish-media-diff" class="publish-diff"></ul>
        <p class="notice-card">Commit başarıyla oluşturulması Cloudflare deploy’unun başladığını veya tamamlandığını kanıtlamaz; bu panel deploy durumunu doğrulayamaz.</p>
        <div class="publishing-actions">
          <button type="button" class="secondary-button" data-action="close-publish">Geri dön</button>
          <button type="button" class="primary-button" data-action="confirm-publish">main’e yayınla</button>
        </div>
      </form>
    </dialog>
  `;

  const menuToggle = app.querySelector<HTMLButtonElement>('.menu-toggle');
  const navigation = app.querySelector<HTMLElement>('.admin-nav');
  const setNavigationOpen = (open: boolean): void => {
    menuToggle?.setAttribute('aria-expanded', String(open));
    navigation?.classList.toggle('is-open', open);
  };
  const setActiveNavigation = (target: string): void => {
    app.querySelectorAll<HTMLButtonElement>('[data-target]').forEach((button) => {
      const active = button.dataset.target === target;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  menuToggle?.addEventListener('click', () => {
    setNavigationOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  navigation?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setNavigationOpen(false);
      menuToggle?.focus();
    }
  });

  app.querySelectorAll('[data-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      if (!target) return;
      document.getElementById(`${target}-panel`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      setActiveNavigation(target);
      setNavigationOpen(false);
    });
  });

  app.querySelector('.brand-mark')?.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('dashboard-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveNavigation('dashboard');
  });

  if ('IntersectionObserver' in window) {
    navigationObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      const headerBottom = app.querySelector('.admin-header')?.getBoundingClientRect().bottom ?? 0;
      const activeSection = Array.from(app.querySelectorAll<HTMLElement>('.section-panel'))
        .find((section) => section.getBoundingClientRect().bottom > headerBottom + 12);
      const target = activeSection?.id.replace(/-panel$/, '');
      if (target) setActiveNavigation(target);
    }, { rootMargin: '-116px 0px -65% 0px', threshold: [0, 0.15, 0.35, 0.6] });
    app.querySelectorAll<HTMLElement>('.section-panel').forEach((section) => navigationObserver?.observe(section));
  }

  app.querySelectorAll('[data-action="draft"]').forEach((button) => button.addEventListener('click', async () => {
    try {
      await api.saveDraft();
      draftHasChanges = false;
      await loadAdminResources();
      setStatus('Taslak sunucuda kalıcı olarak kaydedildi.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Taslak kaydedilemedi.');
    }
  }));

  app.querySelectorAll('[data-action="logout"]').forEach((button) => button.addEventListener('click', async () => {
    try {
      await api.logout();
      currentUser = null;
      csrfToken = null;
      renderApp();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Çıkış sırasında hata oluştu.');
    }
  }));

  app.querySelectorAll('[data-action="publish"]').forEach((button) => button.addEventListener('click', async () => {
    try {
      await api.saveDraft();
      await loadContentFromApi();
      await loadAdminResources();
      fillPublishPreview();
      app.querySelector<HTMLDialogElement>('#publish-dialog')?.showModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Yayın önizlemesi hazırlanamadı.');
    }
  }));

  app.querySelector('[data-action="close-publish"]')?.addEventListener('click', () => {
    app.querySelector<HTMLDialogElement>('#publish-dialog')?.close();
  });

  app.querySelector('[data-action="confirm-publish"]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const message = app.querySelector<HTMLInputElement>('#publish-message')?.value.trim() ?? '';
    if (!message || message.length > 120) {
      setStatus('Commit mesajı 1–120 karakter olmalı.');
      return;
    }
    button.disabled = true;
    setStatus('GitHub’da atomik commit oluşturuluyor…');
    try {
      await api.saveDraft();
      const result = await api.publish(message);
      if (!result.ok) throw new Error(result.error || 'Yayın sırasında hata oluştu.');
      await loadAdminResources();
      app.querySelector<HTMLDialogElement>('#publish-dialog')?.close();
      const warnings = result.warnings?.length ? ` Uyarı: ${result.warnings.join(' ')}` : '';
      setStatus(`GitHub commit oluşturuldu: ${result.commitSha ?? 'commit'}${result.commitUrl ? ` · ${result.commitUrl}` : ''}. ${result.cloudflareDeploy ?? 'Cloudflare deploy durumu doğrulanmadı.'}${warnings}`);
      renderApp();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Yayın sırasında hata oluştu.');
    } finally {
      button.disabled = false;
    }
  });

  const uploadForm = app.querySelector<HTMLFormElement>('#media-upload-form');
  const mediaInput = app.querySelector<HTMLInputElement>('#media-file');
  const targetInput = app.querySelector<HTMLSelectElement>('#upload-target');
  const preview = app.querySelector<HTMLDivElement>('#upload-preview');
  const resetDimensions = (): void => {
    app.querySelector<HTMLInputElement>('#media-width')!.value = '0';
    app.querySelector<HTMLInputElement>('#media-height')!.value = '0';
    app.querySelector<HTMLInputElement>('#media-duration')!.value = '0';
  };

  targetInput?.addEventListener('change', () => {
    const folder = targetInput.selectedOptions[0]?.dataset.folder;
    const posterField = app.querySelector<HTMLElement>('.video-poster-field');
    if (posterField) posterField.hidden = folder !== 'videos';
  });
  targetInput?.dispatchEvent(new Event('change'));

  mediaInput?.addEventListener('change', () => {
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    uploadPreviewUrl = null;
    resetDimensions();
    const file = mediaInput.files?.[0];
    if (!file || !preview) {
      if (preview) preview.textContent = 'Dosya seçildiğinde önizleme burada görünür.';
      return;
    }
    uploadPreviewUrl = URL.createObjectURL(file);
    preview.replaceChildren();
    const label = document.createElement('p');
    label.textContent = `${file.name} · ${formatMediaSize(file.size)} · ${file.type || 'MIME belirtilmemiş'}`;
    preview.append(label);
    if (file.type.startsWith('image/')) {
      const image = document.createElement('img');
      image.alt = 'Yükleme önizlemesi';
      image.onload = () => {
        app.querySelector<HTMLInputElement>('#media-width')!.value = String(image.naturalWidth);
        app.querySelector<HTMLInputElement>('#media-height')!.value = String(image.naturalHeight);
      };
      image.src = uploadPreviewUrl;
      preview.append(image);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.controls = true;
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        app.querySelector<HTMLInputElement>('#media-width')!.value = String(video.videoWidth);
        app.querySelector<HTMLInputElement>('#media-height')!.value = String(video.videoHeight);
        app.querySelector<HTMLInputElement>('#media-duration')!.value = String(Math.ceil(video.duration));
      };
      video.src = uploadPreviewUrl;
      preview.append(video);
    } else {
      preview.append(document.createTextNode('Önizleme için desteklenmeyen MIME türü.'));
    }
  });

  uploadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = mediaInput?.files?.[0];
    const progress = app.querySelector<HTMLDivElement>('#upload-progress');
    if (!file || !targetInput || !progress) return;
    const selected = targetInput.selectedOptions[0];
    const folder = selected?.dataset.folder;
    if (!folder) {
      setStatus('İzinli bir hedef klasör seçin.');
      return;
    }
    const maxSize = file.type.startsWith('video/') ? MEDIA_LIMITS.videoBytes : MEDIA_LIMITS.imageBytes;
    if (file.size > maxSize) {
      setStatus(`Dosya boyutu ${formatMediaSize(maxSize)} sınırını aşıyor.`);
      return;
    }
    const data = new FormData(uploadForm);
    data.set('folder', folder);
    try {
      const target = JSON.parse(selected.value) as Record<string, unknown>;
      if (target.kind === 'project-video') {
        const width = Number(data.get('width'));
        const height = Number(data.get('height'));
        const durationSeconds = Number(data.get('durationSeconds'));
        if (![width, height, durationSeconds].every(Number.isFinite) || width < 1 || height < 1 || durationSeconds <= 0) {
          setStatus('Video önizlemesinde ölçü ve süre bilgisinin yüklenmesini bekleyin.');
          return;
        }
        const poster = app.querySelector<HTMLSelectElement>('#video-poster')?.value;
        if (poster) target.poster = poster;
        target.width = width;
        target.height = height;
        target.durationSeconds = durationSeconds;
      }
      data.set('target', JSON.stringify(target));
    } catch {
      setStatus('Seçilen medya hedefi geçersiz.');
      return;
    }
    progress.textContent = 'Yükleme başlatılıyor…';
    const submit = uploadForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await api.uploadMedia(data, (percent) => {
        progress.textContent = `Yükleniyor: ${percent}%`;
      });
      await loadContentFromApi();
      await loadAdminResources();
      setStatus('Medya KV/R2 taslağına eklendi; yayınlanana kadar canlı sitede görünmez.');
      renderApp();
      document.getElementById('media-panel')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      progress.textContent = '';
      setStatus(error instanceof Error ? error.message : 'Medya yüklenemedi.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  app.querySelectorAll<HTMLButtonElement>('[data-action="replace-media"]').forEach((button) => button.addEventListener('click', () => {
    const filePath = button.dataset.path;
    const option = targetOptions().find((item) => item.currentPath === filePath);
    if (!option || !targetInput) {
      setStatus('Bu medya dosyası için değiştirilebilir içerik hedefi bulunamadı.');
      return;
    }
    targetInput.value = option.value;
    targetInput.dispatchEvent(new Event('change'));
    app.querySelector<HTMLInputElement>('#media-file')?.click();
  }));

  app.querySelectorAll<HTMLButtonElement>('[data-action="delete-media"]').forEach((button) => button.addEventListener('click', async () => {
    const path = button.dataset.path;
    if (!path || !window.confirm(`“${path}” dosyası taslakta silinmek üzere işaretlensin mi? Yayınlanmış dosya yayın başarılı olana kadar korunur.`)) return;
    try {
      await api.deleteMedia(path);
      await loadAdminResources();
      setStatus('Medya taslakta silinmek üzere işaretlendi; dosya yayınlanana kadar korunur.');
      renderApp();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Medya silinemedi.');
    }
  }));

  app.addEventListener('input', (event) => {
    const target = event.target as ActionTarget;
    const section = target.dataset.section;
    if (!section || typeof target.value !== 'string') {
      return;
    }
    draftHasChanges = true;

    if (section === 'site') {
      const field = target.dataset.field as keyof typeof state.site;
      if (field && field in state.site) {
        state.site[field] = target.value;
      }
      setStatus('Kaydedilmemiş değişiklik var.');
      return;
    }

    if (section === 'seo') {
      if (target.dataset.field === 'site.name') {
        state.seo.site.name = target.value;
      }
      if (target.dataset.field === 'site.url') {
        state.seo.site.url = target.value;
      }
      if (target.dataset.field === 'site.phone') {
        state.seo.site.phone = target.value;
      }
      if (target.dataset.field === 'primaryKeywords') {
        state.seo.primaryKeywords = target.value.split(/\n|,/) .map((item) => item.trim()).filter(Boolean);
      }
      setStatus('Kaydedilmemiş değişiklik var.');
      return;
    }

    const groupIndex = Number(target.dataset.groupIndex ?? -1);
    const categoryIndex = Number(target.dataset.categoryIndex ?? -1);
    const serviceIndex = Number(target.dataset.serviceIndex ?? -1);
    const galleryIndex = Number(target.dataset.galleryIndex ?? -1);

    if (section === 'services') {
      const kind = target.dataset.kind;
      if (kind === 'group') {
        const group = state.services.groups[groupIndex];
        if (!group) {
          return;
        }
        if (target.dataset.field === 'title') group.title = target.value;
        if (target.dataset.field === 'eyebrow') group.eyebrow = target.value;
        if (target.dataset.field === 'description') group.description = target.value;
        if (target.dataset.field === 'menuPreview') group.menuPreview = target.value.split('·').map((item) => item.trim()).filter(Boolean);
        setStatus('Kaydedilmemiş değişiklik var.');
        return;
      }
      if (kind === 'service') {
        const service = state.services.groups[groupIndex]?.services[serviceIndex];
        if (!service) {
          return;
        }
        if (target.dataset.field === 'title') service[1] = target.value;
        if (target.dataset.field === 'id') service[0] = target.value;
        if (target.dataset.field === 'description') service[2] = target.value;
        if (target.dataset.field === 'primaryImage') service[3] = target.value;
        if (target.dataset.field === 'gallery' && galleryIndex >= 0) {
          const gallery = [...service[4]];
          gallery[galleryIndex] = target.value;
          service[4] = gallery;
        }
      }
      setStatus('Kaydedilmemiş değişiklik var.');
      return;
    }

    if (section === 'projects' && target.dataset.kind === 'category') {
      const category = state.projects.categories[categoryIndex];
      if (!category) {
        return;
      }
      if (target.dataset.field === 'title') category.title = target.value;
      if (target.dataset.field === 'description') category.description = target.value;
      if (target.dataset.field === 'cover') category.cover = target.value;
      if (target.dataset.field === 'href') category.href = target.value;
      setStatus('Kaydedilmemiş değişiklik var.');
      return;
    }

    if (section === 'promotions' && target.dataset.kind === 'category') {
      const category = state.promotions.categories[categoryIndex];
      if (!category) {
        return;
      }
      if (target.dataset.field === 'title') category.title = target.value;
      if (target.dataset.field === 'description') category.description = target.value;
      if (target.dataset.field === 'cover') category.cover = target.value;
      if (target.dataset.field === 'href') category.href = target.value;
      setStatus('Kaydedilmemiş değişiklik var.');
    }
  });
};

const loadContentFromApi = async (): Promise<void> => {
  const content = await api.getContent();
  state.site = content.site;
  state.services = content.services;
  state.projects = content.projects;
  state.promotions = content.promotions;
  state.seo = content.seo;
  draftHasChanges = false;
  setStatus('Sunucu taslağı yüklendi.');
};

const loadAdminResources = async (): Promise<void> => {
  const [files, entries, status] = await Promise.all([api.getMedia(), api.getPublishLog(), api.getStatus()]);
  mediaFiles = files;
  publishLog = entries;
  lastPublish = status.lastPublish;
  changedSections = status.changedSections;
};

const initialize = async (): Promise<void> => {
  try {
    const session = await api.session();
    currentUser = session.authenticated ? session.username : null;
    csrfToken = session.csrfToken;
    if (currentUser) {
      await loadContentFromApi();
      await loadAdminResources();
    }
  } catch (error) {
    currentUser = null;
    csrfToken = null;
    statusMessage = error instanceof Error ? error.message : 'Oturum doğrulanamadı.';
  }
  renderApp();
};

initialize();
