import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import styles from './Portfolio.module.css';

const CHAPTERS = [
  { id: 'question', label: 'The question' },
  { id: 'decisions', label: 'The decisions' },
  { id: 'evidence', label: 'The evidence' },
] as const;

const DRAWING_NOTES = [
  'A request is a promise. What if the disk never replies?',
  'Make the timeout explicit. Give recovery a path of its own.',
  'A sketch explains intent. Failure testing is where it has to hold up.',
];

export function EngineeringJourney() {
  const ref = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-chapter] h2'));
    let frame = 0;
    const update = () => {
      let next = 0;
      const readingLine = window.innerHeight * (window.innerWidth <= 740 ? 0.9 : 0.6);
      chapters.forEach((element, index) => {
        if (element.getBoundingClientRect().top <= readingLine) next = index;
      });
      setChapter(previous => (previous === next ? previous : next));
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section
      ref={ref}
      id="inquiry"
      className={styles.inquiry}
      aria-label="From a question to the evidence"
      data-chapter-active={CHAPTERS[chapter].id}
    >
      <div className={styles.inquiryDrawing}>
        <div className={styles.drawingHeading}>
          <span>ONE QUESTION, UNFOLDED</span>
          <span>01 — 03</span>
        </div>
        <nav className={styles.chapterNav} aria-label="Engineering story chapters">
          {CHAPTERS.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={chapter === index ? 'step' : undefined}
            >
              <span>0{index + 1}</span> {item.label}
            </a>
          ))}
        </nav>
        <figure className={styles.systemSketch}>
          <svg viewBox="0 0 520 340" aria-hidden="true">
            <defs>
              <marker
                id="sketch-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" />
              </marker>
            </defs>
            <g className={styles.sketchBase}>
              <rect x="25" y="35" width="154" height="70" rx="3" />
              <text x="102" y="77">
                Request
              </text>
              <path d="M 179 70 H 335" markerEnd="url(#sketch-arrow)" />
              <text x="257" y="53" className={styles.sketchLabel}>
                IO
              </text>
              <rect x="340" y="35" width="154" height="70" rx="3" />
              <text x="417" y="77">
                Disk
              </text>
            </g>
            <g className={styles.sketchQuestion}>
              <path d="M 417 109 V 150" />
              <text x="417" y="185">
                No reply?
              </text>
            </g>
            <g className={styles.sketchRecovery} data-sketch-layer="recovery">
              <path
                className={styles.drawPath}
                pathLength="1"
                d="M 417 105 V 210 H 350"
                markerEnd="url(#sketch-arrow)"
              />
              <text x="465" y="164" className={styles.sketchLabel}>
                timeout
              </text>
              <rect x="165" y="175" width="180" height="70" rx="3" />
              <text x="255" y="217">
                Recovery policy
              </text>
              <path
                className={styles.drawPath}
                pathLength="1"
                d="M 165 210 H 102 V 110"
                markerEnd="url(#sketch-arrow)"
              />
              <text x="58" y="164" className={styles.sketchLabel}>
                recover
              </text>
            </g>
            <g className={styles.sketchProof} data-sketch-layer="validation">
              <path className={styles.drawPath} pathLength="1" d="M 255 245 V 279" />
              <rect x="130" y="280" width="250" height="46" rx="3" />
              <text x="255" y="309">
                Validate in failure testing
              </text>
            </g>
          </svg>
          <figcaption>{DRAWING_NOTES[chapter]}</figcaption>
        </figure>
        <div className={styles.drawingFoot}>
          <span>Working sketch. Not a production topology.</span>
          <a href={chapter === 2 ? '#microsoft-azure' : `#${CHAPTERS[chapter + 1].id}`}>
            {chapter === 2 ? 'Read the Microsoft evidence' : 'Follow the thread'}
            <Icon name={chapter === 2 ? 'arrow' : 'down'} size={15} />
          </a>
        </div>
      </div>

      <div className={styles.inquiryChapters}>
        <article id="question" data-chapter className={styles.inquiryChapter}>
          <span className={styles.eyebrow}>01 / CURIOSITY</span>
          <h2>
            What happens when
            <br />
            the disk doesn&apos;t answer?
          </h2>
          <p>
            The happy path is a useful starting point. I&apos;m interested in what happens next: the
            slow request, the missing reply, the assumption that stops being true.
          </p>
          <p>
            That question is close to my current work on <strong>Azure Direct Drive</strong> —
            distributed computing, storage reliability, and performance.
          </p>
          <a href="#decisions" className={styles.threadLink}>
            Open up the system <Icon name="down" size={16} />
          </a>
        </article>
        <article id="decisions" data-chapter className={styles.inquiryChapter}>
          <span className={styles.eyebrow}>02 / SYSTEMS &amp; DECISIONS</span>
          <h2>
            A timeout needs
            <br />
            more than a retry.
          </h2>
          <p>
            Make failure visible. Decide how recovery happens. Then test the assumptions. The sketch
            opens a second path because the unhappy path deserves a design, too.
          </p>
          <dl className={styles.decisionNotes}>
            <div>
              <dt>Observe</dt>
              <dd>Telemetry and release comparisons, before guessing.</dd>
            </div>
            <div>
              <dt>Bound</dt>
              <dd>Capacity throttling for bursty IO workloads.</dd>
            </div>
            <div>
              <dt>Recover</dt>
              <dd>Per-Disk Policy for automatic recovery on IO timeouts.</dd>
            </div>
          </dl>
          <a href="#systems" className={styles.threadLink}>
            Explore my engineering toolkit <Icon name="arrow" size={16} />
          </a>
        </article>
        <article id="evidence" data-chapter className={styles.inquiryChapter}>
          <span className={styles.eyebrow}>03 / THE WORK BEHIND THE SKETCH</span>
          <h2>
            Keep the evidence.
            <br />
            Keep the caveats.
          </h2>
          <p>
            At Microsoft, I developed and validated Per-Disk Policy for IO timeouts (E17), reducing
            VM downtime scenarios by <strong>~80% in failure testing</strong>. That qualification
            matters. It&apos;s not a claim about production downtime.
          </p>
          <div className={styles.evidenceLinks}>
            <a href="#microsoft-azure">
              <span>
                Microsoft<small>Azure Direct Drive / recovery &amp; telemetry</small>
              </span>
              <Icon name="arrow" size={19} />
            </a>
            <a href="#amazon-jwo">
              <span>
                Amazon<small>Timeout-aware spillover / resource allocation</small>
              </span>
              <Icon name="arrow" size={19} />
            </a>
            <a href="#oyo-sde1">
              <span>
                Oyo<small>Another layer: voice pipelines &amp; RAG</small>
              </span>
              <Icon name="arrow" size={19} />
            </a>
          </div>
          <p className={styles.evidenceNote}>
            Resume-based work below. Personal experiments and their source links come after.
          </p>
        </article>
      </div>
    </section>
  );
}
