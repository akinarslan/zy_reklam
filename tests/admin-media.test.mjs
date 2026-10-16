import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithOxc } from 'vite';

const transformTypeScript = async (path) => {
  const source = await readFile(path, 'utf8');
  return (await transformWithOxc(source, path)).code;
};

const moduleUrl = (javascript) => `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`;
const sharedUrl = moduleUrl(await transformTypeScript('src/shared/admin-media.ts'));
const adminMedia = await import(sharedUrl);
const workerMediaSource = await transformTypeScript('worker/media.ts');
const workerMedia = await import(moduleUrl(workerMediaSource.replace('../src/shared/admin-media', sharedUrl)));
const github = await import(moduleUrl(await transformTypeScript('worker/github.ts')));

const readableBytes = (bytes, chunkLengths) => new ReadableStream({
  start(controller) {
    let offset = 0;
    let chunkIndex = 0;
    while (offset < bytes.length) {
      const length = chunkLengths[chunkIndex % chunkLengths.length];
      controller.enqueue(bytes.slice(offset, offset + length));
      offset += length;
      chunkIndex += 1;
    }
    controller.close();
  }
});

const readRequestBody = async (body) => new Response(body).text();

test('Admin medya imza, uzantı, klasör ve boyut sözleşmeleri', () => {
  assert.equal(adminMedia.isValidMediaSignature('image/png', Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])), true);
  assert.equal(adminMedia.isValidMediaSignature('image/png', new TextEncoder().encode('<svg></svg>')), false);
  assert.equal(adminMedia.isValidMediaSignature('video/mp4', new TextEncoder().encode('0000ftyp')), false);
  assert.equal(adminMedia.isAllowedPublicMediaPath('/assets/videos/safe-name.mp4'), true);
  assert.equal(adminMedia.isAllowedPublicMediaPath('/assets/videos/../private.mp4'), false);
  assert.equal(adminMedia.isAllowedPublicMediaPath('/assets/brand/logo.png'), false);
  assert.equal(adminMedia.mimeTypeForExtension('WEBP'), 'image/webp');
  assert.equal(adminMedia.MEDIA_LIMITS.imageBytes, 8 * 1024 * 1024);
  assert.equal(adminMedia.MEDIA_LIMITS.videoBytes, 50 * 1024 * 1024);
});

test('Worker upload validator enforces exact image/video limits and safe unique names', () => {
  const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const mp4Signature = Uint8Array.from([0, 0, 0, 0, 102, 116, 121, 112, 0, 0, 0, 0]);
  assert.equal(workerMedia.validateUpload('test.png', 'image/png', adminMedia.MEDIA_LIMITS.imageBytes, pngSignature).limit, adminMedia.MEDIA_LIMITS.imageBytes);
  assert.throws(() => workerMedia.validateUpload('test.png', 'image/png', adminMedia.MEDIA_LIMITS.imageBytes + 1, pngSignature), /8 MB/);
  assert.equal(workerMedia.validateUpload('test.mp4', 'video/mp4', adminMedia.MEDIA_LIMITS.videoBytes, mp4Signature).limit, adminMedia.MEDIA_LIMITS.videoBytes);
  assert.throws(() => workerMedia.validateUpload('test.mp4', 'video/mp4', adminMedia.MEDIA_LIMITS.videoBytes + 1, mp4Signature), /50 MB/);
  assert.throws(() => workerMedia.validateUpload('test.png', 'image/jpeg', 10, pngSignature), /eşleşmiyor/);
  const mediaPath = workerMedia.createMediaPath('services', 'Çatı tabela.jpg', new Date('2026-10-16T12:34:56.000Z'), 'a1b2c3d4');
  assert.equal(mediaPath.path, '/assets/services/cati-tabela-20261016-123456-a1b2c3d4.jpg');
  assert.equal(mediaPath.repoPath, `public${mediaPath.path}`);
});

test('Binary GitHub blob JSON stream preserves bytes across arbitrary R2 chunk boundaries', async () => {
  const original = Uint8Array.from({ length: 257 }, (_, index) => (index * 43) % 256);
  const body = github.githubBinaryJsonBody(readableBytes(original, [1, 2, 5, 3, 11]));
  const parsed = JSON.parse(await readRequestBody(body));
  assert.equal(parsed.encoding, 'base64');
  assert.deepEqual(Buffer.from(parsed.content, 'base64'), Buffer.from(original));
});

const createGithubMock = ({ conflict = false } = {}) => {
  const calls = [];
  let refReads = 0;
  const fetcher = async (input, init = {}) => {
    const url = String(input);
    const method = init.method ?? 'GET';
    const body = init.body ? await readRequestBody(init.body) : '';
    calls.push({ url, method, body });
    if (url.endsWith('/git/ref/heads/main') && method === 'GET') {
      refReads += 1;
      const sha = conflict && refReads > 1 ? 'concurrent-main-sha' : 'initial-main-sha';
      return Response.json({ object: { sha } });
    }
    if (url.endsWith('/git/commits/initial-main-sha') && method === 'GET') {
      return Response.json({ tree: { sha: 'initial-tree-sha' } });
    }
    if (url.endsWith('/git/blobs') && method === 'POST') {
      const parsed = JSON.parse(body);
      if (parsed.encoding === 'base64') {
        assert.deepEqual(Buffer.from(parsed.content, 'base64'), Buffer.from('binary-payload'));
      }
      return Response.json({ sha: `blob-${calls.length}` });
    }
    if (url.endsWith('/git/trees') && method === 'POST') {
      return Response.json({ sha: 'new-tree-sha' });
    }
    if (url.endsWith('/git/commits') && method === 'POST') {
      return Response.json({ sha: 'new-commit-sha', html_url: 'https://github.com/akinarslan/zy_reklam/commit/new-commit-sha' });
    }
    if (url.endsWith('/git/refs/heads/main') && method === 'PATCH') return Response.json({ ok: true });
    throw new Error(`Unexpected mock GitHub request: ${method} ${url}`);
  };
  return { calls, fetcher };
};

const draftForPublish = {
  content: { site: {}, services: {}, projects: {}, promotions: {}, seo: {} },
  pendingMedia: [{
    path: '/assets/uploads/safe-image.png',
    repoPath: 'public/assets/uploads/safe-image.png',
    filename: 'safe-image.png',
    stageKey: 'drafts/test/image',
    mimeType: 'image/png',
    size: 14,
    mediaType: 'image'
  }],
  deletedMedia: [{ path: '/assets/uploads/old.png', repoPath: 'public/assets/uploads/old.png' }]
};

test('Publish stages JSON and media in one commit based on the main tree', async () => {
  const { calls, fetcher } = createGithubMock();
  const result = await github.publishDraftToGitHub({
    GITHUB_TOKEN: 'mock-token',
    ADMIN_MEDIA_STAGING: { get: async () => ({ body: readableBytes(new TextEncoder().encode('binary-payload'), [4, 3]) }) }
  }, draftForPublish, 'admin', 'Test publish', fetcher);

  assert.equal(result.ok, true);
  assert.equal(result.sha, 'new-commit-sha');
  const treeCall = calls.find(({ url, method }) => url.endsWith('/git/trees') && method === 'POST');
  const treePayload = JSON.parse(treeCall.body);
  assert.equal(treePayload.base_tree, 'initial-tree-sha');
  assert.ok(treePayload.tree.some(({ path }) => path === 'src/content/site.json'));
  assert.ok(treePayload.tree.some(({ path }) => path === 'public/assets/uploads/safe-image.png'));
  assert.ok(treePayload.tree.some(({ path, sha }) => path === 'public/assets/uploads/old.png' && sha === null));
  const commitCall = calls.find(({ url, method }) => url.endsWith('/git/commits') && method === 'POST');
  assert.deepEqual(JSON.parse(commitCall.body).parents, ['initial-main-sha']);
  assert.equal(calls.filter(({ url, method }) => url.endsWith('/git/blobs') && method === 'POST').length, 6);
  assert.equal(calls.some(({ method, url }) => method === 'PATCH' && url.endsWith('/git/refs/heads/main')), true);
});

test('Publish refuses to move main when its ref changes before update', async () => {
  const { calls, fetcher } = createGithubMock({ conflict: true });
  const result = await github.publishDraftToGitHub({ GITHUB_TOKEN: 'mock-token' }, {
    ...draftForPublish,
    pendingMedia: [],
    deletedMedia: []
  }, 'admin', 'Conflict test', fetcher);

  assert.equal(result.ok, false);
  assert.equal(result.conflict, true);
  assert.equal(calls.some(({ method, url }) => method === 'PATCH' && url.endsWith('/git/refs/heads/main')), false);
});
