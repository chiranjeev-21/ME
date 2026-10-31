/*
 * Orbital scene shader. A single full-screen pass:
 *  - analytic ray/sphere planet with NASA Blue Marble (day), Black Marble (city
 *    lights) and cloud textures, ocean sun glint, and a soft terminator;
 *  - single-scattering Rayleigh + Mie atmosphere with planet shadowing and a
 *    faint night-side airglow layer (exaggerated ~8x in thickness for legibility);
 *  - a procedural star field with colour temperature, sun disk and lens glare;
 *  - ACES filmic tone mapping, dithering and fine grain.
 * Units are planet radii.
 */
export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPosition;
out vec2 vNdc;
void main() {
  vNdc = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 vNdc;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uSun;
uniform float uTanHalfFov;
uniform float uExposure;
uniform float uSunVis;
uniform vec2 uSunScreen;
uniform vec2 uLensShift;
uniform float uCloudDrift;
uniform float uTextures;
uniform int uSteps;
uniform int uLightSteps;
uniform sampler2D uDay;
uniform sampler2D uData;
// Higher-resolution city lights for 40°E–120°E, 15°S–45°N (South Asia).
uniform sampler2D uRegion;
uniform float uRegionReady;

const float PI = 3.14159265359;
const float R_PLANET = 1.0;
const float R_ATMOS = 1.062;
const float H_R = 0.0100;
const float H_M = 0.0016;
const vec3 BETA_R = vec3(8.9, 20.7, 50.7);
const float BETA_M = 30.0;
const float G_MIE = 0.78;
const float SUN_I = 22.0;

vec2 sphere(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - r * r;
  float h = b * b - c;
  if (h < 0.0) return vec2(1e9, -1e9);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

// Optical depth (rayleigh, mie) from p toward the sun; huge when the planet blocks it.
vec2 lightDepth(vec3 p, vec3 L) {
  float exitT = sphere(p, L, R_ATMOS).y;
  float ds = exitT / float(uLightSteps);
  vec2 od = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    if (i >= uLightSteps) break;
    vec3 q = p + L * (ds * (float(i) + 0.5));
    float h = length(q) - R_PLANET;
    if (h < 0.0) return vec2(1e4);
    od += exp(-h / vec2(H_R, H_M)) * ds;
  }
  return od;
}

vec3 starLayer(vec3 rd, float cells, float density, float seed, float pixel) {
  vec3 p = rd * cells;
  vec3 id = floor(p);
  float present = hash13(id + seed);
  if (present > density) return vec3(0.0);
  vec3 offset = vec3(hash13(id + seed + 1.7), hash13(id + seed + 3.1), hash13(id + seed + 5.3));
  vec3 s = normalize(id + 0.18 + offset * 0.64);
  float ang = length(rd - s);
  float size = pixel * (0.75 + 0.6 * hash13(id + seed + 7.7));
  float core = exp(-(ang * ang) / (size * size));
  float magnitude = pow(hash13(id + seed + 9.1), 16.0) * 5.0 + 0.018;
  float temperature = hash13(id + seed + 11.3);
  vec3 tint = temperature < 0.5
    ? mix(vec3(1.0, 0.74, 0.52), vec3(1.0, 0.93, 0.84), temperature * 2.0)
    : mix(vec3(1.0, 0.95, 0.9), vec3(0.72, 0.82, 1.0), (temperature - 0.5) * 2.0);
  return tint * core * magnitude;
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Sub-texel structure for city lights, faded out once a pixel spans several texels.
float cityDetail(vec2 uv, vec2 dx, vec2 dy) {
  vec2 texels = vec2(2048.0, 1024.0);
  float footprint = max(length(dx * texels), length(dy * texels));
  vec2 p = uv * texels * 3.0;
  float n = valueNoise(p) * 0.62 + valueNoise(p * 2.31 + 17.0) * 0.38;
  n = smoothstep(0.32, 0.86, n);
  return mix(1.0, n * 2.1, smoothstep(1.6, 0.35, footprint));
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 lens = vNdc - uLensShift;
  vec3 rd = normalize(uForward + lens.x * uTanHalfFov * aspect * uRight + lens.y * uTanHalfFov * uUp);
  vec3 ro = uCamPos;
  float pixel = 2.0 * uTanHalfFov / uResolution.y;

  vec2 atm = sphere(ro, rd, R_ATMOS);
  vec2 pl = sphere(ro, rd, R_PLANET);
  bool hitPlanet = pl.x > 0.0 && pl.x < 1e8;

  // Surface coordinates are computed for every pixel so derivatives stay valid.
  float closest = max(-dot(ro, rd), 0.0);
  vec3 pSurf = ro + rd * (hitPlanet ? pl.x : closest);
  vec3 n = normalize(pSurf);
  float lon = atan(n.x, n.z);
  float lat = asin(clamp(n.y, -1.0, 1.0));
  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
  vec2 uvAlt = vec2(fract(uv.x + 0.5) - 0.5, uv.y);
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  vec2 dxA = dFdx(uvAlt), dyA = dFdy(uvAlt);
  if (dot(dxA, dxA) < dot(dx, dx)) dx = dxA;
  if (dot(dyA, dyA) < dot(dy, dy)) dy = dyA;

  vec3 color = vec3(0.0);
  vec3 transmittance = vec3(1.0);
  float mu = dot(rd, uSun);

  // Lens response: glare and a restrained anamorphic streak, gated by sun visibility.
  float m = max(mu, 0.0);
  vec3 glare = vec3(1.0, 0.8, 0.6) * (pow(m, 2600.0) * 5.0 + pow(m, 220.0) * 0.55 + pow(m, 24.0) * 0.045);
  vec2 sp = lens - uSunScreen;
  sp.x *= aspect;
  float streak = exp(-abs(sp.y) * 320.0) * exp(-abs(sp.x) * 1.9) * 0.22;
  vec3 lensResponse = (glare + vec3(0.78, 0.86, 1.0) * streak) * uSunVis;

  if (atm.y > 0.0) {
    float t0 = max(atm.x, 0.0);
    float t1 = hitPlanet ? pl.x : atm.y;
    float ds = (t1 - t0) / float(uSteps);
    float jitter = hash12(gl_FragCoord.xy);
    vec3 sumR = vec3(0.0);
    vec3 sumM = vec3(0.0);
    vec2 odView = vec2(0.0);
    float airglow = 0.0;
    for (int i = 0; i < 24; i++) {
      if (i >= uSteps) break;
      vec3 p = ro + rd * (t0 + ds * (float(i) + jitter));
      float h = length(p) - R_PLANET;
      vec2 d = exp(-h / vec2(H_R, H_M)) * ds;
      odView += d;
      vec2 odL = lightDepth(p, uSun);
      vec3 tau = BETA_R * (odView.x + odL.x) + BETA_M * 1.1 * (odView.y + odL.y);
      vec3 att = exp(-tau);
      sumR += d.x * att;
      sumM += d.y * att;
      float g = (h - 0.0072) / 0.0006;
      airglow += exp(-g * g) * ds;
    }
    float phaseR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
    float g2 = G_MIE * G_MIE;
    float phaseM = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu * mu)) /
      ((2.0 + g2) * pow(max(1.0 + g2 - 2.0 * G_MIE * mu, 1e-4), 1.5));
    color = SUN_I * (sumR * BETA_R * phaseR + sumM * BETA_M * phaseM);
    transmittance = exp(-(BETA_R * odView.x + BETA_M * 1.1 * odView.y));
    color += vec3(0.30, 0.95, 0.52) * airglow * 0.75 * transmittance;
  }

  if (hitPlanet) {
    vec3 day = textureGrad(uDay, uv, dx, dy).rgb;
    vec4 data = textureGrad(uData, uv, dx, dy);
    float cloud = textureGrad(uData, uv + vec2(uCloudDrift, 0.0), dx, dy).g;
    vec3 albedo = mix(vec3(0.02, 0.035, 0.06), day, uTextures);
    float globalLights = data.r * cityDetail(uv, dx, dy);
    vec2 ruv = vec2((degrees(lon) - 40.0) / 80.0, (45.0 - degrees(lat)) / 60.0);
    vec2 rscale = vec2(4.5, 3.0);
    float inside = smoothstep(0.0, 0.05, ruv.x) * smoothstep(1.0, 0.95, ruv.x) *
      smoothstep(0.0, 0.06, ruv.y) * smoothstep(1.0, 0.94, ruv.y);
    float regional = textureGrad(uRegion, clamp(ruv, 0.0, 1.0), dx * rscale, dy * rscale).r;
    float lights = mix(globalLights, regional, inside * uRegionReady) * uTextures;
    float water = mix(1.0, data.b, uTextures);
    cloud = smoothstep(0.08, 0.92, cloud) * uTextures;

    float ndl = dot(n, uSun);
    vec2 odL = lightDepth(pSurf + n * 0.0008, uSun);
    vec3 sunLight = SUN_I * exp(-(BETA_R * odL.x + BETA_M * 1.1 * odL.y));
    float diffuse = max(ndl, 0.0);

    vec3 ground = albedo * diffuse * sunLight / PI;
    vec3 cloudLit = vec3(0.92) * (diffuse * 0.9 + 0.1 * max(ndl + 0.1, 0.0)) * sunLight / PI;
    vec3 surface = mix(ground, cloudLit, cloud * 0.9);

    vec3 view = -rd;
    vec3 halfV = normalize(view + uSun);
    float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, view), 0.0), 5.0);
    float glint = pow(max(dot(n, halfV), 0.0), 220.0) * fresnel * 18.0;
    surface += glint * water * (1.0 - cloud) * sunLight / PI;

    float night = smoothstep(0.06, -0.14, ndl);
    vec3 city = vec3(1.0, 0.6, 0.28) * pow(lights, 1.35) * 1.15 * night * (1.0 - cloud * 0.8);
    vec3 moonlight = (albedo * 0.006 + cloud * 0.008) * vec3(0.55, 0.7, 1.0) * night;
    surface += city + moonlight;

    color += surface * transmittance;
  } else {
    vec3 stars = starLayer(rd, 210.0, 0.11, 0.0, pixel) + starLayer(rd, 74.0, 0.03, 41.0, pixel * 1.2);
    // A bright sky overwhelms faint stars at any realistic exposure.
    float skyLum = dot(color + lensResponse, vec3(0.2126, 0.7152, 0.0722));
    color += stars * transmittance * exp(-skyLum * 14.0);
    float disk = smoothstep(0.9999731, 0.9999803, mu);
    color += disk * vec3(1.0, 0.95, 0.88) * 90.0 * transmittance;
  }

  color += lensResponse;

  color *= uExposure * 0.85;
  color = aces(color);
  vec2 q = vNdc * vec2(aspect * 0.55, 1.0);
  color *= mix(1.0, 0.78, smoothstep(0.55, 1.45, length(q)));
  color = pow(color, vec3(1.0 / 2.2));
  float grain = hash12(gl_FragCoord.xy + fract(uTime * 13.7) * 311.0) - 0.5;
  color += grain * (2.5 / 255.0);
  fragColor = vec4(color, 1.0);
}
`;
