import type { CSSProperties } from 'react';
import type { SiteCapture, SourceExcerpt } from '../../data/questMedia.ts';
import feature from './ProjectFeature.module.css';
import styles from './QuestPlates.module.css';

const hud = (corner: 'hudTl' | 'hudTr' | 'hudBl' | 'hudBr') =>
  `u-label ${feature.hud} ${feature[corner]} ${styles.hud} ${
    corner === 'hudBl' || corner === 'hudBr' ? styles.low : ''
  }`;

/** The live site, exactly as captured; its host and date sit on a strip above it. */
export function SitePlate({ capture }: { capture: SiteCapture }) {
  const { image } = capture;
  return (
    <div className={styles.site}>
      <p className={styles.siteBar} aria-hidden="true">
        <span className={`u-label ${styles.host}`}>Live site — {capture.host}</span>
        <span className="u-label">Captured {capture.captured}</span>
      </p>
      <img
        className={styles.shot}
        src={image.src}
        srcSet={`${image.srcSmall} 1200w, ${image.src} 2400w`}
        sizes="100vw"
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/** Index of a line comment that is not inside a string literal, or -1. */
function commentStart(line: string, marker: string) {
  let quote = '';
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quote) {
      if (char === '\\') index++;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') quote = char;
    else if (line.startsWith(marker, index)) return index;
  }
  return -1;
}

/** A verbatim excerpt set as an editorial plate, lit in the language's colour. */
export function SourcePlate({
  excerpt,
  language,
  repository,
}: {
  excerpt: SourceExcerpt;
  language?: string;
  repository: string;
}) {
  const last = excerpt.startLine + excerpt.lines.length - 1;
  const style = {
    '--lines': excerpt.lines.length,
    '--chars': Math.max(2, language?.length ?? 0),
  } as CSSProperties;
  return (
    <div className={styles.source} style={style} aria-hidden="true">
      <div className={styles.light} />
      {language && (
        <span className={styles.word}>
          <span data-word>{language}</span>
        </span>
      )}
      <div className={styles.code}>
        <span className={styles.band} data-band data-lines={excerpt.lines.length} />
        {excerpt.lines.map((line, index) => {
          const at = commentStart(line, excerpt.comment);
          return (
            <div key={index} className={styles.line}>
              <span className={styles.number}>{excerpt.startLine + index}</span>
              <code>
                {at < 0 ? line : line.slice(0, at)}
                {at >= 0 && <span className={styles.comment}>{line.slice(at)}</span>}
              </code>
            </div>
          );
        })}
      </div>
      <div className={styles.fade} />
      <p className={hud('hudTl')}>Source — {excerpt.path}</p>
      <p className={hud('hudTr')}>
        Lines {excerpt.startLine}–{last}
      </p>
      <p className={hud('hudBl')}>{repository}</p>
      {language && <p className={hud('hudBr')}>{language}</p>}
    </div>
  );
}

/** With no site or excerpt on record, the repository's name is the image, set as a type specimen. */
export function TypePlate({
  name,
  language,
  topics,
  url,
}: {
  name: string;
  language?: string;
  topics: string[];
  url?: string;
}) {
  const path = url?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return (
    <div
      className={styles.type}
      style={{ '--chars': Math.max(6, name.length) } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.light} />
      <div className={styles.specimen}>
        <i className={styles.capLine}>
          <span>Cap height</span>
        </i>
        <i className={styles.xLine}>
          <span>x-height</span>
        </i>
        <i className={styles.baseLine}>
          <span>Baseline</span>
        </i>
        <i className={styles.descLine} />
      </div>
      <span className={styles.ghost}>
        <span data-ghost>{name}</span>
      </span>
      <p className={hud('hudTl')}>Repository — public metadata</p>
      <p className={hud('hudTr')}>
        <i className={styles.dot} />
        {language ?? 'Language not stated'}
      </p>
      {topics.length > 0 && <p className={hud('hudBl')}>{topics.slice(0, 4).join(' · ')}</p>}
      {path && <p className={hud('hudBr')}>{path}</p>}
    </div>
  );
}
