import { useEffect, useMemo } from 'react';
import type { WorldDefinition } from '../types';
import { surfaceTexture } from './textures';

function Moon({ radius, high }: { radius: number; high: boolean }) {
  const texture = useMemo(() => surfaceTexture('archive', 81, high), [high]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group rotation={[0.35, 0.2, -0.25]}>
      <mesh position={[radius * 1.8, radius * 0.45, -radius * 0.3]}>
        <sphereGeometry args={[radius * 0.23, high ? 48 : 24, 16]} />
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

export function Landmarks({ world, high }: { world: WorldDefinition; high: boolean }) {
  return world.kind === 'ocean' ? <Moon radius={world.radius} high={high} /> : null;
}
