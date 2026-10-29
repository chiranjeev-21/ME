import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Object3D } from 'three';
import type { InstancedMesh, Points } from 'three';
import { orbitPosition, seededRandom } from './math.ts';
import { glowTexture } from './textures';
import type { WorldDefinition } from '../types';

interface Props {
  high: boolean;
  mobile: boolean;
  reducedMotion: boolean;
  worlds: readonly WorldDefinition[];
  onRendered: () => void;
}

export function Environment({ high, mobile, reducedMotion, worlds, onRendered }: Props) {
  const stars = useRef<Points>(null);
  const asteroids = useRef<InstancedMesh>(null);
  const texture = useMemo(glowTexture, []);
  const starData = useMemo(() => {
    const random = seededRandom(7029);
    const count = high ? 1150 : 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new Color();
    for (let i = 0; i < count; i++) {
      positions.set([(random() - 0.5) * 270, (random() - 0.5) * 185, -35 - random() * 145], i * 3);
      color.set(random() > 0.7 ? '#b9c9df' : '#e5d7c1').multiplyScalar(0.25 + random() * 0.65);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    return { positions, colors };
  }, [high]);
  const guides = useMemo(
    () =>
      worlds.map(world => {
        const values = new Float32Array(129 * 3);
        for (let i = 0; i <= 128; i++) {
          values.set(orbitPosition({ ...world, phase: (i / 128) * Math.PI * 2 }, 0, mobile), i * 3);
        }
        return values;
      }),
    [mobile, worlds]
  );
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    if (!asteroids.current) return;
    const random = seededRandom(831);
    const dummy = new Object3D();
    for (let i = 0; i < asteroids.current.count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 9.5 + random() * 0.45;
      dummy.position.set(
        Math.cos(angle) * radius * (mobile ? 0.56 : 1),
        Math.sin(angle) * radius * (mobile ? 0.66 : 0.57),
        Math.sin(angle) * radius * 0.16 - 0.2
      );
      dummy.rotation.set(random() * 6, random() * 6, random() * 6);
      dummy.scale.setScalar(0.012 + random() * 0.028);
      dummy.updateMatrix();
      asteroids.current.setMatrixAt(i, dummy.matrix);
    }
    asteroids.current.instanceMatrix.needsUpdate = true;
  }, [high, mobile]);
  useFrame((_, delta) => {
    if (!reducedMotion && stars.current) stars.current.rotation.z += Math.min(delta, 0.05) * 0.0003;
  });
  return (
    <group>
      <points ref={stars} onAfterRender={onRendered} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={high ? 1.25 : 1.1}
          sizeAttenuation={false}
          vertexColors
          transparent
          opacity={0.68}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <sprite position={[23, 16, -80]} scale={[100, 58, 1]}>
        <spriteMaterial
          map={texture}
          color="#526779"
          opacity={0.12}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite position={[-38, -19, -96]} scale={[100, 70, 1]}>
        <spriteMaterial
          map={texture}
          color="#614c61"
          opacity={0.09}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      {guides.map((positions, index) => (
        <lineLoop key={worlds[index].id}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#a6aebc" transparent opacity={0.065} depthWrite={false} />
        </lineLoop>
      ))}
      <instancedMesh ref={asteroids} args={[undefined, undefined, high ? 95 : 32]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#5c554a" roughness={1} />
      </instancedMesh>
    </group>
  );
}
