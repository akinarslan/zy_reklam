import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pages = ['tekstil-giyim', 'ofis-kirtasiye', 'yasam-mutfak-seyahat', 'vip-ekolojik-setler'];
const servicePages = ['tabela-yonlendirme', 'dijital-baski-kaplama', 'lazer-ozel-uretim', 'promosyon-baski', 'tasarim-kurumsal'];
export default defineConfig({
  build: {
    rolldownOptions: {
      input: [fileURLToPath(new URL('./index.html', import.meta.url)), ...pages.map(id => fileURLToPath(new URL(`./promosyonlar/${id}/index.html`, import.meta.url))), ...['tabela', 'totem', 'lazer-kesim', 'dijital-baski', 'ozel-uretim'].map(id => fileURLToPath(new URL(`./projeler/${id}/index.html`, import.meta.url))), ...servicePages.map(id => fileURLToPath(new URL(`./hizmetler/${id}/index.html`, import.meta.url)))],
    },
  },
});
