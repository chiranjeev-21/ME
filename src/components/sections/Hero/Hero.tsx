import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { HeroBlobs } from './HeroBlobs';
import { HeroContent } from './HeroContent';
import { HeroPortrait } from './HeroPortrait';
import styles from './Hero.module.css';

interface HeroProps {
  onTreasureClick?: () => void;
}

const TREASURE_MARGIN = 16;
const TREASURE_MOVE_MIN_MS = 5000;
const TREASURE_MOVE_MAX_MS = 8000;
const TREASURE_VISIBLE_MIN_MS = 2000;
const TREASURE_VISIBLE_MAX_MS = 3000;
const TREASURE_HIDDEN_MULTIPLIER = 3;
const TREASURE_INITIAL_HIDE_MIN_MS = 1500;
const TREASURE_INITIAL_HIDE_MAX_MS = 3500;
const FALLBACK_TREASURE_WIDTH = 82;
const FALLBACK_TREASURE_HEIGHT = 82;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Hero section — full-viewport intro.
 * Composes: Navbar + animated blobs + left content column + right portrait column.
 */
export function Hero({ onTreasureClick }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const treasureRef = useRef<HTMLButtonElement>(null);
  const [treasurePosition, setTreasurePosition] = useState({
    x: TREASURE_MARGIN,
    y: TREASURE_MARGIN,
  });
  const [treasureMoveDuration, setTreasureMoveDuration] = useState(6000);
  const [isTreasureVisible, setIsTreasureVisible] = useState(false);

  useEffect(() => {
    const getMoveBounds = () => {
      const treasureRect = treasureRef.current?.getBoundingClientRect();
      const treasureWidth = treasureRect?.width ?? FALLBACK_TREASURE_WIDTH;
      const treasureHeight = treasureRect?.height ?? FALLBACK_TREASURE_HEIGHT;

      return {
        maxX: Math.max(
          TREASURE_MARGIN,
          Math.floor(window.innerWidth - treasureWidth - TREASURE_MARGIN)
        ),
        maxY: Math.max(
          TREASURE_MARGIN,
          Math.floor(window.innerHeight - treasureHeight - TREASURE_MARGIN)
        ),
      };
    };

    let moveTimeoutId = 0;

    const moveTreasure = () => {
      const { maxX, maxY } = getMoveBounds();
      setTreasureMoveDuration(randomBetween(TREASURE_MOVE_MIN_MS, TREASURE_MOVE_MAX_MS));
      setTreasurePosition({
        x: randomBetween(TREASURE_MARGIN, maxX),
        y: randomBetween(TREASURE_MARGIN, maxY),
      });

      moveTimeoutId = window.setTimeout(moveTreasure, randomBetween(4000, 6500));
    };

    const handleResize = () => {
      const { maxX, maxY } = getMoveBounds();
      setTreasurePosition(previous => ({
        x: clamp(previous.x, TREASURE_MARGIN, maxX),
        y: clamp(previous.y, TREASURE_MARGIN, maxY),
      }));
    };

    moveTreasure();
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearTimeout(moveTimeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    let visibilityTimeoutId = 0;
    let isDisposed = false;

    const startVisibilityCycle = () => {
      if (isDisposed) return;

      const visibleDuration = randomBetween(TREASURE_VISIBLE_MIN_MS, TREASURE_VISIBLE_MAX_MS);
      const hiddenDuration = visibleDuration * TREASURE_HIDDEN_MULTIPLIER;

      setIsTreasureVisible(true);

      visibilityTimeoutId = window.setTimeout(() => {
        if (isDisposed) return;

        setIsTreasureVisible(false);
        visibilityTimeoutId = window.setTimeout(startVisibilityCycle, hiddenDuration);
      }, visibleDuration);
    };

    visibilityTimeoutId = window.setTimeout(
      startVisibilityCycle,
      randomBetween(TREASURE_INITIAL_HIDE_MIN_MS, TREASURE_INITIAL_HIDE_MAX_MS)
    );

    return () => {
      isDisposed = true;
      window.clearTimeout(visibilityTimeoutId);
    };
  }, []);

  const treasureStyle: CSSProperties & Record<'--treasure-move-ms', string> = {
    left: `${treasurePosition.x}px`,
    top: `${treasurePosition.y}px`,
    '--treasure-move-ms': `${treasureMoveDuration}ms`,
  };

  return (
    <section id="hero" ref={sectionRef} className={styles.hero}>
      <HeroBlobs containerRef={sectionRef} />

      <Navbar />

      <div className={styles.body}>
        <HeroContent />
        <HeroPortrait />
      </div>

      <button
        ref={treasureRef}
        type="button"
        className={`${styles.treasure} ${isTreasureVisible ? styles.treasureVisible : styles.treasureHidden}`}
        style={treasureStyle}
        onClick={onTreasureClick}
        aria-label="Open side quests"
        aria-hidden={!isTreasureVisible}
        tabIndex={isTreasureVisible ? 0 : -1}
      >
        <span className={styles.treasureAura} aria-hidden="true" />
        <span className={styles.treasureChest} aria-hidden="true">
          <svg className={styles.treasureChestIcon} viewBox="0 0 84 84" focusable="false">
            <defs>
              <radialGradient id="treasure-coin" cx="50%" cy="36%" r="70%">
                <stop offset="0%" stopColor="#fff2a6" />
                <stop offset="48%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
              <linearGradient id="treasure-lid" x1="14" y1="19" x2="68" y2="42">
                <stop offset="0%" stopColor="#ffd86b" />
                <stop offset="28%" stopColor="#b45309" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
              <linearGradient id="treasure-base" x1="15" y1="38" x2="69" y2="64">
                <stop offset="0%" stopColor="#a16207" />
                <stop offset="24%" stopColor="#7c3f13" />
                <stop offset="72%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#4a220d" />
              </linearGradient>
              <linearGradient id="treasure-metal" x1="0" y1="18" x2="0" y2="64">
                <stop offset="0%" stopColor="#fff7bf" />
                <stop offset="36%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="treasure-lock" x1="37" y1="42" x2="47" y2="56">
                <stop offset="0%" stopColor="#fff0b3" />
                <stop offset="56%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <filter id="treasure-shadow" x="-30%" y="-30%" width="160%" height="170%">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="4"
                  floodColor="#1f2937"
                  floodOpacity="0.45"
                />
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="#f59e0b"
                  floodOpacity="0.22"
                />
              </filter>
            </defs>

            <ellipse cx="42" cy="69" rx="22" ry="6" fill="#0f172a" fillOpacity="0.32" />

            <g filter="url(#treasure-shadow)">
              <g opacity="0.98">
                <circle cx="28" cy="31" r="8" fill="url(#treasure-coin)" />
                <circle cx="40" cy="26" r="9" fill="url(#treasure-coin)" />
                <circle cx="54" cy="31" r="8" fill="url(#treasure-coin)" />
                <circle cx="34" cy="33" r="7" fill="url(#treasure-coin)" />
                <circle cx="48" cy="33" r="7" fill="url(#treasure-coin)" />
              </g>

              <path
                d="M16 37C16 27 23.6 20 33.4 20H50.6C60.4 20 68 27 68 37V39H16V37Z"
                fill="url(#treasure-lid)"
                stroke="#7c2d12"
                strokeWidth="2.4"
              />
              <rect
                x="15"
                y="38"
                width="54"
                height="26"
                rx="9"
                fill="url(#treasure-base)"
                stroke="#78350f"
                strokeWidth="2.4"
              />
              <path d="M15 48H69" stroke="#4a220d" strokeWidth="2.2" strokeOpacity="0.52" />

              <rect x="26" y="18" width="6" height="46" rx="3" fill="url(#treasure-metal)" />
              <rect x="52" y="18" width="6" height="46" rx="3" fill="url(#treasure-metal)" />
              <rect
                x="40"
                y="20"
                width="4"
                height="44"
                rx="2"
                fill="url(#treasure-metal)"
                fillOpacity="0.95"
              />

              <rect
                x="37"
                y="42"
                width="10"
                height="14"
                rx="4"
                fill="url(#treasure-lock)"
                stroke="#92400e"
                strokeWidth="1.8"
              />
              <rect
                x="38.6"
                y="46"
                width="6.8"
                height="5.2"
                rx="2.6"
                fill="#fffbeb"
                fillOpacity="0.42"
              />

              <path
                d="M28 30.5C31.2 25.2 35.8 22.6 42 22.6C48.2 22.6 52.8 25.2 56 30.5"
                stroke="#fde68a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.65"
              />
            </g>
          </svg>
        </span>
      </button>

      <div className={styles.scrollHint} aria-hidden="true">
        <div className={styles.scrollLine} />
        <span>scroll</span>
      </div>
    </section>
  );
}
