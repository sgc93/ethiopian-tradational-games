import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { setupI18n } from '../i18n';

const readiness = { progress: 0, geometryReady: false, fontsReady: false };
vi.mock('../scene/useSceneReadiness', () => ({ useSceneReadiness: () => ({ ...readiness }) }));

const { Loading } = await import('./Loading');

setupI18n('en');
afterEach(cleanup);

test('shows the emblem, the name, the gold line and the loading line', () => {
  Object.assign(readiness, { progress: 0.5, geometryReady: false, fontsReady: false });
  render(<Loading onDone={() => {}} />);
  const bar = screen.getByRole('progressbar');
  expect(bar.getAttribute('aria-valuenow')).toBe('35');
  expect(screen.getByText('GEBETA')).toBeTruthy();
  expect(screen.getByText(/setting out the board/i)).toBeTruthy();
  expect(document.querySelector('.loading .emblem')).toBeTruthy();
});

test('the gold line never runs backwards when a loader restarts its count', () => {
  Object.assign(readiness, { progress: 0.9, geometryReady: true, fontsReady: true });
  const { rerender } = render(<Loading onDone={() => {}} />);
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('93');
  Object.assign(readiness, { progress: 0, geometryReady: true, fontsReady: true });
  rerender(<Loading onDone={() => {}} />);
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('93');
});

test('starts the flare when everything is ready and finishes after its duration', () => {
  vi.useFakeTimers();
  try {
    Object.assign(readiness, { progress: 1, geometryReady: true, fontsReady: true });
    localStorage.clear();
    const onDone = vi.fn();
    render(<Loading onDone={onDone} />);
    expect(document.querySelector('.loading-exit')).toBeTruthy();
    expect(localStorage.getItem('gebeta.visited')).toBe('1');
    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2500));
    expect(onDone).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

test('a return visit flares for 0.8 s', () => {
  vi.useFakeTimers();
  try {
    Object.assign(readiness, { progress: 1, geometryReady: true, fontsReady: true });
    localStorage.setItem('gebeta.visited', '1');
    const onDone = vi.fn();
    render(<Loading onDone={onDone} />);
    act(() => vi.advanceTimersByTime(700));
    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onDone).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
