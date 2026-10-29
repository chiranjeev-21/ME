import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { UniverseSceneProps, WorldDefinition } from '../types';
import { cameraTransitionProgress, focusPose, overviewPose } from './math.ts';
import type { Point3 } from './math.ts';

interface Props {
  selected: UniverseSceneProps['selected'];
  entered: boolean;
  reducedMotion: boolean;
  worlds: readonly WorldDefinition[];
  positions: Point3[];
  onCameraState: UniverseSceneProps['onCameraState'];
}

export function CameraRig({
  selected,
  entered,
  reducedMotion,
  worlds,
  positions,
  onCameraState,
}: Props) {
  const { camera, size, invalidate } = useThree();
  const target = useRef(new Vector3());
  const destination = useRef({ position: new Vector3(), target: new Vector3() });
  const origin = useRef({ position: new Vector3(), target: new Vector3() });
  const startedAt = useRef(0);
  const initialized = useRef(false);
  const phase = useRef<Parameters<typeof onCameraState>[0] | null>(null);
  const callback = useRef(onCameraState);
  callback.current = onCameraState;

  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    const index = worlds.findIndex(world => world.id === selected);
    const pose =
      index >= 0
        ? focusPose(positions[index], worlds[index].radius, aspect)
        : overviewPose(aspect, entered);
    destination.current.position.fromArray(pose.position);
    destination.current.target.fromArray(pose.target);
    const alreadyThere =
      camera.position.distanceToSquared(destination.current.position) < 0.00015 &&
      target.current.distanceToSquared(destination.current.target) < 0.00015;
    if (!initialized.current || reducedMotion || alreadyThere) {
      camera.position.copy(destination.current.position);
      target.current.copy(destination.current.target);
      camera.lookAt(target.current);
      initialized.current = true;
      const next = selected ? 'focused' : 'overview';
      if (phase.current !== next) {
        phase.current = next;
        callback.current(next);
      }
    } else {
      origin.current.position.copy(camera.position);
      origin.current.target.copy(target.current);
      startedAt.current = performance.now();
      if (phase.current !== 'moving') {
        phase.current = 'moving';
        callback.current('moving');
      }
    }
    invalidate();
  }, [camera, entered, invalidate, positions, reducedMotion, selected, size, worlds]);

  useFrame(() => {
    if (!initialized.current || reducedMotion || phase.current !== 'moving') return;
    const blend = cameraTransitionProgress(performance.now() - startedAt.current);
    camera.position.lerpVectors(origin.current.position, destination.current.position, blend);
    target.current.lerpVectors(origin.current.target, destination.current.target, blend);
    camera.lookAt(target.current);
    if (blend === 1) {
      camera.position.copy(destination.current.position);
      target.current.copy(destination.current.target);
      camera.lookAt(target.current);
      const next = selected ? 'focused' : 'overview';
      phase.current = next;
      callback.current(next);
    }
  });
  return null;
}
