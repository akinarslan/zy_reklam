import type { AdminDraft, PendingMedia } from './content';

type GithubEnv = {
  GITHUB_TOKEN?: string;
  ADMIN_MEDIA_STAGING?: {
    get: (key: string) => Promise<{ body: ReadableStream<Uint8Array> } | null>;
  };
};

type GithubResult = {
  ok: boolean;
  sha?: string;
  url?: string;
  baseSha?: string;
  conflict?: boolean;
  error?: string;
};

type Fetcher = typeof fetch;

const OWNER = 'akinarslan';
const REPOSITORY = 'zy_reklam';
const MAIN_REF = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/ref/heads/main`;
const MAIN_REF_UPDATE = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/refs/heads/main`;
const headers = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'zy-reklam-admin-worker'
});

const base64Chunk = (bytes: Uint8Array): string => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 1) binary += String.fromCharCode(bytes[offset]);
  return btoa(binary);
};

export const githubBinaryJsonBody = (source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> => {
  const reader = source.getReader();
  const encoder = new TextEncoder();
  let started = false;
  let carry = new Uint8Array();
  let finished = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!started) {
        started = true;
        controller.enqueue(encoder.encode('{"content":"'));
        return;
      }

      if (finished) return;
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          if (carry.length) controller.enqueue(encoder.encode(base64Chunk(carry)));
          controller.enqueue(encoder.encode('","encoding":"base64"}'));
          finished = true;
          controller.close();
          return;
        }

        const combined = new Uint8Array(carry.length + (value?.length ?? 0));
        combined.set(carry, 0);
        if (value) combined.set(value, carry.length);
        const fullLength = combined.length - (combined.length % 3);
        carry = combined.slice(fullLength);
        if (fullLength) {
          controller.enqueue(encoder.encode(base64Chunk(combined.subarray(0, fullLength))));
          return;
        }
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
    }
  });
};

const createBlob = async (
  token: string,
  content: string,
  encoding: 'utf-8' | 'base64',
  fetcher: Fetcher
): Promise<string> => {
  const response = await fetcher(`https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/blobs`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, encoding })
  });
  if (!response.ok) throw new Error(`GitHub blob create failed (${response.status}).`);
  const result = await response.json() as { sha?: string };
  if (!result.sha) throw new Error('GitHub returned a blob without a SHA.');
  return result.sha;
};

const createBinaryBlob = async (token: string, file: PendingMedia, env: GithubEnv, fetcher: Fetcher): Promise<string> => {
  const object = await env.ADMIN_MEDIA_STAGING?.get(file.stageKey);
  if (!object) throw new Error(`Taslak medya dosyası bulunamadı: ${file.filename}`);
  const response = await fetcher(`https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/blobs`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: githubBinaryJsonBody(object.body)
  });
  if (!response.ok) throw new Error(`GitHub medya blob'u oluşturulamadı (${response.status}): ${file.filename}`);
  const result = await response.json() as { sha?: string };
  if (!result.sha) throw new Error(`GitHub medya blob SHA eksik: ${file.filename}`);
  return result.sha;
};

const getMainSha = async (token: string, fetcher: Fetcher): Promise<string> => {
  const response = await fetcher(MAIN_REF, { headers: headers(token), cache: 'no-store' });
  if (!response.ok) throw new Error(`GitHub main ref okunamadı (${response.status}).`);
  const result = await response.json() as { object?: { sha?: string } };
  if (!result.object?.sha) throw new Error('GitHub main ref SHA döndürmedi.');
  return result.object.sha;
};

const getMainTreeSha = async (token: string, commitSha: string, fetcher: Fetcher): Promise<string> => {
  const response = await fetcher(`https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/commits/${commitSha}`, {
    headers: headers(token),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`GitHub main commit okunamadı (${response.status}).`);
  const result = await response.json() as { tree?: { sha?: string } };
  if (!result.tree?.sha) throw new Error('GitHub main commit tree SHA döndürmedi.');
  return result.tree.sha;
};

export const publishDraftToGitHub = async (
  env: GithubEnv,
  draft: AdminDraft,
  username: string,
  message: string,
  fetcher: Fetcher = fetch
): Promise<GithubResult> => {
  if (!env.GITHUB_TOKEN) return { ok: false, error: 'GitHub yayın anahtarı yapılandırılmamış.', conflict: false };
  if (!env.ADMIN_MEDIA_STAGING && draft.pendingMedia.length) {
    return { ok: false, error: 'Medya staging deposu yapılandırılmamış.', conflict: false };
  }

  let baseSha: string;
  try {
    baseSha = await getMainSha(env.GITHUB_TOKEN, fetcher);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'GitHub main ref okunamadı.' };
  }

  try {
    const baseTreeSha = await getMainTreeSha(env.GITHUB_TOKEN, baseSha, fetcher);
    const files: Array<{ path: string; sha: string }> = [];
    const jsonFiles: Array<[string, unknown]> = [
      ['src/content/site.json', { site: draft.content.site }],
      ['src/content/services.json', draft.content.services],
      ['src/content/projects.json', draft.content.projects],
      ['src/content/promotions.json', draft.content.promotions],
      ['src/content/seo.json', draft.content.seo]
    ];

    for (const [path, value] of jsonFiles) {
      const sha = await createBlob(env.GITHUB_TOKEN, `${JSON.stringify(value, null, 2)}\n`, 'utf-8', fetcher);
      files.push({ path, sha });
    }

    for (const media of draft.pendingMedia) {
      const sha = await createBinaryBlob(env.GITHUB_TOKEN, media, env, fetcher);
      files.push({ path: media.repoPath, sha });
    }

    const treeEntries = [
      ...files.map(({ path, sha }) => ({ path, mode: '100644', type: 'blob', sha })),
      ...draft.deletedMedia.map(({ repoPath }) => ({ path: repoPath, mode: '100644', type: 'blob', sha: null }))
    ];
    const treeResponse = await fetcher(`https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/trees`, {
      method: 'POST',
      headers: { ...headers(env.GITHUB_TOKEN), 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries })
    });
    if (!treeResponse.ok) throw new Error(`GitHub tree oluşturulamadı (${treeResponse.status}).`);
    const tree = await treeResponse.json() as { sha?: string };
    if (!tree.sha) throw new Error('GitHub tree SHA döndürmedi.');

    const commitResponse = await fetcher(`https://api.github.com/repos/${OWNER}/${REPOSITORY}/git/commits`, {
      method: 'POST',
      headers: { ...headers(env.GITHUB_TOKEN), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] })
    });
    if (!commitResponse.ok) throw new Error(`GitHub commit oluşturulamadı (${commitResponse.status}).`);
    const commit = await commitResponse.json() as { sha?: string; html_url?: string };
    if (!commit.sha) throw new Error('GitHub commit SHA döndürmedi.');

    const currentSha = await getMainSha(env.GITHUB_TOKEN, fetcher);
    if (currentSha !== baseSha) {
      return { ok: false, conflict: true, baseSha, error: 'Site başka bir işlem tarafından güncellendi. Sayfayı yenileyip tekrar deneyin.' };
    }

    const update = await fetcher(MAIN_REF_UPDATE, {
      method: 'PATCH',
      headers: { ...headers(env.GITHUB_TOKEN), 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha, force: false })
    });
    if (!update.ok) {
      if (update.status === 409 || update.status === 422) {
        return { ok: false, conflict: true, baseSha, error: 'Site başka bir işlem tarafından güncellendi. Sayfayı yenileyip tekrar deneyin.' };
      }
      throw new Error(`GitHub main ref güncellenemedi (${update.status}).`);
    }
    return { ok: true, sha: commit.sha, url: commit.html_url, baseSha };
  } catch (error) {
    return { ok: false, baseSha, error: error instanceof Error ? error.message : 'GitHub yayın hatası.' };
  }
};
