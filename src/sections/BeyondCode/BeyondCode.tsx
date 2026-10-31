import { useState } from 'react';
import { Reveal } from '../../components/motion/Reveal';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ChapterMark } from '../../components/ui/ChapterMark';
import { Icon } from '../../components/ui/Icon';
import { themeAttributes } from '../../data/themes.ts';
import { GuitarStrings } from '../../scenes/strings/GuitarStrings';
import { HushReveal } from './HushReveal';
import styles from './BeyondCode.module.css';

export function BeyondCode() {
  const [sound, setSound] = useState(false);
  const [touched, setTouched] = useState(false);
  return (
    <section
      id="beyond"
      className={styles.beyond}
      aria-labelledby="beyond-title"
      {...themeAttributes('beyond')}
    >
      <div className={styles.light} aria-hidden="true" />
      <header className={styles.header}>
        <ChapterMark chapter="beyond" />
        <SplitReveal as="h2" id="beyond-title" className={styles.title}>
          After <em>hours.</em>
        </SplitReveal>
        <Reveal as="p" className={styles.lede} delay={0.15}>
          Music, games, and the slower kind of making.
        </Reveal>
      </header>

      <div className={styles.music}>
        <Reveal className={styles.musicCopy}>
          <p className="u-label">06.1 — Music &amp; guitar</p>
          <h3 className={styles.musicTitle}>
            Leave a little <em>space.</em>
          </h3>
          <p>
            A guitar phrase needs room between its notes. Six strings in standard tuning — draw a
            cursor across them, or tap one, and watch it ring out and settle.
          </p>
          <div className={styles.soundRow}>
            <button
              type="button"
              className={styles.sound}
              aria-pressed={sound}
              onClick={() => setSound(value => !value)}
            >
              <Icon name={sound ? 'sound' : 'mute'} />
              {sound ? 'Sound on' : 'Sound off'}
            </button>
            <span className={styles.soundHint}>
              {touched && !sound
                ? 'Strings are silent until you turn sound on.'
                : 'Synthesised in your browser: a Karplus–Strong plucked string.'}
            </span>
          </div>
        </Reveal>
        <GuitarStrings sound={sound} onFirstPluck={() => setTouched(true)} />
      </div>

      <HushReveal />
    </section>
  );
}
