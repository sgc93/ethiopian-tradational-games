import { DEFAULT_RULES } from '@etg/gebeta-rules';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { setupI18n } from '../i18n';
import { useApp } from '../state/store';
import { RulesScreen } from './RulesScreen';

beforeAll(() => {
  setupI18n('en');
});
beforeEach(() => useApp.getState().updateSettings({ rules: DEFAULT_RULES }));
afterEach(cleanup);

test('every rule is a row of choices with the usual one chosen', () => {
  render(<RulesScreen />);
  expect(screen.getByRole('heading', { name: 'Rules of play' })).toBeTruthy();
  for (const usual of ['Counter-clockwise', 'The other takes the rest', 'Its owner', 'The winner']) {
    expect(screen.getByRole('button', { name: usual }).getAttribute('aria-pressed')).toBe('true');
  }
  for (const other of ['Clockwise', 'Misses the turn', 'Misses it while over four remain', 'The sower', 'The loser']) {
    expect(screen.getByRole('button', { name: other }).getAttribute('aria-pressed')).toBe('false');
  }
  // Nothing to put back while the rules are the usual ones.
  expect((screen.getByRole('button', { name: 'The usual rules' }) as HTMLButtonElement).disabled).toBe(true);
});

test('choosing a rule keeps it with the settings, one rule at a time', () => {
  render(<RulesScreen />);
  fireEvent.click(screen.getByRole('button', { name: 'Clockwise' }));
  fireEvent.click(screen.getByRole('button', { name: 'Misses it while over four remain' }));
  expect(useApp.getState().settings.rules).toEqual({ ...DEFAULT_RULES, direction: 'clockwise', stranded: 'pass-above-four' });
  expect(screen.getByRole('button', { name: 'Clockwise' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Counter-clockwise' }).getAttribute('aria-pressed')).toBe('false');
});

test('the usual rules can be put back in one press, and Done goes home', () => {
  useApp.getState().updateSettings({ rules: { ...DEFAULT_RULES, passingFour: 'sower', nextStarter: 'loser' } });
  useApp.getState().setScreen('rules');
  render(<RulesScreen />);
  fireEvent.click(screen.getByRole('button', { name: 'The usual rules' }));
  expect(useApp.getState().settings.rules).toEqual(DEFAULT_RULES);
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(useApp.getState().screen).toBe('home');
});
