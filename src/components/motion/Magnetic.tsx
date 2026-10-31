import { useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { useMotionValue, useSpring, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import styles from './Magnetic.module.css';

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Fraction of the pointer offset the element follows. */
  strength?: number;
}

const SPRING = { stiffness: 170, damping: 17, mass: 0.7 };

/**
 * A restrained magnetic pull for primary actions. The label travels a little
 * further than its frame, which reads as depth rather than wobble. Only fine
 * pointers engage it; keyboard focus and touch are unaffected.
 */
export function Magnetic({ children, className, strength = 0.28 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  const innerX = useTransform(sx, value => value * 0.45);
  const innerY = useTransform(sy, value => value * 0.45);

  const onMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== 'mouse' || !ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.span
      ref={ref}
      className={`${styles.magnetic} ${className ?? ''}`}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      <m.span className={styles.inner} style={{ x: innerX, y: innerY }}>
        {children}
      </m.span>
    </m.span>
  );
}
