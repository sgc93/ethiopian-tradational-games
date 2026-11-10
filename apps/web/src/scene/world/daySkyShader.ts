export const daySkyVertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A highland morning: a blue gradient paling to haze at the horizon, the sun's glow, two layers
 * of drifting cloud, and three ridges of mountains one behind another, each paler with distance.
 * Everything is worked out from the view direction and one noise texture; nothing is downloaded.
 */
export const daySkyFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uHaze;
  uniform sampler2D uNoise;
  varying vec3 vDir;

  // The height of a ridgeline at a bearing (0 to 1 round the horizon). The noise tiles, and the
  // frequencies are whole numbers, so the ridge joins itself where the bearing wraps.
  float ridge(float bearing, float freq, float row) {
    float broad = texture2D(uNoise, vec2(bearing * freq, row)).g;
    float fine = texture2D(uNoise, vec2(bearing * freq * 3.0, row + 0.31)).b;
    return broad * 0.78 + fine * 0.22;
  }

  void main() {
    vec3 d = normalize(vDir);
    float up = d.y;
    float bearing = atan(d.z, d.x) / 6.2831853 + 0.5;

    vec3 zenith = vec3(0.17, 0.39, 0.73);
    vec3 middle = vec3(0.44, 0.66, 0.89);
    float h = clamp(up, 0.0, 1.0);
    vec3 sky = mix(uHaze, middle, smoothstep(0.0, 0.2, h));
    sky = mix(sky, zenith, smoothstep(0.15, 0.8, h));

    float s = max(0.0, dot(d, uSunDir));
    sky += vec3(1.0, 0.93, 0.8) * (pow(s, 400.0) * 2.5 + pow(s, 10.0) * 0.16);

    // Clouds on a flat ceiling, so they gather towards the horizon as real ones do.
    vec2 ceilingAt = d.xz / (up + 0.22);
    float c1 = texture2D(uNoise, ceilingAt * 0.09 + vec2(uTime * 0.0013, 0.0)).g;
    float c2 = texture2D(uNoise, ceilingAt * 0.27 + vec2(uTime * 0.0026, 0.17)).b;
    float cloud = smoothstep(0.5, 0.74, c1 * 0.66 + c2 * 0.34) * smoothstep(0.02, 0.2, up);
    vec3 cloudColour = mix(vec3(0.78, 0.83, 0.9), vec3(1.0, 0.99, 0.96), c2);
    sky = mix(sky, cloudColour, cloud * 0.9);

    // Three ridges, far to near. Each is a soft-edged silhouette, hazier the farther it is.
    float far = 0.03 + 0.062 * ridge(bearing, 3.0, 0.13);
    float mid = 0.012 + 0.052 * ridge(bearing, 5.0, 0.47);
    float near = -0.004 + 0.036 * ridge(bearing, 8.0, 0.79);
    float edge = 0.0012;
    sky = mix(sky, mix(vec3(0.6, 0.74, 0.86), uHaze, 0.35), 1.0 - smoothstep(far - edge, far + edge, up));
    sky = mix(sky, mix(vec3(0.38, 0.55, 0.7), uHaze, 0.22), 1.0 - smoothstep(mid - edge, mid + edge, up));
    sky = mix(sky, mix(vec3(0.3, 0.42, 0.42), uHaze, 0.16), 1.0 - smoothstep(near - edge, near + edge, up));

    // Below the horizon the ground's own haze takes over.
    sky = mix(sky, uHaze * 0.94, 1.0 - smoothstep(-0.012, -0.004, up));
    gl_FragColor = vec4(sky, 1.0);
  }
`;
