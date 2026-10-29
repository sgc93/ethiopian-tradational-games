import { expect, type Page } from '@playwright/test';

// The minimal tier keeps headless Chrome's software renderer from starving the page under test.
export const GAME_URL = '/?speed=skip&seed=42&tier=minimal';

/** From the home screen (English), start a game against the easy computer and call the coin. */
export async function startComputerGame(page: Page, format: 'Quick game' | 'Full match') {
  await page.getByRole('button', { name: 'Play against the computer' }).click();
  await page.getByRole('button', { name: 'Easy' }).click();
  await page.getByRole('button', { name: new RegExp(format) }).click();
  await page.getByRole('button', { name: /Lion/ }).click();
}

/** Opens the app in English with a clean slate. */
export async function openEnglish(page: Page, url = GAME_URL) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('button', { name: 'Play against the computer' })).toBeVisible();
}

const openHoles = (page: Page) => page.locator('[data-testid^="hole-"]:not([disabled])');

/** Waits until a hole can be played (or the game is over). */
export async function waitForTurn(page: Page) {
  const result = page.locator('#result-title');
  await expect
    .poll(async () => (await result.isVisible()) || (await openHoles(page).count()) > 0, { timeout: 20_000 })
    .toBe(true);
}

/**
 * Plays the first open hole the way a keyboard player would: the hole buttons are hidden until
 * focused, and Enter on a focused button plays it.
 */
export async function playFirstOpenHole(page: Page) {
  try {
    await openHoles(page).first().press('Enter', { timeout: 3_000 });
  } catch {
    // The hole closed between finding and pressing it (the computer moved); the loop tries again.
  }
}

/**
 * Plays by taking the first open hole until the result shows, pressing "Next round" at each
 * round summary. Returns how many summaries were seen.
 */
export async function playToResult(page: Page): Promise<number> {
  let summaries = 0;
  const result = page.locator('#result-title');
  const next = page.getByRole('button', { name: 'Next round' });
  for (;;) {
    await expect
      .poll(
        async () => (await result.isVisible()) || (await next.isVisible()) || (await openHoles(page).count()) > 0,
        { timeout: 20_000 },
      )
      .toBe(true);
    if (await result.isVisible()) return summaries;
    if (await next.isVisible()) {
      summaries++;
      await next.click();
    } else {
      await playFirstOpenHole(page);
    }
  }
}
