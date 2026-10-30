import { useLayoutEffect, useMemo } from 'react';
import { Environment, useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace, Vector2 } from 'three';
import type { Point3 } from '../math';
import { AssetBoundary } from './AssetBoundary';
import { WORLD_ASSETS } from './catalog';
import { Model } from './Model';
import type { PopulationProps } from './Inhabitants';

function ForestMaterial({ onReady, tint }: { onReady: () => void; tint: string }) {
  const textures = useTexture([WORLD_ASSETS.forest, WORLD_ASSETS.normal]);
  const [color, normal] = useMemo(
    () =>
      textures.map((source, index) => {
        const texture = source.clone();
        if (index === 0) texture.colorSpace = SRGBColorSpace;
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(28, 28);
        return texture;
      }),
    [textures]
  );
  useLayoutEffect(() => {
    onReady();
    return () => {
      color.dispose();
      normal.dispose();
    };
  }, [color, normal, onReady]);
  return (
    <meshStandardMaterial
      color={tint}
      map={color}
      normalMap={normal}
      normalScale={new Vector2(0.65, 0.65)}
      roughness={0.96}
    />
  );
}

export function ForestFloor({ onReady, tint = '#ffffff' }: { onReady: () => void; tint?: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, -30]}>
      <planeGeometry args={[180, 180]} />
      <AssetBoundary fallback={<meshStandardMaterial color="#27352e" roughness={1} />}>
        <ForestMaterial onReady={onReady} tint={tint} />
      </AssetBoundary>
    </mesh>
  );
}

const TREES: Point3[] = [
  [-9, 0.1, -8],
  [-12, 0.1, -12],
  [-5, 0.1, -11],
  [-17, 0.1, -22],
  [3, 0.1, -24],
  [-15, 0.1, -32],
];
export function LivingTrees(props: PopulationProps) {
  return (
    <group>
      {TREES.slice(0, props.high ? 6 : 3).map((position, index) => (
        <group key={index} position={position} rotation={[0, index * 1.7, 0]}>
          <AssetBoundary>
            <Model {...props} url={WORLD_ASSETS.tree} height={3.6 + (index % 2)} />
          </AssetBoundary>
        </group>
      ))}
    </group>
  );
}

export function SurfaceLighting() {
  return (
    <AssetBoundary>
      <Environment files={WORLD_ASSETS.lighting} environmentIntensity={0.38} />
    </AssetBoundary>
  );
}
