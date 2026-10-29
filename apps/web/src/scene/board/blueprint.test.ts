import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { BLUEPRINT, MM_PER_UNIT } from './blueprint';

test('the app copy of the blueprint equals the docs copy', () => {
  const docs = JSON.parse(
    readFileSync(resolve(__dirname, '../../../../../docs/design/board/blueprint/board-dimensions.json'), 'utf8'),
  );
  expect(BLUEPRINT).toEqual(docs);
});

test('key dimensions', () => {
  expect(MM_PER_UNIT).toBe(50);
  expect(BLUEPRINT.body.halfLength).toBe(6.05);
  expect(BLUEPRINT.cups.diameter).toBe(0.88);
  expect(BLUEPRINT.heads.measures.hornSpread).toBe(2.27);
  expect(BLUEPRINT.heads.horn.stations).toHaveLength(41);
  expect(BLUEPRINT.heads.horn.ridges.list).toHaveLength(24);
});
