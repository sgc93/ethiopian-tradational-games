import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, test } from 'vitest';
import { setupI18n } from '../i18n';
import { TurnPhone } from './TurnPhone';

beforeAll(() => setupI18n('en'));
afterEach(cleanup);

test('the turn-your-phone screen is a status with the line in both languages', () => {
  render(<TurnPhone />);
  const status = screen.getByRole('status');
  expect(status.textContent).toMatch(/turn your phone/i);
  expect(status.textContent).toContain('ስልክዎን ያዙሩ');
  expect(status.querySelector('[lang="am"]')).not.toBeNull();
  expect(status.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2); // the emblem and the phone
});
