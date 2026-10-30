import { useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { UniverseSceneProps } from '../types';
import { SceneMarker } from './SceneMarker';
import { projectBeaconPosition } from './scrollMath.ts';

interface Props {
  radius: number;
  markers: UniverseSceneProps['projectMarkers'];
  onSelect: UniverseSceneProps['onProjectSelect'];
  interior?: boolean;
}

export function ProjectBeacons({ radius, markers, onSelect, interior = false }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { size } = useThree();
  return (
    <group>
      {markers.slice(0, size.width < 600 ? 3 : 6).map((marker, index, visible) => {
        const angle = (index / Math.max(visible.length, 1)) * Math.PI * 2 + 0.4;
        const x = Math.cos(angle) * radius * 0.59;
        const y = Math.sin(angle) * radius * 0.59;
        const z = Math.sqrt(radius * radius - x * x - y * y) + radius * 0.16;
        const position = interior
          ? projectBeaconPosition(index, size.width / size.height < 0.95)
          : ([x, y, z] as [number, number, number]);
        const sizeFactor = interior ? 4.5 : 1;
        return (
          <group key={marker.slug} position={position}>
            {interior && (
              <mesh position={[0, -0.5, 0]}>
                <cylinderGeometry args={[0.95, 1.15, 0.3, 24]} />
                <meshStandardMaterial color="#b4a797" roughness={0.85} />
              </mesh>
            )}
            <mesh
              onClick={event => {
                event.stopPropagation();
                onSelect(marker.slug);
              }}
              onPointerOver={event => {
                event.stopPropagation();
                setHovered(marker.slug);
              }}
              onPointerOut={() => setHovered(null)}
            >
              <sphereGeometry args={[radius * 0.115 * sizeFactor, 12, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[radius * 0.038 * sizeFactor, 12, 8]} />
              <meshBasicMaterial
                color={hovered === marker.slug ? '#fff7df' : '#f8cc8c'}
                toneMapped={false}
              />
            </mesh>
            <mesh rotation={[0, 0, angle]}>
              <torusGeometry
                args={[radius * 0.08 * sizeFactor, radius * 0.007 * sizeFactor, 5, 24]}
              />
              <meshBasicMaterial color="#f0c48c" transparent opacity={0.7} toneMapped={false} />
            </mesh>
            <SceneMarker attributes={{ 'data-project-beacon': marker.slug }}>
              <span
                style={{
                  position: 'absolute',
                  top: 13,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 130,
                  textAlign: 'center',
                  fontSize: 9,
                  lineHeight: 1.4,
                  color: hovered === marker.slug ? '#fff2d6' : '#deceb9',
                  textShadow: '0 1px 5px #000, 0 1px 9px #000',
                }}
              >
                {marker.title}
              </span>
            </SceneMarker>
          </group>
        );
      })}
    </group>
  );
}
