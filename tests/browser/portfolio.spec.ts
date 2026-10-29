import { test, expect } from '@playwright/test';

const pinned = {
  source: 'github',
  selection: 'pinned',
  profile: { login: 'chiranjeev-21', url: 'https://github.com/chiranjeev-21' },
  items: [
    {
      id: 'test-project',
      name: 'Test pinned project',
      description: 'A deterministic browser fixture.',
      url: 'https://github.com/chiranjeev-21/ME',
      homepageUrl: 'https://chiranjeev.vercel.app',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      stargazerCount: 4,
      forkCount: 1,
      updatedAt: '2026-10-27T00:00:00Z',
      topics: ['systems'],
    },
  ],
};

test('resume content, expandable experience, skill filters, and responsive navigation', async ({
  page,
}, testInfo) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Microsoft', exact: true })).toBeVisible();
  await expect(page.getByText('04/2026 — Present', { exact: true })).toBeVisible();
  await expect(page.getByText(/~80% in failure testing/)).toBeVisible();
  const amazon = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Amazon', exact: true }) });
  await amazon.locator('summary').click();
  await expect(amazon.getByText(/reducing SEV2 tickets/)).toBeVisible();
  await page.getByRole('button', { name: 'AI & ML', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Less AI theatre/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /The invisible stuff/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Distributed systems', exact: true }).click();
  await expect(
    page.locator('#systems').getByText('Distributed Computing', { exact: true })
  ).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  }
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Contact', exact: true })
    .click();
  await expect(page.locator('#cta')).toBeInViewport();
  await expect(page.locator('#cta').getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/chiranjeev-singh-2a012b219/'
  );
  await expect(
    page.locator('#cta').getByRole('link', { name: /chiranj33v.singh@gmail.com/ })
  ).toHaveAttribute('href', 'mailto:chiranj33v.singh@gmail.com');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('terminal commands, history, unknown input, focus restoration, and keyboard escape', async ({
  page,
}) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Open terminal', exact: true });
  await trigger.click();
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await expect(input).toBeFocused();
  await input.fill('whoami');
  await input.press('Enter');
  await expect(page.getByRole('log')).toContainText('Azure Direct Drive');
  await input.fill('<img src=x onerror=alert(1)>');
  await input.press('Enter');
  await expect(page.getByRole('log')).toContainText('Command not found');
  await expect(page.getByRole('dialog').locator('img')).toHaveCount(0);
  await input.press('ArrowUp');
  await expect(input).toHaveValue('<img src=x onerror=alert(1)>');
  await input.fill('clear');
  await input.press('Enter');
  await expect(page.getByRole('log')).toBeEmpty();
  await input.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('floating treasure and conventional vault entry preserve real pinned data and demo links', async ({
  page,
}, testInfo) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.goto('/');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: 'Open side quests', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Secret experiments');
  await expect(page.getByRole('status')).toContainText('Pinned repositories');
  await expect(page.getByRole('link', { name: /Open live demo/ })).toHaveAttribute(
    'href',
    pinned.items[0].homepageUrl
  );
  await page.screenshot({
    path: testInfo.outputPath('vault.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Return to Portfolio' }).click();
  await page.getByRole('button', { name: /Unlock the vault/ }).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name: /Unlock the vault/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Secret experiments');
  await page.getByRole('button', { name: 'Return to Portfolio' }).click();
  await expect(page.locator('#projects')).toBeInViewport();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(30);
  expect(errors).toEqual([]);
});

test('malformed or failed GitHub data becomes an honest usable fallback', async ({ page }) => {
  await page.route('**/api/github-pinned', route =>
    route.fulfill({
      json: { ...pinned, items: [{ ...pinned.items[0], topics: 'not-an-array' }] },
    })
  );
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'Local artifact' })).toBeVisible();
  await page.getByRole('button', { name: 'Open hidden vault', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Live sync unavailable');
  await expect(
    page.getByRole('heading', { name: 'Real-Time Face-Mask Detection', level: 2 })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Return to Portfolio' }).click();
  await page.route('**/api/github-pinned', route =>
    route.fulfill({ status: 503, body: 'Unavailable' })
  );
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'Local artifact' })).toBeVisible();
});

test('concept-specific visual controls are functional', async ({ page }) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.goto('/');
  const concept = await page.locator('[data-concept]').getAttribute('data-concept');
  if (concept === 'os') {
    await page.getByRole('tab', { name: 'stack.tsx' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('The right tool.');
    await page.getByRole('tab', { name: 'stack.tsx' }).press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'notes.tsx' })).toBeFocused();
    await expect(page.getByRole('tabpanel')).toContainText('Make it useful.');
  } else if (concept === 'command') {
    await page.getByRole('button', { name: 'Signals 02' }).click();
    await expect(
      page.getByRole('heading', { name: 'Find the signal in the noise.' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Intelligence 03' }).click();
    await expect(page.getByRole('heading', { name: 'AI that leaves the notebook.' })).toBeVisible();
  } else {
    await page.getByRole('link', { name: '02 / Systems' }).click();
    await expect(page.locator('#systems')).toBeInViewport();
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '?? / Side quests' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Secret experiments');
  }
});

test('direct section links, email copying, and API timeouts remain usable', async ({ page }) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.goto('/#projects');
  await expect(page.locator('#projects')).toBeInViewport();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Email copied.' })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Permission denied');
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copy unavailable' })).toBeVisible();
  await page.clock.install();
  await page.unroute('**/api/github-pinned');
  await page.route('**/api/github-pinned', () => {});
  await page.goto('/');
  await page.clock.fastForward(16000);
  await expect(page.getByRole('status').filter({ hasText: 'Local artifact' })).toBeVisible();
});

test('scroll animation, desktop/mobile screenshots, and narrow layout', async ({
  page,
}, testInfo) => {
  await page.route('**/api/github-pinned', route =>
    route.fulfill({
      json: {
        ...pinned,
        selection: 'recent',
        items: [
          {
            ...pinned.items[0],
            id: 'profile',
            name: 'chiranjeev-21',
            description: 'Config files for my GitHub profile.',
            homepageUrl: null,
            topics: [],
          },
          {
            ...pinned.items[0],
            id: 'leetcode',
            name: 'Leetcode',
            description: 'A repo for my code submissions on Leetcode in C++.',
            homepageUrl: null,
            primaryLanguage: { name: 'C++', color: '#f34b7d' },
            topics: [],
          },
          {
            ...pinned.items[0],
            id: 'whodis',
            name: 'WhoDis',
            description:
              'A photo discovery project for finding your pictures among a group trip collection.',
            primaryLanguage: { name: 'Python', color: '#3572a5' },
            topics: ['computer-vision'],
          },
        ],
      },
    })
  );
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('status').filter({ hasText: 'Live GitHub' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('hero.png'), animations: 'disabled' });
  for (const id of ['work', 'systems', 'projects', 'about', 'cta']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    const reveal = page.locator(`#${id} [data-reveal]`).first();
    await reveal.scrollIntoViewIfNeeded();
    await expect(reveal).toHaveCSS('opacity', '1');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#hero').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath('full-page.png'),
    fullPage: true,
    animations: 'disabled',
  });
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 780 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath('narrow-320.png'),
      fullPage: true,
      animations: 'disabled',
    });
  }
  expect(errors).toEqual([]);
});

test('live GitHub smoke', async ({ request }, testInfo) => {
  test.skip(
    process.env.LIVE_GITHUB !== '1' || testInfo.project.name !== 'desktop',
    'Opt-in upstream availability check: set LIVE_GITHUB=1.'
  );
  const api = await request.get('/api/github-pinned');
  expect(api.status()).toBe(200);
  const data = await api.json();
  expect(data.source).toBe('github');
  expect(data.items.length).toBeGreaterThan(0);
  expect(['recent', 'pinned']).toContain(data.selection);
});
