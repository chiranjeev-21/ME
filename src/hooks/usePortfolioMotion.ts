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
    const journey = root.querySelector<HTMLElement>('[data-journey]');
    const scene = root.querySelector<HTMLElement>('[data-journey-scene]');
    const departure = root.querySelector<HTMLElement>('[data-departure]');
    const arrival = root.querySelector<HTMLElement>('[data-arrival]');
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
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
      if (journey && scene) {
        // The sticky scene's actual travel is the camera track, including on short viewports.
        const travel = journey.offsetHeight - scene.offsetHeight;
        const approach =
          reducedMotion || travel <= 0 ? 0 : clamp(-journey.getBoundingClientRect().top / travel);
        const depth = approach * approach;
        const mobile = window.innerWidth <= 760;
        const landed = !reducedMotion && approach >= 0.76;
        journey.style.setProperty('--planet-scale', String(1 + depth * 4));
        journey.style.setProperty('--planet-x', `${-16 * approach}vw`);
        journey.style.setProperty('--planet-y', `${depth * (mobile ? 60 : 95)}vh`);
        journey.style.setProperty('--departure-opacity', String(clamp(1 - approach * 3.5)));
        journey.style.setProperty('--departure-y', `${-approach * 90}px`);
        journey.style.setProperty('--departure-events', approach < 0.28 ? 'auto' : 'none');
        journey.style.setProperty(
          '--approach-opacity',
          String(clamp((approach - 0.23) * 6) * clamp((0.76 - approach) * 7))
        );
        journey.style.setProperty('--arrival-opacity', String(clamp((approach - 0.68) * 5)));
        journey.style.setProperty('--arrival-events', landed ? 'auto' : 'none');
        journey.style.setProperty('--stars-opacity', String(0.65 * (1 - approach)));
        journey.style.setProperty('--cue-opacity', String(clamp((0.95 - approach) * 4)));
        journey.style.setProperty('--landing-shade', String(clamp(approach * 2)));
        journey.style.setProperty('--surface-opacity', String(clamp((approach - 0.65) * 4)));
        journey.style.setProperty('--surface-y', `${100 * (1 - clamp((approach - 0.65) * 4))}%`);
        if (departure) {
          departure.inert = !reducedMotion && approach >= 0.28;
          departure.setAttribute('aria-hidden', String(departure.inert));
        }
        if (arrival) {
          arrival.inert = !landed;
          arrival.setAttribute('aria-hidden', String(!landed));
          arrival.querySelector('a')?.setAttribute('tabindex', landed ? '0' : '-1');
        }
      }
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
