/** The interface's design tokens, as values for the 3D feedback and for tests of the stylesheet. */
export const TOKENS = {
  ink950: '#120907',
  ink900: '#1c0e0a',
  ink800: '#27130d',
  ink700: '#351a11',
  ox700: '#43170f',
  ox600: '#5a2015',
  ox500: '#742b1c',
  gold200: '#f0dcab',
  gold300: '#e2c486',
  gold400: '#c9a15a',
  gold500: '#a8823f',
  gold700: '#6f5527',
  ember300: '#ffc27a',
  ember400: '#ff9a3c',
  ember600: '#d9661f',
  moon300: '#b9cfee',
  moon500: '#7f9cc4',
  text100: '#efe6d2',
  text300: '#c9bba0',
  text500: '#93856c',
  paperInk: '#3b2414',
  panel: '#1f0f0b',
  line: 'rgba(201, 161, 90, 0.62)',
  lineSoft: 'rgba(201, 161, 90, 0.2)',
} as const;

export type TokenName = keyof typeof TOKENS;
