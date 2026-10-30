import { useMemo } from 'react';
import type { MutableRefObject } from 'react';
import type { UniverseSceneProps } from '../../types';
import { seededRandom } from '../math.ts';
import { ProjectBeacons } from '../ProjectBeacons';
import { Batch, Block, KineticLandmark, Ring } from './Scenery';
import type { Placement, Signal } from './Scenery';

interface Props {
  high: boolean;
  reducedMotion: boolean;
  signal: MutableRefObject<Signal>;
}

export function ProjectSpaceport({
  high,
  reducedMotion,
  signal,
  markers,
  onProjectSelect,
}: Props & {
  markers: UniverseSceneProps['projectMarkers'];
  onProjectSelect: UniverseSceneProps['onProjectSelect'];
}) {
  const buildings = useMemo(() => {
    const random = seededRandom(1703);
    return Array.from({ length: high ? 25 : 14 }, (_, i): Placement => {
      const height = 1.5 + random() * 6;
      return {
        position: [(i % 2 ? -17 : 9) + random() * 5, height / 2, -8 - random() * 46],
        scale: [2.4 + random() * 2, height, 3 + random() * 3],
      };
    });
  }, [high]);
  return (
    <group>
      <Batch placements={buildings} color="#ad8b75" />
      <Block position={[-11, 3.5, -14]} scale={[0.7, 7, 0.7]} color="#d0b59b" />
      <Block position={[-1, 3.5, -14]} scale={[0.7, 7, 0.7]} color="#d0b59b" />
      <Block position={[-6, 7, -14]} scale={[10.7, 0.7, 0.7]} color="#c4b099" />
      <Block position={[-6, 1.2, -10]} scale={[3.7, 2.4, 2.5]} color="#9e8d80" />
      <KineticLandmark
        position={[-6, 3.2, -10]}
        kind="port"
        color="#e0bf91"
        reducedMotion={reducedMotion}
        signal={signal}
      />
      <Block position={[0, 0.03, -24]} scale={[1.7, 0.04, 55]} color="#aca294" />
      {Array.from({ length: 12 }, (_, i) => (
        <Block
          key={i}
          position={[0, 0.08, 1 - i * 4]}
          scale={[0.12, 0.04, 1.8]}
          color="#e7d0a6"
          emissive="#a18d62"
        />
      ))}
      <ProjectBeacons radius={1} markers={markers} onSelect={onProjectSelect} interior />
      <group position={[-16, 1.4, -23]} rotation={[0, 0, -0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 2.5, 0.5]}>
          <coneGeometry args={[1.1, 4, 5]} />
          <meshStandardMaterial color="#c6c2b5" metalness={0.45} roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
}

export function CommunicationsCoast({ high, reducedMotion, signal }: Props) {
  const dunes = useMemo(() => {
    const random = seededRandom(9921);
    return Array.from(
      { length: high ? 16 : 9 },
      (_, i): Placement => ({
        position: [(random() - 0.5) * 90, -1.5, -18 - i * 6],
        scale: [8 + random() * 15, 2.2 + random() * 4, 5 + random() * 7],
        rotation: [0, random() * 3, 0],
      })
    );
  }, [high]);
  return (
    <group>
      <Batch placements={dunes} shape="rock" color="#9c8b73" />
      <mesh position={[-6, 0.35, -10]}>
        <cylinderGeometry args={[3.2, 4, 0.7, 32]} />
        <meshStandardMaterial color="#a69e87" roughness={0.9} />
      </mesh>
      <mesh position={[-6, 3, -10]}>
        <cylinderGeometry args={[0.18, 0.7, 6, 8]} />
        <meshStandardMaterial color="#c6b388" metalness={0.55} roughness={0.5} />
      </mesh>
      <KineticLandmark
        position={[-6, 6, -10]}
        kind="signal"
        color="#ffe0a2"
        reducedMotion={reducedMotion}
        signal={signal}
      />
      {[0, 1, 2].map(index => (
        <Ring
          key={index}
          position={[-6, 6 + index * 1.15, -10]}
          rotation={[Math.PI / 2, 0.1, 0]}
          radius={1.8 + index * 0.9}
          color="#d7bb86"
          thickness={0.04}
        />
      ))}
      {[-1, 1].map(side => (
        <group key={side} position={[-6 + side * 10, 0, -25]}>
          <Block position={[0, 1, 0]} scale={[0.3, 2, 0.3]} color="#a6987b" />
          <mesh position={[0, 2.2, 0]} rotation={[0.65, side * 0.5, 0]}>
            <sphereGeometry args={[1.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#c2bba6" side={2} metalness={0.5} roughness={0.65} />
          </mesh>
        </group>
      ))}
      <Block position={[-6, 0.06, 0]} scale={[1, 0.1, 14]} color="#b9ac8c" />
    </group>
  );
}
