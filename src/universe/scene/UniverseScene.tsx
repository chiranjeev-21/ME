import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { Group } from 'three';
import type { UniverseSceneProps } from '../types';
import { WORLDS } from '../worlds';
import { CameraRig } from './CameraRig';
import { Environment } from './Environment';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { orbitPosition } from './math.ts';
import { ScrollCameraRig } from './ScrollCameraRig';
import { WorldEnvironment } from './interiors/WorldEnvironment';
import { useExpeditionLayer } from './useExpeditionLayer';

function RendererLifecycle({
  onError,
  reducedMotion,
  journey,
  selected,
}: Pick<UniverseSceneProps, 'onError' | 'reducedMotion' | 'journey' | 'selected'>) {
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
  }, [invalidate, reducedMotion, selected]);
  useEffect(() => {
    if (!journey || !reducedMotion) return;
    const update = () => {
      // A second demand frame also sees refs written by a scroll/input RAF in this event.
      if (!document.hidden) invalidate(2);
    };
    const events = ['scroll', 'click', 'input', 'change', 'keyup'] as const;
    events.forEach(event =>
      window.addEventListener(event, update, { passive: true, capture: true })
    );
    return () => events.forEach(event => window.removeEventListener(event, update, true));
  }, [invalidate, journey, reducedMotion]);
  return null;
}

function System(props: UniverseSceneProps) {
  const { size } = useThree();
  const mobile = size.width / size.height < 0.95;
  const high = props.quality === 'high' && !mobile;
  const solar = useRef<Group>(null);
  const [activeWorld, setActiveWorld] = useState(props.journey?.current.world ?? null);
  const elapsed = useRef(0);
  const positions = useMemo(
    () => WORLDS.map(world => orbitPosition(world, elapsed.current, mobile)),
    [mobile]
  );
  const activeIndex = WORLDS.findIndex(world => world.id === activeWorld);
  useExpeditionLayer(solar, props.journey, props.reducedMotion, 'exterior');
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
    if (props.journey && props.journey.current.world !== activeWorld) {
      // Only chapter boundaries mount scenery; precise scroll progress stays entirely in refs.
      setActiveWorld(props.journey.current.world);
    }
    if (props.reducedMotion || (props.journey ? props.journey.current.world : props.selected))
      return;
    elapsed.current += Math.min(delta, 0.05);
    WORLDS.forEach((world, index) => {
      const next = orbitPosition(world, elapsed.current, mobile);
      positions[index][0] = next[0];
      positions[index][1] = next[1];
      positions[index][2] = next[2];
    });
  }, -40);
  return (
    <>
      <color attach="background" args={['#030509']} />
      <ambientLight intensity={0.24} color="#c4cedc" />
      <hemisphereLight args={['#b9cfdf', '#262229', 0.85]} />
      <directionalLight position={[-8, 11, 12]} intensity={1.7} color="#e5e6e3" />
      <pointLight position={[0, 0, 0]} intensity={95} distance={45} decay={2} color="#ffca8c" />
      <RendererLifecycle
        onError={props.onError}
        reducedMotion={props.reducedMotion}
        journey={props.journey}
        selected={props.selected}
      />
      {props.journey ? (
        <ScrollCameraRig
          journey={props.journey}
          reducedMotion={props.reducedMotion}
          worlds={WORLDS}
          positions={positions}
          onCameraState={props.onCameraState}
        />
      ) : (
        <CameraRig
          selected={props.selected}
          entered={Boolean(props.entered || props.selected)}
          reducedMotion={props.reducedMotion}
          worlds={WORLDS}
          positions={positions}
          onCameraState={props.onCameraState}
        />
      )}
      <group ref={solar}>
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
            selected={(props.journey ? activeWorld : props.selected) === world.id}
            labelVisible={!props.selected && (!mobile || Boolean(props.entered))}
            onSelect={props.onSelect}
            projectMarkers={props.projectMarkers}
            onProjectSelect={props.onProjectSelect}
            scrollJourney={Boolean(props.journey)}
          />
        ))}
      </group>
      {props.journey && activeIndex >= 0 && (
        <WorldEnvironment
          key={activeWorld}
          world={WORLDS[activeIndex]}
          position={positions[activeIndex]}
          journey={props.journey}
          interaction={props.interaction}
          high={high}
          reducedMotion={props.reducedMotion}
          projectMarkers={props.projectMarkers}
          onProjectSelect={props.onProjectSelect}
          onRendered={markRendered}
        />
      )}
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
      camera={{ position: [0, 0, 35], fov: 42, near: 0.005, far: 350 }}
      dpr={props.quality === 'high' ? [1, 1.5] : 1}
      frameloop={visible && !props.reducedMotion ? 'always' : 'demand'}
      gl={{
        antialias: props.quality === 'high',
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.domElement.style.touchAction = 'pan-y';
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
