import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { MutableRefObject } from 'react';
import { seededRandom } from '../math.ts';
import { Batch, Block, KineticLandmark, Ring, Water } from './Scenery';
import type { Placement, Signal } from './Scenery';

interface Props {
  high: boolean;
  reducedMotion: boolean;
  signal: MutableRefObject<Signal>;
  onRendered: () => void;
}

export function OceanIsland({ high, reducedMotion, onRendered }: Props) {
  const { islands, trunks, crowns, dock } = useMemo(() => {
    const random = seededRandom(732);
    const islands: Placement[] = [
      { position: [-6, -0.5, -7], scale: [7, 1.15, 5] },
      { position: [-21, -1.2, -28], scale: [12, 3.2, 8] },
      { position: [15, -1.6, -40], scale: [18, 5, 11] },
      { position: [-42, -2, -66], scale: [20, 7, 15] },
    ];
    const trunks: Placement[] = [];
    const crowns: Placement[] = [];
    for (let i = 0; i < (high ? 15 : 8); i++) {
      const x = -6 + (random() - 0.5) * 9;
      const z = -8 - random() * 3;
      const height = 1.2 + random() * 1.5;
      trunks.push({ position: [x, height / 2 + 0.3, z], scale: [0.12, height, 0.12] });
      crowns.push({ position: [x, height + 0.4, z], scale: [0.9, 0.55, 0.85] });
    }
    // The central canopy is also the projected interior landmark.
    trunks.push({ position: [-6, 1.2, -7], scale: [0.15, 2.4, 0.15] });
    crowns.push({ position: [-6, 2.4, -7], scale: [1.25, 0.55, 1] });
    const dock = Array.from({ length: 14 }, (_, i) => ({
      position: [-3.6, 0.22, 4 - i * 0.6] as [number, number, number],
      scale: [1.5, 0.12, 0.44] as [number, number, number],
    }));
    return { islands, trunks, crowns, dock };
  }, [high]);
  return (
    <group>
      <Water high={high} reducedMotion={reducedMotion} onRendered={onRendered} />
      <Batch placements={islands} shape="rock" color="#707f70" />
      <Batch placements={trunks} shape="column" color="#746850" />
      <Batch placements={crowns} shape="rock" color="#7f9e89" />
      <Batch placements={dock} color="#b4a58c" />
      <Block position={[-3.6, 0.7, -3.1]} scale={[1.5, 0.12, 0.65]} color="#c5b99d" />
      <Block position={[-3, 0.5, -3.1]} scale={[0.12, 0.6, 0.12]} color="#9b927f" />
      <Block position={[-4.2, 0.5, -3.1]} scale={[0.12, 0.6, 0.12]} color="#9b927f" />
    </group>
  );
}

export function ContourGarden({ high, reducedMotion, signal }: Props) {
  const foliage = useRef<Group>(null);
  const foliageMaterial = useRef<MeshStandardMaterial>(null);
  const time = useRef(0);
  const { trunks, leaves, stones } = useMemo(() => {
    const random = seededRandom(5913);
    const trunks: Placement[] = [];
    const leaves: Placement[] = [];
    const stones: Placement[] = [];
    for (let i = 0; i < (high ? 28 : 15); i++) {
      const x = -20 + random() * 35;
      const z = -5 - random() * 45;
      const height = 1.8 + random() * 3.6;
      trunks.push({ position: [x, height / 2, z], scale: [0.15, height, 0.15] });
      leaves.push({
        position: [x, height, z],
        scale: [0.9 + random() * 0.7, 0.55 + random(), 1.1],
        rotation: [0, random() * 6, 0],
      });
    }
    for (let i = 0; i < 24; i++) {
      stones.push({
        position: [-1 + Math.sin(i * 0.3) * 3.5, 0.08, 7 - i * 1.5],
        scale: [0.8, 0.15, 0.6],
        rotation: [0, i * 0.45, 0],
      });
    }
    return { trunks, leaves, stones };
  }, [high]);
  useFrame((_, delta) => {
    foliageMaterial.current?.color.setHSL((signal.current.seed % 360) / 360, 0.22, 0.52);
    if (!foliage.current || reducedMotion) return;
    time.current += Math.min(delta, 0.05);
    foliage.current.rotation.z = Math.sin(time.current * 0.32) * 0.006;
  });
  return (
    <group>
      {[0, 1, 2, 3, 4].map(level => (
        <group key={level} position={[-6, 0.18 + level * 0.23, -7]}>
          <mesh scale={[1.4, 1, 0.9]}>
            <cylinderGeometry args={[5.5 - level * 0.65, 6 - level * 0.65, 0.32, 48]} />
            <meshStandardMaterial color={level % 2 ? '#6c8267' : '#829377'} roughness={0.98} />
          </mesh>
          <group scale={[1.4, 1, 0.9]}>
            <Ring
              position={[0, 0.18, 0]}
              radius={5.5 - level * 0.65}
              rotation={[Math.PI / 2, 0, 0]}
              color="#b2b98a"
              thickness={0.028}
            />
          </group>
        </group>
      ))}
      <Batch placements={stones} shape="rock" color="#c1bba6" />
      <Batch placements={trunks} shape="column" color="#64624b" />
      <group ref={foliage}>
        <Batch placements={leaves} shape="rock" color="#8faaa0" materialRef={foliageMaterial} />
      </group>
      <Block position={[-6, 2.2, -7]} scale={[0.16, 3, 0.16]} color="#867a59" />
      <KineticLandmark
        position={[-6, 3.8, -7]}
        kind="garden"
        color="#b8b88b"
        reducedMotion={reducedMotion}
        signal={signal}
      />
      <mesh position={[-19, 0, -42]} scale={[18, 4, 12]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#526f61" roughness={1} />
      </mesh>
    </group>
  );
}
