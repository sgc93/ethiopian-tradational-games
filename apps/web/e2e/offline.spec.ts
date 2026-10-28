import { expect, test } from '@playwright/test';
import { GAME_URL, openEnglish, playFirstOpenHole, startComputerGame, waitForTurn } from './helpers';

test('works offline after the first visit', async ({ page, context }) => {
  await openEnglish(page);
  // Wait until the service worker has installed and taken control of the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
    }
  });

  await context.setOffline(true);
  await page.goto(GAME_URL);
  await expect(page.getByRole('button', { name: 'Play against the computer' })).toBeVisible();
  await startComputerGame(page, 'Quick game');
  await waitForTurn(page);
  const before = await page.locator('[data-testid="hole-0"]').getAttribute('aria-label');
  await playFirstOpenHole(page);
  // The move was played offline: the board changed and the game carried on.
  await expect.poll(() => page.locator('[data-testid="hole-0"]').getAttribute('aria-label')).not.toBe(before);
  await context.setOffline(false);
});
