import type { RefObject } from 'react';
import { chapterStore } from '../../app/chapterStore.ts';
import { isChapterId } from '../../data/chapters.ts';
import { MEDIA, ScrollTrigger, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';

const backdropOf = (section: HTMLElement) => ({ backgroundColor: section.dataset.bg });

/**
 * Scroll-linked chapter transitions. A fixed backdrop's colour is scrubbed
 * between neighbouring chapters, so each seam is a continuous change of light
 * rather than a hard cut; chapters keep static text palettes, so only that one
 * layer repaints. Also publishes the active chapter and drives the
 * reading-progress hairline.
 *
 * Queued after every chapter has built its pins, so measurements include them.
 */
export function useChapterTransitions(scope: RefObject<HTMLElement>) {
  useQueuedGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const backdrop = document.getElementById('backdrop');
      const sections = gsap.utils.toArray<HTMLElement>('[data-chapter]', root);
      if (!sections.length || !backdrop) return;
      gsap.set(backdrop, backdropOf(sections[0]));

      sections.forEach(section => {
        const id = section.dataset.chapter;
        if (!isChapterId(id)) return;
        ScrollTrigger.create({
          trigger: section,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: self => self.isActive && chapterStore.set(id),
        });
      });

      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        sections.slice(1).forEach((section, index) => {
          gsap.fromTo(backdrop, backdropOf(sections[index]), {
            ...backdropOf(section),
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: section.dataset.seamStart || 'top 72%',
              end: section.dataset.seamEnd || 'top 18%',
              scrub: true,
            },
          });
        });
      });
      mm.add(MEDIA.reduced, () => {
        sections.forEach(section =>
          ScrollTrigger.create({
            trigger: section,
            start: 'top 50%',
            end: 'bottom 50%',
            onToggle: self => self.isActive && gsap.set(backdrop, backdropOf(section)),
          })
        );
      });

      const bar = document.getElementById('reading-progress');
      if (bar)
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
          }
        );

      ScrollTrigger.sort();
      return () => {
        mm.revert();
        gsap.set(backdrop, { clearProps: 'backgroundColor' });
      };
    },
    { scope }
  );
}
