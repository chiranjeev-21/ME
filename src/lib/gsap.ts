import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);

// Mirrors the CSS easing tokens so CSS and GSAP motion share one vocabulary.
CustomEase.create('reveal', '0.16, 1, 0.3, 1');
CustomEase.create('cine', '0.76, 0, 0.24, 1');
CustomEase.create('settle', '0.22, 1, 0.36, 1');

gsap.defaults({ ease: 'reveal', duration: 1.1 });
ScrollTrigger.config({ ignoreMobileResize: true });

/** Media conditions shared by every gsap.matchMedia() call. */
export const MEDIA = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  wide: '(min-width: 900px)',
  narrow: '(max-width: 899.98px)',
  finePointer: '(hover: hover) and (pointer: fine)',
} as const;

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(MEDIA.reduced).matches;
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const debug = { refreshes: 0 };
  ScrollTrigger.addEventListener('refresh', () => debug.refreshes++);
  Object.assign(window, { __motion: { gsap, ScrollTrigger, debug } });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
