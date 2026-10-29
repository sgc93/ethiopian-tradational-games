/** The interface's design tokens (spec §9), as values for the 3D feedback and for tests of the stylesheet. */
export const TOKENS = {
  ink950: '#0a0806',
  ink900: '#120e0a',
  ink800: '#1b1510',
  ink700: '#261d15',
  gold200: '#f1dcaa',
  gold300: '#e6c88e',
  gold400: '#d6ae6a',
  gold500: '#c09553',
  gold700: '#7d5f33',
  ember300: '#ffc27a',
  ember400: '#ff9a3c',
  ember600: '#d9661f',
  moon300: '#b9cfee',
  moon500: '#7f9cc4',
  text100: '#f4ead8',
  text300: '#cdbfa3',
  text500: '#8f826b',
  panel: 'rgba(13, 10, 7, 0.84)',
  line: 'rgba(214, 174, 106, 0.55)',
  lineSoft: 'rgba(214, 174, 106, 0.18)',
} as const;

export type TokenName = keyof typeof TOKENS;
