import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { BLUEPRINT } from './blueprint';
import type { Detail } from './bodyGeometry';
import { buildBoardSet, type BoardSetData } from './boardSet';
import { toBufferGeometry, type GeometryData } from './headGeometry';
import { loadHeadSet } from './headMesh';
import type { HeadSet } from './sculpt/pack';

export interface BoardGeometry {
  body: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  hornL: THREE.BufferGeometry;
  hornR: THREE.BufferGeometry;
}

const WORKER_TIMEOUT_MS = 4000;
const cache = new Map<Detail, Promise<BoardGeometry>>();

function unpack(data: BoardSetData, heads: HeadSet<GeometryData> | null): BoardGeometry {
  const body = toBufferGeometry(data.parts.body);
  body.clearGroups();
  for (const g of data.bodyGroups) body.addGroup(g.start, g.count, g.materialIndex);
  const part = (d: GeometryData | undefined) => (d ? toBufferGeometry(d) : new THREE.BufferGeometry());
  return { body, head: part(heads?.head), hornL: part(heads?.hornL), hornR: part(heads?.hornR) };
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

/**
 * The board set for a detail level, built once per session: the body in a worker when there is
 * one (else here), the prebuilt heads fetched alongside. A head set that cannot be fetched leaves
 * the board without heads rather than without a board.
 */
export function loadBoardGeometry(detail: Detail): Promise<BoardGeometry> {
  let pending = cache.get(detail);
  if (!pending) {
    const inWorker = typeof Worker === 'undefined' ? Promise.reject(new Error('no Worker')) : buildInWorker(detail);
    const body = inWorker.catch(() => buildBoardSet(BLUEPRINT, detail));
    const heads = loadHeadSet(detail).catch((e: unknown) => {
      console.warn('the board’s heads could not be loaded', e);
      return null;
    });
    pending = Promise.all([body, heads]).then(([b, h]) => unpack(b, h));
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
