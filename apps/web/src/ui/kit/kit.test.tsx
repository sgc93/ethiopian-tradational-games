import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Button } from './Button';
import { Medallion } from './Medallion';
import { Panel } from './Panel';

test('kit renders its roles', () => {
  render(
    <Panel title="Pause" labelledBy="t" width={380}>
      <Button kind="primary">Continue</Button>
      <Button kind="choice" hint="Four rounds, first to three homes">
        Full match
      </Button>
      <Medallion icon="menu" label="Menu" />
    </Panel>,
  );
  expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Full match/ }).textContent).toContain('Four rounds');
  expect(document.getElementById('t')?.textContent).toBe('Pause');
  expect(document.querySelectorAll('.k')).toHaveLength(4); // the four corner diamonds
});

test('the primary button is marked so there is one per screen', () => {
  render(<Button kind="primary">Play</Button>);
  expect(screen.getByRole('button', { name: 'Play' }).className).toContain('btn-primary');
});

test('a medallion is a labelled button with an icon', () => {
  render(<Medallion icon="sound" label="Sound on" pressed />);
  const b = screen.getByRole('button', { name: 'Sound on' });
  expect(b.getAttribute('aria-pressed')).toBe('true');
  expect(b.querySelector('svg')).not.toBeNull();
});
