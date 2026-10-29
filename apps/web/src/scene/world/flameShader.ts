export const flameVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Two layers of noise scrolling upwards, shaped by a tongue mask (narrow at the top, fading at the
 * sides) and coloured from pale yellow at the base through ember orange to a deep red tip.
 */
export const flameFragmentShader = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uFlicker;
  uniform vec3 uBase;
  uniform vec3 uMid;
  uniform vec3 uTip;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float n1 = texture2D(uNoise, vec2(uv.x * 1.2, uv.y * 0.8 - uTime * 0.9)).r;
    float n2 = texture2D(uNoise, vec2(uv.x * 2.1 + 0.3, uv.y * 1.3 - uTime * 1.6)).g;
    float n = 0.6 * n1 + 0.4 * n2;
    float x = (uv.x - 0.5) * 2.0;
    // The tongue: wide at the base, pinching towards the tip, and wavering with the noise.
    float width = (1.0 - uv.y * 0.85) * (0.75 + 0.35 * n);
    float side = 1.0 - smoothstep(width * 0.55, width, abs(x));
    float body = smoothstep(0.15, 0.6, n * (1.25 - uv.y)) * side;
    float base = smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.85, 1.0, uv.y));
    float a = body * base * uFlicker;
    vec3 colour = mix(uBase, uMid, smoothstep(0.0, 0.45, uv.y));
    colour = mix(colour, uTip, smoothstep(0.4, 1.0, uv.y));
    gl_FragColor = vec4(colour * (0.8 + 0.6 * a), a);
  }
`;
