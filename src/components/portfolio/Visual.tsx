import { useState } from 'react';
import { ACTIVE_CONCEPT } from '@/constants/concept';
import { Icon } from './Icon';
import styles from './Portfolio.module.css';
import journey from './Journey.module.css';

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

function UniverseVisual() {
  return (
    <section
      id="hero"
      data-section
      data-journey
      className={journey.journey}
      aria-labelledby="hero-heading"
    >
      <div className={journey.scene} data-journey-scene>
        <div className={journey.stars} aria-hidden="true" />
        <div className={journey.orbitalPath} aria-hidden="true" />
        <div className={journey.planetWorld} data-planet-world aria-hidden="true">
          <div className={journey.ring} />
          <div className={journey.planet}>
            <svg className={journey.terrain} viewBox="0 0 600 600" fill="none">
              <defs>
                <linearGradient
                  id="land"
                  x1="120"
                  y1="0"
                  x2="520"
                  y2="580"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#f1dfb8" />
                  <stop offset=".5" stopColor="#cead88" />
                  <stop offset="1" stopColor="#84988f" />
                </linearGradient>
                <pattern id="contours" width="160" height="140" patternUnits="userSpaceOnUse">
                  <path
                    d="M-20 30Q40-15 80 30T180 30M-20 40Q40-5 80 40T180 40M-20 50Q40 5 80 50T180 50M-20 60Q40 15 80 60T180 60M-20 70Q40 25 80 70T180 70M-20 80Q40 35 80 80T180 80M-20 90Q40 45 80 90T180 90M-20 100Q40 55 80 100T180 100"
                    stroke="#fcf1d2"
                    strokeWidth=".7"
                    opacity=".3"
                  />
                </pattern>
              </defs>
              <g fill="url(#land)" stroke="#d9d5b3" strokeWidth="2">
                <path d="M-30 70C40 20 70 35 110 0L260-30C270 42 345 64 310 120S190 130 210 198 139 260 107 220 20 251-30 202Z" />
                <path d="M460-20C370 50 420 140 370 184S262 198 275 270 387 291 358 354 379 440 443 409 490 456 550 417 590 318 650 326L650-30Z" />
                <path d="M-30 370C32 339 50 393 111 370S196 388 177 437 237 483 204 544 120 567 120 630L-30 630Z" />
                <path d="M330 517C350 470 429 487 440 534S516 568 502 630H310Z" />
                <path d="M180 306C160 278 191 249 216 274S229 326 207 333Z" />
              </g>
              <path
                d="M15 140C105 90 125 168 165 152S206 95 255 83M465 60C426 128 484 141 439 210S348 204 331 264M421 283C395 323 474 331 441 377M18 433C100 398 120 458 137 483S124 542 91 568M350 550Q408 512 449 590"
                stroke="#f8e5bb"
                strokeWidth="10"
                opacity=".33"
              />
              <path
                d="M15 140C105 90 125 168 165 152S206 95 255 83M465 60C426 128 484 141 439 210S348 204 331 264M421 283C395 323 474 331 441 377M18 433C100 398 120 458 137 483S124 542 91 568"
                stroke="#7b968f"
                strokeWidth="2"
                opacity=".7"
              />
              <path
                d="M95-20Q160 240 390 163T650 219M-40 300Q145 145 241 400T690 459M-30 510Q189 357 301 590"
                stroke="#eaf1dd"
                strokeWidth="20"
                opacity=".15"
              />
              <path d="M0 0H600V600H0Z" fill="url(#contours)" />
              <g stroke="#ebead0" opacity=".23">
                <ellipse cx="300" cy="300" rx="120" ry="290" />
                <ellipse cx="300" cy="300" rx="230" ry="290" />
                <path d="M0 200Q300 260 600 200M0 400Q300 460 600 400" />
              </g>
            </svg>
          </div>
          <div className={`${journey.ring} ${journey.ringFront}`} />
        </div>
        <div className={journey.shade} aria-hidden="true" />
        <div className={journey.intro} data-departure>
          <span className={journey.eyebrow}>A personal universe / Hello, I&apos;m</span>
          <h1 id="hero-heading">
            Chiranjeev <em>Singh.</em>
          </h1>
          <p>
            <strong>Software engineer. Curious human.</strong>
            <br />A small world of distributed systems, useful AI, and the ideas that connect them.
          </p>
          <span className={journey.role}>MICROSOFT / AZURE DIRECT DRIVE</span>
          <a className={journey.skip} href="#work">
            Skip to work <Icon name="arrow" size={16} />
          </a>
        </div>
        <div className={journey.worldNote} aria-hidden="true">
          <span>Not another destination.</span>
          A world to get
          <br />a little closer to.
        </div>
        <div className={journey.approach} aria-hidden="true">
          <span className={journey.eyebrow}>Orbit → approach</span>
          <p>
            Big picture.
            <br />
            <em>Little details.</em>
          </p>
        </div>
        <div className={journey.arrival} data-arrival aria-hidden="true">
          <span className={journey.eyebrow}>Approach → surface</span>
          <h2>
            Every world
            <br />
            has <em>a story.</em>
          </h2>
          <p>This one is built on real systems, good questions, and a little curiosity.</p>
          <a className={journey.skip} href="#work" tabIndex={-1}>
            Read the chapters <Icon name="down" size={16} />
          </a>
        </div>
        <svg
          className={journey.surface}
          viewBox="0 0 1440 360"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 210Q270 165 530 228T1040 124 1440 88V360H0Z" fill="#72868a" />
          <path d="M0 260Q220 135 440 237T940 216 1440 156V360H0Z" fill="#a8ada0" />
          <path d="M0 279Q330 206 612 286T1160 240 1440 248V360H0Z" fill="#e9e2d4" />
          <g stroke="#7d8d871f">
            <path d="M0 301Q330 228 612 308T1160 262 1440 270M0 316Q330 243 612 323T1160 277 1440 285M0 331Q330 258 612 338T1160 292 1440 300" />
          </g>
        </svg>
        <div className={journey.bottom} aria-hidden="true">
          <div className={journey.scroll}>
            <Icon name="down" size={16} /> SCROLL TO GET CLOSER
          </div>
          <span>
            A NATIVE-SCROLL JOURNEY <em> / </em> TAKE YOUR TIME
          </span>
        </div>
        <p className={journey.motionNote}>
          A quieter route. Same universe. Continue below for the work.
        </p>
      </div>
    </section>
  );
}

const SYSTEM_NODES = [
  {
    label: 'Storage',
    icon: 'grid',
    title: 'Reliability is a feature.',
    text: 'Distributed storage, slice-based replication, and disk recovery. Currently exploring these problems on Azure Direct Drive.',
  },
  {
    label: 'Signals',
    icon: 'globe',
    title: 'Find the signal in the noise.',
    text: 'Large-scale telemetry, IO latency anomaly detection, and release comparison. Turning operational data into useful decisions.',
  },
  {
    label: 'Intelligence',
    icon: 'spark',
    title: 'AI that leaves the notebook.',
    text: 'RAG, voice pipelines, and agentic workflows. Useful intelligence is the kind that reaches people in production.',
  },
] as const;

function CommandVisual() {
  const [selected, setSelected] = useState(0);
  return (
    <div className={styles.commandScene}>
      <div className={styles.commandBar}>
        <span className={styles.statusDot} /> FOCUS MAP <span>SYS / CJ-01</span>
      </div>
      <div className={styles.commandGrid}>
        <div className={styles.commandSource}>
          CURIOSITY
          <br />
          <span>input layer</span>
        </div>
        <div className={styles.connector} aria-hidden="true" />
        <div className={styles.commandNodes}>
          {SYSTEM_NODES.map((node, index) => (
            <button
              key={node.label}
              aria-pressed={selected === index}
              className={selected === index ? styles.selectedNode : ''}
              onClick={() => setSelected(index)}
            >
              <Icon name={node.icon} size={22} />
              <span>{node.label}</span>
              <small>0{index + 1}</small>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.commandDetail} aria-live="polite">
        <span className={styles.mono}>SELECTED MODULE / 0{selected + 1}</span>
        <h2>{SYSTEM_NODES[selected].title}</h2>
        <p>{SYSTEM_NODES[selected].text}</p>
      </div>
      <div className={styles.commandFoot}>Interactive focus map. Not a production topology.</div>
    </div>
  );
}

export function Visual({ onTerminal }: { onTerminal: () => void; onVault: () => void }) {
  if (ACTIVE_CONCEPT === 'universe') return <UniverseVisual />;
  if (ACTIVE_CONCEPT === 'command') return <CommandVisual />;
  return <OSVisual onTerminal={onTerminal} />;
}
