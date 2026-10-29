const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { handlePinnedQuestRequest } = require('../server/githubPinned');
const vercelHandler = require('../api/github-pinned');

afterEach(() => mock.restoreAll());

function response() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = JSON.parse(body);
    },
  };
}

function restRepository(overrides = {}) {
  return {
    id: 1,
    name: 'public-project',
    description: 'A public project',
    html_url: 'https://github.com/example/public-project',
    homepage: 'https://example.com',
    language: 'TypeScript',
    stargazers_count: 7,
    forks_count: 2,
    updated_at: '2026-10-27T00:00:00Z',
    topics: ['systems'],
    private: false,
    fork: false,
    ...overrides,
  };
}

function pinnedRepository(overrides = {}) {
  return {
    id: 'R_1',
    name: 'pinned-project',
    description: 'A pinned project',
    url: 'https://github.com/example/pinned-project',
    homepageUrl: null,
    stargazerCount: 4,
    forkCount: 1,
    updatedAt: '2026-10-27T00:00:00Z',
    isPrivate: false,
    primaryLanguage: { name: 'Python', color: '#3572A5' },
    repositoryTopics: { nodes: [{ topic: { name: 'ai' } }] },
    ...overrides,
  };
}

test('keyless sync returns real recent projects, never labeling them pinned', async () => {
  const fetch = mock.method(global, 'fetch', async (url, options) => {
    assert.match(url, /users\/example\/repos/);
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.Authorization, undefined);
    return {
      ok: true,
      json: async () => [
        restRepository(),
        restRepository({ id: 2, private: true }),
        restRepository({ id: 3, fork: true }),
        restRepository({ id: 4, html_url: 'javascript:alert(1)' }),
      ],
    };
  });
  const res = response();
  await handlePinnedQuestRequest({ method: 'GET' }, res, { GITHUB_PROFILE_LOGIN: 'example' });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(res.body.source, 'github');
  assert.equal(res.body.selection, 'recent');
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].id, '1');
  assert.equal(res.body.items[0].stargazerCount, 7);
  assert.match(res.headers['Cache-Control'], /s-maxage=900/);
});

test('configured token retrieves exact public pins and strips unsafe demo URLs', async () => {
  mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.github.com/graphql');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(JSON.parse(options.body).variables.login, 'example');
    return {
      ok: true,
      json: async () => ({
        data: {
          user: {
            login: 'example',
            name: 'Example',
            url: 'https://github.com/example',
            pinnedItems: {
              nodes: [
                pinnedRepository({ homepageUrl: 'javascript:alert(1)' }),
                pinnedRepository({ id: 'private', isPrivate: true }),
                null,
              ],
            },
          },
        },
      }),
    };
  });
  const res = response();
  await handlePinnedQuestRequest({ method: 'GET' }, res, {
    GITHUB_PROFILE_LOGIN: 'example',
    GITHUB_TOKEN: ' test-token ',
  });
  assert.equal(res.body.selection, 'pinned');
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].homepageUrl, null);
  assert.deepEqual(res.body.items[0].topics, ['ai']);
});

for (const reason of ['invalid-token', 'graphql-errors', 'no-pins', 'timeout']) {
  test(`pinned sync ${reason} falls back to live public REST`, async () => {
    let calls = 0;
    mock.method(global, 'fetch', async () => {
      calls++;
      if (calls > 1) return { ok: true, json: async () => [restRepository()] };
      if (reason === 'timeout') throw new DOMException('Timed out', 'TimeoutError');
      return {
        ok: reason !== 'invalid-token',
        status: 401,
        json: async () =>
          reason === 'graphql-errors'
            ? { errors: [{ message: 'Upstream detail must not reach the browser' }] }
            : { data: { user: { login: 'example', pinnedItems: { nodes: [] } } } },
      };
    });
    const res = response();
    await handlePinnedQuestRequest({ method: 'GET' }, res, { GITHUB_TOKEN: 'expired' });
    assert.equal(calls, 2);
    assert.equal(res.body.source, 'github');
    assert.equal(res.body.selection, 'recent');
    assert.doesNotMatch(JSON.stringify(res.body), /Upstream detail/);
  });
}

for (const result of ['rate-limit', 'empty', 'malformed', 'network']) {
  test(`REST ${result} returns a usable local artifact with short caching`, async () => {
    mock.method(global, 'fetch', async () => {
      if (result === 'network') throw new Error('Network failed');
      return {
        ok: result !== 'rate-limit',
        status: 403,
        json: async () => (result === 'malformed' ? { unexpected: true } : []),
      };
    });
    const res = response();
    await handlePinnedQuestRequest({ method: 'GET' }, res, {});
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, 'fallback');
    assert.ok(res.body.items[0].url.startsWith('https://'));
    assert.match(res.headers['Cache-Control'], /s-maxage=60,/);
  });
}

test('unsupported methods are not cached and never call GitHub', async () => {
  const fetch = mock.method(global, 'fetch', async () => {
    throw new Error('Must not fetch');
  });
  const res = response();
  await handlePinnedQuestRequest({ method: 'POST' }, res, {});
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET');
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(fetch.mock.callCount(), 0);
});

test('invalid configured usernames use a safe default without an upstream call', async () => {
  const fetch = mock.method(global, 'fetch', async () => {
    throw new Error('Must not fetch');
  });
  const res = response();
  await handlePinnedQuestRequest({ method: 'GET' }, res, { GITHUB_PROFILE_LOGIN: '../../invalid' });
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(res.body.source, 'fallback');
  assert.equal(res.body.profile.login, 'chiranjeev-21');
});

test('the actual Vercel entrypoint uses the same handler', async () => {
  const res = response();
  await vercelHandler({ method: 'DELETE' }, res);
  assert.equal(res.statusCode, 405);
});
