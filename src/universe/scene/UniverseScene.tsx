import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { UniverseSceneProps } from '../types';
import { WORLDS } from '../worlds';
import { CameraRig } from './CameraRig';
import { Environment } from './Environment';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { orbitPosition } from './math.ts';

function RendererLifecycle({
  onError,
  reducedMotion,
}: Pick<UniverseSceneProps, 'onError' | 'reducedMotion'>) {
  const { gl, invalidate } = useThree();
  const errorCallback = useRef(onError);
  errorCallback.current = onError;
  useEffect(() => {
    const canvas = gl.domElement;
    let reported = false;
    const lost = (event: Event) => {
      event.preventDefault();
      if (reported) return;
      reported = true;
      errorCallback.current(
        'The 3D graphics context was interrupted. The text navigation remains available.'
      );
    };
    const restored = () => invalidate();
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, invalidate]);
  useEffect(() => {
    // Demand mode still needs a frame after responsive HTML labels and camera changes.
    invalidate();
  }, [invalidate, reducedMotion]);
  return null;
}

function System(props: UniverseSceneProps) {
  const { size } = useThree();
  const mobile = size.width / size.height < 0.95;
  const high = props.quality === 'high' && !mobile;
  const elapsed = useRef(0);
  const positions = useMemo(
    () => WORLDS.map(world => orbitPosition(world, elapsed.current, mobile)),
    [mobile]
  );
  const ready = useRef(false);
  const mounted = useRef(true);
  const readyCallback = useRef(props.onReady);
  readyCallback.current = props.onReady;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const markRendered = useCallback(() => {
    if (ready.current) return;
    ready.current = true;
    queueMicrotask(() => {
      if (mounted.current) readyCallback.current();
    });
  }, []);
  useFrame((_, delta) => {
    if (props.reducedMotion || props.selected) return;
    elapsed.current += Math.min(delta, 0.05);
    WORLDS.forEach((world, index) => {
      const next = orbitPosition(world, elapsed.current, mobile);
      positions[index][0] = next[0];
      positions[index][1] = next[1];
      positions[index][2] = next[2];
    });
  });
  return (
    <>
      <color attach="background" args={['#030509']} />
      <ambientLight intensity={0.24} color="#c4cedc" />
      <hemisphereLight args={['#b9cfdf', '#262229', 0.85]} />
      <directionalLight position={[-8, 11, 12]} intensity={1.7} color="#e5e6e3" />
      <pointLight position={[0, 0, 0]} intensity={95} distance={45} decay={2} color="#ffca8c" />
      <RendererLifecycle onError={props.onError} reducedMotion={props.reducedMotion} />
      <CameraRig
        selected={props.selected}
        entered={Boolean(props.entered || props.selected)}
        reducedMotion={props.reducedMotion}
        worlds={WORLDS}
        positions={positions}
        onCameraState={props.onCameraState}
      />
      <Environment
        high={high}
        mobile={mobile}
        reducedMotion={props.reducedMotion}
        worlds={WORLDS}
        onRendered={markRendered}
      />
      <Sun
        reducedMotion={props.reducedMotion}
        high={high}
        labelVisible={!props.selected && (!mobile || Boolean(props.entered))}
        onSelect={() => props.onSelect('about')}
      />
      {WORLDS.map((world, index) => (
        <Planet
          key={world.id}
          world={world}
          position={positions[index]}
          high={high}
          reducedMotion={props.reducedMotion}
          selected={props.selected === world.id}
          labelVisible={!props.selected && (!mobile || Boolean(props.entered))}
          onSelect={props.onSelect}
          projectMarkers={props.projectMarkers}
          onProjectSelect={props.onProjectSelect}
        />
      ))}
    </>
  );
}

export function UniverseScene(props: UniverseSceneProps) {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return (
    <Canvas
      camera={{ position: [0, 0, 35], fov: 42, near: 0.1, far: 350 }}
      dpr={props.quality === 'high' ? [1, 1.5] : 1}
      frameloop={visible && !props.reducedMotion ? 'always' : 'demand'}
      gl={{
        antialias: props.quality === 'high',
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}
      aria-label="Interactive CJ Universe. Select a world or use the world navigation."
    >
      <System {...props} />
    </Canvas>
  );
}
