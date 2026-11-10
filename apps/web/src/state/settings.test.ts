import { expect, test } from 'vitest';
import { defaultSettings } from './settings';

test('defaults follow the device', () => {
  expect(defaultSettings({ languages: ['am-ET', 'en'], reducedMotion: false }).language).toBe('am');
  expect(defaultSettings({ languages: ['fr-FR'], reducedMotion: true })).toEqual({
    language: 'en',
    sound: true,
    speed: 'fast',
    showCounts: true,
    fixedCamera: false,
    rules: { direction: 'counter-clockwise', stranded: 'sweep', passingFour: 'owner', nextStarter: 'winner' },
  });
  expect(defaultSettings({ languages: ['en-US'], reducedMotion: false }).speed).toBe('normal');
});
