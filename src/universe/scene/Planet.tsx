import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide, Color, SphereGeometry } from 'three';
import type { Group } from 'three';
import type { UniverseSceneProps, WorldDefinition } from '../types';
import type { Point3 } from './math.ts';
import { surfaceTexture } from './textures';
import { atmosphereFragment, surfaceVertex } from './shaders';
import { Landmarks } from './Landmarks';
import { ProjectBeacons } from './ProjectBeacons';
import { SceneMarker } from './SceneMarker';
import { AssetBoundary } from './assets/AssetBoundary';
import { EarthClouds, EarthSurface } from './assets/Earth';
import { WorldForm } from './WorldForms';

interface Props {
  world: WorldDefinition;
  position: Point3;
  high: boolean;
  reducedMotion: boolean;
  selected: boolean;
  labelVisible: boolean;
  onSelect: UniverseSceneProps['onSelect'];
  projectMarkers: UniverseSceneProps['projectMarkers'];
  onProjectSelect: UniverseSceneProps['onProjectSelect'];
  scrollJourney?: boolean;
  onAssetReady?: () => void;
}

export function Planet({
  world,
  position,
  high,
  reducedMotion,
  selected,
  labelVisible,
  onSelect,
  projectMarkers,
  onProjectSelect,
  scrollJourney = false,
  onAssetReady = () => {},
}: Props) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const elapsed = useRef(0);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(
    () => (world.kind === 'ocean' ? surfaceTexture('ocean', 17, high) : null),
    [high, world.kind]
  );
  const geometry = useMemo(
    () =>
      world.kind === 'ocean'
        ? new SphereGeometry(world.radius, high ? 64 : 32, high ? 48 : 24)
        : null,
    [high, world.kind, world.radius]
  );
  const atmosphere = useMemo(
    () => ({ uColor: { value: new Color(world.color) }, uOpacity: { value: 1 } }),
    [world.color]
  );
  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture]
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useFrame((_, delta) => {
    root.current?.position.fromArray(position);
    if (body.current && !reducedMotion) {
      elapsed.current += Math.min(delta, 0.05) * (selected ? 0.5 : 1);
      if (world.kind === 'ocean') body.current.rotation.y = elapsed.current * 0.035;
      else if (world.kind === 'industrial') body.current.rotation.z = elapsed.current * 0.025;
      else if (world.kind !== 'ghost') {
        // Faces, pages, instruments, and launch platforms stay presented to the visitor.
        body.current.rotation.y = Math.sin(elapsed.current * 0.12) * 0.075;
      }
    }
  });
  return (
    <group ref={root} position={position}>
      <group
        ref={body}
        onClick={event => {
          event.stopPropagation();
          onSelect(world.id);
        }}
        onPointerOver={event => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {geometry && texture ? (
          <AssetBoundary
            fallback={
              <mesh geometry={geometry}>
                <meshStandardMaterial
                  map={texture}
                  bumpMap={texture}
                  bumpScale={0.009}
                  metalness={0.16}
                  roughness={0.4}
                />
              </mesh>
            }
          >
            <EarthSurface geometry={geometry} onReady={onAssetReady} />
          </AssetBoundary>
        ) : (
          <WorldForm world={world} high={high} reducedMotion={reducedMotion} />
        )}
        {world.kind === 'ocean' && (
          <EarthClouds radius={world.radius} high={high} reducedMotion={reducedMotion} />
        )}
        <Landmarks world={world} high={high} />
      </group>
      {world.kind === 'ocean' && (
        <mesh scale={hovered ? 1.1 : 1.065}>
          <sphereGeometry args={[world.radius, high ? 48 : 24, 24]} />
          <shaderMaterial
            uniforms={atmosphere}
            vertexShader={surfaceVertex}
            fragmentShader={atmosphereFragment}
            side={BackSide}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
      {selected && world.kind === 'terracotta' && !scrollJourney && (
        <ProjectBeacons radius={world.radius} markers={projectMarkers} onSelect={onProjectSelect} />
      )}
      <SceneMarker attributes={{ 'data-world-pick': world.id }}>
        {labelVisible && (
          <span
            style={{
              position: 'absolute',
              top: world.radius > 0.8 ? 35 : 29,
              left: '50%',
              transform: 'translateX(-50%)',
              color: hovered ? '#f5ead9' : '#bfc3cc',
              fontSize: 10,
              fontWeight: 450,
              letterSpacing: '.08em',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 6px #020308, 0 2px 12px #020308',
            }}
          >
            <span style={{ opacity: 0.45, marginRight: 5, fontSize: 8 }}>{world.number}</span>
            {world.name}
          </span>
        )}
      </SceneMarker>
      <SceneMarker position={[world.radius, 0, 0]} attributes={{ 'data-world-limb': world.id }} />
      <SceneMarker
        attributes={{
          'data-world-form': world.id,
          'data-form-kind': world.kind,
          'data-form-description': world.form ?? world.name,
          'data-form-landmark': {
            about: 'living-earth',
            engineering: 'reliability-engine',
            'ai-lab': 'neural-inspection-lens',
            projects: 'orbital-shipyard',
            creative: 'living-lyre',
            hush: 'inhabited-celestial-ghost',
            writing: 'celestial-open-book',
            contact: 'deep-space-signal-beacon',
          }[world.id],
        }}
      />
    </group>
  );
}
