import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function usePortfolioMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
    const sections = root.querySelectorAll<HTMLElement>('[data-section]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = 'true';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    targets.forEach(target => observer.observe(target));
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      let active = 'hero';
      sections.forEach(section => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) {
          active = section.id;
        }
      });
      root.style.setProperty('--page-progress', String(progress));
      root.style.setProperty(
        '--hero-shift',
        `${reducedMotion ? 0 : Math.min(window.scrollY, 900) * 0.12}px`
      );
      root.style.setProperty(
        '--orbit-turn',
        `${reducedMotion ? 0 : Math.min(window.scrollY, 1600) * 0.05}deg`
      );
      setActiveSection(previous => (previous === active ? previous : active));
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reducedMotion]);

  return { ref, activeSection, reducedMotion };
}
