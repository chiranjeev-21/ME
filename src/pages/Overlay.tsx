import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useIsPresent } from 'motion/react';
import * as m from 'motion/react-m';
import { useRouter } from '../app/routerContext.ts';
import { Icon } from '../components/ui/Icon';
import styles from './Overlay.module.css';

const EASE = [0.76, 0, 0.24, 1] as const;

interface OverlayProps {
  labelledBy: string;
  tone?: 'night' | 'paper';
  backLabel: string;
  backHref: string;
  children: ReactNode;
}

/**
 * Full-screen reading surface layered over the home page. The home page stays
 * mounted (inert) beneath it, so closing returns to the exact scroll position.
 */
export function Overlay({
  labelledBy,
  tone = 'night',
  backLabel,
  backHref,
  children,
}: OverlayProps) {
  const { navigate } = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  // An overlay that is animating out must not react to input meant for its successor.
  const present = useIsPresent();
  const presentRef = useRef(present);
  presentRef.current = present;

  const close = () => {
    if (!presentRef.current) return;
    if ((history.state as { from?: string } | null)?.from === 'app') history.back();
    else navigate(backHref, { replace: true });
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    scrollerRef.current?.scrollTo(0, 0);
    scrollerRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !presentRef.current) return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className={styles.overlay}
      data-tone={tone}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1, ease: EASE } }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.75, ease: EASE } }}
    >
      <div ref={scrollerRef} className={styles.scroller}>
        <div className={styles.bar}>
          <button type="button" className={styles.back} onClick={close}>
            <Icon name="arrow-left" /> {backLabel}
          </button>
          <span className="u-label">Esc to close</span>
        </div>
        <m.div
          initial={{ y: 70, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { delay: 0.45, duration: 1.1, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          {children}
        </m.div>
      </div>
    </m.div>
  );
}
