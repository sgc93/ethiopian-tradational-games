import { ibexPath } from './ibexPath';

/**
 * The interface's icons on a 24 px grid: solid shapes with their details cut out (even-odd), in
 * the manner of a stamped crest. The ibex is the blueprint's own head outline.
 */
export const ICONS = {
  menu: 'M4 5.6h16v2.2H4zM4 10.9h16v2.2H4zM4 16.2h16v2.2H4z',
  sound: 'M3 9.4h4.2L12.4 5v14l-5.2-4.4H3zM15.2 8.3a5.3 5.3 0 0 1 0 7.4l-1.3-1.3a3.5 3.5 0 0 0 0-4.8zM18 5.5a9.2 9.2 0 0 1 0 13l-1.3-1.3a7.4 7.4 0 0 0 0-10.4z',
  soundOff:
    'M3 9.4h4.2L12.4 5v14l-5.2-4.4H3zM14.9 9.6l1.3-1.3 2.3 2.4 2.3-2.4 1.3 1.3-2.3 2.4 2.3 2.4-1.3 1.3-2.3-2.4-2.3 2.4-1.3-1.3 2.3-2.4z',
  back: 'M15.4 4.2 17 5.8 10.8 12l6.2 6.2-1.6 1.6L7.6 12z',
  chevron: 'M8.6 4.2 7 5.8l6.2 6.2L7 18.2l1.6 1.6 7.8-7.8z',
  close: 'M6.5 5 12 10.5 17.5 5 19 6.5 13.5 12l5.5 5.5-1.5 1.5-5.5-5.5L6.5 19 5 17.5l5.5-5.5L5 6.5z',
  pebble: 'M4.6 14c0-4.2 4-7.4 8.2-7.4s6.6 3.1 6.6 6.4-3.4 5.4-7.6 5.4-7.2-1.2-7.2-4.4z',
  hut: 'M12 2.8 2.4 11h3.2v9.2h12.8V11h3.2zM10 20.2v-5.4h4v5.4z',
  ibex: ibexPath(20.5, 12, 12),
  knot: 'M12 2.6 21.4 12 12 21.4 2.6 12zM12 6 6 12l6 6 6-6zM12 9.3l2.7 2.7-2.7 2.7L9.3 12z',
  phone: 'M8.2 2.5h7.6a1.7 1.7 0 0 1 1.7 1.7v15.6a1.7 1.7 0 0 1-1.7 1.7H8.2a1.7 1.7 0 0 1-1.7-1.7V4.2a1.7 1.7 0 0 1 1.7-1.7zM8.4 5.2v11.6h7.2V5.2zM10.8 18.3h2.4v1.3h-2.4z',
  rotate: 'M12 4a8 8 0 0 1 6.9 4H16v2h6V4h-2v2.4A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8zM20 12a8 8 0 0 1-14.9 4H8v-2H2v6h2v-2.4A10 10 0 0 0 22 12z',
} as const satisfies Record<string, string>;

export type IconName = keyof typeof ICONS;
