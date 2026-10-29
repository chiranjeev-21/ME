export type Point3 = [number, number, number];
export interface Orbit {
  orbitRadius: number;
  phase: number;
  inclination: number;
  orbitalSpeed: number;
}
export interface CameraPose {
  position: Point3;
  target: Point3;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function orbitPosition(orbit: Orbit, elapsed: number, mobile = false): Point3 {
  const angle = orbit.phase + elapsed * orbit.orbitalSpeed;
  return [
    Math.cos(angle) * orbit.orbitRadius * (mobile ? 0.56 : 1),
    Math.sin(angle) * orbit.orbitRadius * (mobile ? 0.66 : 0.57),
    Math.sin(angle) * orbit.orbitRadius * 0.16 + orbit.inclination * orbit.orbitRadius,
  ];
}

export function overviewPose(aspect: number, entered = false): CameraPose {
  const mobile = aspect < 0.95;
  const distance = mobile
    ? Math.max(34, 8.6 / (Math.tan((21 * Math.PI) / 180) * Math.max(aspect, 0.2)))
    : Math.max(35, 21.2 / (Math.tan((21 * Math.PI) / 180) * aspect));
  const target: Point3 = mobile
    ? [0, entered ? -0.5 : distance * Math.tan((21 * Math.PI) / 180) * 0.72, 0]
    : [entered ? 0 : -5.8, 0.3, 0];
  return { position: [target[0], target[1], distance], target };
}

export function focusPose(center: Point3, radius: number, aspect: number): CameraPose {
  const mobile = aspect < 0.95;
  const distance = radius * (mobile ? Math.max(9.8, 4.2 / Math.max(aspect, 0.2)) : 7.6);
  const offsetX = mobile ? 0 : distance * Math.tan((21 * Math.PI) / 180) * aspect * 0.51;
  const target: Point3 = [center[0] + offsetX, center[1] - (mobile ? radius * 1.65 : 0), center[2]];
  return { target, position: [target[0], target[1], center[2] + distance] };
}

export function cameraTransitionProgress(elapsedMs: number, durationMs = 1100): number {
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}
