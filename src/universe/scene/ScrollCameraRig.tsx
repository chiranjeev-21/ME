import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { UniverseSceneProps, WorldDefinition } from '../types';
import type { Point3 } from './math.ts';
import { scrollCameraPose } from './scrollMath.ts';

interface Props {
  journey: NonNullable<UniverseSceneProps['journey']>;
  reducedMotion: boolean;
  worlds: readonly WorldDefinition[];
  positions: Point3[];
  onCameraState: UniverseSceneProps['onCameraState'];
}

export function ScrollCameraRig({
  journey,
  reducedMotion,
  worlds,
  positions,
  onCameraState,
}: Props) {
  const { camera, size } = useThree();
  const lastPhase = useRef<string | null>(null);
  useFrame(() => {
    const frame = journey.current;
    const index = worlds.findIndex(world => world.id === frame.world);
    const pose = scrollCameraPose(
      frame,
      worlds[index],
      positions[index],
      size.width / size.height,
      true,
      reducedMotion
    );
    camera.position.fromArray(pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    if (lastPhase.current !== frame.phase) {
      lastPhase.current = frame.phase;
      onCameraState(
        frame.phase === 'orbit' ? 'overview' : frame.phase === 'inside' ? 'focused' : 'moving'
      );
    }
  }, -30);
  return null;
}
