import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const feed = {
  source: 'github',
  selection: 'pinned',
  profile: {
    login: 'chiranjeev-21',
    name: 'Chiranjeev Singh',
    url: 'https://github.com/chiranjeev-21',
  },
  items: [
    {
      id: 'public-project',
      name: 'Public Project',
      description: 'A real-data-shaped browser test fixture.',
      url: 'https://github.com/chiranjeev-21/ME',
      homepageUrl: 'https://chiranjeev.vercel.app',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      stargazerCount: 7,
      forkCount: 2,
      updatedAt: '2026-10-27T00:00:00Z',
      topics: ['systems', 'typescript'],
    },
  ],
};

async function command(page: Page, text: string) {
  const terminal = page.locator('[data-window-id="terminal"]');
  if (!(await terminal.isVisible()))
    await page
      .getByRole('navigation', { name: 'Application dock' })
      .getByRole('button', { name: 'Terminal', exact: true })
      .click();
  const input = terminal.getByRole('textbox', { name: 'Terminal command' });
  await input.fill(text);
  await input.press('Enter');
  return terminal.getByRole('log');
}
async function open(page: Page, app: string) {
  await page
    .getByRole('navigation', { name: 'Application dock' })
    .getByRole('button', { name: app, exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/github-pinned', route => route.fulfill({ json: feed }));
});

test('boots into an actual desktop with identity and direct recruiter access', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-os-desktop]')).toBeVisible();
  await expect(page.locator('[data-window-id="terminal"]')).toBeVisible();
  await expect(page.locator('[data-window-id="terminal"]')).toContainText('Chiranjeev');
  await expect(
    page.getByRole('navigation', { name: 'Application dock' }).getByRole('button')
  ).toHaveCount(6);
  await open(page, 'Resume');
  const resume = page.locator('[data-window-id="resume"]');
  await expect(resume).toContainText('Microsoft');
  await expect(resume).toContainText('Agentic AI');
  await expect(resume).toContainText('Distributed Computing');
  await expect(resume).toContainText(/80%.*failure testing/);
  await expect(resume.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute(
    'href',
    'mailto:chiranj33v.singh@gmail.com'
  );
  const pdf = resume.locator('a[href="/resume/Chiranjeev-Singh-Resume.pdf"]').first();
  await expect(pdf).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await pdf.click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/Chiranjeev.*\.pdf$/i);
  expect(await page.locator('audio[autoplay]').count()).toBe(0);
});

test('dock and terminal share one registry and minimize restores app state', async ({ page }) => {
  await page.goto('/');
  await command(page, 'echo "a window remembers"');
  await expect(page.locator('[data-window-id="terminal"]')).toContainText('a window remembers');
  await page.getByRole('button', { name: 'Minimize Terminal', exact: true }).click();
  await expect(page.locator('[data-window-id="terminal"]')).toBeHidden();
  await open(page, 'Terminal');
  await expect(page.locator('[data-window-id="terminal"]')).toContainText('a window remembers');
  await command(page, 'open resume');
  await expect(page.locator('[data-window-id="resume"]')).toBeVisible();
  await page
    .locator('[data-window-id="resume"]')
    .getByRole('button', { name: 'Minimize Resume', exact: true })
    .click();
  await command(page, 'resume');
  await expect(page.locator('[data-window-id="resume"]')).toHaveCount(1);
  await expect(page.locator('[data-window-id="resume"]')).toBeVisible();
});

test('shell parses quotes, reads virtual files, completes commands and keeps history', async ({
  page,
}) => {
  await page.goto('/');
  const log = await command(page, 'echo "hello curious human"');
  await expect(log).toContainText('hello curious human');
  await command(page, 'cd ~/writing');
  await command(page, 'pwd');
  await expect(log).toContainText('/home/cj/writing');
  await command(page, 'cat "design notes.md"');
  await expect(log).toContainText(/registry|window/i);
  await command(page, 'cat /etc/passwd');
  await expect(log).toContainText(/not found|no such|does not exist/i);
  await command(page, 'echo hi; rm -rf /');
  await expect(log).toContainText(/unsupported|not supported|read.only/i);
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('draft');
  await input.press('ArrowUp');
  await expect(input).not.toHaveValue('draft');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('draft');
  await input.fill('whoa');
  await input.press('Tab');
  await expect(input).toHaveValue(/whoami\s*/);
  await input.press('Enter');
  await expect(log).toContainText('Chiranjeev Singh');
});

test('virtual project paths open the same investigation and docs have real links', async ({
  page,
}) => {
  await page.goto('/');
  await command(page, 'open ~/projects/cj-os/README.md');
  const project = page.locator('[data-window-id="project:cj-os"]');
  await expect(project).toBeVisible();
  await expect(project).toContainText(/architecture/i);
  await page.getByRole('button', { name: /Minimize.*CJ OS/ }).click();
  await command(page, 'open cj-os');
  await expect(project).toHaveCount(1);
  await expect(project).toBeVisible();
  await page.getByRole('button', { name: 'Contact CJ', exact: true }).click();
  await expect(page.locator('[data-window-id="reader:/home/cj/contact.md"]')).toContainText(
    'chiranj33v.singh@gmail.com'
  );
});

test('command palette searches apps, notes and commands, and supports keyboard navigation', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette', exact: true });
  const search = palette.getByRole('combobox');
  await expect(search).toBeFocused();
  await search.fill('Resume');
  await search.press('Enter');
  await expect(palette).toHaveCount(0);
  await expect(page.locator('[data-window-id="resume"]')).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('design notes');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.getByRole('combobox').press('Enter');
  await expect(
    page.locator('[data-window-id="reader:/home/cj/writing/design notes.md"]')
  ).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('no-such-app-qwerty');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toContainText('No matches');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toHaveCount(0);
  await page.getByRole('button', { name: 'CJ OS menu' }).focus();
  await page.keyboard.press('`');
  await expect(page.locator('[data-window-id="terminal"]')).toBeVisible();
});

test('windows drag, resize, maximize and restore without leaving the viewport', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'Mobile applications intentionally use a full-screen window.'
  );
  await page.goto('/');
  const terminal = page.locator('[data-window-id="terminal"]');
  const before = (await terminal.boundingBox())!;
  const title = terminal.getByRole('button', { name: 'Move Terminal window' });
  await title.focus();
  await title.press('ArrowRight');
  await expect.poll(async () => (await terminal.boundingBox())!.x).toBeCloseTo(before.x + 10, 0);
  const titleBox = (await title.boundingBox())!;
  await page.mouse.move(titleBox.x + 110, titleBox.y + 10);
  await page.mouse.down();
  await page.mouse.move(titleBox.x + 160, titleBox.y + 45, { steps: 8 });
  await page.mouse.up();
  const moved = (await terminal.boundingBox())!;
  expect(moved.x).toBeGreaterThan(before.x + 30);
  const resize = terminal.getByRole('button', { name: 'Resize Terminal' });
  const handle = (await resize.boundingBox())!;
  await page.mouse.move(handle.x + 16, handle.y + 16);
  await page.mouse.down();
  await page.mouse.move(handle.x + 70, handle.y + 50, { steps: 7 });
  await page.mouse.up();
  const resized = (await terminal.boundingBox())!;
  expect(resized.width).toBeGreaterThan(moved.width + 30);
  await terminal.getByRole('button', { name: 'Maximize Terminal', exact: true }).click();
  await expect(terminal).toHaveAttribute('data-maximized', 'true');
  await terminal.getByRole('button', { name: 'Restore Terminal', exact: true }).click();
  await expect(terminal).toHaveAttribute('data-maximized', 'false');
  await expect
    .poll(async () => (await terminal.boundingBox())!.width)
    .toBeCloseTo(resized.width, 0);
  await page.setViewportSize({ width: 800, height: 650 });
  const bounds = (await terminal.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(800);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(650);
});

test('desktop settings persist and app deep links survive reload', async ({ page }) => {
  await page.goto('/#app=resume');
  await expect(page.locator('[data-window-id="resume"]')).toBeVisible();
  await open(page, 'Desktop Settings');
  const settings = page.locator('[data-window-id="settings"]');
  await settings.getByRole('radio', { name: 'Warm amber' }).check();
  await settings.getByRole('radio', { name: 'Blueprint' }).check();
  await settings.getByRole('radio', { name: 'Comfortable' }).check();
  await expect(page.locator('[data-os-desktop]')).toHaveAttribute('data-accent', 'amber');
  await page.reload();
  await expect(page.locator('[data-window-id="settings"]')).toBeVisible();
  await expect(page.locator('[data-os-desktop]')).toHaveAttribute('data-wallpaper', 'blueprint');
  await expect(page.locator('[data-os-desktop]')).toHaveAttribute('data-font-size', 'large');
});

test('the floating treasure opens a real OS vault with honest live and offline states', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open side quests', exact: true }).click();
  const vault = page.locator('[data-window-id="vault"]');
  await expect(vault).toBeVisible();
  await expect(vault).toContainText(/pinned/i);
  await expect(
    vault.locator('a[href="https://github.com/chiranjeev-21/ME"]').first()
  ).toBeVisible();
  await page.route('**/api/github-pinned', route =>
    route.fulfill({ status: 503, body: 'Unavailable' })
  );
  await page.reload();
  await expect(page.locator('[data-window-id="vault"]')).toContainText(
    /fallback|local artifact|offline/i
  );
});

test('workspace screenshots, keyboard focus, and phone-sized application views', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('textbox', { name: 'Terminal command' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), animations: 'disabled' });
  for (const app of ['Project Explorer', 'AI Lab', 'System Monitor', 'Resume']) {
    await open(page, app);
    await expect(
      page.locator(
        `[data-window-id="${app === 'Project Explorer' ? 'explorer' : app === 'AI Lab' ? 'lab' : app === 'System Monitor' ? 'monitor' : 'resume'}"]`
      )
    ).toBeVisible();
    const appWindow = page.locator(
      `[data-window-id="${app === 'Project Explorer' ? 'explorer' : app === 'AI Lab' ? 'lab' : app === 'System Monitor' ? 'monitor' : 'resume'}"]`
    );
    await expect(appWindow.getByRole('heading').first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`${app.replaceAll(' ', '-').toLowerCase()}.png`),
      animations: 'disabled',
    });
  }
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 740 });
    const resume = page.locator('[data-window-id="resume"]');
    await expect(resume).toBeVisible();
    const rect = (await resume.boundingBox())!;
    expect(rect.width).toBeLessThanOrEqual(320);
    expect(rect.y + rect.height).toBeLessThanOrEqual(740);
    await page.screenshot({ path: testInfo.outputPath('phone-320.png'), animations: 'disabled' });
  }
  expect(errors).toEqual([]);
});

test('Explorer and shell open the same project, and hidden files lead to the vault', async ({
  page,
}) => {
  await page.goto('/');
  await open(page, 'Project Explorer');
  const explorer = page.locator('[data-window-id="explorer"]');
  await explorer
    .getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: 'Projects', exact: true })
    .click();
  await explorer.getByRole('button', { name: 'Open cj-os', exact: true }).click();
  const readme = explorer.getByRole('button', { name: /README\.md, Project investigation/ });
  await readme.focus();
  await readme.press('Enter');
  const project = page.locator('[data-window-id="project:cj-os"]');
  await expect(project).toBeVisible();
  await command(page, 'open cj-os');
  await expect(project).toHaveCount(1);
  await expect(project).toBeVisible();
  await open(page, 'Project Explorer');
  await explorer
    .getByRole('navigation', { name: 'Workspace shortcuts' })
    .getByRole('button', { name: 'Home', exact: true })
    .click();
  await expect(explorer.getByRole('button', { name: 'Open .secrets', exact: true })).toHaveCount(0);
  await explorer.getByRole('checkbox', { name: 'Hidden files' }).check();
  await explorer.getByRole('button', { name: 'Open .secrets', exact: true }).click();
  await explorer.getByRole('button', { name: 'Open treasure.map', exact: true }).click();
  await expect(page.locator('[data-window-id="vault"]')).toBeVisible();
});

test('AI Lab computes retrieval and abstention, and Monitor records actual runs', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await open(page, 'AI Lab');
  const lab = page.locator('[data-window-id="lab"]');
  await lab.getByRole('textbox', { name: 'Search query' }).fill('Agentic AI');
  await lab.getByRole('combobox', { name: 'Results', exact: true }).selectOption('2');
  await lab.getByRole('button', { name: 'Run retrieval', exact: true }).click();
  const results = lab.getByRole('region', { name: 'Retrieval results' });
  await expect(results).toContainText('Evidence, not a generated answer');
  await expect(results).toContainText('Top cosine score');
  await expect(
    results.getByText('Search + extraction', { exact: true }).locator('..')
  ).toContainText(/[\d.]+\s*ms/);
  await page.screenshot({
    path: testInfo.outputPath('retrieval-working.png'),
    animations: 'disabled',
  });
  await lab.getByRole('textbox', { name: 'Search query' }).fill('zzzxqvflibbertigibbet');
  await lab.getByRole('button', { name: 'Run retrieval', exact: true }).click();
  await expect(results).toContainText('No supported extractive answer');
  await open(page, 'System Monitor');
  const monitor = page.locator('[data-window-id="monitor"]');
  await expect(monitor.getByRole('heading', { name: 'Observed, not assumed.' })).toBeVisible();
  await expect(
    monitor.getByText('Recorded runs available', { exact: true }).locator('..')
  ).toContainText('2');
  await expect(monitor).toContainText('Pinned repositories');
  await expect(
    monitor.getByText('Production server health', { exact: true }).locator('..')
  ).toContainText('Not instrumented');
  await expect(
    monitor.getByRole('list', { name: 'Latest eight local retrieval runs' })
  ).toContainText('zzzxqvflibbertigibbet');
  await page.screenshot({
    path: testInfo.outputPath('measured-monitor.png'),
    animations: 'disabled',
  });
});

test('normal-motion boot and window transitions finish without losing the workspace', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const skip = page.getByRole('button', { name: /Skip intro/ });
  if (await skip.isVisible()) await skip.click();
  const terminal = page.locator('[data-window-id="terminal"]');
  await expect(terminal).toBeVisible({ timeout: 5000 });
  if (await terminal.getByRole('button', { name: 'Maximize Terminal', exact: true }).isEnabled()) {
    await terminal.getByRole('button', { name: 'Maximize Terminal', exact: true }).click();
    await expect(terminal).toHaveAttribute('data-maximized', 'true');
    await terminal.getByRole('button', { name: 'Restore Terminal', exact: true }).click();
    await expect(terminal).toHaveAttribute('data-maximized', 'false');
  }
  await terminal.getByRole('button', { name: 'Minimize Terminal', exact: true }).click();
  await expect(terminal).toBeHidden();
  await open(page, 'Terminal');
  await expect(terminal.getByRole('textbox', { name: 'Terminal command' })).toBeVisible();
});

test('the desktop still opens when browser preference storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ['localStorage', 'sessionStorage'])
      Object.defineProperty(window, key, {
        get() {
          throw new DOMException('Storage denied', 'SecurityError');
        },
      });
  });
  await page.goto('/#app=resume');
  await expect(page.locator('[data-window-id="resume"]')).toContainText('Chiranjeev Singh');
  await expect(page.locator('[data-os-desktop]')).toHaveAttribute('data-accent', 'green');
});

test('a conventional résumé and contact route remains available without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.getByRole('heading', { name: 'Chiranjeev Singh' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download résumé PDF' })).toHaveAttribute(
      'href',
      '/resume/Chiranjeev-Singh-Resume.pdf'
    );
    const pdf = await context.request.get(`${baseURL}/resume/Chiranjeev-Singh-Resume.pdf`);
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
  } finally {
    await context.close();
  }
});

test('live GitHub smoke', async ({ request }, testInfo) => {
  test.skip(
    process.env.LIVE_GITHUB !== '1' || testInfo.project.name !== 'desktop',
    'Opt-in upstream availability check.'
  );
  const response = await request.get('/api/github-pinned');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.source).toBe('github');
  expect(['pinned', 'recent']).toContain(body.selection);
  expect(body.items.length).toBeGreaterThan(0);
});
