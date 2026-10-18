import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSnapshots,hash} from '../scripts/live-snapshot.mjs';
import {canonical,validManifest,validSnapshot,safeUrl} from '../src/content/live/protocol.js';

test('A: deterministic public snapshots, schema, unsafe URL rejection and full initial HTML', async()=>{
 const paths=['/','/3d-vitrin/','/hizmetler/tabela-yonlendirme/','/projeler/tabela/','/promosyonlar/ofis-kirtasiye/'];
 const pages=await Promise.all(paths.map(async path=>[path,await readFile(`dist${path}index.html`,'utf8')]));
 const revision='a'.repeat(40);
 const first=await createSnapshots(process.cwd(),pages,revision),second=await createSnapshots(process.cwd(),[...pages].reverse(),revision);
 assert.deepEqual(first.manifest,second.manifest);
 assert.equal(canonical({b:2,a:1}),canonical({a:1,b:2}));
 assert.ok(validManifest(first.manifest));
 assert.ok(!validManifest({...first.manifest,schemaVersion:2}));
 for(const [key,item] of Object.entries(first.manifest.sections)) {
  const text=first.files.get(item.url);
  assert.equal(hash(text),item.hash);
  assert.ok(validSnapshot(JSON.parse(text),key));
  assert.ok(!/ADMIN_SESSION_SECRET|GITHUB_TOKEN|stageKey|sourceSHA256|sourceFile/.test(text));
 }
 const changed=pages.map(([path,html])=>[path,html.replace('Tüm hizmetlerimizi beş ana başlıkta keşfedin.','Different static heading')]);
 // Only selected public DOM contributes to each section, never scripts or admin data.
 const next=await createSnapshots(process.cwd(),changed,'b'.repeat(40));
 assert.deepEqual(next.manifest.sections,first.manifest.sections);
 for(const url of ['javascript:alert(1)','//evil.test/','/../admin/','https://evil.test/a','data:text/html,evil']) assert.ok(!safeUrl(url),url);
 for(const [,html] of pages) {assert.ok(html.includes('<h1'));assert.ok(html.includes('rel="canonical"'));assert.ok(html.includes('live-content-baseline'));}
 const built=JSON.parse(await readFile('dist/content-version.json','utf8'));
 for(const [key,item] of Object.entries(built.sections)) assert.equal(hash(await readFile(`dist${item.url}`,'utf8')),item.hash,key);
 const headers=await readFile('dist/_headers','utf8');
 assert.match(headers,/no-store.*must-revalidate/);assert.match(headers,/max-age=31536000, immutable/);
});
