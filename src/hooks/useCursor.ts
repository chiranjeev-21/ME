import { useEffect, useRef, useCallback } from 'react';

interface CursorRefs {
  dotRef: React.RefObject<HTMLDivElement>;
  ringRef: React.RefObject<HTMLDivElement>;
}

/**
 * Drives a two-part custom cursor:
 * - dot:  snaps instantly to mouse position
 * - ring: lerps toward mouse position (trailing effect)
 */
export function useCursor(): CursorRefs {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const animate = useCallback(() => {
    ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
    ring.current.y += (mouse.current.y - ring.current.y) * 0.12;

    if (ringRef.current) {
      ringRef.current.style.left = `${ring.current.x}px`;
      ringRef.current.style.top = `${ring.current.y}px`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  return { dotRef, ringRef };
}
