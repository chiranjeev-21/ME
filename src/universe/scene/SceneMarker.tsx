import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { ReactNode } from 'react';
import type { Point3 } from './math.ts';

interface Props {
  position?: Point3;
  attributes: Record<string, string>;
  children?: ReactNode;
}

export function SceneMarker({ position, attributes, children }: Props) {
  const anchor = useRef<Group>(null);
  const element = useRef<HTMLSpanElement>(null);
  useFrame(() => {
    let object = anchor.current;
    let visible = true;
    let opacity = 1;
    while (object) {
      if (!object.visible) visible = false;
      if (typeof object.userData.expeditionOpacity === 'number') {
        opacity *= object.userData.expeditionOpacity;
      }
      object = object.parent as Group | null;
    }
    if (element.current) {
      element.current.style.display = visible ? 'block' : 'none';
      element.current.style.opacity = String(opacity);
    }
  });
  return (
    <group ref={anchor} position={position}>
      <Html center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
        <span
          ref={element}
          {...attributes}
          aria-hidden="true"
          style={{ display: 'block', width: 2, height: 2, pointerEvents: 'none' }}
        >
          {children}
        </span>
      </Html>
    </group>
  );
}
