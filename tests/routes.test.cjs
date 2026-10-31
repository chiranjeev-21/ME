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
  assert.deepEqual(parseRoute('/#side-quests'), {
    name: 'home',
    chapter: null,
    anchor: 'side-quests',
  });
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

test('the playbox has its own address and nothing beneath it', () => {
  assert.deepEqual(parseRoute('/playbox'), { name: 'playbox' });
  assert.deepEqual(parseRoute('/playbox/?from=guitar#top'), { name: 'playbox' });
  assert.equal(routeHref({ name: 'playbox' }), '/playbox');
  assert.equal(canonicalHref('/playbox?ref=beyond'), '/playbox');
  assert.equal(parseRoute('/playbox/extra').name, 'not-found');
  assert.equal(parseRoute('/playboxes').name, 'not-found');
});

test('every previous CJ Universe destination still lands on its new chapter', () => {
  const expected = {
    about: '/#identity',
    engineering: '/#work',
    'ai-lab': '/#work',
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
  assert.deepEqual(parseRoute('/?vault=1'), {
    name: 'home',
    chapter: 'work',
    anchor: 'side-quests',
  });
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
