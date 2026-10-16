import { readdir, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const assetsRoot = join(root, 'public', 'assets');
const output = join(root, 'public', 'admin-media-manifest.json');
const mimeTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm']
]);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
};

const files = [];
for (const file of await walk(assetsRoot)) {
  const extension = extname(file).toLowerCase();
  const mimeType = mimeTypes.get(extension);
  if (!mimeType) continue;
  const metadata = await stat(file);
  const relativePath = relative(assetsRoot, file).split(sep).join('/');
  const path = `/assets/${relativePath}`;
  if (!/^\/assets\/[a-z0-9/_-]+\.(?:jpe?g|png|webp|mp4|webm)$/i.test(path)) continue;
  files.push({
    path,
    mimeType,
    size: metadata.size,
    mediaType: mimeType.startsWith('video/') ? 'video' : 'image'
  });
}

files.sort((a, b) => a.path.localeCompare(b.path));
await writeFile(output, `${JSON.stringify({ version: 1, files }, null, 2)}\n`, 'utf8');
console.log(`Generated admin media manifest for ${files.length} public image/video assets.`);
