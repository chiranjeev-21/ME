import type { ExpeditionFrame, WorldDefinition, WorldId } from '../types.ts';
import { focusPose, overviewPose } from './math.ts';
import type { CameraPose, Point3 } from './math.ts';

export function unit(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function smoothRange(value: number, start = 0, end = 1): number {
  const t = unit((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function expeditionProgress(frame: ExpeditionFrame, reducedMotion = false) {
  const approach =
    frame.phase === 'orbit' ? 0 : frame.phase === 'approach' ? unit(frame.approach) : 1;
  const entry = frame.phase === 'inside' ? 1 : frame.phase === 'entry' ? unit(frame.entry) : 0;
  return {
    approach: reducedMotion && approach > 0 ? 1 : approach,
    entry: reducedMotion ? (entry >= 0.5 ? 1 : 0) : entry,
    read: reducedMotion ? 0 : unit(frame.readProgress),
  };
}

export function interiorTransform(center: Point3, radius: number) {
  return {
    position: [center[0], center[1] - radius * 0.18, center[2] + radius * 0.12] as Point3,
    scale: radius * 0.045,
  };
}

export function interiorLandmark(world: WorldId): Point3 {
  switch (world) {
    case 'about':
      return [-6, 2.4, -7];
    case 'engineering':
      return [-6, 4, -8];
    case 'ai-lab':
      return [-6, 4.5, -9];
    case 'projects':
      return [-6, 3.2, -10];
    case 'creative':
      return [-6, 3.8, -7];
    case 'hush':
      return [-6, 3, -10.3];
    case 'writing':
      return [-6, 4, -8];
    case 'contact':
      return [-6, 6, -10];
  }
}

export function interiorPose(
  world: WorldId,
  center: Point3,
  radius: number,
  aspect: number,
  readProgress = 0
): CameraPose {
  const mobile = aspect < 0.95;
  const read = unit(readProgress);
  const landmark = interiorLandmark(world);
  const transform = interiorTransform(center, radius);
  const scenicX =
    landmark[0] +
    (14 - landmark[2]) * Math.tan((21 * Math.PI) / 180) * Math.min(aspect, 2.8) * 0.48;
  const localPosition: Point3 = mobile
    ? [-6, 5.4, 17 - read * 1.5]
    : [scenicX + read * 0.65, 4.6, 14 - read * 2.2];
  const localTarget: Point3 = mobile ? [-6, landmark[1] - 4.2, -12] : [scenicX, 2, -12];
  const toWorld = (point: Point3): Point3 =>
    point.map((value, i) => transform.position[i] + value * transform.scale) as Point3;
  return { position: toWorld(localPosition), target: toWorld(localTarget) };
}

function mixPoint(a: Point3, b: Point3, amount: number): Point3 {
  return a.map((value, i) => value + (b[i] - value) * amount) as Point3;
}

function mixPose(a: CameraPose, b: CameraPose, amount: number): CameraPose {
  return {
    position: mixPoint(a.position, b.position, amount),
    target: mixPoint(a.target, b.target, amount),
  };
}

// Absolute poses: approach ends outside the sphere; entry crosses into surface-scale scenery.
// Neither chapter changes nor jumpRevision start a time-based flight, so reversal is immediate.
export function scrollCameraPose(
  frame: ExpeditionFrame,
  world: WorldDefinition | undefined,
  center: Point3 | undefined,
  aspect: number,
  entered = true,
  reducedMotion = false
): CameraPose {
  const safeAspect = Number.isFinite(aspect) ? Math.max(0.2, aspect) : 1;
  const overview = overviewPose(safeAspect, safeAspect < 0.95 ? false : entered);
  if (safeAspect < 0.95) {
    // Journey HUD clearance: keep the Sun between the intro and fixed selector, without zooming.
    const identityY = overview.position[2] * Math.tan((21 * Math.PI) / 180) * 0.52;
    overview.position[1] = identityY;
    overview.target[1] = identityY;
  }
  if (!world || !center || !frame.world || frame.phase === 'orbit') return overview;
  const progress = expeditionProgress(frame, reducedMotion);
  const close = focusPose(center, world.radius, safeAspect);
  // Keep the planet in the document-free half, but finish close enough to cross its surface.
  const distance = world.radius * (safeAspect < 0.95 ? 4.8 : 3.8);
  const originalDistance = close.position[2] - center[2];
  const ratio = distance / originalDistance;
  close.position = close.position.map(
    (value, i) => center[i] + (value - center[i]) * ratio
  ) as Point3;
  close.target = close.target.map((value, i) => center[i] + (value - center[i]) * ratio) as Point3;
  const approach = mixPose(overview, close, smoothRange(progress.approach));
  if (progress.entry === 0) return approach;
  return mixPose(
    close,
    interiorPose(world.id, center, world.radius, safeAspect, progress.read),
    smoothRange(progress.entry)
  );
}

export function chapterReveal(frame: ExpeditionFrame, reducedMotion = false): number {
  if (reducedMotion || !frame.world) return 1;
  if (frame.phase === 'inside' && frame.world !== 'contact') {
    return 1 - smoothRange(unit(frame.readProgress), 0.92, 1);
  }
  if (frame.phase === 'approach' && frame.world !== 'about') {
    return smoothRange(unit(frame.approach), 0, 0.12);
  }
  return 1;
}

export function expeditionVisibility(frame: ExpeditionFrame, reducedMotion = false) {
  const entry = frame.world ? expeditionProgress(frame, reducedMotion).entry : 0;
  // The single interior changes beneath a scroll-bound fade, never a timed scene transition.
  const reveal = chapterReveal(frame, reducedMotion);
  return {
    exterior: (1 - smoothRange(entry, 0.12, 0.48)) * reveal,
    interior: smoothRange(entry, 0.18, 0.6) * reveal,
  };
}

export function projectBeaconPosition(index: number, mobile = false): Point3 {
  return mobile
    ? [-7 + (index % 2) * 2.5, 0.65, -3 - index * 4]
    : [-7 + (index % 3) * 3.2, 0.65, -4 - Math.floor(index / 3) * 7];
}

export function signalSeed(value: string | number | undefined): number {
  const text = String(value ?? 'CJ');
  let seed = 2166136261;
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619);
  return seed >>> 0;
}
