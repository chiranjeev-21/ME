import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function WorldDocument({ active, children }: { active: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const revealed = useRef(new WeakSet<Element>());

  useEffect(() => {
    const element = root.current;
    if (
      !active ||
      !element ||
      !('IntersectionObserver' in window) ||
      typeof window.matchMedia !== 'function'
    )
      return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');

    let intersections: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    const stop = () => {
      intersections?.disconnect();
      mutations?.disconnect();
    };
    const start = () => {
      stop();
      if (preference.matches) return;
      intersections = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            revealed.current.add(entry.target);
            entry.target.setAttribute('data-revealed', 'true');
            intersections?.unobserve(entry.target);
          }
        },
        { threshold: 0.08 }
      );
      const observe = () => {
        element.querySelectorAll('[data-reveal]').forEach(section => {
          if (!revealed.current.has(section)) intersections?.observe(section);
        });
      };
      observe();
      mutations = new MutationObserver(observe);
      mutations.observe(element, { childList: true, subtree: true });
    };
    start();
    preference.addEventListener('change', start);
    return () => {
      stop();
      preference.removeEventListener('change', start);
    };
  }, [active]);

  return (
    <div ref={root} className="uw-document" data-active={active}>
      {children}
    </div>
  );
}
