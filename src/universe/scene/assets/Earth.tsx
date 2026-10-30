import { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SRGBColorSpace } from 'three';
import type { Group, SphereGeometry } from 'three';
import { WORLD_ASSETS } from './catalog';
import { cloudTexture } from '../textures';

export function EarthSurface({
  geometry,
  onReady,
}: {
  geometry: SphereGeometry;
  onReady: () => void;
}) {
  const map = useTexture(WORLD_ASSETS.earth);
  useLayoutEffect(() => {
    map.colorSpace = SRGBColorSpace;
    onReady();
  }, [map, onReady]);
  return (
    <mesh>
      <primitive attach="geometry" object={geometry} />
      <meshPhysicalMaterial
        map={map}
        roughness={0.73}
        metalness={0.04}
        clearcoat={0.23}
        clearcoatRoughness={0.6}
      />
    </mesh>
  );
}

export function EarthClouds({
  radius,
  high,
  reducedMotion,
}: {
  radius: number;
  high: boolean;
  reducedMotion: boolean;
}) {
  const root = useRef<Group>(null);
  const map = useMemo(() => cloudTexture(high), [high]);
  useEffect(() => () => map.dispose(), [map]);
  useFrame((_, delta) => {
    if (root.current && !reducedMotion) root.current.rotation.y += Math.min(delta, 0.05) * 0.014;
  });
  return (
    <group ref={root}>
      <mesh>
        <sphereGeometry args={[radius * 1.012, high ? 64 : 32, 32]} />
        <meshStandardMaterial
          color="#dbeaf2"
          alphaMap={map}
          opacity={0.69}
          transparent
          depthWrite={false}
          roughness={1}
        />
      </mesh>
    </group>
  );
}
