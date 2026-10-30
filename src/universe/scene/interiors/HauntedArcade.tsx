import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Block, Batch } from './Scenery';
import type { Placement } from './Scenery';
import { Inhabitants } from '../assets/Inhabitants';
import type { PopulationProps } from '../assets/Inhabitants';
import { ForestFloor, LivingTrees } from '../assets/SurfaceAssets';
import { surfaceTexture } from '../textures';

export function HauntedArcade(props: PopulationProps & { illuminated: boolean }) {
  const mist = useRef<Group>(null);
  const elapsed = useRef(0);
  const moon = useMemo(() => surfaceTexture('archive', 81, false), []);
  useEffect(() => () => moon.dispose(), [moon]);
  const fence = useMemo(
    () =>
      Array.from(
        { length: 22 },
        (_, index): Placement => ({
          position: [-17 + index * 1.05, 1, -18],
          scale: [0.14, 2 + Math.sin(index) * 0.2, 0.14],
        })
      ),
    []
  );
  useFrame((_, delta) => {
    if (!mist.current || props.reducedMotion || props.journey.current.entry < 0.2) return;
    elapsed.current += Math.min(delta, 0.05);
    mist.current.position.x = Math.sin(elapsed.current * 0.13) * 0.6;
  });
  return (
    <group>
      <ForestFloor onReady={props.onReady} tint="#4d6462" />
      <mesh position={[-14, 14, -42]}>
        <sphereGeometry args={[3, 32, 24]} />
        <meshBasicMaterial map={moon} color="#c5d6cd" />
      </mesh>
      <LivingTrees {...props} />
      <Batch placements={fence} color="#2a3538" />
      <Block position={[-6, 3.2, -11]} scale={[8.4, 6.4, 0.45]} color="#17252c" />
      <Block position={[-6, 6.5, -10.8]} scale={[9.3, 0.45, 1.2]} color="#38443f" />
      <Block position={[-6, 2, -10.5]} scale={[2.6, 4, 0.25]} color="#071014" />
      <mesh position={[-6, 3, -10.3]}>
        <torusGeometry args={[1.65, 0.1, 8, 48, Math.PI]} />
        <meshStandardMaterial
          color="#9b9b76"
          roughness={0.6}
          emissive="#86af9b"
          emissiveIntensity={0.18}
        />
      </mesh>
      {[-10, -2].map((x, index) => (
        <group key={x} position={[x, 0, -8 + index * 2]}>
          <Block position={[0, 0.8, 0]} scale={[1.35, 1.6, 1]} color="#303446" />
          <Block
            position={[0, 1.9, -0.18]}
            scale={[1.35, 1.1, 0.6]}
            color="#1e2430"
            rotation={[-0.12, 0, 0]}
          />
          <Block
            position={[0, 1.95, 0.15]}
            scale={[0.92, 0.65, 0.04]}
            color="#3b8f89"
            emissive="#4da898"
          />
          <Block position={[0, 1.2, 0.48]} scale={[1.25, 0.16, 0.5]} color="#6e6964" />
          <mesh position={[-0.27, 1.4, 0.48]}>
            <sphereGeometry args={[0.09, 12, 8]} />
            <meshStandardMaterial color="#bc977c" />
          </mesh>
        </group>
      ))}
      <Inhabitants {...props} kind="ghost" />
      <group ref={mist} position={[0, 0.35, 0]}>
        {Array.from({ length: 5 }, (_, index) => (
          <mesh key={index} position={[-12 + index * 4, 0.2, -5 - index * 3]} scale={[5, 0.15, 2]}>
            <sphereGeometry args={[1, 16, 8]} />
            <meshBasicMaterial color="#819e9a" transparent opacity={0.075} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[-6, 5.3, -10.45]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshBasicMaterial color={props.illuminated ? '#d9ffbd' : '#6a938a'} />
      </mesh>
      <pointLight
        position={[-6, 4.5, -5]}
        intensity={props.illuminated ? 0.055 : 0.004}
        color="#c2ffd7"
        distance={1.5}
        decay={2}
      />
    </group>
  );
}
