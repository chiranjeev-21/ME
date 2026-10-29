import { useState } from 'react';
import { ACTIVE_CONCEPT } from '@/constants/concept';
import { Icon } from './Icon';
import styles from './Portfolio.module.css';

function OSVisual({ onTerminal }: { onTerminal: () => void }) {
  const [tab, setTab] = useState('profile');
  return (
    <div className={styles.osScene}>
      <div className={styles.sceneCross} aria-hidden="true">
        +
      </div>
      <div className={styles.window}>
        <div className={styles.windowBar}>
          <span className={styles.windowDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>~/chiranjeev</span>
          <Icon name="code" size={16} />
        </div>
        <div className={styles.windowTabs} role="tablist" aria-label="Profile window">
          {['profile', 'stack', 'notes'].map(item => (
            <button
              key={item}
              role="tab"
              id={`tab-${item}`}
              aria-controls="profile-panel"
              aria-selected={tab === item}
              tabIndex={tab === item ? 0 : -1}
              onClick={() => setTab(item)}
              onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const tabs = ['profile', 'stack', 'notes'];
                const index =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? 2
                      : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
                setTab(tabs[index]);
                document.getElementById(`tab-${tabs[index]}`)?.focus();
              }}
            >
              {item}.tsx
            </button>
          ))}
        </div>
        <div
          id="profile-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className={styles.windowContent}
        >
          {tab === 'profile' && (
            <>
              <div className={styles.profileRow}>
                <img
                  src="/images/photo.jpeg"
                  width="88"
                  height="88"
                  alt="Chiranjeev Singh"
                  className={styles.avatar}
                />
                <div>
                  <span className={styles.mono}>HELLO, WORLD. I&apos;M</span>
                  <h2>
                    Chiranjeev
                    <span>
                      Singh<span className={styles.lime}>.</span>
                    </span>
                  </h2>
                </div>
              </div>
              <div className={styles.codeBlock}>
                <p>
                  <span>const</span> engineer = {'{'}
                </p>
                <p>
                  &nbsp; now: <em>&quot;Microsoft / Azure&quot;</em>,
                </p>
                <p>
                  &nbsp; focus: <em>&quot;Distributed systems&quot;</em>,
                </p>
                <p>
                  &nbsp; fuel: <em>&quot;A good what if?&quot;</em>
                </p>
                <p>{'};'}</p>
              </div>
            </>
          )}
          {tab === 'stack' && (
            <div className={styles.tabCopy}>
              <span className={styles.mono}>TOOLS, NOT IDENTITIES.</span>
              <h2>
                The right tool.
                <br />
                The real problem.
              </h2>
              <div className={styles.tags}>
                {['C/C++', 'Python', 'Java', 'Azure', 'AWS', 'PyTorch', 'Kafka', 'Redis'].map(
                  skill => (
                    <span key={skill}>{skill}</span>
                  )
                )}
              </div>
              <p>Distributed computing, production AI, and the backend glue in between.</p>
            </div>
          )}
          {tab === 'notes' && (
            <div className={styles.tabCopy}>
              <span className={styles.mono}>A NOTE TO THE INTERNET.</span>
              <h2>
                Make it useful.
                <br />
                Then make it feel right.
              </h2>
              <p>
                I like the space where hard engineering problems meet playful ideas. This website is
                a little bit of both.
              </p>
              <button className={styles.textButton} onClick={onTerminal}>
                Try the terminal <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
        </div>
        <div className={styles.windowFooter}>
          <span className={styles.statusDot} /> Curiosity, always on{' '}
          <span>0{['profile', 'stack', 'notes'].indexOf(tab) + 1} / 03</span>
        </div>
      </div>
      <button className={styles.miniTerminal} onClick={onTerminal}>
        <span>
          <Icon name="terminal" size={16} /> cj@portfolio:~
        </span>
        <strong>
          <b>$</b> explore --curiosity
          <span className={styles.caret} />
        </strong>
        <small>
          Click to run a command <Icon name="arrow" size={13} />
        </small>
      </button>
      <div className={styles.sceneTag}>
        <Icon name="spark" size={15} /> Built to keep exploring.
      </div>
    </div>
  );
}

function UniverseVisual({ onVault }: { onVault: () => void }) {
  return (
    <div className={styles.universeScene} aria-label="Explore the personal universe">
      <div className={styles.starField} aria-hidden="true" />
      <div className={styles.orbitOuter} aria-hidden="true" />
      <div className={styles.orbitInner} aria-hidden="true" />
      <div className={styles.planet}>
        <span>
          CJ<span>.</span>
        </span>
        <small>A WORLD IN PROGRESS</small>
      </div>
      <a href="#work" className={`${styles.orbitNode} ${styles.nodeOne}`}>
        <i />
        01 / Experience
        <Icon name="arrow" size={14} />
      </a>
      <a href="#systems" className={`${styles.orbitNode} ${styles.nodeTwo}`}>
        <i />
        02 / Systems
        <Icon name="arrow" size={14} />
      </a>
      <button onClick={onVault} className={`${styles.orbitNode} ${styles.nodeThree}`}>
        <i />
        ?? / Side quests
        <Icon name="spark" size={14} />
      </button>
      <span className={styles.coordinate}>28.6&deg; N &nbsp; / &nbsp; ALWAYS EXPLORING</span>
    </div>
  );
}

function CommandVisual() {
  return (
    <figure className={styles.deskPortrait}>
      <img
        src="/images/photo.jpeg"
        width="340"
        height="370"
        alt="Chiranjeev Singh smiling outdoors"
      />
      <figcaption>
        A face to the code. <span>Chiranjeev / CJ</span>
      </figcaption>
    </figure>
  );
}

export function Visual({ onTerminal, onVault }: { onTerminal: () => void; onVault: () => void }) {
  if (ACTIVE_CONCEPT === 'universe') return <UniverseVisual onVault={onVault} />;
  if (ACTIVE_CONCEPT === 'command') return <CommandVisual />;
  return <OSVisual onTerminal={onTerminal} />;
}
