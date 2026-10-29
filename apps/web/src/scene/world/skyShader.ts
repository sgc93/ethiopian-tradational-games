export const skyVertexShader = /* glsl */ `
  varying vec3 vDir;
  varying vec2 vUv;
  void main() {
    vDir = normalize(position);
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * A deep blue-black night: a vertical gradient, hashed twinkling stars, a moon with a soft halo,
 * two cloud layers drifting past it, and the mountain ridge strip along the horizon.
 */
export const skyFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMoonDir;
  uniform sampler2D uNoise;
  uniform sampler2D uRidge;
  varying vec3 vDir;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    float up = clamp(vDir.y, 0.0, 1.0);
    vec3 sky = mix(vec3(0.043, 0.071, 0.149), vec3(0.02, 0.027, 0.055), pow(up, 0.6));
    // Stars: a hashed grid, sparse, twinkling.
    vec2 cell = floor(vDir.xz / max(0.02, abs(vDir.y) + 0.05) * 60.0 + vDir.y * 300.0);
    float star = step(0.985, hash(cell));
    float tw = 0.6 + 0.4 * sin(uTime * (1.0 + hash(cell + 7.0) * 3.0) + hash(cell + 3.0) * 6.28);
    sky += star * tw * up * vec3(0.8, 0.85, 1.0);
    // The moon and its halo.
    float m = dot(vDir, uMoonDir);
    float disc = smoothstep(0.9990, 0.9994, m);
    float halo = pow(max(0.0, m), 180.0) * 0.5;
    sky += vec3(0.72, 0.81, 0.93) * disc + vec3(0.35, 0.42, 0.6) * halo;
    // Two thin cloud layers drifting past the moon.
    vec2 cuv = vec2(atan(vDir.z, vDir.x) / 6.2832, vDir.y);
    float c1 = texture2D(uNoise, cuv * vec2(3.0, 2.0) + vec2(uTime * 0.004, 0.0)).g;
    float c2 = texture2D(uNoise, cuv * vec2(5.0, 3.0) + vec2(-uTime * 0.003, 0.1)).b;
    float cloud = smoothstep(0.55, 0.8, 0.55 * c1 + 0.45 * c2) * smoothstep(0.1, 0.5, up) * 0.35;
    sky = mix(sky, vec3(0.12, 0.14, 0.2) + vec3(0.3, 0.33, 0.4) * halo, cloud);
    // The ridge along the horizon, wrapped round once.
    float band = (vDir.y + 0.02) / 0.14; // 0 at the horizon, 1 at the ridge's top
    if (band > 0.0 && band < 1.0) {
      vec4 r = texture2D(uRidge, vec2(cuv.x + 0.5, 1.0 - band));
      sky = mix(sky, r.rgb, r.a);
    }
    if (vDir.y < -0.02) sky = vec3(0.04, 0.03, 0.023);
    gl_FragColor = vec4(sky, 1.0);
  }
`;
