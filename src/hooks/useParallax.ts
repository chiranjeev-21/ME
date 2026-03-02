import { useEffect, useRef } from 'react';

export interface ParallaxTarget {
  ref: React.RefObject<HTMLElement>;
  /** px multiplied by the –0.5..0.5 mouse offset. Negative inverts direction. */
  factorX: number;
  factorY: number;
}

/**
 * Applies a CSS translate to each target based on mouse position
 * relative to the given container element.
 */
export function useParallax(
  containerRef: React.RefObject<HTMLElement>,
  targets: ParallaxTarget[]
): void {
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;

      targetsRef.current.forEach(({ ref, factorX, factorY }) => {
        if (ref.current) {
          ref.current.style.transform = `translate(${cx * factorX}px, ${cy * factorY}px)`;
        }
      });
    };

    container.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => container.removeEventListener('mousemove', onMouseMove);
  }, [containerRef]);
}
