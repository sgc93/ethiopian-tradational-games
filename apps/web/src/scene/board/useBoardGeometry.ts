import { useEffect, useState } from 'react';
import type * as THREE from 'three';
import { BLUEPRINT } from './blueprint';
import type { Detail } from './bodyGeometry';
import { buildBoardSet, type BoardSetData } from './boardSet';
import { toBufferGeometry } from './headGeometry';

export interface BoardGeometry {
  body: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  hornL: THREE.BufferGeometry;
  hornR: THREE.BufferGeometry;
}

const WORKER_TIMEOUT_MS = 4000;
const cache = new Map<Detail, Promise<BoardGeometry>>();

function unpack(data: BoardSetData): BoardGeometry {
  const body = toBufferGeometry(data.parts.body);
  body.clearGroups();
  for (const g of data.bodyGroups) body.addGroup(g.start, g.count, g.materialIndex);
  return {
    body,
    head: toBufferGeometry(data.parts.head),
    hornL: toBufferGeometry(data.parts.hornL),
    hornR: toBufferGeometry(data.parts.hornR),
  };
}

function buildInWorker(detail: Detail): Promise<BoardSetData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./board.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('board worker timed out'));
    }, WORKER_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<BoardSetData>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      reject(e.error ?? new Error(e.message));
    };
    worker.postMessage({ detail });
  });
}

/** The board set for a detail level, built once per session: in a worker when there is one, else here. */
export function loadBoardGeometry(detail: Detail): Promise<BoardGeometry> {
  let pending = cache.get(detail);
  if (!pending) {
    const inWorker = typeof Worker === 'undefined' ? Promise.reject(new Error('no Worker')) : buildInWorker(detail);
    pending = inWorker.catch(() => buildBoardSet(BLUEPRINT, detail)).then(unpack);
    cache.set(detail, pending);
  }
  return pending;
}

/** The board geometry, or null until it is built. */
export function useBoardGeometry(detail: Detail): BoardGeometry | null {
  const [geometry, setGeometry] = useState<BoardGeometry | null>(null);
  useEffect(() => {
    let live = true;
    setGeometry(null);
    loadBoardGeometry(detail).then((g) => {
      if (live) setGeometry(g);
    });
    return () => {
      live = false;
    };
  }, [detail]);
  return geometry;
}
