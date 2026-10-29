import { expect, test } from 'vitest';
import { GRADE_HIGHLIGHT, GRADE_SHADOW, GradeEffect } from './gradeEffect';

test('the grade effect compiles its fragment with both constants', () => {
  const e = new GradeEffect();
  expect(e.getFragmentShader()).toContain('-0.02');
  expect(e.getFragmentShader()).toContain('1.06');
  expect(e.uniforms.get('strength')!.value).toBe(1);
  expect(GRADE_SHADOW).toEqual([-0.02, 0.01, 0.03]);
  expect(GRADE_HIGHLIGHT).toEqual([1.06, 1.0, 0.92]);
});

test('strength can be turned down', () => {
  const e = new GradeEffect(0.5);
  expect(e.uniforms.get('strength')!.value).toBe(0.5);
});
