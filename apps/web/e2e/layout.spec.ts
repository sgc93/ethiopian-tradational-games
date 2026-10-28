import { expect, test } from '@playwright/test';
import { openEnglish, startComputerGame } from './helpers';

test('the whole board is visible on a 360×640 phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(500); // a few frames, so the camera has settled
  const positions = await page.evaluate(() =>
    (window as unknown as { __gebetaHolePositions: () => [number, number][] }).__gebetaHolePositions(),
  );
  expect(positions).toHaveLength(12);
  for (const [x, y] of positions) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(360);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(640);
  }
  await page.screenshot({ path: 'test-results/board-360x640.png' });
});

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
