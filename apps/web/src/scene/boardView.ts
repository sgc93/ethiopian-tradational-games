import { create } from 'zustand';

/**
 * What the board currently shows, for the DOM layers drawn over the canvas: fourteen counts, the
 * twelve cups in sowing order then the two stores (A, B), as the stones land.
 */
export const useBoardView = create<{ counts: number[] }>(() => ({ counts: [...Array<number>(12).fill(4), 0, 0] }));
