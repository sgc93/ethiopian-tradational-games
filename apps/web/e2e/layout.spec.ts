import { expect, test } from '@playwright/test';
import { openEnglish, startComputerGame, waitForTurn } from './helpers';

/** Every hole centre projected on screen, as the scene reports it for tests. */
async function holePositions(page: import('@playwright/test').Page) {
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500); // the camera eases into the play view
  return page.evaluate(() =>
    (window as unknown as { __gebetaHolePositions: () => [number, number][] }).__gebetaHolePositions(),
  );
}

test('the whole board is visible on an 844×390 phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  const positions = await holePositions(page);
  expect(positions).toHaveLength(12);
  for (const [x, y] of positions) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(844);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(390);
  }
  await page.screenshot({ path: 'test-results/board-844x390.png' });
});

test('a portrait window shows "turn your phone" and pauses the game', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  await waitForTurn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('status')).toContainText(/turn your phone/i);
  await expect(page.getByRole('status')).toContainText('ስልክዎን ያዙሩ');
  await page.screenshot({ path: 'test-results/turn-phone-390x844.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('status')).toHaveCount(0);
  await waitForTurn(page); // the game resumes with open holes
});

for (const [width, height] of [
  [844, 390],
  [750, 300],
] as const) {
  test(`the play view at ${width}×${height} keeps every cup between the interface bands`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openEnglish(page);
    await startComputerGame(page, 'Quick game');
    const positions = await holePositions(page);
    expect(positions).toHaveLength(12);
    const top = height < 340 ? 44 : 56;
    const bottom = height - (height < 340 ? 56 : 77);
    for (const [x, y] of positions) {
      expect(x).toBeGreaterThan(width * 0.095);
      expect(x).toBeLessThan(width * 0.905);
      expect(y).toBeGreaterThan(top);
      expect(y).toBeLessThan(bottom);
    }
    await page.screenshot({ path: `test-results/play-${width}x${height}.png` });
  });
}

test('no WebGL shows the message, not a crash', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      if (kind === 'webgl2') return null;
      return (original as (...a: unknown[]) => unknown).call(this, kind, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(/WebGL 2/);
  // The message sits over a still of the home scene (spec §9, screen 12).
  await expect(page.locator('img[src*="home-still"]')).toBeVisible();
});
