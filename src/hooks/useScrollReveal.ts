import { useEffect, useRef } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Attaches an IntersectionObserver to the returned ref.
 * Adds the `visible` CSS class when the element enters the viewport.
 * Unobserves after first intersection (fire once).
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): React.RefObject<T> {
  const { threshold = 0.12, rootMargin = '0px' } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
