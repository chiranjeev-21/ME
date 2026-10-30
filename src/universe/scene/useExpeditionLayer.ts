import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { RefObject } from 'react';
import type { UniverseSceneProps } from '../types';
import { expeditionVisibility } from './scrollMath.ts';
import { createExpeditionLayer } from './expeditionLayer.ts';

export function useExpeditionLayer(
  root: RefObject<Group>,
  journey: UniverseSceneProps['journey'],
  reducedMotion: boolean,
  layer: 'exterior' | 'interior'
) {
  const controller = useRef<ReturnType<typeof createExpeditionLayer> | null>(null);
  useLayoutEffect(() => {
    if (!journey || !root.current) return;
    const current = createExpeditionLayer(root.current);
    controller.current = current;
    return () => {
      current.dispose();
      controller.current = null;
    };
  });
  useFrame(() => {
    if (!journey) return;
    controller.current?.setOpacity(expeditionVisibility(journey.current, reducedMotion)[layer]);
  }, -20);
}
