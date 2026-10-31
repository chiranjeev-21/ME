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
      url: 'https://github.com/chiranjeev-21/public-research-fixture',
      homepageUrl: 'https://chiranjeev.vercel.app',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      stargazerCount: 7,
      forkCount: 2,
      updatedAt: '2026-10-27T00:00:00Z',
      topics: ['web', 'research'],
    },
  ],
};

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/github-pinned', route => route.fulfill({ json: feed }));
});
test.afterEach(() => {
  expect(errors, 'no uncaught page errors').toEqual([]);
});

const inView = async (page: Page, selector: string) =>
  page.locator(selector).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.top < innerHeight * 0.6 && rect.bottom > innerHeight * 0.2;
  });

test('every chapter and the primary contact links are present and readable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Chiranjeev Singh' })).toBeVisible();
  for (const name of [
    /Engineer by trade/,
    /Where I.ve been/,
    /Design for the/,
    /Experiments,/,
    /After/,
    /A good conversation/,
  ])
    await expect(page.getByRole('heading', { level: 2, name })).toHaveCount(1);
  for (const company of ['Microsoft', 'Amazon', 'Oyo'])
    await expect(page.getByRole('heading', { level: 3, name: company }).first()).toBeAttached();
  await expect(page.getByText('~80% in failure testing', { exact: false })).toBeAttached();
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link', { name: 'chiranj33v.singh@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:chiranj33v.singh@gmail.com'
  );
  await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
    'href',
    'https://github.com/chiranjeev-21'
  );
  await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/chiranjeev-singh-2a012b219/'
  );
  await expect(contact.getByRole('link', { name: /Résumé/ })).toHaveAttribute(
    'href',
    '/resume/Chiranjeev-Singh-Resume.pdf'
  );
});

test('the chapter index is a keyboard dialog that navigates and restores focus', async ({
  page,
}) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Index' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Chapter index' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Close/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await dialog.getByRole('link', { name: /Journey/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/#journey$/);
  await expect.poll(() => inView(page, '#journey')).toBe(true);
});

test('case studies are addressable overlays and closing returns to the page', async ({ page }) => {
  await page.goto('/#work');
  await expect.poll(() => inView(page, '#work')).toBe(true);
  await page
    .locator('#work')
    .getByRole('link', { name: /Read the case study/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/projects\/cj-os-desktop$/);
  const overlay = page.getByRole('dialog', { name: 'CJ OS' });
  await expect(overlay.getByRole('heading', { level: 1, name: 'CJ OS' })).toBeFocused();
  await expect(overlay.getByRole('link', { name: /View source/ })).toHaveAttribute(
    'href',
    'https://github.com/chiranjeev-21/ME/tree/feature/cj-os-desktop'
  );
  await expect(page.locator('#main')).toHaveAttribute('inert', '');
  await overlay.getByRole('link', { name: /Next project/ }).click();
  await expect(page).toHaveURL(/\/projects\/cj-universe$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/projects\/cj-os-desktop$/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#main')).not.toHaveAttribute('inert', '');
  await expect.poll(() => inView(page, '#work')).toBe(true);

  await page.goto('/projects/face-mask-detection');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Real-Time Face-Mask Detection' })
  ).toBeVisible();
  await expect(page.getByText('Research artifact').first()).toBeVisible();
  await page.getByRole('button', { name: /Back to the work/ }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect.poll(() => inView(page, '#work')).toBe(true);
});

test('links from the previous CJ Universe land on their new chapters', async ({ page }) => {
  await page.goto('/world/hush?mode=explore');
  await expect(page).toHaveURL(/\/#hush$/);
  await expect.poll(() => inView(page, '#hush')).toBe(true);
  await page.goto('/world/projects?mode=browse&vault=1');
  await expect(page).toHaveURL(/\/#side-quests$/);
  await expect.poll(() => inView(page, '#side-quests')).toBe(true);
});

test('studio notes and unknown paths have real, recoverable pages', async ({ page }) => {
  await page.goto('/writing/retrieval-is-not-evidence');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Retrieval is not evidence.' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: /Start with the actual mechanism/ })
  ).toBeVisible();
  await expect(page).toHaveTitle(/Retrieval is not evidence/);

  await page.goto('/definitely/not/here');
  await expect(page.getByRole('heading', { level: 1, name: 'Nothing orbits here.' })).toBeVisible();
  await page.getByRole('link', { name: /Return to the opening/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the lab retrieves real evidence locally and abstains honestly', async ({ page }) => {
  await page.goto('/#retrieval');
  const lab = page.locator('#retrieval');
  await lab.getByLabel('Query').fill('distributed systems navigation');
  await lab.getByRole('button', { name: 'Run' }).click();
  const results = lab.getByRole('region', { name: 'Retrieval results' });
  await expect(results.getByText('Evidence, not a generated answer.')).toBeVisible();
  await expect(results.getByRole('listitem').first()).toBeVisible();
  await lab.getByLabel('Query').fill('zebra quantum marmalade');
  await lab.getByRole('button', { name: 'Run' }).click();
  await expect(results.getByText('No supported evidence found.')).toBeVisible();
});

test('side quests show the live feed as repository dossiers, not invented case studies', async ({
  page,
}) => {
  await page.goto('/#side-quests');
  const quests = page.locator('#side-quests');
  await expect(quests.getByText('Recently updated on GitHub')).toBeVisible();
  await expect(quests.getByRole('link', { name: 'Source', exact: false }).first()).toHaveAttribute(
    'href',
    'https://github.com/chiranjeev-21/public-research-fixture'
  );
  await quests.getByRole('link', { name: 'Public Research' }).click();
  await expect(page.getByText('Repository dossier — public metadata')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Architecture' })).toHaveCount(0);
});

test('creative instruments work with keyboard and touch, with sound off by default', async ({
  page,
}) => {
  await page.goto('/#contour');
  const garden = page.locator('#contour');
  const title = garden.locator('svg title');
  const before = await title.textContent();
  await garden.getByRole('button', { name: 'New composition' }).click();
  await expect(title).not.toHaveText(before || '');

  await page.goto('/#beyond');
  const sound = page.getByRole('button', { name: /Sound off/ });
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Pluck the A2 string' }).click();
  await expect(page.getByText('Strings are silent until you turn sound on.')).toBeVisible();
  await sound.click();
  await expect(page.getByRole('button', { name: /Sound on/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  const lantern = page.getByRole('button', { name: 'Raise the lantern' });
  await lantern.click();
  await expect(page.getByRole('button', { name: 'Lower the lantern' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('copying the email address reports what actually happened', async ({
  page,
  context,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Clipboard permissions are desktop Chromium only.'
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect(page.getByText('Copied to your clipboard.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'chiranj33v.singh@gmail.com'
  );
});

test.describe('with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the opening pins, the journey scrolls horizontally and chapter light changes', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Horizontal journey is a wide-screen presentation.'
    );
    test.setTimeout(90000);
    await page.goto('/');
    await expect(page.locator('#opening')).toHaveAttribute('data-pinned', 'true');
    const background = () =>
      page.evaluate(() => getComputedStyle(document.getElementById('backdrop')!).backgroundColor);
    await expect.poll(background).toBe('rgb(4, 5, 7)');

    await page.evaluate(() => document.getElementById('identity')!.scrollIntoView());
    await expect.poll(background).toBe('rgb(230, 223, 210)');

    const journey = page.locator('#journey [data-horizontal="true"]');
    await page.evaluate(() => document.getElementById('journey')!.scrollIntoView());
    await expect(journey).toBeAttached();
    const track = journey.locator('[data-track]');
    const x = () =>
      track.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41);
    const start = await x();
    await page.mouse.wheel(0, 1800);
    await expect.poll(x, { timeout: 10000 }).toBeLessThan(start - 600);
  });

  test('the orbital scene goes live, and without WebGL the poster carries the opening', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'One renderer check is enough.');
    test.setTimeout(90000);
    await page.goto('/');
    await expect(page.locator('#opening [data-live]')).toHaveAttribute('data-live', 'true', {
      timeout: 60000,
    });

    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const noGl = await context.newPage();
    const failures: string[] = [];
    noGl.on('pageerror', error => failures.push(error.message));
    await noGl.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === 'webgl2' || type === 'webgl') return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    await noGl.route('**/api/github-pinned', route => route.fulfill({ json: feed }));
    await noGl.goto('/');
    await noGl.waitForTimeout(3500);
    await expect(noGl.locator('#opening [data-live]')).toHaveAttribute('data-live', 'false');
    await expect(noGl.locator('#opening picture img')).toHaveJSProperty('complete', true);
    await expect(noGl.getByRole('heading', { level: 1, name: 'Chiranjeev Singh' })).toBeVisible();
    expect(failures).toEqual([]);
    await context.close();
  });
});

test('narrow layouts never scroll sideways and keep the journey vertical', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile layout check.');
  await page.goto('/');
  for (const id of ['identity', 'journey', 'work', 'lab', 'beyond', 'contact']) {
    await page.evaluate(target => document.getElementById(target)!.scrollIntoView(), id);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, id).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('#journey [data-horizontal="true"]')).toHaveCount(0);
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
