import { expect, test } from 'vitest';
import { useScene } from './sceneStore';

test('scene store defaults', () => {
  const s = useScene.getState();
  expect(s.mode).toBe('home');
  expect(s.bands).toBeNull();
  expect(s.seat).toBe(0);
  expect(s.tier).toBe('mid');
  expect(s.session).toBeNull();
});

test('setMode changes the mode', () => {
  useScene.getState().setMode('play');
  expect(useScene.getState().mode).toBe('play');
  useScene.getState().setMode('home');
});
