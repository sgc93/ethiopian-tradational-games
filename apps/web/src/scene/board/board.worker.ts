/// <reference lib="webworker" />
import { BLUEPRINT } from './blueprint';
import { buildBoardSet, type BoardSetData, type BoardSetRequest } from './boardSet';

self.onmessage = (e: MessageEvent<BoardSetRequest>) => {
  const data: BoardSetData = buildBoardSet(BLUEPRINT, e.data.detail);
  const buffers: ArrayBuffer[] = [];
  for (const part of Object.values(data.parts)) {
    for (const arr of [part.position, part.normal, part.uv, part.index]) buffers.push(arr.buffer as ArrayBuffer);
  }
  self.postMessage(data, buffers);
};
