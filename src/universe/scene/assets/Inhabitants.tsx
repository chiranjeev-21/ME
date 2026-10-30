import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { MutableRefObject } from 'react';
import type { ExpeditionFrame, WorldId } from '../../types';
import { SceneMarker } from '../SceneMarker';
import { AssetBoundary } from './AssetBoundary';
import { Model } from './Model';
import { WORLD_ASSETS } from './catalog';
import { citizenPose } from './population';
import type { CitizenKind } from './population';

export interface PopulationProps {
  journey: MutableRefObject<ExpeditionFrame>;
  world: WorldId;
  reducedMotion: boolean;
  high: boolean;
  onReady: () => void;
}

function Citizen({
  kind,
  index,
  ...props
}: PopulationProps & { kind: CitizenKind; index: number }) {
  const root = useRef<Group>(null);
  const time = useRef(0);
  const stride = useRef(0);
  const pose = citizenPose(kind, index, 0, props.reducedMotion);
  useFrame((_, delta) => {
    if (
      !root.current ||
      props.journey.current.world !== props.world ||
      props.journey.current.entry < 0.2
    )
      return;
    if (!props.reducedMotion) time.current += Math.min(delta, 0.05);
    const current = citizenPose(kind, index, time.current, props.reducedMotion);
    root.current.position.fromArray(current.position);
    root.current.rotation.y = current.rotation;
    stride.current = current.stride;
  });
  return (
    <group ref={root} position={pose.position} rotation={[0, pose.rotation, 0]}>
      <AssetBoundary>
        <Model
          url={WORLD_ASSETS[kind]}
          height={kind === 'ghost' ? 1.9 : 1.7}
          clip={kind === 'robot' ? 'Walking' : undefined}
          stride={kind === 'alien' ? stride : undefined}
          phase={index * 0.3}
          {...props}
        />
      </AssetBoundary>
      <SceneMarker
        position={[0, 1.1, 0]}
        attributes={{ 'data-inhabitant': kind, 'data-citizen': `${kind}-${index}` }}
      />
    </group>
  );
}

export function Inhabitants(props: PopulationProps & { kind: CitizenKind }) {
  const count = props.kind === 'human' ? (props.high ? 3 : 2) : props.high ? 3 : 2;
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <Citizen key={index} index={index} {...props} />
      ))}
    </group>
  );
}
