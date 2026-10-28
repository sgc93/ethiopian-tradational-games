import { expect, test } from '@playwright/test';
import { GAME_URL, openEnglish, playFirstOpenHole, playToResult, startComputerGame, waitForTurn } from './helpers';

test('quick game against easy reaches a result', async ({ page }) => {
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  await playToResult(page);
  await expect(page.locator('#result-title')).toHaveText(/won|draw/);
  const [a, b] = (await page.locator('.result-score').textContent())!.split('–').map((s) => Number(s.trim()));
  expect(a! + b!).toBe(48);
});

test('full match against easy reaches a result through round summaries', async ({ page }) => {
  await openEnglish(page);
  await startComputerGame(page, 'Full match');
  const summaries = await playToResult(page);
  expect(summaries).toBeGreaterThanOrEqual(1);
  await expect(page.locator('#result-title')).toHaveText(/won/);
  await expect(page.getByText(/\d+ rounds? played/)).toBeVisible();
});

test('language switch changes the home screen to Amharic', async ({ page }) => {
  await openEnglish(page);
  await page.getByRole('button', { name: 'አማርኛ' }).click();
  await expect(page.getByRole('heading', { name: 'ገበጣ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ከኮምፒውተር ጋር ይጫወቱ' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'ከኮምፒውተር ጋር ይጫወቱ' })).toBeVisible();
});

test('continue your game after reload', async ({ page }) => {
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  await waitForTurn(page);
  await playFirstOpenHole(page);
  await page.waitForTimeout(300); // let the move land
  await waitForTurn(page);
  const before = await page.locator('[data-testid^="hole-"]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));

  await page.goto(GAME_URL);
  await page.getByRole('button', { name: 'Continue your game' }).click();
  await expect(page.locator('[data-testid="hole-0"]')).toBeAttached();
  const after = await page.locator('[data-testid^="hole-"]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  expect(after).toEqual(before);
});
