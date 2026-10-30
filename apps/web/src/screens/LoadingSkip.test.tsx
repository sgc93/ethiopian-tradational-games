import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { setupI18n } from '../i18n';

vi.mock('../scene/useSceneReadiness', () => ({ useSceneReadiness: () => ({ progress: 1, geometryReady: true, fontsReady: true }) }));
vi.mock('../urlOptions', () => ({ urlOptions: { speed: 'skip' } }));

const { Loading } = await import('./Loading');

setupI18n('en');
afterEach(cleanup);

test('the test-only skip speed takes the flare to almost nothing, so the suite does not pay 2.4 s per visit', () => {
  vi.useFakeTimers();
  try {
    localStorage.clear(); // a first visit, which would otherwise flare for 2.4 s
    const onDone = vi.fn();
    render(<Loading onDone={onDone} />);
    act(() => vi.advanceTimersByTime(150));
    expect(onDone).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
