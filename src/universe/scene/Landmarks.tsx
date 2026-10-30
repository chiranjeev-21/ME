import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D, Vector3 } from 'three';
import type { InstancedMesh } from 'three';
import type { WorldDefinition } from '../types';
import { seededRandom } from './math.ts';
import { surfaceTexture } from './textures';

interface Props {
  world: WorldDefinition;
  high: boolean;
}

function Structures({ world, high }: Props) {
  const buildings = useRef<InstancedMesh>(null);
  const crowns = useRef<InstancedMesh>(null);
  const count = high ? 34 : 18;
  const garden = world.kind === 'garden';
  const normals = useMemo(() => {
    const random = seededRandom(world.number.charCodeAt(1) * 317);
    return Array.from({ length: count }, () => ({
      normal: new Vector3(
        (random() - 0.5) * 1.8,
        (random() - 0.45) * 1.7,
        0.15 + random()
      ).normalize(),
      height: 0.055 + random() * 0.14,
      width: 0.035 + random() * 0.075,
    }));
  }, [count, world.number]);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const up = new Vector3(0, 1, 0);
    normals.forEach(({ normal, height, width }, i) => {
      dummy.position.copy(normal).multiplyScalar(world.radius * (1 + height * 0.4));
      dummy.quaternion.setFromUnitVectors(up, normal);
      dummy.scale.set(
        world.radius * width,
        world.radius * height,
        world.radius * (garden ? width : width * 1.6)
      );
      dummy.updateMatrix();
      buildings.current?.setMatrixAt(i, dummy.matrix);
      if (garden) {
        dummy.position.copy(normal).multiplyScalar(world.radius * (1 + height));
        dummy.scale.setScalar(world.radius * (width + 0.035));
        dummy.updateMatrix();
        crowns.current?.setMatrixAt(i, dummy.matrix);
      }
    });
    if (buildings.current) buildings.current.instanceMatrix.needsUpdate = true;
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
  }, [garden, normals, world.radius]);
  const color =
    world.kind === 'terracotta'
      ? '#dab18b'
      : world.kind === 'archive'
        ? '#dadbd2'
        : garden
          ? '#66573e'
          : '#a9a197';
  return (
    <group>
      <instancedMesh ref={buildings} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          metalness={world.kind === 'industrial' ? 0.5 : 0.12}
          roughness={0.75}
        />
      </instancedMesh>
      {garden && (
        <instancedMesh ref={crowns} args={[undefined, undefined, count]}>
          <icosahedronGeometry args={[1, high ? 1 : 0]} />
          <meshStandardMaterial color="#8fba76" roughness={0.95} />
        </instancedMesh>
      )}
    </group>
  );
}

function Observatory({ radius, archive }: { radius: number; archive: boolean }) {
  return (
    <group position={[0, radius * 0.72, radius * 0.78]} rotation={[0.78, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[radius * 0.19, radius * 0.23, radius * 0.08, 16]} />
        <meshStandardMaterial
          color={archive ? '#d6d5c7' : '#9a99ae'}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, radius * 0.05, 0]}>
        <sphereGeometry args={[radius * 0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={archive ? '#e5e3d7' : '#b4b1ce'}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[radius * 0.02, radius * 0.13, radius * 0.11]} rotation={[0.72, 0, -0.3]}>
        <cylinderGeometry args={[radius * 0.035, radius * 0.045, radius * 0.3, 10]} />
        <meshStandardMaterial color="#4d5962" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Moon({ radius, high }: { radius: number; high: boolean }) {
  const texture = useMemo(() => surfaceTexture('archive', 81, high), [high]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group rotation={[0.35, 0.2, -0.25]}>
      <mesh position={[radius * 1.8, radius * 0.45, -radius * 0.3]}>
        <sphereGeometry args={[radius * 0.23, high ? 48 : 32, 24]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={texture}
          bumpScale={radius * 0.008}
          color="#b4b8b2"
          roughness={1}
        />
      </mesh>
    </group>
  );
}

export function Landmarks({ world, high }: Props) {
  const r = world.radius;
  const kind = world.kind;
  return (
    <group>
      {(kind === 'industrial' ||
        kind === 'terracotta' ||
        kind === 'garden' ||
        kind === 'archive') && <Structures world={world} high={high} />}
      {kind === 'ocean' && <Moon radius={r} high={high} />}
      {(kind === 'industrial' || kind === 'archive') && (
        <mesh rotation={[Math.PI / 2.8, 0.2, 0.35]}>
          <torusGeometry args={[r * 1.025, r * 0.009, 5, high ? 96 : 48]} />
          <meshStandardMaterial color={world.color} metalness={0.55} roughness={0.45} />
        </mesh>
      )}
      {(kind === 'research' || kind === 'archive') && (
        <Observatory radius={r} archive={kind === 'archive'} />
      )}
      {kind === 'research' && (
        <group rotation={[0.3, -0.2, -0.25]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 1.42, r * 0.008, 5, high ? 96 : 48]} />
            <meshStandardMaterial color="#b4a9cc" emissive="#706286" emissiveIntensity={0.3} />
          </mesh>
          {Array.from({ length: 6 }, (_, index) => {
            const angle = (index / 6) * Math.PI * 2;
            return (
              <mesh
                key={index}
                position={[Math.cos(angle) * r * 1.42, 0, Math.sin(angle) * r * 1.42]}
                rotation={[0.3, angle, 0.3]}
              >
                <octahedronGeometry args={[r * 0.09, 0]} />
                <meshStandardMaterial
                  color="#c4bed4"
                  metalness={0.55}
                  roughness={0.3}
                  emissive="#837299"
                  emissiveIntensity={0.28}
                />
              </mesh>
            );
          })}
        </group>
      )}
      {kind === 'beacon' && (
        <group position={[0, r * 0.94, 0]} rotation={[0.22, 0, -0.15]}>
          <mesh position={[0, r * 0.22, 0]}>
            <cylinderGeometry args={[r * 0.035, r * 0.1, r * 0.6, 8]} />
            <meshStandardMaterial color="#bba77c" metalness={0.65} roughness={0.5} />
          </mesh>
          <mesh position={[0, r * 0.54, 0]}>
            <sphereGeometry args={[r * 0.065, 12, 8]} />
            <meshBasicMaterial color="#ffe1a0" toneMapped={false} />
          </mesh>
          {[0, 1, 2].map(index => (
            <mesh
              key={index}
              position={[0, r * (0.53 + index * 0.19), 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[r * (0.18 + index * 0.13), r * 0.008, 5, 48]} />
              <meshBasicMaterial
                color="#e7c68c"
                transparent
                opacity={0.6 - index * 0.16}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
