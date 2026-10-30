import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Vector3,
} from 'three';
import type { Group } from 'three';
import type { WorldDefinition } from '../types';
import type { Point3 } from './math';
import { createCognitionGeometry, createGhostGeometry } from './formGeometry';
import { SceneMarker } from './SceneMarker';
import { Batch, Block, Ring } from './interiors/Scenery';
import type { Placement } from './interiors/Scenery';

interface FormProps {
  high: boolean;
  reducedMotion: boolean;
}

function Conduit({
  points,
  color,
  thickness = 0.035,
  high,
}: {
  points: Point3[];
  color: string;
  thickness?: number;
  high: boolean;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map(point => new Vector3(...point))),
    [points]
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, high ? 40 : 20, thickness, high ? 8 : 5, false]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.46} />
    </mesh>
  );
}

function ReliabilityEngine({ high }: FormProps) {
  const teeth = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index): Placement => {
        const angle = (index / 16) * Math.PI * 2;
        return {
          position: [Math.cos(angle) * 0.78, Math.sin(angle) * 0.78, -0.12],
          rotation: [0, 0, angle],
          scale: [0.2, 0.13, 0.26],
        };
      }),
    []
  );
  const ports = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index): Placement => {
        const angle = (index / 8) * Math.PI * 2;
        return {
          position: [Math.cos(angle) * 0.56, Math.sin(angle) * 0.56, 0.3],
          rotation: [0, 0, angle],
          scale: [0.09, 0.16, 0.035],
        };
      }),
    []
  );
  return (
    <group name="reliability-engine">
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.65, high ? 48 : 24]} />
        <meshStandardMaterial color="#384a51" metalness={0.78} roughness={0.4} />
      </mesh>
      <Ring position={[0, 0, 0.2]} radius={0.52} thickness={0.09} color="#c7b398" />
      <Batch placements={teeth} color="#8c9c9b" metalness={0.7} />
      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={index} rotation={[0, 0, (index / 6) * Math.PI * 2]}>
          <torusGeometry args={[0.73, 0.13, 5, high ? 16 : 8, 0.78]} />
          <meshStandardMaterial color="#b4afa0" metalness={0.7} roughness={0.48} />
        </mesh>
      ))}
      <Batch placements={ports} color="#a6d7cd" emissive="#6faeaa" metalness={0.4} />
      <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.31, 0.2, 12]} />
        <meshStandardMaterial color="#d0bb92" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.47]}>
        <torusGeometry args={[0.15, 0.045, 8, 24]} />
        <meshStandardMaterial color="#c3e6dc" emissive="#73b9b2" emissiveIntensity={0.5} />
      </mesh>
      {[-1, 1].map(side => (
        <Conduit
          key={side}
          high={high}
          color="#82b4b1"
          points={[
            [side * 0.21, 0, 0.43],
            [side * 0.4, -0.32, 0.38],
            [side * 0.67, -0.26, 0.24],
          ]}
        />
      ))}
    </group>
  );
}

function NeuralConstruct({ high }: FormProps) {
  const lobe = useMemo(() => createCognitionGeometry(high), [high]);
  const nodes = useMemo(
    () =>
      [
        [-0.62, 0.36, 0.28],
        [-0.38, 0.64, 0.28],
        [0.35, 0.65, 0.26],
        [0.62, 0.3, 0.32],
        [-0.64, -0.08, 0.29],
        [0.63, -0.11, 0.3],
        [-0.35, -0.49, 0.19],
        [0.32, -0.5, 0.2],
        [-0.21, 0.23, 0.55],
        [0.21, 0.23, 0.55],
      ].map(
        (position): Placement => ({
          position: position as Point3,
          scale: [0.065, 0.065, 0.065],
        })
      ),
    []
  );
  const network = useMemo(() => {
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [3, 5],
      [4, 6],
      [5, 7],
      [6, 7],
      [0, 8],
      [1, 8],
      [8, 9],
      [2, 9],
      [3, 9],
      [4, 8],
      [5, 9],
      [6, 8],
      [7, 9],
    ];
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        edges.flatMap(edge => edge.flatMap(index => nodes[index].position)),
        3
      )
    );
    return geometry;
  }, [nodes]);
  useEffect(
    () => () => {
      lobe.dispose();
      network.dispose();
    },
    [lobe, network]
  );
  return (
    <group name="neural-research-construct">
      {[-1, 1].map(side => (
        <mesh
          key={side}
          geometry={lobe}
          position={[side * 0.28, 0.06, -0.04]}
          scale={[0.36, 0.64, 0.42]}
          rotation={[0, 0, side * -0.15]}
        >
          <meshStandardMaterial
            color={side < 0 ? '#aaa0c4' : '#797f9f'}
            metalness={0.27}
            roughness={0.52}
          />
        </mesh>
      ))}
      <lineSegments geometry={network}>
        <lineBasicMaterial color="#ddd4f3" transparent opacity={0.65} />
      </lineSegments>
      <Batch placements={nodes} shape="sphere" color="#ded3ee" emissive="#9886ca" />
      <Conduit
        high={high}
        color="#9babc0"
        thickness={0.09}
        points={[
          [-0.18, -0.43, 0],
          [0, -0.7, 0.04],
          [0.18, -0.43, 0],
        ]}
      />
      <Ring position={[0, -0.13, 0.57]} radius={0.22} thickness={0.055} color="#d5c7e8" />
      <mesh position={[0, -0.13, 0.57]} scale={[1, 1, 0.3]}>
        <sphereGeometry args={[0.19, high ? 32 : 20, 16]} />
        <meshStandardMaterial
          color="#343852"
          emissive="#8b78ba"
          emissiveIntensity={0.45}
          metalness={0.8}
          roughness={0.16}
        />
      </mesh>
      <Ring position={[0, -0.13, 0.63]} radius={0.09} thickness={0.012} color="#d7dfef" />
    </group>
  );
}

function Shipyard({ high }: FormProps) {
  const { towers, windows, cranes } = useMemo(() => {
    const towers: Placement[] = [];
    const windows: Placement[] = [];
    const cranes: Placement[] = [];
    for (let index = 0; index < (high ? 9 : 6); index++) {
      const x = -0.55 + (index % 3) * 0.23;
      const z = -0.36 + Math.floor(index / 3) * 0.2;
      const height = 0.26 + ((index * 7) % 5) * 0.075;
      towers.push({ position: [x, -0.12 + height / 2, z], scale: [0.15, height, 0.15] });
      windows.push({ position: [x, height * 0.65 - 0.12, z + 0.08], scale: [0.1, 0.025, 0.01] });
    }
    for (const x of [0.17, 0.66]) {
      cranes.push({ position: [x, 0.2, -0.24], scale: [0.035, 0.76, 0.035] });
    }
    cranes.push({ position: [0.42, 0.56, -0.24], scale: [0.53, 0.04, 0.035] });
    return { towers, windows, cranes };
  }, [high]);
  return (
    <group name="orbital-shipyard" rotation={[0.22, -0.18, -0.05]}>
      <mesh position={[0, -0.23, 0]}>
        <cylinderGeometry args={[0.81, 0.63, 0.2, 8]} />
        <meshStandardMaterial color="#7d7772" metalness={0.6} roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.79, 0.79, 0.035, 8]} />
        <meshStandardMaterial color="#bfab92" metalness={0.35} roughness={0.8} />
      </mesh>
      <Batch placements={towers} color="#b48872" metalness={0.42} />
      <Batch placements={windows} color="#f0dab0" emissive="#c4a975" />
      <Batch placements={cranes} color="#d3ba8e" metalness={0.55} />
      <Block position={[0.42, 0.33, -0.24]} scale={[0.018, 0.42, 0.018]} color="#575b60" />
      <mesh position={[0.42, -0.07, 0.18]}>
        <cylinderGeometry args={[0.24, 0.24, 0.055, 24]} />
        <meshStandardMaterial color="#3a4b54" metalness={0.6} roughness={0.5} />
      </mesh>
      <Ring
        position={[0.42, -0.035, 0.18]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={0.18}
        thickness={0.014}
        color="#d8c49c"
      />
      <group position={[0.42, 0.16, 0.18]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.085, 0.38, 12]} />
          <meshStandardMaterial color="#d6d8d1" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <coneGeometry args={[0.065, 0.16, 12]} />
          <meshStandardMaterial color="#b88c75" metalness={0.5} roughness={0.5} />
        </mesh>
        {[-1, 1].map(side => (
          <Block
            key={side}
            position={[side * 0.09, -0.13, 0]}
            scale={[0.045, 0.15, 0.11]}
            color="#d3b59b"
            rotation={[0, 0, side * -0.25]}
          />
        ))}
      </group>
      <Block position={[-0.14, -0.09, 0.34]} scale={[0.16, 0.025, 0.53]} color="#44545b" />
      <Block position={[-0.14, -0.07, 0.34]} scale={[0.025, 0.01, 0.39]} color="#ead7b6" />
      <mesh position={[-0.14, 0.02, 0.28]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.8, 0.65]}>
        <coneGeometry args={[0.12, 0.3, 4]} />
        <meshStandardMaterial color="#d4cbc0" metalness={0.55} roughness={0.48} />
      </mesh>
      <Block position={[0, -0.45, 0]} scale={[0.22, 0.35, 0.25]} color="#4d616a" />
      <Ring
        position={[0, -0.58, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={0.21}
        thickness={0.035}
        color="#81b7bb"
      />
    </group>
  );
}

export function CreativeSculpture({ high }: Pick<FormProps, 'high'>) {
  const { strings, leaves } = useMemo(() => {
    const strings: Placement[] = [];
    const leaves: Placement[] = [];
    for (let index = 0; index < 7; index++) {
      const x = (index - 3) * 0.105;
      strings.push({ position: [x, 0.1, 0.035], scale: [0.009, 0.94 - Math.abs(x) * 0.3, 0.009] });
    }
    for (const side of [-1, 1]) {
      for (let index = 0; index < 3; index++) {
        leaves.push({
          position: [side * (0.62 - index * 0.07), 0.06 + index * 0.22, -0.035],
          scale: [0.2, 0.09, 0.06],
          rotation: [0, side * 0.3, side * 0.6],
        });
      }
    }
    return { strings, leaves };
  }, []);
  return (
    <group name="living-lyre">
      <mesh position={[0, -0.48, 0]} scale={[0.48, 0.25, 0.27]}>
        <sphereGeometry args={[1, high ? 32 : 20, 16]} />
        <meshStandardMaterial color="#9b8261" metalness={0.36} roughness={0.5} />
      </mesh>
      {[-1, 1].map(side => (
        <Conduit
          key={side}
          high={high}
          color="#9db59b"
          thickness={0.075}
          points={[
            [side * 0.16, -0.54, 0],
            [side * 0.52, -0.27, 0],
            [side * 0.56, 0.22, 0],
            [side * 0.39, 0.66, 0],
            [side * 0.16, 0.72, 0],
          ]}
        />
      ))}
      <Conduit
        high={high}
        color="#d0b48a"
        thickness={0.045}
        points={[
          [-0.41, 0.57, 0],
          [0, 0.64, 0],
          [0.41, 0.57, 0],
        ]}
      />
      <Batch placements={strings} color="#ead8b5" metalness={0.72} />
      <Batch placements={leaves} shape="sphere" color="#7caca2" metalness={0.25} />
      <Ring position={[0, -0.44, 0.25]} radius={0.11} thickness={0.025} color="#ddc3a0" />
    </group>
  );
}

function CelestialGhost({ high, reducedMotion }: FormProps) {
  const geometry = useMemo(() => createGhostGeometry(high), [high]);
  const veil = useRef<Group>(null);
  const time = useRef(0);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (!veil.current || reducedMotion) return;
    time.current += Math.min(delta, 0.05);
    veil.current.rotation.z = Math.sin(time.current * 0.42) * 0.025;
  });
  return (
    <group name="inhabited-celestial-ghost">
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#c6dad2"
          emissive="#7faeaa"
          emissiveIntensity={0.13}
          metalness={0.12}
          roughness={0.56}
        />
      </mesh>
      {[-1, 1].map(side => (
        <group
          key={side}
          position={[side * 0.205, 0.33, 0.415]}
          rotation={[0, side * 0.27, side * 0.07]}
        >
          <mesh scale={[0.1, 0.15, 0.065]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color="#14272c" roughness={0.4} />
          </mesh>
          <mesh position={[-side * 0.012, 0.015, 0.056]} scale={[0.023, 0.04, 0.015]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#c2e9db" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.04, 0.456]} scale={[0.065, 0.085, 0.022]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#476562" roughness={0.8} />
      </mesh>
      <group ref={veil}>
        {[-1, 1].map(side => (
          <Conduit
            key={side}
            high={high}
            color="#88b8b2"
            thickness={0.035}
            points={[
              [side * 0.51, -0.22, -0.04],
              [side * 0.69, -0.35, -0.02],
              [side * 0.66, -0.63, 0.06],
              [side * 0.48, -0.76, 0.08],
            ]}
          />
        ))}
      </group>
      <mesh position={[-0.62, 0.53, -0.15]}>
        <sphereGeometry args={[0.14, high ? 32 : 20, 16]} />
        <meshStandardMaterial
          color="#ced7ce"
          emissive="#9caaa8"
          emissiveIntensity={0.22}
          roughness={1}
        />
      </mesh>
      <group position={[0, -0.43, 0.47]}>
        <Block position={[0, -0.05, 0]} scale={[0.6, 0.045, 0.25]} color="#546c69" />
        <Block position={[0, 0.035, -0.025]} scale={[0.17, 0.17, 0.06]} color="#233b41" />
        <mesh position={[0, 0.12, 0.01]}>
          <torusGeometry args={[0.085, 0.018, 6, 20, Math.PI]} />
          <meshStandardMaterial color="#b8d5be" emissive="#7dbca9" emissiveIntensity={0.4} />
        </mesh>
        {[-1, 1].map(side => (
          <group key={side} position={[side * 0.22, 0.05, 0]}>
            <Block position={[0, 0.025, 0]} scale={[0.022, 0.14, 0.025]} color="#adbeb1" />
            <Block position={[0, 0.045, 0]} scale={[0.095, 0.022, 0.025]} color="#adbeb1" />
          </group>
        ))}
      </group>
      <SceneMarker position={[0, 0.33, 0.5]} attributes={{ 'data-form-detail': 'ghost-eyes' }} />
      <SceneMarker
        position={[0, -0.38, 0.5]}
        attributes={{ 'data-form-detail': 'ghost-cemetery-arcade' }}
      />
    </group>
  );
}

function CelestialBook({ high }: FormProps) {
  const ink = useMemo(
    () =>
      [-1, 1].flatMap(side =>
        Array.from(
          { length: high ? 7 : 5 },
          (_, index): Placement => ({
            position: [side * 0.34, 0.38 - index * 0.115, 0.19],
            scale: [index === 0 ? 0.31 : 0.42 - (index % 3) * 0.04, 0.012, 0.01],
            rotation: [0, side * 0.22, 0],
          })
        )
      ),
    [high]
  );
  return (
    <group name="celestial-open-book" rotation={[0.08, -0.06, -0.12]}>
      {[-1, 1].map(side => (
        <group key={side} position={[side * 0.34, 0, 0.06]} rotation={[0, side * 0.22, 0]}>
          <Block position={[0, 0, -0.1]} scale={[0.7, 1.3, 0.065]} color="#567080" />
          <Block position={[0, 0, -0.02]} scale={[0.65, 1.21, 0.12]} color="#c3bca9" />
          <Block position={[0, 0, 0.05]} scale={[0.63, 1.19, 0.025]} color="#e2dbcb" />
          {[-0.46, 0.46].map(y => (
            <Block key={y} position={[0, y, -0.087]} scale={[0.69, 0.035, 0.13]} color="#b9a67d" />
          ))}
        </group>
      ))}
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 1.3, 12]} />
        <meshStandardMaterial color="#627f8b" metalness={0.4} roughness={0.6} />
      </mesh>
      <Batch placements={ink} color="#7f8587" />
      <Block position={[0.24, -0.43, 0.23]} scale={[0.075, 0.62, 0.012]} color="#ba8f72" />
    </group>
  );
}

function SignalBeacon({ high }: FormProps) {
  const braces = useMemo(
    () =>
      [-1, 1].flatMap(side => [
        {
          position: [side * 0.31, -0.25, 0],
          scale: [0.04, 0.76, 0.04],
          rotation: [0, 0, side * -0.48],
        },
        {
          position: [0, -0.22, side * 0.22],
          scale: [0.035, 0.74, 0.035],
          rotation: [side * 0.35, 0, 0],
        },
      ]) as Placement[],
    []
  );
  return (
    <group name="deep-space-signal-beacon">
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.42, 0.53, 0.16, 8]} />
        <meshStandardMaterial color="#7b8078" metalness={0.65} roughness={0.55} />
      </mesh>
      <Batch placements={braces} color="#b8ab8b" metalness={0.7} />
      <mesh position={[0, -0.13, 0]}>
        <cylinderGeometry args={[0.065, 0.13, 0.94, 8]} />
        <meshStandardMaterial color="#c6b591" metalness={0.65} roughness={0.4} />
      </mesh>
      <group position={[0, 0.22, 0.02]} rotation={[Math.PI / 2 - 0.28, -0.18, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.53, high ? 40 : 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#c8c9b7"
            metalness={0.7}
            roughness={0.36}
            side={DoubleSide}
          />
        </mesh>
        <Ring
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.53}
          thickness={0.025}
          color="#cebf98"
        />
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.018, 0.035, 0.48, 8]} />
          <meshStandardMaterial color="#bba77d" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.41, 0]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color="#f1ddb1" emissive="#e8c38b" emissiveIntensity={0.8} />
        </mesh>
      </group>
      {[0, 1].map(index => (
        <Ring
          key={index}
          position={[0, 0.58 + index * 0.18, 0]}
          radius={0.18 + index * 0.12}
          thickness={0.012}
          rotation={[Math.PI / 2 - 0.25, 0, 0]}
          color="#ddcba4"
        />
      ))}
    </group>
  );
}

export function WorldForm({ world, ...props }: FormProps & { world: WorldDefinition }) {
  return (
    <group scale={world.radius}>
      {world.id === 'engineering' && <ReliabilityEngine {...props} />}
      {world.id === 'ai-lab' && <NeuralConstruct {...props} />}
      {world.id === 'projects' && <Shipyard {...props} />}
      {world.id === 'creative' && <CreativeSculpture {...props} />}
      {world.id === 'hush' && <CelestialGhost {...props} />}
      {world.id === 'writing' && <CelestialBook {...props} />}
      {world.id === 'contact' && <SignalBeacon {...props} />}
    </group>
  );
}
