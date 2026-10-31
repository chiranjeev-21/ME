import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', error => errors.push(error.message));
  // The playbox never needs the GitHub feed; keep the home page offline and deterministic.
  await page.route('**/api/github-pinned', route => route.fulfill({ status: 503, json: {} }));
});
test.afterEach(() => {
  expect(errors, 'no uncaught page errors').toEqual([]);
});

const playbox = (page: Page) => page.getByRole('dialog', { name: 'The playbox.' });

// Every test runs in a fresh browser context, so storage starts empty.
async function openFresh(page: Page) {
  await page.goto('/playbox');
  await expect(playbox(page).getByRole('heading', { level: 1 })).toBeFocused();
  return playbox(page);
}

test('the playbox opens from the guitar and closes back to it', async ({ page }) => {
  await page.goto('/#beyond');
  const link = page.locator('#beyond').getByRole('link', { name: /Open the playbox/ });
  await expect(link).toHaveAttribute('href', '/playbox');
  await link.click();
  await expect(page).toHaveURL(/\/playbox$/);
  const dialog = playbox(page);
  await expect(dialog.getByRole('heading', { level: 1, name: 'The playbox.' })).toBeFocused();
  await expect(page).toHaveTitle('Playbox — Chiranjeev Singh');
  await expect(page.locator('#main')).toHaveAttribute('inert', '');
  await expect(dialog.getByRole('button', { name: 'Sound on' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/#beyond$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#main')).not.toHaveAttribute('inert', '');

  await page.goto('/playbox');
  await expect(playbox(page).getByRole('heading', { level: 1 })).toBeFocused();
  await playbox(page)
    .getByRole('button', { name: /Back to the guitar/ })
    .click();
  await expect(page).toHaveURL(/\/#beyond$/);
  await expect(page.locator('#main')).not.toHaveAttribute('inert', '');
});

test('chords are built one position per string, named, and moved with the keyboard', async ({
  page,
}) => {
  const dialog = await openFresh(page);
  const name = dialog.getByTestId('chord-name');
  await expect(name).toHaveText('Silence');
  for (const label of [
    'A string, fret 3, C3',
    'D string, fret 2, E3',
    'G string, open, G3',
    'B string, fret 1, C4',
    'High E string, open, E4',
  ])
    await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(name).toHaveText('C');
  await expect(dialog.getByText('x32010')).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'A string, fret 3, C3', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');

  // Choosing another fret on the same string replaces the first; pressing it again mutes the string.
  await dialog.getByRole('button', { name: 'A string, fret 2, B2', exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: 'A string, fret 3, C3', exact: true })
  ).toHaveAttribute('aria-pressed', 'false');
  await dialog.getByRole('button', { name: 'A string, fret 2, B2', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Mute the A string' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(name).toHaveText('C/E');

  const presets = dialog.getByRole('group', { name: 'Chord presets' });
  await presets.getByRole('button', { name: 'F', exact: true }).click();
  await expect(name).toHaveText('F');
  await expect(presets.getByRole('button', { name: 'F', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await presets.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(name).toHaveText('Unnamed');

  const open = dialog.getByRole('button', { name: 'Low E string, open, E2', exact: true });
  await open.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    dialog.getByRole('button', { name: 'Low E string, fret 1, F2', exact: true })
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const target = dialog.getByRole('button', { name: 'A string, fret 1, A♯2', exact: true });
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(target).toHaveAttribute('aria-pressed', 'true');
});

test('a sequence is added, repeated, reordered, timed, played and kept', async ({ page }) => {
  test.slow();
  const dialog = await openFresh(page);
  const presets = dialog.getByRole('group', { name: 'Chord presets' });
  const step = (n: number) => dialog.getByRole('button', { name: new RegExp(`^Step ${n}:`) });

  await expect(dialog.getByText(/No steps yet/)).toBeVisible();
  await presets.getByRole('button', { name: 'C', exact: true }).click();
  await dialog.getByRole('button', { name: 'Add to sequence' }).click();
  await presets.getByRole('button', { name: 'G', exact: true }).click();
  await dialog.getByRole('button', { name: 'Up', exact: true }).click();
  await dialog.getByRole('button', { name: 'Add to sequence' }).click();

  // Repeat the C, then move the copy after the G.
  await step(1).click();
  await expect(dialog.getByTestId('chord-name')).toHaveText('C');
  await dialog.getByRole('button', { name: 'Repeat step' }).click();
  await expect(step(2)).toHaveAccessibleName(/^Step 2: C, down strum/);
  await expect(step(2)).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Move step later' }).click();
  await expect(step(1)).toHaveAccessibleName(/^Step 1: C, down strum, 1 beat/);
  await expect(step(2)).toHaveAccessibleName(/^Step 2: G, up strum, 1 beat/);
  await expect(step(3)).toHaveAccessibleName(/^Step 3: C, down strum, 1 beat/);

  // Lengthen the G to a beat and a half.
  await step(2).click();
  await dialog.getByRole('button', { name: 'Longer' }).click();
  await dialog.getByRole('button', { name: 'Update step' }).click();
  await expect(step(2)).toHaveAccessibleName('Step 2: G, up strum, 1½ beats (1.50 seconds)');
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(dialog.getByText('3 steps · 3.50 s')).toBeVisible();

  const timeline = dialog.getByTestId('timeline');
  await expect(timeline).toHaveAttribute('data-active-step', 'none');
  await dialog.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(timeline).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => timeline.getAttribute('data-active-step')).toBe('0');
  await expect.poll(() => timeline.getAttribute('data-active-step'), { timeout: 5000 }).toBe('1');
  await dialog.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(timeline).toHaveAttribute('data-playing', 'false');
  await expect(timeline).toHaveAttribute('data-active-step', 'none');

  await page.reload();
  const again = playbox(page);
  await expect(again.getByRole('button', { name: /^Step \d+:/ })).toHaveCount(3);
  await expect(again.getByRole('button', { name: /^Step 2:/ })).toHaveAccessibleName(
    'Step 2: G, up strum, 1½ beats (1.50 seconds)'
  );

  // Clearing can be undone.
  await again.getByRole('button', { name: 'Clear sequence' }).click();
  await expect(again.getByRole('button', { name: /^Step \d+:/ })).toHaveCount(0);
  await again.getByRole('button', { name: 'Undo clear' }).click();
  await expect(again.getByRole('button', { name: /^Step \d+:/ })).toHaveCount(3);
});

test('a stored song that is malformed falls back to an empty sequence', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('cj-playbox:v1', '{"version":1,"bpm":9000,"loop":true,"steps":[]}')
  );
  await page.goto('/playbox');
  await expect(playbox(page).getByText(/No steps yet/)).toBeVisible();
});

test('a take is recorded without a microphone and downloads as a WAV', async ({ page }) => {
  test.slow();
  const dialog = await openFresh(page);
  await expect(dialog.getByText(/No take yet/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Record', exact: true }).click();
  const stop = dialog.getByRole('button', { name: 'Stop recording' });
  await expect(stop).toHaveAttribute('data-state', 'recording');
  await expect(dialog.getByText(/^Recording\./)).toBeVisible();
  await dialog
    .getByRole('group', { name: 'Chord presets' })
    .getByRole('button', { name: 'Em', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Strum', exact: true }).click();
  await dialog.getByRole('button', { name: 'B string, fret 3, D4', exact: true }).click();
  await page.waitForTimeout(400);
  await stop.click();

  const download = dialog.getByRole('link', { name: 'Download (.wav)' });
  await expect(download).toBeVisible({ timeout: 20000 });
  await expect(download).toHaveAttribute('download', /^cj-playbox-\d{8}-\d{4}\.wav$/);
  await expect(dialog.locator('audio')).toHaveAttribute('src', /^blob:/);
  const wav = await download.evaluate(async element => {
    const buffer = await (await fetch((element as HTMLAnchorElement).href)).arrayBuffer();
    const view = new DataView(buffer);
    const text = (offset: number) =>
      String.fromCharCode(...new Uint8Array(buffer.slice(offset, offset + 4)));
    let peak = 0;
    for (let i = 44; i + 1 < buffer.byteLength; i += 2)
      peak = Math.max(peak, Math.abs(view.getInt16(i, true)));
    return {
      bytes: buffer.byteLength,
      riff: text(0),
      wave: text(8),
      channels: view.getUint16(22, true),
      rate: view.getUint32(24, true),
      bits: view.getUint16(34, true),
      data: view.getUint32(40, true),
      peak,
    };
  });
  expect(wav.riff).toBe('RIFF');
  expect(wav.wave).toBe('WAVE');
  expect(wav.channels).toBe(1);
  expect(wav.rate).toBe(44100);
  expect(wav.bits).toBe(16);
  expect(wav.data).toBe(wav.bytes - 44);
  expect(wav.bytes).toBeGreaterThan(44100 * 2 * 2);
  expect(wav.peak, 'the take is not silence').toBeGreaterThan(2000);
});
