/** The interface's line icons on a 24 px grid, drawn by hand (spec §9 "Icons"); 1.5 px strokes. */
export const ICONS = {
  menu: 'M5 7h14M5 12h14M5 17h14',
  sound: 'M4 10v4h4l5 4V6L8 10H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  soundOff: 'M4 10v4h4l5 4V6L8 10H4zM16 9l5 6M21 9l-5 6',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  pebble: 'M5 14c0-4 4-7 8-7s6 3 6 6-3 5-7 5-7-1-7-4z',
  hut: 'M3 11L12 4l9 7M6 10v9h12v-9M10 19v-5h4v5',
  ibex: 'M9 21v-6l-3-3 2-3h3l2 2M11 9c-1-4 2-7 6-6 3 1 3 5 1 7M13 10c0-3 2-5 4-4',
  knot: 'M12 4l8 8-8 8-8-8zM8 8l8 8M16 8l-8 8',
  phone: 'M8 3h8v18H8zM11 18h2',
  rotate: 'M4 12a8 8 0 0 1 14-5M18 3v4h-4M20 12a8 8 0 0 1-14 5M6 21v-4h4',
} as const;

export type IconName = keyof typeof ICONS;
