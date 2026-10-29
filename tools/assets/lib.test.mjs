import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { heightToNormal, makeSeamless, roughnessFromHeight } from './lib.mjs';

/** A 64 x 64 horizontal gradient: its left and right edges differ by 255. */
async function gradient() {
  const data = Buffer.alloc(64 * 64 * 3);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) data.fill(Math.round((x / 63) * 255), (y * 64 + x) * 3, (y * 64 + x) * 3 + 3);
  return sharp(data, { raw: { width: 64, height: 64, channels: 3 } }).png().toBuffer();
}

test('seamless output wraps left to right', async () => {
  const out = await makeSeamless(sharp(await gradient()));
  const { data, info } = await out.raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 64);
  for (let y = 0; y < info.height; y++) {
    const left = data[y * info.width * info.channels];
    const right = data[(y * info.width + info.width - 1) * info.channels];
    assert.ok(Math.abs(left - right) < 24, `row ${y}: ${left} vs ${right}`);
  }
});

test('a flat height gives a flat normal', () => {
  const n = heightToNormal({ data: Buffer.alloc(16 * 16, 128), width: 16, height: 16 });
  assert.deepEqual([n[0], n[1], n[2]], [128, 128, 255]);
  assert.equal(n.length, 16 * 16 * 3);
});

test('a slope tilts the normal towards the lower side', () => {
  const data = Buffer.alloc(16 * 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) data[y * 16 + x] = x * 16;
  const n = heightToNormal({ data, width: 16, height: 16 });
  const i = (8 * 16 + 8) * 3;
  assert.ok(n[i] < 128, 'x component points towards -x (the lower side)');
  assert.ok(n[i + 2] > 128);
});

test('roughness follows height within its range', () => {
  const r = roughnessFromHeight({ data: Buffer.from([0, 255]), width: 2, height: 1 }, { base: 0.4, range: 0.3 });
  assert.equal(r[0], Math.round(0.4 * 255));
  assert.equal(r[1], Math.round(0.7 * 255));
});
