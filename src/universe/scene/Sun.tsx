import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide } from 'three';
import type { ShaderMaterial } from 'three';
import { glowTexture } from './textures';
import { coronaFragment, sunFragment, surfaceVertex } from './shaders';

interface Props {
  reducedMotion: boolean;
  high: boolean;
  labelVisible: boolean;
  onSelect: () => void;
}

export function Sun({ reducedMotion, high, labelVisible, onSelect }: Props) {
  const texture = useMemo(glowTexture, []);
  const material = useRef<ShaderMaterial>(null);
  const corona = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const [hovered, setHovered] = useState(false);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (material.current) material.current.uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return (
    <group>
      <sprite scale={[13.5, 13.5, 1]}>
        <spriteMaterial
          map={texture}
          color="#e5a464"
          opacity={0.37}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[7.6, 7.6, 1]}>
        <spriteMaterial
          map={texture}
          opacity={hovered ? 0.79 : 0.63}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <mesh
        onClick={event => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerOver={event => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.58, high ? 64 : 32, high ? 48 : 24]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={surfaceVertex}
          fragmentShader={sunFragment}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.14}>
        <sphereGeometry args={[1.58, high ? 48 : 24, 24]} />
        <shaderMaterial
          ref={corona}
          uniforms={uniforms}
          vertexShader={surfaceVertex}
          fragmentShader={coronaFragment}
          transparent
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Html center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
        <span
          data-sun-pick
          style={{ display: 'block', width: 2, height: 2, pointerEvents: 'none' }}
        >
          {labelVisible && (
            <span
              style={{
                position: 'absolute',
                top: high ? 62 : 48,
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#e9c99c',
                fontSize: 10,
                letterSpacing: '.28em',
                whiteSpace: 'nowrap',
                textShadow: '0 2px 9px #000',
              }}
            >
              CJ · THE CORE
            </span>
          )}
        </span>
      </Html>
    </group>
  );
}
