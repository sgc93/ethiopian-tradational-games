import { beforeEach, expect, test } from 'vitest';
import { useFeedback } from './feedbackStore';

beforeEach(() => useFeedback.setState({ events: [], hover: null, press: null }));

test('feedback store prunes events older than 3 s', () => {
  const s = useFeedback.getState();
  s.push({ kind: 'landed', hole: 3, at: 0 });
  s.push({ kind: 'landed', hole: 4, at: 5 });
  s.prune(5);
  expect(useFeedback.getState().events).toHaveLength(1);
  expect(useFeedback.getState().events[0]).toMatchObject({ hole: 4 });
});

test('pushing keeps the order and prune at 3 s keeps the boundary event', () => {
  const s = useFeedback.getState();
  s.push({ kind: 'captured', hole: 1, by: 0, count: 4, at: 1 });
  s.push({ kind: 'turn', player: 1, at: 2 });
  s.prune(4);
  expect(useFeedback.getState().events.map((e) => e.kind)).toEqual(['captured', 'turn']);
});

test('hover and press are the latest hole or null, not events', () => {
  const s = useFeedback.getState();
  s.setHover(5);
  s.setPress(5);
  expect(useFeedback.getState().hover).toBe(5);
  expect(useFeedback.getState().press).toBe(5);
  s.setPress(null);
  expect(useFeedback.getState().press).toBeNull();
  expect(useFeedback.getState().events).toHaveLength(0);
});
