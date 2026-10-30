import { initialOwners, newMatch, type MatchState, type Player } from '@etg/gebeta-rules';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import type { Session } from '../game/session';
import { setupI18n } from '../i18n';
import { AboutScreen } from '../screens/AboutScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { useApp } from '../state/store';
import { defaultSettings } from '../state/settings';
import { GameMenu } from './GameMenu';
import { HoleButtons } from './HoleButtons';
import { Hud } from './Hud';
import { RoundSummary } from './RoundSummary';

beforeAll(() => {
  setupI18n('en');
});
afterEach(cleanup);

const session = (patch: Partial<Session> = {}, match: Partial<MatchState> = {}): Session => ({
  id: 1,
  mode: { kind: 'computer', level: 'easy' },
  match: { ...newMatch('match', 0), ...match },
  humanSeat: 0,
  phase: 'awaiting-move',
  turnEvents: [],
  turnId: 0,
  paused: false,
  ...patch,
});

const sevenFive: Player[] = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];

test('HUD shows the round out of 5 and extra rounds', () => {
  const { rerender } = render(<Hud session={session({}, { roundNumber: 2 })} />);
  expect(screen.getByText('Round 2 of 5')).toBeTruthy();
  rerender(<Hud session={session({}, { roundNumber: 6 })} />);
  expect(screen.getByText('Extra round')).toBeTruthy();
});

test('HUD shows no round count in a quick game', () => {
  render(<Hud session={session({}, { format: 'quick' })} />);
  expect(screen.queryByText(/Round \d of 5/)).toBeNull();
});

test('HUD shows homes from ownership', () => {
  const m = newMatch('match', 0);
  render(<Hud session={session({}, { round: { ...m.round, owners: sevenFive } })} />);
  expect(screen.getByTestId('homes-0').textContent).toBe('7');
  expect(screen.getByTestId('homes-1').textContent).toBe('5');
});

test('HUD says whose turn it is', () => {
  render(<Hud session={session({ phase: 'thinking' }, { round: { ...newMatch('match', 1).round } })} />);
  expect(screen.getByText('The computer is thinking…')).toBeTruthy();
});

test("HUD credits a move to the player who made it while it animates", () => {
  const s = session({
    phase: 'animating',
    turnEvents: [{ type: 'turn-start', player: 0, hole: 0 }],
  }, { round: { ...newMatch('match', 1).round } });
  render(<Hud session={s} />);
  expect(screen.getByText('Your turn')).toBeTruthy();
});

test('round summary shows totals and next homes', () => {
  const m = newMatch('match', 0);
  const s = session(
    { phase: 'round-summary' },
    { roundNumber: 2, history: [{ totals: [28, 20], winner: 0, starter: 0 }], round: { ...m.round, owners: sevenFive } },
  );
  render(<RoundSummary session={s} onNext={() => {}} />);
  expect(screen.getByTestId('summary-stones-0').textContent).toContain('28');
  expect(screen.getByTestId('summary-stones-1').textContent).toContain('20');
  expect(screen.getByTestId('summary-homes-0').textContent).toContain('7');
  expect(screen.getByTestId('summary-homes-1').textContent).toContain('5');
});

test('result shows a quick-game draw', () => {
  const s = session(
    { phase: 'finished' },
    { format: 'quick', history: [{ totals: [24, 24], winner: null, starter: 0 }], result: { winner: null, reason: 'quick', rounds: 1 } },
  );
  render(<ResultScreen session={s} onPlayAgain={() => {}} onHome={() => {}} />);
  expect(screen.getByText("It's a draw")).toBeTruthy();
  expect(screen.getByText('24 – 24')).toBeTruthy();
});

test('result names the winner of a full match and the rounds played', () => {
  const s = session(
    { phase: 'finished' },
    {
      roundNumber: 5,
      history: [{ totals: [20, 28], winner: 1, starter: 0 }],
      result: { winner: 1, reason: 'round-limit', rounds: 5 },
    },
  );
  render(<ResultScreen session={s} onPlayAgain={() => {}} onHome={() => {}} />);
  expect(screen.getByText('The computer won')).toBeTruthy();
  expect(screen.getByText('5 rounds played')).toBeTruthy();
});

test('hole buttons are enabled only for playable holes', () => {
  const m = newMatch('quick', 0);
  const board = [0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 0, 2];
  const s = session({}, { round: { ...m.round, board, captured: [20, 20], owners: initialOwners() } });
  const onPlay = vi.fn();
  const { rerender } = render(<HoleButtons session={s} onPlay={onPlay} />);
  const enabled = screen
    .getAllByRole('button')
    .filter((b) => !(b as HTMLButtonElement).disabled)
    .map((b) => b.getAttribute('data-testid'));
  expect(enabled).toEqual(['hole-1', 'hole-5']);
  fireEvent.click(screen.getByTestId('hole-5'));
  expect(onPlay).toHaveBeenCalledWith(5);
  expect(screen.getByTestId('hole-8').getAttribute('aria-label')).toContain('3 stones');

  rerender(<HoleButtons session={{ ...s, phase: 'animating' }} onPlay={onPlay} />);
  expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
});

test('home shows the title block, the menu stack with one primary button and the footer', () => {
  render(<HomeScreen />);
  expect(document.querySelectorAll('.btn-primary')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Play against the computer' }).className).toContain('btn-primary');
  expect(screen.getByRole('heading', { name: 'ገበጣ' })).toBeTruthy();
  expect(screen.getByText('GEBETA')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Play with a friend' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Learn to play' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'About Gebeta · ገበጣ' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'አማርኛ' }).getAttribute('lang')).toBe('am');
  expect(screen.getByRole('button', { name: 'English' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Sound on' }).className).toContain('medal');
});

test('the level panel replaces the stack in place and its back medallion returns', () => {
  render(<HomeScreen />);
  fireEvent.click(screen.getByRole('button', { name: 'Play against the computer' }));
  expect(screen.getByRole('button', { name: 'Easy' }).className).toContain('btn-primary');
  expect(screen.getByRole('button', { name: 'Medium' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Hard' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Play with a friend' })).toBeNull();
  expect(document.querySelector('.panel')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /back/i }));
  expect(screen.getByRole('button', { name: 'Play against the computer' })).toBeTruthy();
  expect(document.querySelector('.panel')).toBeNull();
});

test('the game type panel offers two choices with their hints', () => {
  render(<HomeScreen />);
  fireEvent.click(screen.getByRole('button', { name: 'Play with a friend' }));
  const quick = screen.getByRole('button', { name: /Quick game/ });
  expect(quick.className).toContain('btn-choice');
  expect(quick.className).toContain('btn-primary');
  expect(quick.textContent).toContain('One round. Whoever takes more stones wins.');
  expect(screen.getByRole('button', { name: /Full match/ }).className).toContain('btn-choice');
});

test('about is a reading panel with a close medallion that returns home', () => {
  useApp.setState({ screen: 'about' });
  render(<AboutScreen />);
  expect(document.querySelector('.panel')).toBeTruthy();
  expect(screen.getByRole('heading', { name: /About Gebeta/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(useApp.getState().screen).toBe('home');
});

test('opening the menu pauses the session and closing it resumes', () => {
  const onPause = vi.fn();
  render(
    <GameMenu
      session={session()}
      settings={defaultSettings({ languages: ['en'], reducedMotion: false })}
      onPause={onPause}
      onSettings={() => {}}
      onRestart={() => {}}
      onQuit={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  expect(onPause).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onPause).toHaveBeenLastCalledWith(false);
});
