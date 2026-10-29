const { test, before } = require('node:test');
const assert = require('node:assert/strict');
let desktopReducer, initialDesktop, clampRect, normalizeSettings;
before(
  async () =>
    ({ desktopReducer, initialDesktop, clampRect, normalizeSettings } =
      await import('../src/os/state.ts'))
);
const size = { width: 1300, height: 850 };

function workspaceWithApps() {
  let state = initialDesktop(size);
  state = desktopReducer(state, { type: 'open', appId: 'explorer' });
  return desktopReducer(state, { type: 'open', appId: 'terminal' });
}

test('a fresh desktop has no pre-opened apps on desktop or mobile', () => {
  for (const viewport of [size, { width: 374, height: 620 }]) {
    const state = initialDesktop(viewport);
    assert.deepEqual(state.windows, []);
    assert.equal(state.activeId, null);
  }
});

test('opening an existing app restores the same instance and raises it', () => {
  let state = workspaceWithApps();
  state = desktopReducer(state, { type: 'open', appId: 'resume' });
  state = desktopReducer(state, { type: 'minimize', id: 'resume' });
  state = desktopReducer(state, { type: 'open', appId: 'resume' });
  assert.equal(state.windows.filter(item => item.appId === 'resume').length, 1);
  assert.equal(state.windows.at(-1).id, 'resume');
  assert.equal(state.windows.at(-1).minimized, false);
  assert.equal(state.activeId, 'resume');
});

test('project identity is shared across launch sources but different projects have separate windows', () => {
  let state = workspaceWithApps();
  for (const projectId of ['cj-os', 'ai-lab', 'cj-os']) {
    state = desktopReducer(state, { type: 'open', appId: 'project', payload: { projectId } });
  }
  assert.equal(state.windows.filter(item => item.appId === 'project').length, 2);
  assert.equal(state.activeId, 'project:cj-os');
  assert.equal(state.windows.at(-1).launchCount, 2);
});

test('closing or minimizing the foreground restores the most recent visible window', () => {
  let state = workspaceWithApps();
  state = desktopReducer(state, { type: 'open', appId: 'resume' });
  state = desktopReducer(state, { type: 'open', appId: 'monitor' });
  state = desktopReducer(state, { type: 'minimize', id: 'monitor' });
  assert.equal(state.activeId, 'resume');
  state = desktopReducer(state, { type: 'close', id: 'resume' });
  assert.equal(state.activeId, 'terminal');
  assert.ok(state.windows.find(item => item.id === 'monitor').minimized);
});

test('maximize and restore preserve normal geometry', () => {
  let state = workspaceWithApps();
  const normal = state.windows.find(item => item.id === 'terminal').rect;
  state = desktopReducer(state, { type: 'maximize', id: 'terminal' });
  state = desktopReducer(state, { type: 'move', id: 'terminal', x: -99, y: -99 });
  state = desktopReducer(state, { type: 'resize', id: 'terminal', width: 5000, height: 5000 });
  assert.deepEqual(state.windows.find(item => item.id === 'terminal').rect, normal);
  state = desktopReducer(state, { type: 'maximize', id: 'terminal' });
  assert.equal(state.windows.find(item => item.id === 'terminal').maximized, false);
  assert.deepEqual(state.windows.find(item => item.id === 'terminal').rect, normal);
});

test('drag, resize, and viewport changes keep titlebars and windows reachable', () => {
  let state = workspaceWithApps();
  state = desktopReducer(state, { type: 'move', id: 'terminal', x: 90000, y: -90000 });
  state = desktopReducer(state, { type: 'resize', id: 'terminal', width: 90000, height: 90000 });
  state = desktopReducer(state, { type: 'viewport', viewport: { width: 304, height: 540 } });
  for (const item of state.windows) {
    assert.ok(item.rect.x >= 0 && item.rect.y >= 0);
    assert.ok(item.rect.width + item.rect.x <= 304);
    assert.ok(item.rect.height + item.rect.y <= 540);
  }
  assert.deepEqual(clampRect({ x: -2, y: 2000, width: 10, height: 5 }, size), {
    x: 0,
    y: 610,
    width: 360,
    height: 240,
  });
});

test('ordinary terminal opens clear one-shot commands rather than replaying them', () => {
  let state = workspaceWithApps();
  state = desktopReducer(state, { type: 'open', appId: 'terminal', payload: { command: 'help' } });
  state = desktopReducer(state, { type: 'open', appId: 'terminal' });
  assert.equal(state.windows.find(item => item.id === 'terminal').payload.command, undefined);
});

test('ordinary restores remember the virtual location without replaying one-shot commands', () => {
  let state = workspaceWithApps();
  state = desktopReducer(state, {
    type: 'open',
    appId: 'explorer',
    payload: { path: '/home/cj/writing' },
  });
  state = desktopReducer(state, { type: 'minimize', id: 'explorer' });
  state = desktopReducer(state, { type: 'open', appId: 'explorer' });
  assert.equal(state.windows.find(item => item.id === 'explorer').payload.path, '/home/cj/writing');
  state = desktopReducer(state, {
    type: 'open',
    appId: 'lab',
    payload: { command: 'original query' },
  });
  state = desktopReducer(state, { type: 'open', appId: 'lab' });
  assert.equal(state.windows.find(item => item.id === 'lab').payload.command, undefined);
});

test('malformed preferences use valid defaults while valid customizations survive', () => {
  assert.deepEqual(normalizeSettings(null), {
    wallpaper: 'aurora',
    accent: 'green',
    fontSize: 'normal',
  });
  assert.deepEqual(
    normalizeSettings({ wallpaper: '<script>', accent: 'cyan', fontSize: 'giant' }),
    { wallpaper: 'aurora', accent: 'cyan', fontSize: 'normal' }
  );
  assert.deepEqual(
    normalizeSettings({ wallpaper: 'midnight', accent: 'amber', fontSize: 'large' }),
    { wallpaper: 'midnight', accent: 'amber', fontSize: 'large' }
  );
});
