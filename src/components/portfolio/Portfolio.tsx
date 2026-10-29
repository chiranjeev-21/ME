import { useState } from 'react';
import { EDUCATION, EMAIL, EXPERIENCE, NAV_LINKS, SOCIAL_LINKS } from '@/constants';
import { ACTIVE_CONCEPT, CONCEPTS } from '@/constants/concept';
import { usePortfolioMotion } from '@/hooks/usePortfolioMotion';
import type { UsePinnedQuestsState } from '@/hooks/usePinnedQuests';
import { Icon } from './Icon';
import { Visual } from './Visual';
import styles from './Portfolio.module.css';

const CAPABILITIES = [
  {
    id: 'distributed',
    number: '01',
    icon: 'grid',
    label: 'DISTRIBUTED SYSTEMS',
    title: 'The invisible stuff.\nThe essential stuff.',
    text: 'Reliable storage, resource allocation, and systems that keep their promises when the easy assumptions stop holding.',
    skills: ['Distributed Computing', 'Distributed Storage', 'Azure', 'System Design', 'C/C++'],
    footnote: 'Now exploring / Azure Direct Drive',
  },
  {
    id: 'ai',
    number: '02',
    icon: 'spark',
    label: 'APPLIED INTELLIGENCE',
    title: 'Less AI theatre.\nMore useful intelligence.',
    text: 'From anomaly detection to RAG and voice pipelines. Models matter. What happens after the model matters just as much.',
    skills: ['Agentic AI', 'LLM / RAG', 'Python', 'PyTorch', 'Langchain', 'NLP', 'Multimodal'],
    footnote: 'Built with / telemetry, language & vision',
  },
  {
    id: 'backend',
    number: '03',
    icon: 'code',
    label: 'BACKEND ENGINEERING',
    title: 'Built to ship.\nDesigned to stay.',
    text: 'APIs, data pipelines, and runtime services. Thoughtful interfaces on top of solid engineering foundations.',
    skills: ['Java', 'FastAPI', 'Node.js', 'TypeScript', 'SQL', 'Kafka', 'Redis', 'Docker', 'AWS'],
    footnote: 'The connective tissue / APIs to operations',
  },
] as const;

const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'distributed', label: 'Distributed systems' },
  { id: 'ai', label: 'AI & ML' },
  { id: 'backend', label: 'Backend' },
];

const SKILL_THREADS = [
  { id: 'distributed', label: 'Distributed systems' },
  { id: 'ai', label: 'Agentic AI' },
  { id: 'backend', label: 'Backend engineering' },
];

interface PortfolioProps {
  quests: UsePinnedQuestsState;
  onVault: () => void;
  onTerminal: () => void;
}

function SectionHeading({
  number,
  label,
  title,
  text,
}: {
  number: string;
  label: string;
  title: string;
  text?: string;
}) {
  return (
    <div className={styles.sectionHeading} data-reveal>
      <div className={styles.eyebrow}>
        <span>{number}</span> / {label}
      </div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Portfolio({ quests, onVault, onTerminal }: PortfolioProps) {
  const { ref, activeSection, reducedMotion } = usePortfolioMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const concept = CONCEPTS[ACTIVE_CONCEPT];
  const capabilities = CAPABILITIES.filter(item => filter === 'all' || item.id === filter);
  const projectStatus = quests.isLoading
    ? 'Connecting to GitHub'
    : quests.data.source !== 'github'
      ? 'Local artifact / offline fallback'
      : quests.data.selection === 'recent'
        ? 'Live GitHub / recent repositories'
        : 'Live GitHub / pinned repositories';

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div
      ref={ref}
      className={styles.site}
      data-concept={ACTIVE_CONCEPT}
      data-motion={reducedMotion ? 'off' : 'on'}
    >
      <div className={styles.progress} aria-hidden="true" />
      <header className={styles.header}>
        <a href="#hero" className={styles.brand} aria-label="Chiranjeev Singh, back to top">
          cj<span>.</span>
          <small>
            {concept.name}
            <span>/ 2026</span>
          </small>
        </a>
        <nav
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
          aria-label="Main navigation"
          id="main-navigation"
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setMenuOpen(false);
              document.querySelector<HTMLElement>('[aria-controls="main-navigation"]')?.focus();
            }
          }}
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeSection === link.href.slice(1) ? 'location' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.commandButton} onClick={onTerminal} aria-label="Open terminal">
            <Icon name="terminal" size={16} />
            <span>Let&apos;s explore</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button
            className={styles.menuButton}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section id="hero" data-section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroTopline}>
            <span>{concept.eyebrow}</span>
            <span className={styles.heroEdition}>A PERSONAL SPACE / NOT JUST A RÉSUMÉ</span>
          </div>
          <div className={styles.heroBody}>
            <div className={styles.heroCopy}>
              <a href="#work" className={styles.currentStatus}>
                <span className={styles.statusDot} /> Currently at Microsoft <span>/</span> Azure
              </a>
              <div className={styles.heroGreeting}>
                <span>Hi, I&apos;m CJ.</span>
                <span className={styles.greetingPortrait}>
                  <img src="/images/photo.jpeg" width="64" height="64" alt="" />
                </span>
              </div>
              <h1 id="hero-heading">
                {concept.headline}
                <br />
                <span>{concept.accent}</span>
              </h1>
              <p>
                A <strong>software engineer</strong> making distributed systems more reliable and AI
                more useful. Currently building on <strong>Azure Direct Drive</strong>. Previously
                Amazon &amp; Oyo.
              </p>
              <nav className={styles.skillThreads} aria-label="Explore my skills">
                <span>FOLLOW A THREAD</span>
                <div>
                  {SKILL_THREADS.map(item => (
                    <a key={item.id} href="#systems" onClick={() => setFilter(item.id)}>
                      {item.label} <Icon name="arrow" size={12} />
                    </a>
                  ))}
                </div>
              </nav>
              <div className={styles.heroButtons}>
                <a className={styles.primaryButton} href="#work">
                  Explore my work <Icon name="down" size={18} />
                </a>
                <a className={styles.secondaryButton} href={`mailto:${EMAIL}`}>
                  Let&apos;s talk <Icon name="arrow" size={18} />
                </a>
              </div>
              <div className={styles.heroSignature}>
                <span className={styles.signatureMark} aria-hidden="true">
                  *
                </span>
                <span>
                  {concept.note}
                  <br />
                  <small>Stay for the work. Wander for the side quests.</small>
                </span>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <Visual onTerminal={onTerminal} onVault={onVault} />
            </div>
          </div>
          <div className={styles.heroBottom}>
            <div className={styles.companyTrail}>
              <span>THE JOURNEY SO FAR</span>
              <strong>Microsoft</strong>
              <i />
              Amazon
              <i />
              Oyo
            </div>
            <a href="#work" className={styles.scrollCue}>
              SCROLL TO DISCOVER <Icon name="down" size={15} />
            </a>
          </div>
        </section>

        <div className={styles.statement} aria-label="Engineering focus">
          <span>Distributed by design.</span>
          <Icon name="spark" size={30} />
          <span>Curious by default.</span>
          <Icon name="spark" size={30} />
          <span>Human at the core.</span>
        </div>

        <section
          id="work"
          data-section
          className={`${styles.section} ${styles.workSection}`}
          aria-labelledby="work-heading"
        >
          <aside className={styles.workAside}>
            <div className={styles.eyebrow}>
              <span>01</span> / THE TRACK RECORD
            </div>
            <h2 id="work-heading" data-reveal>
              Real problems.
              <br />
              <span>Measurable impact.</span>
            </h2>
            <p data-reveal>
              From AI-driven experiences to the distributed systems underneath them. A few chapters
              from the journey.
            </p>
            <div className={styles.asideNote} data-reveal>
              <span>NOW</span>
              <strong>Microsoft</strong>
              <p>
                Azure Direct Drive
                <br />
                Bengaluru, India
              </p>
              <a href="#systems">
                What I work with <Icon name="arrow" size={15} />
              </a>
            </div>
          </aside>
          <div className={styles.timeline}>
            {EXPERIENCE.map((item, index) => (
              <article key={item.id} className={styles.job} data-reveal>
                <span className={styles.timelineDot} aria-hidden="true" />
                <div className={styles.jobTop}>
                  <span>{item.period}</span>
                  {index === 0 && <span className={styles.currentLabel}>CURRENT CHAPTER</span>}
                </div>
                <div className={styles.jobHeading}>
                  <div className={`${styles.companyIcon} ${styles[item.logoVariant]}`}>
                    {item.company === 'Microsoft' ? (
                      <span className={styles.microsoftMark} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      item.logoInitial
                    )}
                  </div>
                  <div>
                    <h3>{item.company}</h3>
                    <p>{item.role}</p>
                  </div>
                  <span className={styles.jobIndex}>0{index + 1}</span>
                </div>
                <p
                  className={styles.jobLead}
                  dangerouslySetInnerHTML={{ __html: item.highlights[0] }}
                />
                <details className={styles.jobDetails} open={index === 0}>
                  <summary>
                    Impact &amp; engineering details <span aria-hidden="true">+</span>
                  </summary>
                  <ul>
                    {item.highlights.slice(1).map(highlight => (
                      <li key={highlight} dangerouslySetInnerHTML={{ __html: highlight }} />
                    ))}
                  </ul>
                </details>
                <div className={styles.tags}>
                  {item.tags.map(tag => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="systems"
          data-section
          className={`${styles.section} ${styles.systemsSection}`}
          aria-label="Systems and skills"
        >
          <div className={styles.sectionTop}>
            <SectionHeading
              number="02"
              label="THE TOOLBOX"
              title="Different layers. Same curiosity."
              text="Not a wall of logos. A few connected ways I like to solve problems."
            />
            <span className={styles.sectionSideNote}>
              <Icon name="code" size={22} /> THINK IN SYSTEMS.
              <br />
              BUILD FOR PEOPLE.
            </span>
          </div>
          <div className={styles.filters} aria-label="Filter skills">
            {FILTERS.map(item => (
              <button
                key={item.id}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.capabilityGrid} data-filtered={filter !== 'all'}>
            {capabilities.map(item => (
              <article key={item.id} className={styles.capability}>
                <div className={styles.capabilityTop}>
                  <Icon name={item.icon} size={26} />
                  <span>
                    {item.number} / {item.label}
                  </span>
                </div>
                <div
                  className={`${styles.systemArt} ${styles[`${item.id}Art`]}`}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <span />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className={styles.tags}>
                  {item.skills.map(skill => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <div className={styles.capabilityFoot}>{item.footnote}</div>
              </article>
            ))}
          </div>
          <div className={styles.systemsFooter}>
            <span className={styles.statusDot} /> Always learning. No framework is a personality.
          </div>
        </section>

        <section
          id="projects"
          data-section
          className={`${styles.section} ${styles.projectsSection}`}
          aria-label="Projects and side quests"
        >
          <div className={styles.sectionTop}>
            <SectionHeading
              number="03"
              label="OFF THE MAIN PATH"
              title={concept.projectTitle}
              text="Open-source work, research, and ideas that refused to stay in a notes app."
            />
            <button className={styles.secondaryButton} onClick={onVault} data-vault-trigger>
              Unlock the vault <Icon name="arrow" size={18} />
            </button>
          </div>
          <div className={styles.feedStatus} role="status">
            <span
              className={quests.data.source === 'github' ? styles.statusDot : styles.fallbackDot}
            />
            {projectStatus}
            <a href={quests.data.profile.url} target="_blank" rel="noopener noreferrer">
              View GitHub <Icon name="arrow" size={14} />
            </a>
          </div>
          <div className={styles.projectGrid}>
            {quests.isLoading
              ? [1, 2, 3].map(item => (
                  <div key={item} className={styles.skeleton} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                ))
              : quests.data.items.slice(0, 3).map((item, index) => (
                  <article key={item.id} className={styles.projectCard}>
                    <div className={styles.projectCardTop}>
                      <span>EXP / 0{index + 1}</span>
                      <Icon
                        name={index === 0 ? 'code' : index === 1 ? 'globe' : 'spark'}
                        size={23}
                      />
                    </div>
                    <h3>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.name}
                        <Icon name="arrow" size={21} />
                      </a>
                    </h3>
                    <p>{item.description}</p>
                    <div className={styles.projectTopics}>
                      {item.topics.slice(0, 3).map(topic => (
                        <span key={topic}>#{topic}</span>
                      ))}
                    </div>
                    <div className={styles.projectFoot}>
                      <span>{item.primaryLanguage?.name ?? 'Open source'}</span>
                      {item.homepageUrl ? (
                        <a href={item.homepageUrl} target="_blank" rel="noopener noreferrer">
                          Live demo <Icon name="arrow" size={14} />
                        </a>
                      ) : (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          Explore <Icon name="arrow" size={14} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
          </div>
          <button onClick={onVault} className={styles.vaultTeaser}>
            <span className={styles.vaultTeaserIcon} aria-hidden="true">
              <Icon name="spark" size={27} />
            </span>
            <span>
              <strong>A little off-script?</strong>
              <small>
                There&apos;s a treasure chest wandering around here. It leads somewhere good.
              </small>
            </span>
            <span className={styles.vaultTeaserEnd}>
              ENTER THE HIDDEN VAULT <Icon name="arrow" size={20} />
            </span>
          </button>
        </section>

        <section
          id="about"
          data-section
          className={`${styles.section} ${styles.aboutSection}`}
          aria-label="About Chiranjeev"
        >
          <div className={styles.aboutPortrait} data-reveal>
            <img
              src="/images/photo.jpeg"
              width="440"
              height="520"
              loading="lazy"
              alt="Chiranjeev Singh"
            />
            <div>
              <span>THE PERSON BEHIND THE TERMINAL</span>
              <strong>
                Chiranjeev Singh<span>.</span>
              </strong>
            </div>
            <span className={styles.portraitAnnotation}>A WORK IN PROGRESS, IN THE BEST WAY.</span>
          </div>
          <div className={styles.aboutCopy}>
            <SectionHeading
              number="04"
              label="A HUMAN, NOT JUST A STACK"
              title="Good engineering starts with good questions."
            />
            <p data-reveal>
              I like making complicated things make sense. Sometimes that means finding an anomaly
              in a sea of telemetry. Sometimes it means making a system recover when a disk
              doesn&apos;t cooperate. And sometimes it means building a tiny universe on the
              internet.
            </p>
            <p data-reveal>
              My work moves between{' '}
              <strong>distributed computing, backend engineering, and applied AI</strong>. The
              thread connecting them? A healthy obsession with how things work — and how they could
              work better.
            </p>
            <div className={styles.education} data-reveal>
              <div>
                <span>FOUNDATIONS</span>
                <h3>Thapar Institute of Engineering &amp; Technology</h3>
                <p>B.E. Computer Science &amp; Engineering / 2020–2024</p>
              </div>
              <strong>
                9.30<small>CGPA</small>
              </strong>
            </div>
            <div className={styles.recognition} data-reveal>
              {EDUCATION.slice(1).map(item => (
                <div key={item.id}>
                  <Icon name="spark" size={16} />
                  <span>{item.title}</span>
                </div>
              ))}
              <div>
                <Icon name="spark" size={16} />
                <span>Merit scholarship / four consecutive years</span>
              </div>
              <div>
                <Icon name="spark" size={16} />
                <span>AI &amp; ML Nanodegrees / Udacity</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cta"
          data-section
          className={`${styles.section} ${styles.contactSection}`}
          aria-labelledby="contact-heading"
        >
          <div className={styles.contactTop} data-reveal>
            <span className={styles.eyebrow}>05 / START A CONVERSATION</span>
            <Icon name="spark" size={58} />
          </div>
          <h2 id="contact-heading" data-reveal>
            Something interesting
            <br />
            on your mind<span>?</span>
          </h2>
          <div className={styles.contactBottom} data-reveal>
            <div>
              <p>
                A good problem. An unexpected idea.
                <br />
                Or just a hello. I&apos;m all ears.
              </p>
              <div className={styles.emailRow}>
                <a href={`mailto:${EMAIL}`}>
                  {EMAIL}
                  <Icon name="arrow" size={21} />
                </a>
                <button
                  onClick={() => {
                    void copyEmail();
                  }}
                  aria-label="Copy email address"
                >
                  <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={18} />
                </button>
              </div>
              <span role="status" className={styles.copyStatus}>
                {copyState === 'copied'
                  ? 'Email copied.'
                  : copyState === 'failed'
                    ? 'Copy unavailable. Use the email link to get in touch.'
                    : ''}
              </span>
            </div>
            <div className={styles.socialLinks}>
              {SOCIAL_LINKS.map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <Icon name="arrow" size={18} />
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>&copy; {new Date().getFullYear()} Chiranjeev Singh</span>
        <span>Built with intent. And a little curiosity.</span>
        <a href="#hero">
          BACK TO TOP <Icon name="down" size={13} style={{ transform: 'rotate(180deg)' }} />
        </a>
      </footer>
      <nav className={styles.dock} aria-label="Quick navigation">
        <a
          href="#work"
          aria-label="Experience"
          aria-current={activeSection === 'work' ? 'location' : undefined}
        >
          <Icon name="grid" />
          <span>Work</span>
        </a>
        <a
          href="#systems"
          aria-label="Systems and skills"
          aria-current={activeSection === 'systems' ? 'location' : undefined}
        >
          <Icon name="code" />
          <span>Systems</span>
        </a>
        <button onClick={onVault} aria-label="Open hidden vault">
          <Icon name="spark" />
          <span>Vault</span>
        </button>
        <button onClick={onTerminal} aria-label="Open command terminal">
          <Icon name="terminal" />
          <span>Terminal</span>
        </button>
        <a
          href="#cta"
          aria-label="Contact"
          aria-current={activeSection === 'cta' ? 'location' : undefined}
        >
          <Icon name="mail" />
          <span>Contact</span>
        </a>
      </nav>
    </div>
  );
}
