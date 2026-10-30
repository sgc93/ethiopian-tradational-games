import { expect, test } from '@playwright/test';
import { openEnglish, playToResult, startComputerGame, waitForTurn } from './helpers';

/** The three landscape sizes the suite runs at (spec §12): full-height phone, compact phone, desktop. */
const SIZES = ['phone-full', 'phone-compact', 'desktop', 'desktop-large'];

/** Every hole centre projected on screen, as the scene reports it for tests. */
async function holePositions(page: import('@playwright/test').Page) {
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500); // the camera eases into the play view
  return page.evaluate(() =>
    (window as unknown as { __gebetaHolePositions: () => [number, number][] }).__gebetaHolePositions(),
  );
}

/** The interface bands for a viewport height (spec §9): 56/77 px, or 44/56 px below 340 px, scaled by the interface. */
function bands(height: number) {
  const compact = height < 340;
  const scale = Math.min(1.6, Math.max(0.82, height / 390));
  return { top: (compact ? 44 : 56) * scale, bottom: height - (compact ? 56 : 77) * scale };
}

test('the play view keeps every cup between the interface bands', async ({ page }) => {
  const { width, height } = page.viewportSize()!;
  await openEnglish(page);
  await startComputerGame(page, 'Quick game');
  const positions = await holePositions(page);
  expect(positions).toHaveLength(12);
  const { top, bottom } = bands(height);
  for (const [x, y] of positions) {
    expect(x).toBeGreaterThan(width * 0.095);
    expect(x).toBeLessThan(width * 0.905);
    expect(y).toBeGreaterThan(top);
    expect(y).toBeLessThan(bottom);
  }
});

test('count discs sit between the interface bands, with screenshots of home, play and the result', async ({ page }, info) => {
  expect(SIZES).toContain(info.project.name);
  const { height } = page.viewportSize()!;
  await openEnglish(page);
  await page.waitForTimeout(1200); // the home camera settles
  await page.screenshot({ path: `test-results/screens/${info.project.name}-home.png` });
  await startComputerGame(page, 'Quick game');
  await waitForTurn(page);
  await page.waitForTimeout(1500); // the camera eases into the play view and the discs return
  const boxes = await page.locator('.discs .cnt').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
  const { top, bottom } = bands(height);
  expect(boxes).toHaveLength(14);
  for (const b of boxes) {
    expect(b.top).toBeGreaterThanOrEqual(top * 0.82 - 1);
    expect(b.bottom).toBeLessThanOrEqual(bottom + 1);
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.screenshot({ path: `test-results/screens/${info.project.name}-play.png` });
  await playToResult(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/screens/${info.project.name}-result.png` });
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
