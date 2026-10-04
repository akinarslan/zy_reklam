import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { groups } = JSON.parse(await readFile('src/content/services.json','utf8'));

test('Hizmetler mega menüsü beş ana grubu içerir', async () => {
  const html = await readFile('index.html','utf8');
  assert.match(html,/data-service-menu/);
  assert.equal(groups.length,5);
  for (const group of groups) {
    assert.ok(html.includes(`/hizmetler/${group.id}/`), group.title);
  }
});

test('Her hizmet grubu tek sayfada bütün alt hizmetleri içerir', async () => {
  for (const group of groups) {
    const html = await readFile(`hizmetler/${group.id}/index.html`,'utf8');
    assert.ok(html.includes(`<h1>${group.title}</h1>`));
    for (const item of group.services) {
      assert.ok(html.includes(`id="${item[0]}"`), `${group.title}: ${item[1]}`);
      assert.ok(html.includes(`<h2>${item[1]}</h2>`), `${group.title}: ${item[1]}`);
    }
  }
});

test('Sitemap hizmet kategori sayfalarını içerir', async () => {
  const sitemap = await readFile('public/sitemap.xml','utf8');
  for (const group of groups) {
    assert.ok(sitemap.includes(`/hizmetler/${group.id}/`), group.title);
  }
});
