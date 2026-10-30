import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { InstancedMesh, Mesh, MeshStandardMaterial, ShaderMaterial } from 'three';
import type { MutableRefObject, RefObject } from 'react';
import type { Point3 } from '../math.ts';
import type { Signal } from './useWorldSignal';
export type { Signal } from './useWorldSignal';

export interface Placement {
  position: Point3;
  scale: Point3;
  rotation?: Point3;
}

interface BatchProps {
  placements: readonly Placement[];
  shape?: 'box' | 'rock' | 'column' | 'sphere';
  color: string;
  emissive?: string;
  metalness?: number;
  materialRef?: RefObject<MeshStandardMaterial>;
}

export function Batch({
  placements,
  shape = 'box',
  color,
  emissive = '#000000',
  metalness = 0.1,
  materialRef,
}: BatchProps) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    placements.forEach((placement, index) => {
      dummy.position.fromArray(placement.position);
      dummy.scale.fromArray(placement.scale);
      dummy.rotation.set(...(placement.rotation ?? [0, 0, 0]));
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [placements]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, placements.length]}>
      {shape === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {shape === 'rock' && <icosahedronGeometry args={[1, 1]} />}
      {shape === 'column' && <cylinderGeometry args={[1, 1, 1, 8]} />}
      {shape === 'sphere' && <sphereGeometry args={[1, 12, 8]} />}
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        roughness={0.78}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={0.35}
      />
    </instancedMesh>
  );
}

export function Block({
  position,
  scale,
  color,
  rotation,
  emissive,
}: Placement & { color: string; emissive?: string }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <boxGeometry />
      <meshStandardMaterial
        color={color}
        roughness={0.72}
        metalness={0.18}
        emissive={emissive}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export function Ring({
  position,
  radius,
  color,
  rotation = [0, 0, 0],
  thickness = 0.055,
}: {
  position: Point3;
  radius: number;
  color: string;
  rotation?: Point3;
  thickness?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, thickness, 6, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.4}
        metalness={0.4}
      />
    </mesh>
  );
}

export function Ground({ color, onRendered }: { color: string; onRendered?: () => void }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -30]} onAfterRender={onRendered}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color={color} roughness={0.96} />
    </mesh>
  );
}

const skyVertex = `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;
const skyFragment = `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform float uOpacity;
  uniform float uSunGlow;
  varying vec3 vLocal;
  void main() {
    float height = smoothstep(-.08, .68, normalize(vLocal).y);
    vec3 color = mix(uHorizon, uTop, height);
    float glow = pow(max(0., dot(normalize(vLocal), normalize(vec3(-.6,.24,-1.)))), 24.);
    color += vec3(.24,.18,.1) * glow * uSunGlow;
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export function Sky({
  top,
  horizon,
  sunGlow = 1,
}: {
  top: string;
  horizon: string;
  sunGlow?: number;
}) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new Color(top) },
      uHorizon: { value: new Color(horizon) },
      uOpacity: { value: 1 },
      uSunGlow: { value: sunGlow },
    }),
    [top, horizon, sunGlow]
  );
  return (
    <mesh renderOrder={-100}>
      <sphereGeometry args={[160, 24, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        side={1}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function KineticLandmark({
  position,
  color,
  signal,
  reducedMotion,
  kind,
}: {
  position: Point3;
  color: string;
  signal: MutableRefObject<Signal>;
  reducedMotion: boolean;
  kind: 'research' | 'archive' | 'signal' | 'garden' | 'port';
}) {
  const core = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const time = useRef(0);
  const seededColor = useMemo(() => new Color(), []);
  useFrame((_, delta) => {
    if (!core.current || !ring.current || !material.current) return;
    const pulse = signal.current.pulse;
    if (!reducedMotion) time.current += Math.min(delta, 0.05);
    core.current.rotation.y = reducedMotion ? 0 : time.current * 0.12;
    ring.current.rotation.z = reducedMotion ? 0 : time.current * 0.065;
    ring.current.rotation.y = reducedMotion ? 0.3 : 0.3 + Math.sin(time.current * 0.14) * 0.3;
    const warmth = !reducedMotion && kind === 'signal' ? Math.sin(time.current * 0.6) * 0.04 : 0;
    ring.current.scale.setScalar(1 + pulse * 0.15 + warmth);
    material.current.emissiveIntensity = 0.35 + pulse * 1.4 + warmth;
    if (kind === 'garden') {
      seededColor.setHSL((signal.current.seed % 360) / 360, 0.32, 0.57);
      material.current.color.copy(seededColor);
      material.current.emissive.copy(seededColor).multiplyScalar(0.35);
      core.current.rotation.z = reducedMotion ? 0 : Math.sin(time.current * 0.35) * 0.055;
    }
  });
  return (
    <group position={position}>
      <mesh ref={core}>
        {kind === 'garden' ? (
          <icosahedronGeometry args={[1.15, 1]} />
        ) : kind === 'archive' ? (
          <boxGeometry args={[1.15, 1.5, 0.2]} />
        ) : (
          <octahedronGeometry args={[kind === 'signal' ? 0.45 : 0.7, 0]} />
        )}
        <meshStandardMaterial
          ref={material}
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.45}
          metalness={0.25}
        />
      </mesh>
      <mesh ref={ring} rotation={[kind === 'garden' ? 0.6 : 0.15, 0.3, 0]}>
        <torusGeometry args={[kind === 'signal' ? 1.1 : 1.8, 0.045, 6, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.65}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

const waterVertex = `
  uniform float uTime;
  varying vec2 vWater;
  varying float vWave;
  void main() {
    vec3 point = position;
    vWave = sin(point.x * .8 + uTime * .35) * cos(point.y * .6 + uTime * .2);
    point.z += vWave * .055;
    vWater = point.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.);
  }
`;
const waterFragment = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vWater;
  varying float vWave;
  void main() {
    float ripple = sin(vWater.x * 2. + sin(vWater.y + uTime * .18)) * .5 + .5;
    vec3 color = mix(vec3(.045,.15,.19), vec3(.18,.37,.40), vWave * .25 + .5);
    color += vec3(.11,.18,.18) * pow(ripple, 12.) * .25;
    float distanceFade = smoothstep(25., 110., length(vWater));
    color = mix(color, vec3(.16,.27,.31), distanceFade);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export function Water({
  reducedMotion,
  high,
  onRendered,
}: {
  reducedMotion: boolean;
  high: boolean;
  onRendered: () => void;
}) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }), []);
  useFrame((_, delta) => {
    if (!reducedMotion && material.current) {
      material.current.uniforms.uTime.value += Math.min(delta, 0.05);
    }
  });
  return (
    <mesh position={[0, -0.1, -30]} rotation={[-Math.PI / 2, 0, 0]} onAfterRender={onRendered}>
      <planeGeometry args={[200, 200, high ? 64 : 24, high ? 64 : 24]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
        toneMapped={false}
      />
    </mesh>
  );
}
