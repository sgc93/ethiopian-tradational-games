import { BlendFunction, Effect } from 'postprocessing';
import { Uniform } from 'three';

/** Added to the shadows, weighted by darkness: a cool teal lift. */
export const GRADE_SHADOW: [number, number, number] = [-0.02, 0.01, 0.03];
/** Multiplied into the highlights, weighted by brightness: an amber push. */
export const GRADE_HIGHLIGHT: [number, number, number] = [1.06, 1.0, 0.92];

const fragmentShader = /* glsl */ `
  uniform float strength;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    vec3 shadows = c + vec3(${GRADE_SHADOW.join(', ')}) * (1.0 - luma);
    vec3 highlights = c * vec3(${GRADE_HIGHLIGHT.join(', ')});
    vec3 graded = mix(shadows, highlights, luma);
    outputColor = vec4(mix(c, graded, strength), inputColor.a);
  }
`;

/** The colour grade: teal-tinted shadows and amber highlights. */
export class GradeEffect extends Effect {
  constructor(strength = 1) {
    super('GradeEffect', fragmentShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([['strength', new Uniform(strength)]]),
    });
  }
}
