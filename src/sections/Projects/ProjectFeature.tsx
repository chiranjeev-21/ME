import { useRef } from 'react';
import type { CSSProperties, FocusEvent, ReactNode } from 'react';
import { AppLink } from '../../app/router.tsx';
import { PinnedSection } from '../../components/motion/PinnedSection';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import { languageColour, questMedia } from '../../data/questMedia.ts';
import type {
  GitHubRepository,
  Project,
  ProjectTreatment,
  QuestTreatment,
} from '../../data/types.ts';
import { ScrollTrigger, gsap } from '../../lib/gsap.ts';
import { SitePlate, SourcePlate, SwarmPlate, TypePlate } from './QuestPlates';
import styles from './ProjectFeature.module.css';

type Treatment = ProjectTreatment | QuestTreatment;
type Side = 'left' | 'right';
type Select = (selector: string) => Element[];

const TINT: Record<ProjectTreatment, string> = {
  monitor: '#9fb3c9',
  surveillance: '#d0574a',
};

// The frame sits opposite the title, then opens to full bleed.
const FRAME: Record<Side, string> = {
  right: 'inset(17% 6% 17% 47% round 3px)',
  left: 'inset(17% 47% 17% 6% round 3px)',
};
const FULL = 'inset(0% 0% 0% 0% round 0px)';

/** Each treatment's own gesture, layered on the shared three-beat choreography. */
const ACCENTS: Record<Treatment, (tl: gsap.core.Timeline, q: Select) => void> = {
  monitor: (tl, q) =>
    tl.fromTo(
      q('[data-tilt]'),
      { rotateX: 14, rotateY: -16, z: -90 },
      { rotateX: 0, rotateY: 0, z: 0, duration: 0.38, ease: 'cine' },
      0.04
    ),
  surveillance: (tl, q) =>
    tl.fromTo(
      q('[data-box]'),
      { left: '58%', top: '30%', width: '18%', height: '34%' },
      { left: '52%', top: '16%', width: '34%', height: '38%', duration: 0.6, ease: 'power1.inOut' },
      0
    ),
  // The page settles into place, as if it had just been scrolled to its top.
  site: (tl, q) =>
    tl.fromTo(
      q('[data-tilt]'),
      { yPercent: 5 },
      { yPercent: 0, duration: 0.36, ease: 'cine' },
      0.04
    ),
  // A reading light passes down the excerpt while the language drifts behind it.
  source: (tl, q) => {
    const band = q('[data-band]')[0] as HTMLElement | undefined;
    const lines = Number(band?.dataset.lines) || 1;
    if (band)
      tl.fromTo(band, { yPercent: 0 }, { yPercent: (lines - 1) * 100, duration: 0.62 }, 0.02);
    tl.fromTo(q('[data-word]'), { xPercent: 6 }, { xPercent: -6, duration: 1.1 }, 0);
  },
  type: (tl, q) =>
    tl.fromTo(q('[data-ghost]'), { xPercent: 7 }, { xPercent: -7, duration: 1.1 }, 0),
  // A slow dolly into the fleet while the frame opens.
  swarm: (tl, q) =>
    tl.fromTo(
      q('[data-swarm]'),
      { scale: 1.08, yPercent: 3 },
      { scale: 1, yPercent: 0, duration: 0.7, ease: 'cine' },
      0.02
    ),
};

interface SceneProps {
  project: Project;
  label: string;
  treatment: Treatment;
  side?: Side;
  /** Extra scroll distance while held, in viewport heights. */
  length?: number;
  heading?: 'h3' | 'h4';
  tint?: string;
  quest?: boolean;
  /** What fills the frame: a screenshot or a typeset plate. */
  visual: ReactNode;
  /** Detail columns; each carries `data-detail`. */
  children: ReactNode;
}

/**
 * One pinned scene in three beats: the title steps aside as the frame opens to
 * full bleed and the image settles; a clean hold; then the light drops and the
 * slate and details rise. Narrow screens and reduced motion get a static layout.
 */
function Scene({
  project,
  label,
  treatment,
  side = 'right',
  length = 2.2,
  heading: Heading = 'h3',
  tint,
  quest = false,
  visual,
  children,
}: SceneProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const choreograph = (tl: gsap.core.Timeline, stage: HTMLElement) => {
    const q = gsap.utils.selector(stage);
    const details = q('[data-detail]');
    // Quests hold a little longer on the work itself before the details arrive.
    const hold = quest ? 0.1 : 0;
    // Staggered targets need explicit start states. Opacity, not visibility, keeps the
    // links reachable by keyboard and assistive tech before they rise.
    gsap.set(details, { y: 70, opacity: 0, pointerEvents: 'none' });
    // Beat 1 — the title steps aside as the frame opens to full bleed.
    tl.to(
      q('[data-title]'),
      { autoAlpha: 0, x: side === 'left' ? 48 : -48, duration: 0.12, ease: 'power1.in' },
      0.02
    )
      .fromTo(
        q('[data-media]'),
        { clipPath: FRAME[side] },
        { clipPath: FULL, duration: 0.36, ease: 'cine' },
        0.04
      )
      .fromTo(
        q('[data-media-inner]'),
        { scale: 1.3 },
        { scale: 1, duration: 0.5, ease: 'power2.out' },
        0
      )
      // Beat 2 — a clean hold on the work itself, then the light drops.
      .fromTo(
        q('[data-scrim]'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.12, ease: 'none' },
        0.5 + hold
      )
      // Beat 3 — the slate and details rise into the lower half and hold for reading.
      .to(
        details,
        {
          y: 0,
          opacity: 1,
          pointerEvents: 'auto',
          duration: 0.16,
          stagger: 0.035,
          ease: 'power2.out',
        },
        0.55 + hold
      )
      .to({}, { duration: quest ? 0.3 : 0.28 });
    ACCENTS[treatment](tl, q);
  };

  // Keyboard users tabbing into the details are brought to the point where they are visible.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const root = sectionRef.current?.querySelector<HTMLElement>('section');
    if (!root?.dataset.pinned || !(event.target as HTMLElement).closest('[data-detail]')) return;
    const trigger = ScrollTrigger.getAll().find(item => item.trigger === root);
    if (trigger && trigger.progress < 0.75)
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * 0.82,
        behavior: 'auto',
      });
  };

  const titleId = `${quest ? 'quest' : 'project'}-${project.slug}`;
  const attributes: Record<string, string> = { 'data-treatment': treatment, 'data-side': side };
  if (quest) attributes['data-quest'] = '';
  return (
    <div
      ref={sectionRef}
      onFocus={onFocus}
      style={{ '--tint': tint ?? 'var(--accent)' } as CSSProperties}
    >
      <PinnedSection
        className={styles.feature}
        stageClassName={styles.stage}
        length={length}
        choreograph={choreograph}
        media="(min-width: 900px) and (min-height: 640px)"
        labelledBy={titleId}
        dataAttributes={attributes}
      >
        <div className={styles.media} data-media>
          <div className={styles.tiltSpace}>
            <div className={styles.mediaInner} data-media-inner>
              <div className={styles.tilt} data-tilt>
                {visual}
              </div>
            </div>
          </div>
          <div className={styles.scrim} data-scrim aria-hidden="true" />
        </div>

        <div className={styles.titleBlock} data-title>
          <p className={`u-label ${styles.kicker}`}>{label}</p>
          <Heading id={titleId} className={styles.title}>
            {project.title}
          </Heading>
          <p className={styles.summary}>{project.summary}</p>
        </div>

        <div className={styles.details}>
          <div className={styles.slate} data-detail aria-hidden="true">
            <span className={`u-label ${styles.kicker}`}>{label}</span>
            <span className={styles.slateTitle}>{project.title}</span>
          </div>
          {children}
        </div>
      </PinnedSection>
    </div>
  );
}

function Surveillance({ title }: { title: string }) {
  return (
    <div className={styles.cctv} aria-hidden="true">
      <span className={styles.cctvWord}>MASK</span>
      <div className={styles.cctvBox} data-box>
        <i />
        <i />
        <i />
        <i />
        <span className="u-label">detection region</span>
      </div>
      <p className={`u-label ${styles.hud} ${styles.hudTl}`}>CAM 01 — real-time</p>
      <p className={`u-label ${styles.hud} ${styles.hudTr}`}>
        <span className={styles.rec} /> rec
      </p>
      <p className={`u-label ${styles.hud} ${styles.hudBl}`}>{title}</p>
      <p className={`u-label ${styles.hud} ${styles.hudBr}`}>YOLO · computer vision</p>
      <div className={styles.scan} />
    </div>
  );
}

/** A curated case study or the research artifact, numbered within the chapter. */
export function ProjectFeature({ project, index }: { project: Project; index: number }) {
  const treatment = project.treatment ?? 'monitor';
  const artifact = treatment === 'surveillance';
  const label = `04.${index + 1} — ${artifact ? 'Research artifact' : project.categories.join(' · ')}`;
  const visual = project.image ? (
    <img
      src={project.image.src}
      srcSet={`${project.image.srcSmall} 1200w, ${project.image.src} 2400w`}
      sizes="100vw"
      width={project.image.width}
      height={project.image.height}
      alt={project.image.alt}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <Surveillance title={project.title} />
  );
  return (
    <Scene
      project={project}
      label={label}
      treatment={treatment}
      tint={TINT[treatment]}
      visual={visual}
    >
      <div className={styles.detailCol} data-detail>
        <p className="u-label">{artifact ? 'What it is' : 'The problem'}</p>
        <p className={styles.detailLead}>{artifact ? project.summary : project.problem}</p>
      </div>
      <div className={styles.detailCol} data-detail>
        <p className="u-label">{artifact ? 'What is documented' : 'Architecture'}</p>
        <ul className={styles.detailList}>
          {(artifact
            ? [...project.outcomes, ...project.tradeoffs]
            : project.architecture.slice(0, 3)
          ).map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.detailCol} data-detail>
        <p className="u-label">Stack</p>
        <p className={styles.stack}>{project.technologies.join(' · ')}</p>
        <div className={styles.links}>
          <AppLink href={`/projects/${project.slug}`} className={styles.primaryLink}>
            {artifact ? 'Read the dossier' : 'Read the case study'} <Icon name="arrow-right" />
          </AppLink>
          {project.sourceUrl && (
            <ExternalLink href={project.sourceUrl} className="u-link">
              {artifact ? 'Original artifact' : 'Source on GitHub'} <Icon name="arrow-up-right" />
            </ExternalLink>
          )}
          {project.demoUrl && (
            <ExternalLink href={project.demoUrl} className="u-link">
              Live preview <Icon name="arrow-up-right" />
            </ExternalLink>
          )}
        </div>
      </div>
    </Scene>
  );
}

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * A public repository staged like the featured work, using only its public
 * metadata. The frame holds its live site, a real source excerpt, or — with
 * neither — its name set as type.
 */
export function QuestFeature({
  project,
  meta,
  index,
  total,
}: {
  project: Project;
  meta?: GitHubRepository;
  index: number;
  total: number;
}) {
  const language = meta?.primaryLanguage?.name || undefined;
  const colour = languageColour(language, meta?.primaryLanguage?.color);
  const media = questMedia(project.title, project.demoUrl);
  const topics = project.technologies.filter(item => item !== language);
  const stars = meta?.stargazerCount ?? 0;
  const updated = meta
    ? new Date(meta.updatedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : undefined;
  const label = `Side quest ${pad(index + 1)} / ${pad(total)}${language ? ` — ${language}` : ''}`;
  const visual =
    media?.kind === 'site' ? (
      <SitePlate capture={media} />
    ) : media?.kind === 'source' ? (
      <SourcePlate excerpt={media} language={language} repository={project.title} />
    ) : media?.kind === 'swarm' ? (
      <SwarmPlate illustration={media} language={language} repository={project.title} />
    ) : (
      <TypePlate name={project.title} language={language} topics={topics} url={project.sourceUrl} />
    );
  return (
    <Scene
      project={project}
      label={label}
      treatment={media?.kind ?? 'type'}
      side={index % 2 === 0 ? 'left' : 'right'}
      length={1.6}
      heading="h4"
      tint={colour ? `color-mix(in oklab, ${colour} 70%, #ece6db)` : undefined}
      quest
      visual={visual}
    >
      <div className={styles.detailCol} data-detail>
        <p className="u-label">Description</p>
        <p className={styles.questLead}>{project.summary}</p>
      </div>
      <div className={styles.detailCol} data-detail>
        <p className="u-label">Language &amp; topics</p>
        <p className={styles.stack}>
          {[language, ...topics].filter(Boolean).join(' · ') || 'Not specified'}
        </p>
        {updated && (
          <p className={`u-label ${styles.meta}`}>
            Updated {updated}
            {stars > 0 && ` · ${stars} ${stars === 1 ? 'star' : 'stars'}`}
          </p>
        )}
        {media && (
          <p className={styles.visualNote}>
            {media.kind === 'site'
              ? `Image: the live site, captured ${media.captured}.`
              : media.kind === 'swarm'
                ? `Image: an illustration of the swarm in the ${media.basis}, rendered live — not a screenshot.`
                : `Image: ${media.path}, lines ${media.startLine}–${media.startLine + media.lines.length - 1}.`}
          </p>
        )}
      </div>
      <div className={styles.detailCol} data-detail>
        <p className="u-label">Links</p>
        <div className={`${styles.links} ${styles.questLinks}`}>
          <AppLink href={`/projects/${project.slug}`} className={styles.primaryLink}>
            Read the dossier<span className="u-sr"> for {project.title}</span>{' '}
            <Icon name="arrow-right" />
          </AppLink>
          {project.sourceUrl && (
            <ExternalLink href={project.sourceUrl} className="u-link">
              Source on GitHub<span className="u-sr">: {project.title}</span>{' '}
              <Icon name="arrow-up-right" />
            </ExternalLink>
          )}
          {project.demoUrl && project.demoUrl !== project.sourceUrl && (
            <ExternalLink href={project.demoUrl} className="u-link">
              Live site<span className="u-sr">: {project.title}</span>{' '}
              <Icon name="arrow-up-right" />
            </ExternalLink>
          )}
        </div>
      </div>
    </Scene>
  );
}
