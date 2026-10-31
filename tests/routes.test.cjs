const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let parseRoute;
let routeHref;
let canonicalHref;
before(
  async () => ({ parseRoute, routeHref, canonicalHref } = await import('../src/app/routes.ts'))
);

test('home, chapter anchors, case studies and notes have direct addresses', () => {
  assert.deepEqual(parseRoute('/'), { name: 'home', chapter: null, anchor: null });
  assert.deepEqual(parseRoute('/#journey'), { name: 'home', chapter: 'journey', anchor: null });
  assert.deepEqual(parseRoute('/#retrieval'), { name: 'home', chapter: null, anchor: 'retrieval' });
  assert.deepEqual(parseRoute('/projects/cj-os-desktop'), {
    name: 'project',
    slug: 'cj-os-desktop',
  });
  assert.deepEqual(parseRoute('/writing/retrieval-is-not-evidence?mode=browse'), {
    name: 'note',
    slug: 'retrieval-is-not-evidence',
  });
  assert.equal(routeHref(parseRoute('/projects/cj-universe')), '/projects/cj-universe');
  assert.equal(routeHref({ name: 'home', chapter: 'contact', anchor: null }), '/#contact');
});

test('every previous CJ Universe destination still lands on its new chapter', () => {
  const expected = {
    about: '/#identity',
    engineering: '/#work',
    'ai-lab': '/#retrieval',
    projects: '/#work',
    creative: '/#beyond',
    hush: '/#hush',
    writing: '/#notes',
    contact: '/#contact',
  };
  for (const [world, href] of Object.entries(expected)) {
    assert.equal(canonicalHref(`/world/${world}?mode=explore`), href, world);
    assert.equal(canonicalHref(`/world/${world}?mode=browse`), href, world);
  }
  assert.equal(canonicalHref('/world/projects?mode=browse&vault=1'), '/#side-quests');
  assert.equal(canonicalHref('/?mode=browse&vault=1'), '/#side-quests');
  assert.equal(canonicalHref('/?mode=explore'), '/');
  assert.equal(canonicalHref('/projects'), '/#work');
  assert.equal(canonicalHref('/writing'), '/#notes');
});

test('malformed, unknown and hostile paths become not-found instead of a destination', () => {
  for (const input of [
    '/world/atlantis',
    '/world/__proto__',
    '/world/constructor',
    '/projects/a/b',
    '/projects/%E0%A4%A',
    '/projects/<script>',
    '/projects/-leading-dash',
    '/admin',
  ]) {
    assert.equal(parseRoute(input).name, 'not-found', input);
  }
  assert.deepEqual(parseRoute('/#bad anchor!'), { name: 'home', chapter: null, anchor: null });
});
