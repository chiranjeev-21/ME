import type { CSSProperties, RefObject } from 'react';
import type { Frets } from '../../scenes/strings/music.ts';
import { formatBeats, stepTitle } from './format.ts';
import type { TimelineGeometry } from './format.ts';
import { stepSeconds } from './song.ts';
import type { Step } from './song.ts';
import styles from './Timeline.module.css';

/** A six-string chord box, drawn on its side like the fretboard (low E on top). */
function Diagram({ frets }: { frets: Frets }) {
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0);
  const low = fretted.length ? Math.min(...fretted) : 1;
  const high = fretted.length ? Math.max(...fretted) : 1;
  const base = high <= 4 ? 1 : low;
  const span = 4;
  const x = (n: number) => 9 + ((n - base + 0.5) / span) * 40;
  const y = (string: number) => 3 + string * 4.8;
  return (
    <svg className={styles.diagram} viewBox="0 0 52 30" aria-hidden="true">
      {frets.map((_, string) => (
        <line key={`s${string}`} x1="7" x2="50" y1={y(string)} y2={y(string)} />
      ))}
      {[0, 1, 2, 3, 4].map(n => (
        <line
          key={`f${n}`}
          className={n === 0 && base === 1 ? styles.nut : undefined}
          x1={7 + n * 10}
          x2={7 + n * 10}
          y1="2"
          y2="28"
        />
      ))}
      {frets.map((fret, string) =>
        fret === null ? (
          <text key={`m${string}`} x="2" y={y(string) + 1.6}>
            ×
          </text>
        ) : fret === 0 ? (
          <circle key={`o${string}`} className={styles.open} cx="3" cy={y(string)} r="1.5" />
        ) : fret - base < span ? (
          <circle key={`d${string}`} className={styles.dotMark} cx={x(fret)} cy={y(string)} r="2" />
        ) : null
      )}
      {base > 1 && (
        <text className={styles.base} x="50" y="29.5" textAnchor="end">
          {base}
        </text>
      )}
    </svg>
  );
}

interface TimelineProps {
  steps: readonly Step[];
  bpm: number;
  geometry: TimelineGeometry;
  selectedId: string | null;
  activeIndex: number | null;
  playing: boolean;
  onSelect: (id: string) => void;
  scrollerRef: RefObject<HTMLDivElement>;
  playheadRef: RefObject<HTMLDivElement>;
}

export function Timeline({
  steps,
  bpm,
  geometry,
  selectedId,
  activeIndex,
  playing,
  onSelect,
  scrollerRef,
  playheadRef,
}: TimelineProps) {
  const bars = Math.ceil(geometry.width / (geometry.beat * 4)) + 1;
  return (
    <div
      ref={scrollerRef}
      className={styles.scroller}
      data-testid="timeline"
      data-active-step={activeIndex ?? 'none'}
      data-playing={playing}
    >
      <div
        className={styles.track}
        style={
          {
            '--beat': `${geometry.beat}px`,
            width: `max(100%, ${Math.ceil(geometry.width) + 1}px)`,
          } as CSSProperties
        }
      >
        <div className={styles.ruler} aria-hidden="true">
          {Array.from({ length: bars }, (_, bar) => (
            <span key={bar} style={{ left: `${bar * geometry.beat * 4}px` }}>
              {bar + 1}
            </span>
          ))}
        </div>
        <ol className={styles.steps} aria-label="Sequence">
          {steps.map((step, index) => {
            const seconds = stepSeconds(step.beats, bpm);
            const title = stepTitle(step.frets);
            const width = geometry.widths[index];
            return (
              <li
                key={step.id}
                className={styles.step}
                style={{ width: `${width}px` }}
                data-active={activeIndex === index || undefined}
              >
                <button
                  type="button"
                  className={styles.block}
                  aria-pressed={selectedId === step.id}
                  aria-label={`Step ${index + 1}: ${title}, ${step.direction} strum, ${formatBeats(step.beats)} (${seconds.toFixed(2)} seconds)`}
                  onClick={() => onSelect(step.id)}
                >
                  <span className={styles.meta}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{step.direction === 'down' ? '↓' : '↑'}</span>
                  </span>
                  <span className={styles.name} data-rest={title === 'Rest' || undefined}>
                    {title}
                  </span>
                  {width >= 92 && <Diagram frets={step.frets} />}
                  <span className={styles.length}>
                    {width >= 92
                      ? `${formatBeats(step.beats)} · ${seconds.toFixed(2)} s`
                      : `${seconds.toFixed(1)}s`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div
          ref={playheadRef}
          className={styles.playhead}
          data-visible={playing || undefined}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
