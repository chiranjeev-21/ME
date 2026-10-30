import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MutableRefObject } from 'react';
import type { UniverseSceneProps, WorldId } from '../../types';
import { signalSeed } from '../scrollMath.ts';

export interface Signal {
  pulse: number;
  seed: number;
}

export function useWorldSignal(
  world: WorldId,
  interaction: UniverseSceneProps['interaction'],
  reducedMotion: boolean
): MutableRefObject<Signal> {
  const signal = useRef<Signal>({ pulse: 0, seed: signalSeed(world) });
  const last = useRef<number | null>(null);
  useFrame(() => {
    const event = interaction?.current;
    if (!event || event.world !== world || event.kind === 'environment' || event.kind === 'hush') {
      signal.current.pulse = 0;
      return;
    }
    if (event.at !== last.current) {
      last.current = event.at;
      signal.current.seed = signalSeed(event.value);
    }
    const age = Math.max(0, performance.now() - event.at);
    signal.current.pulse = reducedMotion ? 0 : Math.exp(-age / 950);
  }, -5);
  return signal;
}
