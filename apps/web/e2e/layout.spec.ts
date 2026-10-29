import { expect, test } from '@playwright/test';
import { openEnglish, startComputerGame } from './helpers';

/** Every hole centre projected on screen, as the scene reports it for tests. */
async function holePositions(page: import('@playwright/test').Page) {
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500); // the camera eases into the play view
  return page.evaluate(() =>
    (window as unknown as { __gebetaHolePositions: () => [number, number][] }).__gebetaHolePositions(),
  );
}

test('the whole board is visible on a 360×640 phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  const positions = await holePositions(page);
  expect(positions).toHaveLength(12);
  for (const [x, y] of positions) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(360);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(640);
  }
  await page.screenshot({ path: 'test-results/board-360x640.png' });
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
});
