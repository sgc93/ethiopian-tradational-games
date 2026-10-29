import { expect, test } from '@playwright/test';
import { GAME_URL, openEnglish, playFirstOpenHole, startComputerGame, waitForTurn } from './helpers';

test('works offline after the first visit', async ({ page, context }) => {
  await openEnglish(page);
  // Wait until the service worker has installed, then visit again: a page loaded while the worker
  // was still installing is not always claimed, but the next visit is controlled from the start.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto(GAME_URL);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 30_000 }).toBe(true);

  await context.setOffline(true);
  await page.goto(GAME_URL);
  // Through the loading screen and the fire's flare, on a software renderer: the usual 5 s is short.
  await expect(page.getByRole('button', { name: 'Play against the computer' })).toBeVisible({ timeout: 30_000 });
  await startComputerGame(page, 'Quick game');
  await waitForTurn(page);
  const before = await page.locator('[data-testid="hole-0"]').getAttribute('aria-label');
  await playFirstOpenHole(page);
  // The move was played offline: the board changed and the game carried on.
  await expect.poll(() => page.locator('[data-testid="hole-0"]').getAttribute('aria-label')).not.toBe(before);
  await context.setOffline(false);
});
