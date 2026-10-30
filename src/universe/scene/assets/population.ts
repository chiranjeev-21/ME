import type { Point3 } from '../math.ts';

export type CitizenKind = 'human' | 'robot' | 'alien' | 'ghost';

export function citizenPose(kind: CitizenKind, index: number, elapsed: number, still = false) {
  const time = still ? 0 : Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
  const phase = time * (kind === 'human' ? 0.26 : 0.18) + index * 2.094;
  let position: Point3;
  let rotation: number;
  if (kind === 'human') {
    position = [-3.6 + Math.cos(phase) * 0.28, 0.29, -0.4 + Math.sin(phase) * 2.8];
    rotation = Math.atan2(-Math.sin(phase) * 0.28, Math.cos(phase) * 2.8);
  } else if (kind === 'ghost') {
    position = [
      -6 + Math.sin(phase) * 3.3,
      1.3 + Math.sin(phase * 1.7) * 0.45,
      -5 - index * 2 + Math.cos(phase) * 1.3,
    ];
    rotation = Math.sin(phase * 0.7) * 0.5;
  } else {
    position = [-6 + index * 2 + Math.sin(phase) * 0.7, 0.04, -0.6 + Math.cos(phase) * 0.7];
    rotation = Math.atan2(Math.cos(phase), -Math.sin(phase));
  }
  return { position, rotation, stride: still ? 0 : Math.sin(time * 4.3 + index * 2) * 0.36 };
}
