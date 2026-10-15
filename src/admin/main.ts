import servicesData from '../content/services.json';
import projectsData from '../content/projects.json';
import promotionsData from '../content/promotions.json';
import seoData from '../content/seo.json';
import siteData from '../content/site.json';

type ContentState = {
  site: typeof siteData.site;
  services: typeof servicesData;
  projects: typeof projectsData;
  promotions: typeof promotionsData;
  seo: typeof seoData;
};

type ActionTarget = HTMLElement & { dataset: DOMStringMap; value?: string };

const state: ContentState = {
  site: structuredClone(siteData.site),
  services: structuredClone(servicesData),
  projects: structuredClone(projectsData),
  promotions: structuredClone(promotionsData),
  seo: structuredClone(seoData)
};

const draftKey = 'zy-reklam-admin-draft';
let currentUser: string | null = null;
let statusMessage = 'Yükleniyor...';

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

const saveDraftLocally = (): void => {
  localStorage.setItem(draftKey, JSON.stringify(state));
  setStatus('Bu taslak bu tarayıcıda saklanır.');
};

const loadDraftLocally = (): void => {
  const saved = localStorage.getItem(draftKey);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<ContentState>;
    if (parsed.site) state.site = parsed.site;
    if (parsed.services) state.services = parsed.services;
    if (parsed.projects) state.projects = parsed.projects;
    if (parsed.promotions) state.promotions = parsed.promotions;
    if (parsed.seo) state.seo = parsed.seo;
  } catch {
    console.warn('Draft load failed.');
  }
};

const sendJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || 'İstek sırasında hata oluştu.');
  }
  return payload as T;
};

const api = {
  async session(): Promise<{ authenticated: boolean; username: string | null }> {
    return sendJson('/api/admin/session');
  },
  async login(username: string, password: string): Promise<{ ok: true; username: string }> {
    return sendJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  async logout(): Promise<void> {
    await sendJson('/api/admin/logout', { method: 'POST' });
  },
  async getContent(): Promise<ContentState> {
    const response = await sendJson<{ site: typeof state.site; services: typeof state.services; projects: typeof state.projects; promotions: typeof state.promotions; seo: typeof state.seo }>('/api/admin/content');
    return {
      site: response.site,
      services: response.services,
      projects: response.projects,
      promotions: response.promotions,
      seo: response.seo
    };
  },
  async saveSection(section: keyof ContentState, value: ContentState[keyof ContentState]): Promise<void> {
    await sendJson('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({ section, data: value })
    });
  },
  async publish(message: string): Promise<{ ok: boolean; commitSha?: string; error?: string }> {
    return sendJson('/api/admin/publish', {
      method: 'POST',
      body: JSON.stringify({
        message,
        baseSha: null,
        site: state.site,
        services: state.services,
        projects: state.projects,
        promotions: state.promotions,
        seo: state.seo,
        media: {}
      })
    });
  }
};

const renderHome = (): string => `
  <div class="form-grid">
    <label class="field">
      <span>Sayfa başlığı</span>
      <input data-section="site" data-field="title" value="${escapeHtml(state.site.title)}" />
    </label>
    <label class="field">
      <span>Telefon</span>
      <input data-section="site" data-field="phone" value="${escapeHtml(state.site.phone)}" />
    </label>
    <label class="field" style="grid-column: 1 / -1;">
      <span>Meta açıklama</span>
      <textarea data-section="site" data-field="description">${escapeHtml(state.site.description)}</textarea>
    </label>
    <label class="field" style="grid-column: 1 / -1;">
      <span>Adres</span>
      <textarea data-section="site" data-field="address">${escapeHtml(state.site.address)}</textarea>
    </label>
    <label class="field" style="grid-column: 1 / -1;">
      <span>Instagram linki</span>
      <input data-section="site" data-field="instagram" value="${escapeHtml(state.site.instagram)}" />
    </label>
    <label class="field" style="grid-column: 1 / -1;">
      <span>Footer metni</span>
      <input data-section="site" data-field="footerText" value="${escapeHtml(state.site.footerText)}" />
    </label>
  </div>
`;

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
  <div class="admin-layout" style="display: grid; place-items: center; min-height: 100vh;">
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

const renderApp = (): void => {
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
        await loadContentFromApi();
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
      <aside class="admin-sidebar">
        <div class="brand-mark"><div class="brand-mark-badge">ZY</div><div>Admin</div></div>
        <nav class="admin-nav" aria-label="Yönetim menüsü">
          <button type="button" data-target="home">Ana Sayfa</button>
          <button type="button" data-target="services">Hizmetler</button>
          <button type="button" data-target="projects">Projeler</button>
          <button type="button" data-target="promotions">Promosyonlar</button>
          <button type="button" data-target="seo">SEO</button>
        </nav>
        <div style="margin-top: 24px; display: grid; gap: 10px;">
          <button type="button" class="secondary-button" data-action="draft">Taslağı Kaydet</button>
          <button type="button" class="primary-button" data-action="publish">Yayınla</button>
          <button type="button" class="ghost-button" data-action="logout">Çıkış</button>
        </div>
      </aside>
      <main class="admin-main">
        <div class="admin-content">
          <section class="panel" id="home-panel">
            <div class="panel-header"><div><h2>Ana sayfa</h2><p class="panel-subtitle">Başlık, iletişim, SEO ve footer alanları.</p></div></div>
            ${renderHome()}
          </section>
          <section class="panel" id="services-panel">
            <div class="panel-header"><div><h2>Hizmetler</h2><p class="panel-subtitle">Her hizmet ve grup düzenlenebilir.</p></div></div>
            ${renderServices()}
          </section>
          <section class="panel" id="projects-panel">
            <div class="panel-header"><div><h2>Projeler</h2><p class="panel-subtitle">Kategori ve örnek görünüm alanları.</p></div></div>
            ${renderProjects()}
          </section>
          <section class="panel" id="promotions-panel">
            <div class="panel-header"><div><h2>Promosyonlar</h2><p class="panel-subtitle">Kategori ve promosyon içerikleri.</p></div></div>
            ${renderPromotions()}
          </section>
          <section class="panel" id="seo-panel">
            <div class="panel-header"><div><h2>SEO</h2><p class="panel-subtitle">Anahtar kelimeler ve sayfa meta düzeni.</p></div></div>
            <div class="form-grid">
              <label class="field" style="grid-column: 1 / -1;"><span>Site adı</span><input data-section="seo" data-field="site.name" value="${escapeHtml(state.seo.site.name)}" /></label>
              <label class="field" style="grid-column: 1 / -1;"><span>URL</span><input data-section="seo" data-field="site.url" value="${escapeHtml(state.seo.site.url)}" /></label>
              <label class="field" style="grid-column: 1 / -1;"><span>Telefon</span><input data-section="seo" data-field="site.phone" value="${escapeHtml(state.seo.site.phone)}" /></label>
              <label class="field" style="grid-column: 1 / -1;"><span>Primary keywords</span><textarea data-section="seo" data-field="primaryKeywords">${escapeHtml(state.seo.primaryKeywords.join('\n'))}</textarea></label>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header"><div><h2>Yayın durumu</h2><p class="panel-subtitle">Bu taslak bu tarayıcıda saklanır.</p></div></div>
            <div class="status-box" id="status-box">${escapeHtml(statusMessage)}</div>
          </section>
        </div>
      </main>
    </div>
  `;

  app.querySelectorAll('[data-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      document.getElementById(`${target}-panel`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  app.querySelectorAll('[data-action="draft"]').forEach((button) => button.addEventListener('click', () => {
    saveDraftLocally();
  }));

  app.querySelectorAll('[data-action="logout"]').forEach((button) => button.addEventListener('click', async () => {
    try {
      await api.logout();
      currentUser = null;
      renderApp();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Çıkış sırasında hata oluştu.');
    }
  }));

  app.querySelectorAll('[data-action="publish"]').forEach((button) => button.addEventListener('click', async () => {
    try {
      const result = await api.publish(`Admin: ${new Date().toISOString()}`);
      if (result.ok) {
        setStatus(`Yayın başarılı: ${result.commitSha ?? 'commit'} `);
      } else {
        setStatus(result.error || 'Yayın sırasında hata oluştu.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Yayın sırasında hata oluştu.');
    }
  }));

  app.addEventListener('input', (event) => {
    const target = event.target as ActionTarget;
    const section = target.dataset.section;
    if (!section || typeof target.value !== 'string') {
      return;
    }

    if (section === 'site') {
      const field = target.dataset.field as keyof typeof state.site;
      if (field && field in state.site) {
        state.site[field] = target.value;
      }
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
    }
  });

  app.querySelectorAll('[data-action="save"]').forEach((button) => button.remove());
};

const loadContentFromApi = async (): Promise<void> => {
  try {
    const content = await api.getContent();
    state.site = content.site;
    state.services = content.services;
    state.projects = content.projects;
    state.promotions = content.promotions;
    state.seo = content.seo;
    setStatus('İçerik API üzerinden yüklendi.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'İçerik yüklenemedi.');
  }
};

const initialize = async (): Promise<void> => {
  loadDraftLocally();
  try {
    const session = await api.session();
    currentUser = session.authenticated ? session.username : null;
    if (currentUser) {
      await loadContentFromApi();
    }
  } catch {
    currentUser = null;
  }
  renderApp();
};

initialize();
