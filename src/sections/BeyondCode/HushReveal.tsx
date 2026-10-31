import { useRef, useState } from 'react';
import { MEDIA, gsap, useGSAP } from '../../lib/gsap.ts';
import styles from './HushReveal.module.css';

/**
 * A handheld torch in a dark room: the pointer carries the light with a little
 * inertia and tremor. Touch drags it; keyboard and reduced motion use the lantern.
 */
export function HushReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [lantern, setLantern] = useState(false);

  useGSAP(
    () => {
      const stage = ref.current;
      if (!stage) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const light = { x: 0.62, y: 0.46 };
        const target = { x: 0.62, y: 0.46 };
        let idle = true;
        let time = 0;
        const setX = gsap.quickSetter(stage, '--lx', '%');
        const setY = gsap.quickSetter(stage, '--ly', '%');
        const setR = gsap.quickSetter(stage, '--lr', 'px');
        const move = (event: PointerEvent) => {
          const rect = stage.getBoundingClientRect();
          target.x = (event.clientX - rect.left) / rect.width;
          target.y = (event.clientY - rect.top) / rect.height;
          idle = false;
        };
        const tick = (_: number, delta: number) => {
          time += delta / 1000;
          if (idle) {
            // Unattended, the light wanders the way a resting hand drifts.
            target.x = 0.55 + Math.sin(time * 0.31) * 0.22;
            target.y = 0.5 + Math.sin(time * 0.47 + 1.3) * 0.16;
          }
          light.x += (target.x - light.x) * 0.075;
          light.y += (target.y - light.y) * 0.075;
          const tremor = Math.sin(time * 9.1) * 0.0016 + Math.sin(time * 13.7) * 0.0011;
          setX((light.x + tremor) * 100);
          setY((light.y + tremor * 0.8) * 100);
          setR(Math.min(stage.clientWidth, 900) * (0.24 + Math.sin(time * 1.7) * 0.004));
        };
        const leave = () => (idle = true);
        stage.addEventListener('pointermove', move);
        stage.addEventListener('pointerleave', leave);
        let active = false;
        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !active) {
            gsap.ticker.add(tick);
            active = true;
          } else if (!entry.isIntersecting && active) {
            gsap.ticker.remove(tick);
            active = false;
          }
        });
        observer.observe(stage);
        return () => {
          observer.disconnect();
          gsap.ticker.remove(tick);
          stage.removeEventListener('pointermove', move);
          stage.removeEventListener('pointerleave', leave);
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div className={styles.hush} data-lantern={lantern}>
      <div ref={ref} id="hush" className={styles.stage}>
        <div className={styles.dark} aria-hidden="true">
          <span className={styles.word}>Hush.</span>
        </div>
        <div className={styles.lit} aria-hidden="true">
          <span className={styles.word}>Hush.</span>
          <span className={styles.whisper}>something is still watching</span>
        </div>
        <div className={styles.copy}>
          <p className="u-label">06.2 — Games</p>
          <h3 className={styles.heading}>
            A little curiosity.
            <br />
            <em>A little unease.</em>
          </h3>
          <p>
            Hush is my horror-game project — something between the trees, and one light you control.
            I play games too; building one is a different kind of puzzle.
          </p>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.lantern}
              aria-pressed={lantern}
              onClick={() => setLantern(value => !value)}
            >
              {lantern ? 'Lower the lantern' : 'Raise the lantern'}
            </button>
            <p className={styles.status} role="status">
              {lantern
                ? 'Lantern raised. The room is lit; the feeling stays.'
                : 'Moonlight only. Move the light.'}
            </p>
          </div>
          <p className={styles.note}>No gameplay footage on this page — just the mood.</p>
        </div>
      </div>
    </div>
  );
}
