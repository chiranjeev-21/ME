import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { join } from 'node:path';

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        let last = scrollY;
        let stable = 0;
        const settled = () => {
          stable = Math.abs(scrollY - last) < 0.5 ? stable + 1 : 0;
          last = scrollY;
          if (stable >= 8) resolve();
          else requestAnimationFrame(settled);
        };
        requestAnimationFrame(settled);
      })
  );
  const filename = `${testInfo.project.name}-${name}.png`;
  await page.screenshot({
    path: process.env.PORTFOLIO_ARTIFACT_DIR
      ? join(process.env.PORTFOLIO_ARTIFACT_DIR, filename)
      : testInfo.outputPath(filename),
    animations: 'disabled',
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/github-pinned', route =>
    route.fulfill({ status: 503, body: 'Deterministic offline fixture' })
  );
});

test('native scroll approaches the planet, reverses, lands, and reaches the work', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const planet = page.locator('[data-planet-world]');
  const scene = page.locator('[data-journey-scene]');
  const launch = (await planet.boundingBox())!;
  const initialTransform = await planet.evaluate(element => getComputedStyle(element).transform);
  const travel = await page
    .locator('[data-journey]')
    .evaluate(
      element =>
        (element as HTMLElement).offsetHeight -
        (element.querySelector('[data-journey-scene]') as HTMLElement).offsetHeight
    );
  expect(travel).toBeGreaterThan(500);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chiranjeev Singh.');
  await capture(page, testInfo, 'launch');

  await page.mouse.wheel(0, Math.round(travel * 0.52));
  await expect
    .poll(async () => (await planet.boundingBox())!.width / launch.width)
    .toBeGreaterThan(1.9);
  const mid = (await planet.boundingBox())!;
  expect(mid.width / launch.width).toBeLessThan(2.5);
  expect(await planet.evaluate(element => getComputedStyle(element).transform)).not.toBe(
    initialTransform
  );
  expect(Math.abs((await scene.boundingBox())!.y)).toBeLessThan(2);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(travel * 0.48);
  await expect(page.locator('[data-departure]')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-departure]')).toHaveJSProperty('inert', true);
  await capture(page, testInfo, 'mid-zoom');

  await page.mouse.wheel(0, -Math.round(travel * 0.52));
  await expect
    .poll(async () => (await planet.boundingBox())!.width / launch.width)
    .toBeLessThan(1.03);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(3);
  await expect(page.getByRole('link', { name: 'Skip to work', exact: true })).toBeVisible();
  await expect(page.locator('[data-departure]')).toHaveJSProperty('inert', false);

  await page.mouse.wheel(0, Math.round(travel * 0.97));
  await expect
    .poll(async () => (await planet.boundingBox())!.width / launch.width)
    .toBeGreaterThan(4.5);
  await expect(page.locator('[data-arrival]')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('heading', { name: 'Every world has a story.' })).toBeInViewport();
  await capture(page, testInfo, 'landing');
  await page.getByRole('link', { name: 'Read the chapters' }).click();
  await expect(page.locator('#work-heading')).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Microsoft', exact: true })).toBeInViewport();
  await expect(page.getByText('04/2026 — Present', { exact: true })).toBeVisible();
  await expect(page.getByText(/~80% in failure testing/)).toBeVisible();
  const treasure = (await page.locator('button[aria-label="Open side quests"]').boundingBox())!;
  const viewportWidth = await page.evaluate(() => innerWidth);
  expect(viewportWidth - treasure.x - treasure.width).toBeGreaterThanOrEqual(0);
  expect(viewportWidth - treasure.x - treasure.width).toBeLessThanOrEqual(24);
  await capture(page, testInfo, 'work-arrival');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('reduced motion is a conventional readable path without a pinned camera', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('[data-journey-scene]')).toHaveCSS('position', 'relative');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Skip to work', exact: true })).toBeVisible();
  const planet = page.locator('[data-planet-world]');
  const before = (await planet.boundingBox())!.width;
  const introHeight = await page
    .locator('[data-journey]')
    .evaluate(element => element.getBoundingClientRect().height);
  expect(introHeight).toBeLessThan(1200);
  await capture(page, testInfo, 'reduced-motion');
  await page.getByRole('link', { name: 'Skip to work', exact: true }).click();
  await expect(page.locator('#work-heading')).toBeInViewport();
  expect((await planet.boundingBox())!.width).toBeCloseTo(before, 0);
  await expect(page.getByRole('heading', { name: 'Microsoft', exact: true })).toBeVisible();
  await page.locator('#systems').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Nothing exists in isolation.' })).toBeVisible();
  await expect(page.locator('#systems').getByText('Agentic AI', { exact: true })).toBeVisible();
});

test('narrow mobile keeps the launch, zoom, landing, and chapters inside the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Narrow mobile composition check.');
  await page.setViewportSize({ width: 320, height: 780 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const travel = await page
    .locator('[data-journey]')
    .evaluate(element => (element as HTMLElement).offsetHeight - innerHeight);
  for (const fraction of [0, 0.5, 0.98]) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), travel * fraction);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(320);
    if (fraction === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      await expect(page.getByRole('link', { name: 'Skip to work', exact: true })).toBeInViewport();
    }
  }
  for (const id of ['work', 'systems', 'projects', 'about', 'cta']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320
    );
  }
  await capture(page, testInfo, 'narrow-contact');
});
