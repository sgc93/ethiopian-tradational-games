import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { Mixed } from './Geez';

afterEach(cleanup);

test('wraps each Ge’ez run in a lang="am" span and leaves the Latin bare', () => {
  const { container } = render(<Mixed text="About Gebeta · ገበጣ (bet)" />);
  const spans = container.querySelectorAll('span[lang="am"]');
  expect(spans).toHaveLength(1);
  expect(spans[0]!.textContent).toBe('ገበጣ');
  expect(container.textContent).toBe('About Gebeta · ገበጣ (bet)');
});

test('all-Latin text gets no span', () => {
  const { container } = render(<Mixed text="Quick game" />);
  expect(container.querySelector('span')).toBeNull();
  expect(container.textContent).toBe('Quick game');
});
