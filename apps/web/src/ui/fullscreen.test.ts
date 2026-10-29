import { expect, test, vi } from 'vitest';
import { requestLandscapeFullscreen } from './fullscreen';

test('full screen refusal resolves false', async () => {
  const doc = { documentElement: { requestFullscreen: () => Promise.reject(new Error('no')) } } as never;
  await expect(requestLandscapeFullscreen(doc, { orientation: { lock: async () => {} } } as never)).resolves.toBe(false);
  await expect(requestLandscapeFullscreen({ documentElement: {} } as never, {} as never)).resolves.toBe(false);
});

test('full screen then a landscape lock resolves true, and a refused lock false', async () => {
  const requestFullscreen = vi.fn(() => Promise.resolve());
  const lock = vi.fn(async (_: string) => {});
  const doc = { documentElement: { requestFullscreen } } as never;
  await expect(requestLandscapeFullscreen(doc, { orientation: { lock } } as never)).resolves.toBe(true);
  expect(requestFullscreen).toHaveBeenCalledOnce();
  expect(lock).toHaveBeenCalledWith('landscape');
  await expect(
    requestLandscapeFullscreen(doc, { orientation: { lock: () => Promise.reject(new Error('no')) } } as never),
  ).resolves.toBe(false);
  // A screen without orientation locking still counts as full screen.
  await expect(requestLandscapeFullscreen(doc, {} as never)).resolves.toBe(true);
});
