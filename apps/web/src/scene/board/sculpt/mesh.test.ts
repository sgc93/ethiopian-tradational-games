import { expect, test } from 'vitest';
import { meshSdf } from './mesh';
import type { V3 } from './sdf';

test('a sphere meshes to a closed surface at its radius, trimmed to the budget', async () => {
  const r = 0.8;
  const sphere = (p: V3) => Math.hypot(p[0] - 0.2, p[1] - 1.0, p[2] + 0.1) - r;
  const mesh = await meshSdf(sphere, { min: [-1, -0.2, -1.3], max: [1.4, 2.2, 1.1] }, { resolution: 48, triangles: 1200 });
  const verts = mesh.position.length / 3;
  expect(mesh.index.length / 3).toBeLessThanOrEqual(1200);
  expect(mesh.index.length / 3).toBeGreaterThan(600);
  let worst = 0;
  for (let i = 0; i < verts; i++) {
    const d = Math.abs(Math.hypot(mesh.position[i * 3]! - 0.2, mesh.position[i * 3 + 1]! - 1.0, mesh.position[i * 3 + 2]! + 0.1) - r);
    worst = Math.max(worst, d);
  }
  expect(worst).toBeLessThan(0.08); // within a cell or so of the true surface
  // Closed: every edge is shared by two triangles.
  const edges = new Map<string, number>();
  for (let i = 0; i < mesh.index.length; i += 3) {
    const t = [mesh.index[i]!, mesh.index[i + 1]!, mesh.index[i + 2]!];
    for (let k = 0; k < 3; k++) {
      const a = t[k]!;
      const b = t[(k + 1) % 3]!;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  const open = [...edges.values()].filter((n) => n !== 2).length;
  expect(open).toBe(0);
  for (let i = 0; i < mesh.uv.length; i++) {
    expect(mesh.uv[i]).toBeGreaterThanOrEqual(0);
    expect(mesh.uv[i]).toBeLessThanOrEqual(1);
  }
});
