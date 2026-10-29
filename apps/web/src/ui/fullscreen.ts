/**
 * Asks for full screen, then a landscape lock (spec §9 "Full screen"). Resolves `false` on any
 * refusal and never throws: iPhone Safari has no full screen, desktops may decline, and the game
 * carries on either way.
 */
export async function requestLandscapeFullscreen(doc: Document = document, screenApi: Screen = screen): Promise<boolean> {
  try {
    const root = doc.documentElement;
    if (typeof root?.requestFullscreen !== 'function') return false;
    await root.requestFullscreen();
    const orientation = screenApi.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
    if (typeof orientation?.lock === 'function') await orientation.lock('landscape');
    return true;
  } catch {
    return false;
  }
}

let asked = false;

/**
 * The first tap on a Play button asks Android browsers for full screen and a landscape lock.
 * Elsewhere it does nothing: iPhone Safari cannot go full screen and the compact layout covers it,
 * and desktops are not phones.
 */
export function onFirstPlayTap(): void {
  if (asked) return;
  asked = true;
  if (typeof navigator === 'undefined' || !/Android/.test(navigator.userAgent)) return;
  void requestLandscapeFullscreen();
}
