import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pages = ['tekstil-giyim', 'ofis-kirtasiye', 'yasam-mutfak-seyahat', 'vip-ekolojik-setler'];
export default defineConfig({
  build: {
    rolldownOptions: {
      input: [fileURLToPath(new URL('./index.html', import.meta.url)), ...pages.map(id => fileURLToPath(new URL(`./promosyonlar/${id}/index.html`, import.meta.url)))],
    },
  },
});
