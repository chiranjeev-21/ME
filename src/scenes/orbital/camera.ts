/**
 * Pure camera and lighting math for the orbital scene. Units are planet radii;
 * angles are degrees at the API boundary and radians internally.
 */
export type Vec3 = [number, number, number];

const DEG = Math.PI / 180;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

export interface OrbitalPose {
  /** Sub-camera latitude / longitude on the planet, degrees. */
  lat: number;
  lon: number;
  /** Camera distance from the planet centre, in planet radii (> 1). */
  distance: number;
  /** Compass heading the camera faces, degrees clockwise from north. */
  heading: number;
  /**
   * View angle relative to the horizon, degrees. Positive tilts up (the horizon
   * drops in frame); `-horizonDegrees(distance)` looks straight at the centre.
   */
  pitch: number;
  /** Sun angle relative to the planet limb along the sun azimuth, degrees. */
  sunElevation: number;
  /** Sun direction rotated clockwise from the heading, degrees. */
  sunAzimuth: number;
  /** Vertical field of view, degrees. */
  fov: number;
  exposure: number;
  /** Physical lens shift in NDC units; moves the subject without rotating the camera. */
  shiftX?: number;
  shiftY?: number;
}

export interface OrbitalFrame {
  position: Vec3;
  forward: Vec3;
  right: Vec3;
  up: Vec3;
  sun: Vec3;
  tanHalfFov: number;
  /** 0 when the sun is hidden by the planet, 1 when fully clear of the limb. */
  sunVisibility: number;
  /** Sun position in normalised device coordinates (may be off-screen). */
  sunScreen: [number, number];
  lensShift: [number, number];
  exposure: number;
}

export function surfacePoint(lat: number, lon: number): Vec3 {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  return [Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda)];
}

/** Angle from nadir at which the horizon sits for a camera at `distance`, radians. */
export function horizonFromNadir(distance: number) {
  return Math.asin(Math.min(1, 1 / Math.max(1.000001, distance)));
}

export function horizonDegrees(distance: number) {
  return horizonFromNadir(distance) / DEG;
}

export function buildFrame(pose: OrbitalPose, aspect: number): OrbitalFrame {
  const zenith = surfacePoint(pose.lat, pose.lon);
  const lambda = pose.lon * DEG;
  const phi = pose.lat * DEG;
  const east: Vec3 = [Math.cos(lambda), 0, -Math.sin(lambda)];
  const north: Vec3 = [
    -Math.sin(phi) * Math.sin(lambda),
    Math.cos(phi),
    -Math.sin(phi) * Math.cos(lambda),
  ];
  const h = pose.heading * DEG;
  const heading = normalize(add(scale(north, Math.cos(h)), scale(east, Math.sin(h))));
  const side = cross(heading, zenith);
  const nadir = scale(zenith, -1);
  const horizon = horizonFromNadir(pose.distance);

  // Viewing direction: rotate from nadir toward the heading.
  const look = horizon + pose.pitch * DEG;
  const forward = normalize(add(scale(nadir, Math.cos(look)), scale(heading, Math.sin(look))));
  const up = normalize(add(scale(zenith, Math.sin(look)), scale(heading, Math.cos(look))));
  const right = cross(forward, up);

  const sunAngle = horizon + pose.sunElevation * DEG;
  const a = pose.sunAzimuth * DEG;
  const lateral = normalize(add(scale(heading, Math.cos(a)), scale(side, Math.sin(a))));
  const sun = normalize(add(scale(nadir, Math.cos(sunAngle)), scale(lateral, Math.sin(sunAngle))));

  // Sun visibility: compare its angle from the planet centre with the limb.
  const fromCentre = Math.acos(Math.max(-1, Math.min(1, dot(sun, nadir))));
  const clearance = (fromCentre - horizon) / DEG;
  const sunVisibility = Math.max(0, Math.min(1, (clearance + 0.3) / 0.9));

  const tanHalfFov = Math.tan((pose.fov * DEG) / 2);
  const depth = dot(sun, forward);
  const shiftX = pose.shiftX ?? 0;
  const shiftY = pose.shiftY ?? 0;
  const sunScreen: [number, number] =
    depth > 0.01
      ? [
          dot(sun, right) / depth / (tanHalfFov * aspect) + shiftX,
          dot(sun, up) / depth / tanHalfFov + shiftY,
        ]
      : [9, 9];

  return {
    position: scale(zenith, pose.distance),
    forward,
    right,
    up,
    sun,
    tanHalfFov,
    sunVisibility,
    sunScreen,
    lensShift: [shiftX, shiftY],
    exposure: pose.exposure,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixPose(a: OrbitalPose, b: OrbitalPose, t: number): OrbitalPose {
  const k = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  return {
    lat: lerp(a.lat, b.lat, k),
    lon: lerp(a.lon, b.lon, k),
    distance: lerp(a.distance, b.distance, k),
    heading: lerp(a.heading, b.heading, k),
    pitch: lerp(a.pitch, b.pitch, k),
    sunElevation: lerp(a.sunElevation, b.sunElevation, k),
    sunAzimuth: lerp(a.sunAzimuth, b.sunAzimuth, k),
    fov: lerp(a.fov, b.fov, k),
    exposure: lerp(a.exposure, b.exposure, k),
    shiftX: lerp(a.shiftX ?? 0, b.shiftX ?? 0, k),
    shiftY: lerp(a.shiftY ?? 0, b.shiftY ?? 0, k),
  };
}

/** Smooth, symmetric easing for scroll-scrubbed camera moves. */
export function easeInOut(t: number) {
  const k = Math.max(0, Math.min(1, t));
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

/*
 * Bengaluru sits at 12.97° N, 77.59° E. The opening hangs above the Arabian Sea,
 * looking east across the lights of southern India toward an orbital sunrise.
 */
export const PRESETS = {
  dawnStart: {
    lat: 9,
    lon: 63,
    distance: 1.62,
    heading: 78,
    pitch: 6.5,
    sunElevation: -1.1,
    sunAzimuth: 22,
    fov: 34,
    exposure: 0.6,
  },
  dawnEnd: {
    lat: 10,
    lon: 66,
    distance: 1.4,
    heading: 80,
    pitch: -6,
    sunElevation: 2.6,
    sunAzimuth: 16,
    fov: 38,
    exposure: 1.75,
  },
  /* Closing scene: the night side eclipses the sun and the atmosphere rings the disk. */
  eclipseStart: {
    lat: 20,
    lon: 80,
    distance: 4.4,
    heading: 0,
    pitch: -13.14,
    sunElevation: -0.45,
    sunAzimuth: -52,
    fov: 30,
    exposure: 1,
    shiftX: 0.36,
    shiftY: -0.1,
  },
  eclipseEnd: {
    lat: 18,
    lon: 82,
    distance: 3.9,
    heading: 0,
    pitch: -14.86,
    sunElevation: 0.06,
    sunAzimuth: -52,
    fov: 30,
    exposure: 1.1,
    shiftX: 0.34,
    shiftY: -0.06,
  },
} satisfies Record<string, OrbitalPose>;

export type OrbitalPresetName = 'dawn' | 'eclipse';
