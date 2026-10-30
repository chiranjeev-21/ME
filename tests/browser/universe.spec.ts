import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const feed = {
  source: 'github',
  selection: 'recent',
  profile: {
    login: 'chiranjeev-21',
    name: 'Chiranjeev Singh',
    url: 'https://github.com/chiranjeev-21',
  },
  items: [
    {
      id: 'real-shaped-fixture',
      name: 'Public Research',
      description: 'Public repository metadata used by deterministic browser tests.',
      url: 'https://github.com/chiranjeev-21/ME',
      homepageUrl: 'https://chiranjeev.vercel.app',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      stargazerCount: 7,
      forkCount: 2,
      updatedAt: '2026-10-27T00:00:00Z',
      topics: ['web', 'research'],
    },
  ],
};
const root = (page: Page) => page.locator('[data-universe-mode]');
const host = (page: Page) =>
  page.locator('[data-expedition-world][data-current="true"] [data-world-content]');
async function world(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Planet selector' })
    .getByRole('button', { name, exact: true })
    .click();
  await expect(host(page).getByRole('heading', { level: 1 }).first()).toBeVisible();
}
async function sceneReady(page: Page) {
  await expect(root(page)).toHaveAttribute('data-render-state', 'ready', { timeout: 30000 });
  await expect(page.locator('canvas')).toBeVisible();
}
async function nativeScrollTo(page: Page, y: number) {
  const delta = y - (await page.evaluate(() => scrollY));
  await page.mouse.move(18, 240);
  await page.mouse.wheel(0, delta);
  await expect.poll(async () => Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(5);
}
async function planetRadius(page: Page, id: string) {
  const center = await page.locator(`[data-world-pick="${id}"]`).boundingBox();
  const limb = await page.locator(`[data-world-limb="${id}"]`).boundingBox();
  return center && limb ? Math.hypot(center.x - limb.x, center.y - limb.y) : 0;
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: feed }));
});

test('native scrolling visibly zooms into a planet, enters its environment, and reverses the flight', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=explore&quality=low');
  await sceneReady(page);
  const geometry = await page.locator('[data-expedition-world="about"]').evaluate(element => ({
    top: element.getBoundingClientRect().top + scrollY,
    read: element.querySelector('[data-world-content]')!.getBoundingClientRect().top + scrollY,
    height: innerHeight,
  }));
  const far = geometry.top - geometry.height * 0.5;
  const near = geometry.top + geometry.height * 0.12;
  await nativeScrollTo(page, far);
  await expect(root(page)).toHaveAttribute('data-world', 'about');
  await expect(root(page)).toHaveAttribute('data-expedition-phase', 'approach');
  await expect.poll(() => planetRadius(page, 'about')).toBeGreaterThan(1);
  const farRadius = await planetRadius(page, 'about');
  await nativeScrollTo(page, near);
  await expect.poll(() => planetRadius(page, 'about')).toBeGreaterThan(farRadius * 1.8);
  const nearRadius = await planetRadius(page, 'about');
  await page.screenshot({
    path: testInfo.outputPath('earth-approach.png'),
    animations: 'disabled',
  });
  await nativeScrollTo(page, geometry.read - 100);
  await expect(root(page)).toHaveAttribute('data-expedition-phase', 'inside');
  await expect(
    page.locator('[data-world-environment="about"][data-environment-landmark]').first()
  ).toBeAttached();
  await expect(host(page).getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(page).toHaveURL(/\/world\/about\?mode=explore/);
  await page.screenshot({
    path: testInfo.outputPath('scroll-about-surface.png'),
    animations: 'disabled',
  });
  const historyLength = await page.evaluate(() => history.length);
  const engineering = await page
    .locator('[data-expedition-world="engineering"]')
    .evaluate(element => ({
      top: element.getBoundingClientRect().top + scrollY,
      read: element.querySelector('[data-world-content]')!.getBoundingClientRect().top + scrollY,
      height: innerHeight,
    }));
  await nativeScrollTo(page, engineering.top - Math.min(96, engineering.height * 0.1));
  await expect(root(page)).toHaveAttribute('data-world', 'engineering');
  await nativeScrollTo(page, engineering.read - 100);
  await expect(
    page.locator('[data-world-environment="engineering"][data-environment-landmark]').first()
  ).toBeAttached();
  await expect(host(page).getByRole('heading', { level: 1 })).toBeInViewport();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await nativeScrollTo(page, far);
  await expect(root(page)).toHaveAttribute('data-expedition-phase', 'approach');
  await expect.poll(() => planetRadius(page, 'about')).toBeLessThan(nearRadius * 0.7);
  await world(page, 'About');
  await expect(root(page)).toHaveAttribute('data-expedition-phase', 'inside');
  await expect(host(page).getByRole('heading', { level: 1 })).toBeInViewport();
  await nativeScrollTo(page, 0);
  await expect(root(page)).toHaveAttribute('data-world', 'overview');
  await expect(root(page)).toHaveAttribute('data-camera-phase', 'overview');
});

test('touch scrolling advances the native planetary journey without a drag-camera trap', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'Real touch gesture is covered on the mobile viewport.'
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=explore&quality=low');
  await sceneReady(page);
  const session = await page.context().newCDPSession(page);
  const timestamp = Date.now() / 1000;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 18, y: 470 }],
    timestamp,
  });
  for (let step = 1; step <= 12; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 18, y: 470 - (350 * step) / 12 }],
      timestamp: timestamp + step / 30,
    });
  }
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
    timestamp: timestamp + 0.7,
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(250);
  await expect(root(page)).toHaveAttribute('data-world', 'about');
  await expect(root(page)).not.toHaveAttribute('data-expedition-phase', 'orbit');
  await session.detach();
});

test('real WebGL sun and seven planets render, raycasting selects bodies, camera returns', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=explore&quality=low');
  await sceneReady(page);
  await expect(page.getByRole('heading', { name: /CJ\s*UNIVERSE/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin the journey', exact: true })).toBeVisible();
  await expect(page.locator('[data-world-pick]')).toHaveCount(7);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: testInfo.outputPath('solar-system-landing.png'),
    animations: 'disabled',
  });
  const sun = (await page.locator('[data-sun-pick]').boundingBox())!;
  if (testInfo.project.name === 'mobile')
    await page.touchscreen.tap(sun.x + sun.width / 2, sun.y + sun.height / 2);
  else await page.mouse.click(sun.x + sun.width / 2, sun.y + sun.height / 2);
  await expect(root(page)).toHaveAttribute('data-world', 'about');
  await expect(root(page)).toHaveAttribute('data-camera-phase', 'focused', { timeout: 20000 });
  await expect(host(page)).toContainText('Azure Direct Drive');
  await page.screenshot({ path: testInfo.outputPath('about-world.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Full universe', exact: true }).click();
  await expect(root(page)).toHaveAttribute('data-world', 'overview');
  await expect(root(page)).toHaveAttribute('data-camera-phase', 'overview', { timeout: 20000 });
  if (testInfo.project.name === 'mobile') {
    const approach = await page
      .locator('[data-expedition-world="projects"]')
      .evaluate(element => element.getBoundingClientRect().top + scrollY + innerHeight * 0.12);
    await nativeScrollTo(page, approach);
    await expect(root(page)).toHaveAttribute('data-expedition-phase', 'approach');
  }
  const target = (await page.locator('[data-world-pick="projects"]').boundingBox())!;
  if (testInfo.project.name === 'mobile') await page.touchscreen.tap(target.x + 1, target.y + 1);
  else await page.mouse.click(target.x + 1, target.y + 1);
  await expect(root(page)).toHaveAttribute('data-world', 'projects');
  await expect(root(page)).toHaveAttribute('data-expedition-phase', 'inside');
  await expect(root(page)).toHaveAttribute('data-camera-phase', 'focused', { timeout: 20000 });
  await expect(host(page)).toContainText('Documented.');
  await page.screenshot({
    path: testInfo.outputPath('projects-planet.png'),
    animations: 'disabled',
  });
  if (testInfo.project.name === 'mobile') {
    const inspection = await host(page).evaluate(
      element => element.getBoundingClientRect().top + scrollY - innerHeight * 0.44
    );
    await nativeScrollTo(page, inspection);
  }
  const beacon = (await page.locator('[data-project-beacon="cj-os-desktop"]').boundingBox())!;
  if (testInfo.project.name === 'mobile') await page.touchscreen.tap(beacon.x + 1, beacon.y + 1);
  else await page.mouse.click(beacon.x + 1, beacon.y + 1);
  await expect(page).toHaveURL(/\/projects\/cj-os-desktop/);
  await expect(host(page).getByRole('heading', { name: 'CJ OS', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('guided planet controls reach all seven distinct worlds with keyboard and touch alternatives', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=explore&quality=low');
  await sceneReady(page);
  for (const [name, id, evidence] of [
    ['Engineering', 'engineering', 'failure testing'],
    ['AI Lab', 'ai-lab', 'Run retrieval'],
    ['Projects', 'projects', 'Search the catalog'],
    ['Creative', 'creative', 'Contour garden'],
    ['Writing', 'writing', 'Search the archive'],
    ['Contact', 'contact', 'chiranj33v.singh@gmail.com'],
  ]) {
    await world(page, name);
    await expect(root(page)).toHaveAttribute('data-world', id);
    await expect(root(page)).toHaveAttribute('data-camera-phase', 'focused', { timeout: 20000 });
    await expect(host(page)).toContainText(evidence);
    await expect(
      page.locator(`[data-world-environment="${id}"][data-environment-landmark]`).first()
    ).toBeAttached();
    await page.screenshot({
      path: testInfo.outputPath(`${id}-surface.png`),
      animations: 'disabled',
    });
  }
  const about = page
    .getByRole('navigation', { name: 'Planet selector' })
    .getByRole('button', { name: 'About', exact: true });
  await about.focus();
  await about.press('Home');
  await expect(about).toBeFocused();
  await about.press('Enter');
  await expect(root(page)).toHaveAttribute('data-world', 'about');
  await expect(host(page)).toContainText('Microsoft');
  await page.screenshot({
    path: testInfo.outputPath('guided-destination.png'),
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Browse Mode uses real routes, preserves project filters and the selected case study across modes', async ({
  page,
}) => {
  await page.goto('/world/projects?mode=browse');
  await expect(page.locator('canvas')).toHaveCount(0);
  const search = host(page).getByRole('searchbox', { name: 'Search the catalog' });
  await search.fill('CJ OS');
  await host(page).getByRole('button', { name: 'Systems', exact: true }).click();
  await host(page).getByRole('link', { name: 'CJ OS', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/cj-os-desktop\?mode=browse/);
  await expect(
    host(page).getByRole('heading', { name: 'Architecture', exact: true })
  ).toBeVisible();
  await expect(host(page).getByRole('img', { name: /Actual CJ OS desktop/ })).toBeVisible();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await sceneReady(page);
  await expect(host(page).getByRole('heading', { name: 'CJ OS', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/cj-os-desktop\?mode=explore/);
  await page.getByRole('button', { name: 'Browse', exact: true }).click();
  await host(page)
    .getByRole('link', { name: /Back to Projects/ })
    .click();
  await expect(search).toHaveValue('CJ OS');
  await expect(host(page).getByRole('button', { name: 'Systems', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.reload();
  await expect(root(page)).toHaveAttribute('data-world', 'projects');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('article URLs and the paper archive work without requiring 3D navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/world/writing?mode=browse');
  await host(page).getByRole('searchbox', { name: 'Search the archive' }).fill('retrieval');
  await host(page).getByRole('link', { name: 'Retrieval is not evidence.', exact: true }).click();
  await expect(page).toHaveURL(/\/writing\/retrieval-is-not-evidence\?mode=browse/);
  await expect(host(page).getByRole('heading', { level: 1 })).toHaveText(
    'Retrieval is not evidence.'
  );
  await expect(host(page)).toContainText('Keep claims smaller than their sources');
  await page.reload();
  await expect(host(page)).toContainText('A more sophisticated model');
  await page.screenshot({ path: testInfo.outputPath('writing-world.png'), animations: 'disabled' });
  await page.goto('/writing/does-not-exist?mode=browse');
  await expect(host(page)).toContainText(/not found|not in|missing/i);
  await expect(host(page).getByRole('link')).toBeVisible();
});

test('local research computes sources, scores and abstention and opens the real evidence', async ({
  page,
}, testInfo) => {
  await page.goto('/world/ai-lab?mode=browse');
  const query = host(page).getByRole('textbox', { name: 'Search query' });
  await query.fill('retrieval evidence');
  await host(page).getByRole('combobox', { name: 'Results', exact: true }).selectOption('2');
  await host(page).getByRole('button', { name: 'Run retrieval', exact: true }).click();
  const results = host(page).getByRole('region', { name: 'Retrieval results' });
  await expect(results).toContainText('Evidence, not a generated answer.');
  await expect(results).toContainText(/[\d.]+\s*ms/);
  await expect(results.locator('article')).toHaveCount(2);
  await results.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath('working-retrieval.png'),
    animations: 'disabled',
  });
  await query.fill('zzqxvflibbertigibbet');
  await host(page).getByRole('button', { name: 'Run retrieval', exact: true }).click();
  await expect(results).toContainText('No supported evidence found.');
  await query.fill('retrieval evidence');
  await host(page).getByRole('button', { name: 'Run retrieval', exact: true }).click();
  await results.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/projects\/|\/writing\//);
  await expect(host(page).getByRole('heading', { level: 1 })).toBeVisible();
});

test('creative world produces original interactive artwork, exports it, and does not invent media', async ({
  page,
}, testInfo) => {
  await page.goto('/world/creative?mode=browse');
  const artwork = host(page).getByRole('img', { name: /Contour garden, seed/ });
  const before = await artwork.locator('path').first().getAttribute('d');
  await host(page).getByRole('spinbutton', { name: 'Composition seed' }).fill('49');
  await expect(artwork).toHaveAccessibleName('Contour garden, seed 49');
  expect(await artwork.locator('path').first().getAttribute('d')).not.toBe(before);
  await host(page).getByRole('combobox', { name: 'Color study' }).selectOption('1');
  const download = page.waitForEvent('download');
  await host(page)
    .getByRole('button', { name: /Export.*SVG/i })
    .click();
  expect((await download).suggestedFilename()).toBe('cj-contour-garden-49.svg');
  await expect(host(page)).toContainText('Hush');
  await expect(host(page)).toContainText(
    /not supplied|not available|not included|not been supplied|not been added|No original audio/i
  );
  expect(await page.locator('audio[autoplay]').count()).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath('creative-world.png'),
    animations: 'disabled',
  });
});

test('terminal and command palette use the shared world/project/article routes', async ({
  page,
}) => {
  await page.goto('/?mode=browse');
  await page.getByRole('button', { name: 'Launch Terminal', exact: true }).click();
  const terminal = page.getByRole('dialog', { name: 'Launch Terminal', exact: true });
  const input = terminal.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('echo "hello curious human"');
  await input.press('Enter');
  await expect(terminal.getByRole('log')).toContainText('hello curious human');
  await input.fill('draft');
  await input.press('ArrowUp');
  await expect(input).not.toHaveValue('draft');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('draft');
  await input.fill('whoa');
  await input.press('Tab');
  await expect(input).toHaveValue('whoami');
  await input.press('Enter');
  await expect(terminal.getByRole('log')).toContainText('Azure Direct Drive');
  await input.fill('open "AI Lab"');
  await input.press('Enter');
  await expect(terminal).toHaveCount(0);
  await expect(root(page)).toHaveAttribute('data-world', 'ai-lab');
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette', exact: true });
  await palette.getByRole('combobox').fill('CJ OS');
  await palette.getByRole('combobox').press('Enter');
  await expect(page).toHaveURL(/\/projects\/cj-os-desktop/);
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('One universe. Two ways in.');
  await page.getByRole('combobox').press('Enter');
  await expect(page).toHaveURL(/\/writing\/one-universe-two-ways-in/);
  await page.keyboard.press('Control+k');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('contact is direct, copy feedback is honest, and the original résumé remains downloadable', async ({
  page,
  request,
}) => {
  await page.goto('/world/contact?mode=browse');
  await expect(host(page).locator('a[href="mailto:chiranj33v.singh@gmail.com"]')).toBeVisible();
  await expect(host(page).getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/chiranjeev-singh-2a012b219/'
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Denied');
        },
      },
    })
  );
  await host(page).getByRole('button', { name: 'Copy email address', exact: true }).click();
  await expect(host(page).getByRole('status')).toContainText('Copy was not permitted');
  await page.goto('/world/about?mode=browse');
  await expect(host(page)).toContainText('~80% in failure testing');
  await expect(host(page)).toContainText('Agentic AI');
  await expect(host(page)).toContainText('Distributed Computing');
  const pdf = await request.get('/resume/Chiranjeev-Singh-Resume.pdf');
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
});

test('unavailable WebGL falls back to the same project in fully usable Browse Mode', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (type: string, ...args: unknown[]) {
        if (type === 'webgl2' || type === 'webgl') return null;
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto('/projects/cj-os-desktop?mode=explore');
  await expect(root(page)).toHaveAttribute('data-render-state', 'fallback');
  await expect(root(page)).toHaveAttribute('data-universe-mode', 'browse');
  await expect(host(page).getByRole('heading', { name: 'CJ OS', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'WebGL 2' })).toBeVisible();
  await world(page, 'Contact');
  await expect(host(page)).toContainText('chiranj33v.singh@gmail.com');
  expect(errors).toEqual([]);
});

test('real context loss recovers without losing the destination', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'One real context-loss check is sufficient; mobile shares the same recovery path.'
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/world/engineering?mode=explore&quality=low');
  await sceneReady(page);
  await page.locator('canvas').evaluate(canvas => {
    const context = (canvas as HTMLCanvasElement).getContext('webgl2');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(root(page)).toHaveAttribute('data-universe-mode', 'browse');
  await expect(root(page)).toHaveAttribute('data-world', 'engineering');
  await expect(host(page).getByRole('heading', { level: 1 })).toBeVisible();
});

test('reduced motion is readable without a renderer and explicit Explore remains motionless', async ({
  page,
}) => {
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-universe-mode', 'browse');
  await expect(page.locator('canvas')).toHaveCount(0);
  await world(page, 'Writing');
  await expect(host(page).getByRole('searchbox', { name: 'Search the archive' })).toBeVisible();
  await page.goto('/?mode=explore&quality=low');
  await sceneReady(page);
  await world(page, 'Engineering');
  await expect(root(page)).toHaveAttribute('data-camera-phase', 'focused');
  await expect(host(page).getByRole('heading', { level: 1 })).toBeVisible();
});

test('mobile/narrow layouts keep all destinations and primary actions inside the viewport', async ({
  page,
}, testInfo) => {
  await page.goto('/?mode=browse');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const [name, id] of [
    ['About', 'about'],
    ['Engineering', 'engineering'],
    ['AI Lab', 'ai-lab'],
    ['Projects', 'projects'],
    ['Creative', 'creative'],
    ['Writing', 'writing'],
    ['Contact', 'contact'],
  ]) {
    await world(page, name);
    await expect(root(page)).toHaveAttribute('data-world', id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({
      path: testInfo.outputPath(`${id}-browse.png`),
      fullPage: true,
      animations: 'disabled',
    });
  }
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 780 });
    await world(page, 'Projects');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320
    );
    await page.screenshot({
      path: testInfo.outputPath('narrow-320.png'),
      fullPage: true,
      animations: 'disabled',
    });
  }
});

test('actual live GitHub feed remains functional', async ({ request }, testInfo) => {
  test.skip(
    process.env.LIVE_GITHUB !== '1' || testInfo.project.name !== 'desktop',
    'Opt-in upstream availability smoke check.'
  );
  const response = await request.get('/api/github-pinned');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.source).toBe('github');
  expect(['pinned', 'recent']).toContain(body.selection);
});

test('skip navigation provides an immediate keyboard Browse path and mobile menus dismiss cleanly', async ({
  page,
}, testInfo) => {
  await page.goto('/?mode=explore&quality=low');
  const skip = page.getByRole('link', { name: 'Skip to accessible Browse Mode', exact: true });
  await skip.focus();
  await skip.press('Enter');
  await expect(root(page)).toHaveAttribute('data-universe-mode', 'browse');
  await expect(page.locator('#universe-content').getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await expect(
      page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'About', exact: true })
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Open navigation', exact: true })
    ).toHaveAttribute('aria-expanded', 'false');
  }
});

test('inhabited planets load real animated people and articulated alien assets', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/world/about?mode=explore&quality=low');
  await sceneReady(page);
  await expect(page.locator('[data-model="walker"]')).toHaveCount(2);
  const citizen = page.locator('[data-citizen="human-0"]');
  const before = (await citizen.boundingBox())!;
  await expect
    .poll(async () => {
      const after = await citizen.boundingBox();
      return after ? Math.hypot(after.x - before.x, after.y - before.y) : 0;
    })
    .toBeGreaterThan(1);
  await page.screenshot({ path: testInfo.outputPath('earth-people.png'), animations: 'disabled' });
  await world(page, 'AI Lab');
  await expect(page.locator('[data-model="alien"]')).toHaveCount(2);
  await page.screenshot({
    path: testInfo.outputPath('alien-observatory.png'),
    animations: 'disabled',
  });
  await world(page, 'Engineering');
  await expect(page.locator('[data-model="robot"]')).toHaveCount(2);
  await expect(host(page)).toContainText('failure testing');
  if (testInfo.project.name === 'desktop') {
    const lighting = page.waitForResponse(
      response => response.url().endsWith('/dawn-1k.hdr') && response.status() === 200
    );
    await page.getByRole('combobox', { name: 'Render quality' }).selectOption('high');
    await lighting;
    await expect(page.locator('[data-model="robot"]')).toHaveCount(3);
    await page.screenshot({
      path: testInfo.outputPath('asset-lighting-high.png'),
      animations: 'disabled',
    });
  }
  expect(errors).toEqual([]);
});

test('the Hush section enters a haunted game set and its lantern changes the actual environment', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/world/creative?mode=explore&quality=low');
  await sceneReady(page);
  const lantern = host(page).getByRole('button', { name: /Raise the lantern/ });
  await lantern.scrollIntoViewIfNeeded();
  await expect(
    page.locator('[data-world-environment="creative"][data-environment-theme="hush"]')
  ).toBeAttached();
  await expect(page.locator('[data-model="ghost"]')).toHaveCount(2);
  await lantern.click();
  await expect(page.locator('[data-haunt-state="illuminated"]')).toBeAttached();
  await expect(host(page).getByRole('status').filter({ hasText: 'Lantern raised' })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('hush-haunted-set.png'),
    animations: 'disabled',
  });
  await expect(host(page)).toContainText('not gameplay footage');
  await host(page)
    .getByRole('button', { name: /Return to the garden/ })
    .click();
  await expect(
    page.locator('[data-world-environment="creative"][data-environment-theme="creative"]')
  ).toBeAttached();
  await expect(page.locator('[data-model="ghost"]')).toHaveCount(0);
});

test('reduced motion freezes character travel and asset failures preserve the portfolio', async ({
  page,
}) => {
  await page.goto('/world/about?mode=explore&quality=low');
  await sceneReady(page);
  await expect(page.locator('[data-model="walker"]')).toHaveCount(2);
  const first = await page.locator('[data-citizen="human-0"]').boundingBox();
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await page.keyboard.press('Escape');
  const after = await page.locator('[data-citizen="human-0"]').boundingBox();
  expect(after?.x).toBeCloseTo(first!.x, 1);
  expect(after?.y).toBeCloseTo(first!.y, 1);
  await world(page, 'Creative');
  await host(page)
    .getByRole('button', { name: /Raise the lantern/ })
    .scrollIntoViewIfNeeded();
  await expect(page.locator('[data-environment-theme="hush"]')).toBeAttached();
  await expect(page.locator('[data-model="ghost"]')).toHaveCount(2);
  await page.route('**/assets/worlds/**', route => route.abort());
  await page.goto('/world/about?mode=explore&quality=low');
  await sceneReady(page);
  await expect(host(page)).toContainText('Azure Direct Drive');
  await world(page, 'Contact');
  await expect(host(page)).toContainText('chiranj33v.singh@gmail.com');
});
