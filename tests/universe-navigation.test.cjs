const { test, before } = require('node:test');
const assert = require('node:assert/strict');
let homeNavigation, parseUniverseUrl, updateNavigation, routeHref;
before(
  async () =>
    ({ homeNavigation, parseUniverseUrl, updateNavigation, routeHref } =
      await import('../src/universe/navigation.ts'))
);

test('worlds, projects and articles have direct routes independent of the renderer', () => {
  for (const url of [
    '/world/engineering?mode=browse',
    '/projects/cj-os-desktop?mode=browse',
    '/writing/one-universe-two-ways-in?mode=explore',
  ]) {
    const navigation = parseUniverseUrl(url);
    assert.equal(routeHref(navigation), url);
  }
});
test('switching presentation preserves the exact destination and collection', () => {
  const project = parseUniverseUrl('/projects/cj-os-desktop?mode=explore&vault=1');
  const browse = updateNavigation(project, { mode: 'browse' });
  assert.equal(browse.projectSlug, project.projectSlug);
  assert.equal(browse.vault, true);
  assert.equal(browse.world, 'projects');
  assert.equal(routeHref(browse), '/projects/cj-os-desktop?mode=browse&vault=1');
});
test('world changes remove stale project and article selections', () => {
  let state = parseUniverseUrl('/projects/cj-os-desktop?mode=browse&vault=1');
  state = updateNavigation(state, { world: 'writing', articleSlug: 'one-universe-two-ways-in' });
  assert.equal(state.projectSlug, null);
  assert.equal(state.vault, false);
  assert.equal(state.articleSlug, 'one-universe-two-ways-in');
  state = updateNavigation(state, { world: null });
  assert.equal(state.articleSlug, null);
  assert.equal(routeHref(state), '/?mode=browse');
});
test('malformed paths and unsupported mode values cannot produce invalid destinations', () => {
  for (const value of [
    '/world/not-a-world?mode=javascript',
    '/projects/%E0%A4%A',
    '/world/%3Cscript%3E',
  ]) {
    assert.deepEqual(parseUniverseUrl(value, 'browse'), homeNavigation('browse'));
  }
  assert.equal(parseUniverseUrl('/projects/..%2F..%2Fsecret').projectSlug, null);
});
test('explicit URL mode overrides preferences and absent mode respects the fallback', () => {
  assert.equal(parseUniverseUrl('/world/creative', 'browse').mode, 'browse');
  assert.equal(parseUniverseUrl('/world/creative?mode=explore', 'browse').mode, 'explore');
});
