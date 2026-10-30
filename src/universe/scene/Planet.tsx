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
}: Props) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(
    () => surfaceTexture(world.kind, Number(world.number) * 17, high),
    [high, world.kind, world.number]
  );
  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(world.radius, high ? 64 : 32, high ? 48 : 24);
    if (world.kind !== 'ocean') {
      const positions = sphere.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const relief = 1 + Math.sin(x * 23 + y * 17) * Math.sin(z * 19 - x * 9) * 0.008;
        positions.setXYZ(i, x * relief, y * relief, z * relief);
      }
      sphere.computeVertexNormals();
    }
    return sphere;
  }, [high, world.kind, world.radius]);
  const atmosphere = useMemo(
    () => ({ uColor: { value: new Color(world.color) }, uOpacity: { value: 1 } }),
    [world.color]
  );
  useEffect(
    () => () => {
      texture.dispose();
    },
    [texture]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    root.current?.position.fromArray(position);
    if (body.current && !reducedMotion) {
      body.current.rotation.y += Math.min(delta, 0.05) * (selected ? 0.018 : 0.035);
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
        <mesh>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial
            map={texture}
            bumpMap={texture}
            bumpScale={world.kind === 'ocean' ? 0.009 : 0.035}
            metalness={world.kind === 'research' ? 0.24 : world.kind === 'ocean' ? 0.16 : 0.05}
            roughness={world.kind === 'ocean' ? 0.4 : 0.88}
            emissive={world.color}
            emissiveIntensity={hovered ? 0.09 : 0.012}
          />
        </mesh>
        <Landmarks world={world} high={high} />
      </group>
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
    </group>
  );
}
