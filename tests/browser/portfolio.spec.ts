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
  await expect(page.locator('#work').getByText(/~80% in failure testing/)).toBeVisible();
  const amazon = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Amazon', exact: true }) });
  await amazon.locator('summary').click();
  await expect(amazon.getByText(/reducing SEV2 tickets/)).toBeVisible();
  await page.getByRole('button', { name: 'AI & ML', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Less AI theatre/ })).toBeVisible();
  await expect(page.locator('#systems').getByText('Agentic AI', { exact: true })).toBeVisible();
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
  await expect(page.getByRole('button', { name: 'Open side quests', exact: true })).toBeFocused();
  await page.getByRole('button', { name: /Unlock the vault/ }).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name: /Unlock the vault/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Secret experiments');
  await page.getByRole('button', { name: 'Return to Portfolio' }).click();
  await expect(page.locator('#projects')).toBeInViewport();
  await expect(page.getByRole('button', { name: /Unlock the vault/ })).toBeFocused();
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
  await page.getByRole('button', { name: 'Open side quests', exact: true }).click();
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

test('concept-specific visual controls are functional', async ({ page }, testInfo) => {
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
    const deskNote = page.locator('details').filter({ hasText: 'A note from CJ' });
    const noteControl = deskNote.locator('summary');
    await noteControl.focus();
    await noteControl.press('Enter');
    await expect(deskNote).toHaveAttribute('open', '');
    await expect(deskNote.getByText(/Make yourself at home/)).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await noteControl.press('Enter');
    await expect(deskNote).not.toHaveAttribute('open');
    await noteControl.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('workbench.png'), animations: 'disabled' });
    const principle = page.locator('details').filter({ hasText: 'Design for the unhappy path.' });
    await principle.locator('summary').click();
    await expect(principle.getByText(/Timeouts, disk failures/)).toBeVisible();
  } else {
    await page.getByRole('link', { name: '02 / Systems' }).click();
    await expect(page.locator('#systems')).toBeInViewport();
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '?? / Side quests' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Secret experiments');
  }
});

test('native scroll unfolds the recovery sketch, reverses it, and reaches real evidence', async ({
  page,
}, testInfo) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Follow the question', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('#inquiry').evaluate(element => Math.round(element.getBoundingClientRect().top))
    )
    .toBe(110);
  const story = page.getByRole('region', { name: 'From a question to the evidence' });
  const recovery = story.locator('[data-sketch-layer="recovery"]');
  const validation = story.locator('[data-sketch-layer="validation"]');
  await expect(story).toHaveAttribute('data-chapter-active', 'question');
  await expect(recovery).toHaveCSS('opacity', '0');
  await expect(story.locator('figcaption')).toContainText('What if the disk never replies?');
  const drawing = story.locator('figure');
  await expect(drawing).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath('narrative-question.png'),
    animations: 'disabled',
  });

  const scrollToChapter = async (id: string) => {
    const distance = await page
      .locator(`#${id}`)
      .evaluate(
        element =>
          element.getBoundingClientRect().top -
          window.innerHeight * (window.innerWidth <= 740 ? 0.56 : 0.25)
      );
    await page.mouse.wheel(0, distance);
  };
  await scrollToChapter('decisions');
  await expect(story).toHaveAttribute('data-chapter-active', 'decisions');
  await expect(recovery).toHaveCSS('opacity', '1');
  await expect(recovery.locator('path').first()).toHaveCSS('stroke-dashoffset', '0px');
  await expect(validation).toHaveCSS('opacity', '0');
  await expect(story.locator('figcaption')).toContainText('Give recovery a path');
  await expect(drawing).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath('narrative-decisions.png'),
    animations: 'disabled',
  });

  await scrollToChapter('evidence');
  await expect(story).toHaveAttribute('data-chapter-active', 'evidence');
  await expect(validation).toHaveCSS('opacity', '1');
  await expect(story.locator('#evidence')).toContainText('~80% in failure testing');
  await expect(drawing).toBeInViewport();
  const sketchBounds = await drawing.boundingBox();
  const treasureBounds = await page
    .getByRole('button', { name: 'Open side quests', exact: true })
    .boundingBox();
  expect(sketchBounds).not.toBeNull();
  expect(treasureBounds).not.toBeNull();
  expect(
    treasureBounds!.x >= sketchBounds!.x + sketchBounds!.width ||
      treasureBounds!.y >= sketchBounds!.y + sketchBounds!.height
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('narrative-evidence.png'),
    animations: 'disabled',
  });
  await scrollToChapter('decisions');
  await expect(story).toHaveAttribute('data-chapter-active', 'decisions');
  await expect(validation).toHaveCSS('opacity', '0');
  await expect(recovery).toHaveCSS('opacity', '1');
  await scrollToChapter('question');
  await expect(story).toHaveAttribute('data-chapter-active', 'question');
  await expect(recovery).toHaveCSS('opacity', '0');
  await expect(recovery.locator('path').first()).toHaveCSS('stroke-dashoffset', '1px');

  await scrollToChapter('evidence');
  await expect(story).toHaveAttribute('data-chapter-active', 'evidence');
  await story.getByRole('link', { name: 'Read the Microsoft evidence' }).click();
  await expect(page.locator('#microsoft-azure')).toBeInViewport();
  await expect(page.locator('#microsoft-azure details')).toHaveAttribute('open', '');
  await expect(page.locator('#microsoft-azure')).toContainText('~80% in failure testing');
  await page.goto('/#evidence');
  await story.getByRole('link', { name: /Amazon.*Timeout-aware spillover/ }).click();
  await expect(page.locator('#amazon-jwo')).toBeInViewport();
  await expect(page.locator('#amazon-jwo details')).toHaveAttribute('open', '');
  await expect(page.locator('#amazon-jwo')).toContainText('85% → ~92%');
});

test('reduced-motion story has keyboard chapter links and a direct recruiter path', async ({
  page,
}) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Experience, directly' }).click();
  await expect(page.locator('#work')).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Microsoft', exact: true })).toBeVisible();
  await page.goto('/#inquiry');
  const chapters = page.getByRole('navigation', { name: 'Engineering story chapters' });
  const decisions = chapters.getByRole('link', { name: '02 The decisions' });
  await decisions.focus();
  await decisions.press('Enter');
  const story = page.locator('#inquiry');
  await expect(story).toHaveAttribute('data-chapter-active', 'decisions');
  await expect(decisions).toHaveAttribute('aria-current', 'step');
  await expect(story.locator('[data-sketch-layer="recovery"]')).toHaveCSS('opacity', '1');
  expect(
    await story
      .locator('figure svg')
      .evaluate(
        element =>
          element
            .getAnimations({ subtree: true })
            .filter(animation => animation.playState === 'running').length
      )
  ).toBe(0);
  await chapters.getByRole('link', { name: '03 The evidence' }).focus();
  await page.keyboard.press('Enter');
  await expect(story).toHaveAttribute('data-chapter-active', 'evidence');
  await story.getByRole('link', { name: /Oyo.*voice pipelines/ }).click();
  await expect(page.locator('#oyo-sde1')).toBeInViewport();
  await expect(page.locator('#oyo-sde1 details')).toHaveAttribute('open', '');
  await expect(page.locator('#oyo-sde1')).toContainText('projected 20% cost reduction');
  await page.goto('/#amazon-jwo');
  await expect(page.locator('#amazon-jwo details')).toHaveAttribute('open', '');
  await expect(page.locator('#amazon-jwo')).toBeInViewport();
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
    if (id === 'systems') {
      await page.screenshot({
        path: testInfo.outputPath('systems-scrolled.png'),
        animations: 'disabled',
      });
    }
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

test('reduced-motion treasure stays in view after resizing', async ({ page }) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: pinned }));
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 640 });
  const treasure = page.getByRole('button', { name: 'Open side quests', exact: true });
  await expect(treasure).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await treasure.boundingBox();
      return bounds ? bounds.x + bounds.width : Infinity;
    })
    .toBeLessThanOrEqual(320);
  const bounds = await treasure.boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.y ?? Infinity) + (bounds?.height ?? 0)).toBeLessThanOrEqual(640);
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
