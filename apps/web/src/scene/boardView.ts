import { create } from 'zustand';

/** What the board currently shows, for the DOM layers drawn over the canvas. */
export const useBoardView = create<{ counts: number[] }>(() => ({ counts: Array(12).fill(4) }));
