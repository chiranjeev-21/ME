import { useRef } from 'react';
import { OrbitalScene } from '../../scenes/orbital/OrbitalScene';
import { themeAttributes } from '../../data/themes.ts';
import { MEDIA, SplitText, gsap, useGSAP } from '../../lib/gsap.ts';
import styles from './Hero.module.css';

const POSTER = {
  wide: '/images/orbit/dawn-wide.webp',
  tall: '/images/orbit/dawn-tall.webp',
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useGSAP(
    (_, contextSafe) => {
      const root = ref.current;
      if (!root || !contextSafe) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        root.dataset.pinned = 'true';
        // The name stays hidden until its face has loaded, so it neither reflows nor splits twice.
        root.dataset.intro = 'pending';
        let split: SplitText | null = null;
        let cancelled = false;
        const supporting = q('[data-kicker] > *, [data-foot] > *');
        gsap.set(supporting, { y: 18, autoAlpha: 0 });

        const build = contextSafe(() => {
          if (cancelled) return;
          const title = q('[data-title]')[0] as HTMLElement;
          split = SplitText.create(title, {
            type: 'lines,chars',
            mask: 'lines',
            linesClass: 'split-line',
          });
          const chars = split.chars as HTMLElement[];
          gsap.set(chars, { yPercent: 120 });
          root.dataset.intro = 'ready';

          // Entrance: the name surfaces letter by letter while its tracking settles.
          gsap
            .timeline({ delay: 0.2 })
            .to(chars, { yPercent: 0, duration: 1.7, ease: 'reveal', stagger: 0.04 })
            .from(q('[data-line]'), { letterSpacing: '0.06em', duration: 2.4, ease: 'settle' }, 0)
            .to(q('[data-kicker] > *'), { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.12 }, 0.4)
            .to(q('[data-foot] > *'), { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.12 }, 0.6)
            .from(
              q('[data-cue-line]'),
              { scaleY: 0, transformOrigin: 'top', duration: 1.4, ease: 'cine' },
              1.3
            );

          // Scroll: descend toward the sunrise; the name disperses, then light floods the frame.
          const centre = (chars.length - 1) / 2;
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: root,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
                onUpdate: self => {
                  progress.current = self.progress;
                },
              },
            })
            .to(q('[data-kicker], [data-foot]'), { autoAlpha: 0, y: -24, duration: 0.18 }, 0)
            .to(
              chars,
              {
                x: index => `${(index - centre) * 0.9}vw`,
                autoAlpha: 0,
                filter: 'blur(10px)',
                duration: 0.42,
                ease: 'power1.in',
                stagger: { each: 0.004, from: 'center' },
              },
              0.04
            )
            .to(q('[data-title-wrap]'), { yPercent: -18, duration: 0.5 }, 0)
            .to(q('[data-flash]'), { autoAlpha: 1, duration: 0.24, ease: 'power2.in' }, 0.76);
        });

        const face = (style: string) =>
          document.fonts.load(`${style} 400 100px "Instrument Serif"`);
        void Promise.race([
          Promise.all([face('normal'), face('italic')]).catch(() => undefined),
          new Promise(resolve => setTimeout(resolve, 2500)),
        ]).then(build);

        // Cursor: a slight counter-drift against the scene's camera parallax.
        const wrap = q('[data-title-pointer]')[0] as HTMLElement;
        const xTo = gsap.quickTo(wrap, 'x', { duration: 1.4, ease: 'settle' });
        const yTo = gsap.quickTo(wrap, 'y', { duration: 1.4, ease: 'settle' });
        const fine = window.matchMedia(MEDIA.finePointer).matches;
        const onMove = (event: PointerEvent) => {
          xTo((event.clientX / window.innerWidth - 0.5) * -14);
          yTo((event.clientY / window.innerHeight - 0.5) * -8);
        };
        if (fine) window.addEventListener('pointermove', onMove, { passive: true });

        return () => {
          cancelled = true;
          window.removeEventListener('pointermove', onMove);
          split?.revert();
          delete root.dataset.pinned;
          delete root.dataset.intro;
          progress.current = 0;
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      id="opening"
      className={styles.hero}
      aria-labelledby="hero-title"
      {...themeAttributes('opening')}
    >
      <div className={styles.stage}>
        <OrbitalScene
          preset="dawn"
          progress={progress}
          poster={POSTER}
          priority
          startDelay={1900}
        />
        <div className={styles.veil} aria-hidden="true" />
        <div className={styles.content}>
          <p className={`u-label ${styles.kicker}`} data-kicker>
            <span>A personal universe</span>
            <span className={styles.coords}>Bengaluru · 12.97° N, 77.59° E</span>
          </p>
          <div className={styles.titleWrap} data-title-wrap>
            <div data-title-pointer>
              <h1 id="hero-title" className={styles.title} data-title>
                <span className={styles.line} data-line>
                  Chiranjeev
                </span>{' '}
                <span className={`${styles.line} ${styles.lineTwo}`} data-line>
                  <em>Singh</em>
                </span>
              </h1>
            </div>
          </div>
          <div className={styles.foot} data-foot>
            <p className={styles.role}>
              Software engineer at Microsoft, on Azure Direct Drive.
              <br />
              Building systems, exploring AI, shipping ideas.
            </p>
            <p className={`u-label ${styles.cue}`}>
              <span>Scroll to descend</span>
              <span className={styles.cueLine} data-cue-line aria-hidden="true" />
            </p>
          </div>
        </div>
        <div className={styles.flash} data-flash aria-hidden="true" />
      </div>
    </section>
  );
}
