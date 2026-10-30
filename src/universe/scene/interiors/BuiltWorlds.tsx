import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import type { MutableRefObject } from 'react';
import { seededRandom } from '../math.ts';
import { Batch, Block, KineticLandmark, Ring } from './Scenery';
import type { Placement, Signal } from './Scenery';

interface Props {
  high: boolean;
  reducedMotion: boolean;
  signal: MutableRefObject<Signal>;
}

export function RecoveryFoundry({ high, reducedMotion, signal }: Props) {
  const flow = useRef<Mesh>(null);
  const glow = useRef<MeshStandardMaterial>(null);
  const time = useRef(0);
  const { towers, racks, conduits } = useMemo(() => {
    const random = seededRandom(413);
    const towers: Placement[] = [];
    const racks: Placement[] = [];
    const conduits: Placement[] = [];
    for (let i = 0; i < (high ? 22 : 12); i++) {
      const x = i % 2 ? -17 - random() * 5 : 6 + random() * 8;
      const z = -7 - Math.floor(i / 2) * 5.5;
      const height = 3 + random() * 8;
      towers.push({ position: [x, height / 2, z], scale: [2.4, height, 3] });
      racks.push({ position: [x, height * 0.65, z + 1.53], scale: [1.8, 0.06, 0.04] });
    }
    for (let i = 0; i < 14; i++) {
      conduits.push({
        position: [-12 + i * 1.5, 0.11, -7],
        scale: [1.2, 0.07, 0.12],
      });
    }
    return { towers, racks, conduits };
  }, [high]);
  useFrame((_, delta) => {
    if (reducedMotion || !flow.current || !glow.current) return;
    time.current += Math.min(delta, 0.05);
    // Decorative light following the visible recovery path, not operational telemetry.
    flow.current.position.x = -12 + ((time.current * 1.25) % 18);
    glow.current.emissiveIntensity = 0.6 + signal.current.pulse;
  });
  return (
    <group>
      <Batch placements={towers} color="#58656b" metalness={0.5} />
      <Batch placements={racks} color="#b5c8bb" emissive="#85b5bd" />
      <Batch placements={conduits} color="#b7c9c5" emissive="#66a5ae" />
      <Block position={[-10, 3.5, -8]} scale={[0.8, 7, 1.4]} color="#89948e" />
      <Block position={[-2, 3.5, -8]} scale={[0.8, 7, 1.4]} color="#89948e" />
      <Block position={[-6, 7, -8]} scale={[8.8, 0.7, 1.4]} color="#a6a897" />
      <Block position={[-6, 4, -8]} scale={[3.6, 0.2, 0.3]} color="#d3bd8f" emissive="#ad8c52" />
      <Block position={[-6, 0.25, -8]} scale={[9, 0.5, 5]} color="#6e7572" />
      <Block position={[-12, 0.08, -22]} scale={[0.15, 0.1, 30]} color="#a5b7ad" />
      <Block position={[-8, 0.08, -22]} scale={[0.15, 0.1, 30]} color="#a5b7ad" />
      <mesh ref={flow} position={[-12, 0.3, -7]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial
          ref={glow}
          color="#d9e7da"
          emissive="#8cc6c6"
          emissiveIntensity={0.6}
        />
      </mesh>
      {[0, 1, 2].map(index => (
        <Ring
          key={index}
          position={[-6, 2.7, -18 - index * 9]}
          rotation={[0, 0, Math.PI / 4]}
          radius={3.6}
          color="#839993"
          thickness={0.14}
        />
      ))}
    </group>
  );
}

export function ResearchObservatory({ high, reducedMotion, signal }: Props) {
  const dataMaterial = useRef<MeshStandardMaterial>(null);
  const { data, pillars } = useMemo(() => {
    const random = seededRandom(883);
    const data: Placement[] = [];
    const pillars: Placement[] = [];
    for (let i = 0; i < (high ? 26 : 14); i++) {
      const x = -18 + random() * 29;
      const z = -17 - random() * 28;
      const height = 1.5 + random() * 5;
      pillars.push({ position: [x, height / 2, z], scale: [0.16, height, 0.16] });
      data.push({
        position: [x, height + 0.4, z],
        scale: [0.55, 0.55, 0.55],
        rotation: [0.5, random() * 3, 0.5],
      });
    }
    return { data, pillars };
  }, [high]);
  useFrame(() => {
    if (dataMaterial.current) {
      dataMaterial.current.emissiveIntensity = 0.35 + signal.current.pulse * 1.2;
    }
  });
  return (
    <group>
      <mesh position={[-6, 0.55, -9]}>
        <cylinderGeometry args={[4.5, 5, 1.1, 48]} />
        <meshStandardMaterial color="#77778b" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[-6, 1.1, -9]}>
        <sphereGeometry args={[3.3, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#8d8aab" metalness={0.55} roughness={0.48} />
      </mesh>
      <Ring position={[-6, 4.5, -9]} radius={3.2} rotation={[0.4, 0.35, 0]} color="#b7acd4" />
      <KineticLandmark
        position={[-6, 4.5, -9]}
        kind="research"
        color="#c1b5e3"
        reducedMotion={reducedMotion}
        signal={signal}
      />
      <Batch
        placements={data}
        color="#9896bc"
        emissive="#6f6996"
        metalness={0.4}
        materialRef={dataMaterial}
      />
      <Batch placements={pillars} color="#72758c" metalness={0.6} />
      <Block position={[-13, 1.4, -3]} scale={[2.6, 2.8, 1.4]} color="#757b8b" />
      <Block
        position={[-13, 2.1, -2.25]}
        scale={[1.9, 0.9, 0.06]}
        color="#c8c0de"
        emissive="#8175ae"
      />
      <Block position={[-3, 0.12, -20]} scale={[0.08, 0.08, 38]} color="#b5b4cb" />
      <Block position={[-9, 0.12, -20]} scale={[0.08, 0.08, 38]} color="#b5b4cb" />
      {[-1, 1].map(side => (
        <group key={side} position={[-6 + side * 8, 0, -20]}>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.12, 0.55, 3.4, 10]} />
            <meshStandardMaterial color="#9799ad" metalness={0.6} roughness={0.45} />
          </mesh>
          <mesh position={[0, 3.6, 0]} rotation={[1.05, 0.3 * side, 0]}>
            <cylinderGeometry args={[0.55, 0.38, 2.8, 16]} />
            <meshStandardMaterial color="#b6bac9" metalness={0.65} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function ArchiveLibrary({ high, reducedMotion, signal }: Props) {
  const vault = useRef<Group>(null);
  const { shelves, books, columns } = useMemo(() => {
    const random = seededRandom(1207);
    const shelves: Placement[] = [];
    const books: Placement[] = [];
    const columns: Placement[] = [];
    for (let row = 0; row < 5; row++) {
      const z = -9 - row * 8;
      for (const x of [-15, 4]) {
        columns.push({ position: [x - 3, 4.5, z], scale: [0.45, 9, 0.45] });
        columns.push({ position: [x + 3, 4.5, z], scale: [0.45, 9, 0.45] });
        for (let level = 0; level < 4; level++) {
          shelves.push({ position: [x, 0.6 + level * 1.7, z], scale: [6, 0.13, 1] });
          for (let book = 0; book < (high ? 9 : 5); book++) {
            books.push({
              position: [x - 2.5 + book * (high ? 0.58 : 1.12), 1.2 + level * 1.7, z],
              scale: [0.22 + random() * 0.18, 0.7 + random() * 0.4, 0.65],
              rotation: [0, 0, (random() - 0.5) * 0.12],
            });
          }
        }
      }
    }
    return { shelves, books, columns };
  }, [high]);
  return (
    <group ref={vault}>
      <Batch placements={shelves} color="#a29780" />
      <Batch placements={columns} shape="column" color="#b3b8b4" />
      <Batch placements={books} color="#728a96" />
      <Block position={[-6, 1.5, -8]} scale={[3.4, 0.22, 2.4]} color="#b2aa95" />
      <Block position={[-6, 0.75, -8]} scale={[0.6, 1.5, 0.6]} color="#8b8b80" />
      <KineticLandmark
        position={[-6, 4, -8]}
        kind="archive"
        color="#e1d4b8"
        reducedMotion={reducedMotion}
        signal={signal}
      />
      {[0, 1, 2, 3].map(index => (
        <group key={index}>
          <Ring
            position={[-6, 7.5, -10 - index * 10]}
            radius={8.6}
            color="#96a9b3"
            thickness={0.2}
          />
          <Block position={[-6, 15.8, -10 - index * 10]} scale={[0.25, 0.3, 11]} color="#9da9ad" />
        </group>
      ))}
    </group>
  );
}
