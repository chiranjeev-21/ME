import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { usePinnedQuests } from '../hooks/usePinnedQuests';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { buildUniverseContent } from './content';
import { WORLDS, getWorld } from './worlds';
import { routeHref, updateNavigation } from './navigation';
import { useUniverseNavigation } from './useNavigation';
import { WorldView } from './worlds/WorldView';
import { ResearchLab } from './lab/ResearchLab';
import { UniversePalette, UniverseTerminal } from './ui/Overlays';
import { UniverseIcon } from './ui/Icon';
import { SceneBoundary } from './SceneBoundary';
import { Expedition } from './journey/Expedition';
import type {
  ExpeditionFrame,
  ExpeditionHandle,
  UniverseNavigation,
  WorldId,
  WorldInteraction,
} from './types';
import styles from './Universe.module.css';

const UniverseScene = lazy(() =>
  import('./scene/UniverseScene').then(module => ({ default: module.UniverseScene }))
);

function canRender3D(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { powerPreference: 'low-power', antialias: false });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function OrbitIllustration() {
  return (
    <svg viewBox="0 0 640 460" fill="none" aria-hidden="true" className={styles.orbitIllustration}>
      {[80, 135, 195, 260].map(radius => (
        <ellipse
          key={radius}
          cx="320"
          cy="230"
          rx={radius}
          ry={radius * 0.56}
          transform="rotate(-20 320 230)"
          stroke="currentColor"
          strokeOpacity=".2"
        />
      ))}
      <circle cx="320" cy="230" r="28" fill="currentColor" opacity=".8" />
      <circle cx="165" cy="287" r="10" fill="#81bbc9" />
      <circle cx="438" cy="140" r="13" fill="#b3a5d7" />
      <circle cx="557" cy="194" r="16" fill="#d3a17f" />
      <circle cx="278" cy="382" r="8" fill="#9ab68d" />
    </svg>
  );
}

export function Universe() {
  const feed = usePinnedQuests();
  const reducedMotion = useReducedMotion();
  const { navigation, navigate, current: navigationState, cause } = useUniverseNavigation();
  const content = useMemo(() => buildUniverseContent(feed.data), [feed.data]);
  const [expeditionPhase, setExpeditionPhase] = useState<ExpeditionFrame['phase']>('orbit');
  const [overlay, setOverlay] = useState<'palette' | 'terminal' | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [support, setSupport] = useState<'checking' | 'supported' | 'unavailable'>('checking');
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState('');
  const [cameraPhase, setCameraPhase] = useState<'overview' | 'moving' | 'focused'>('overview');
  const [qualitySetting, setQualitySetting] = useState<'auto' | 'low' | 'high'>(() => {
    const requested = new URLSearchParams(window.location.search).get('quality');
    return requested === 'low' || requested === 'high' ? requested : 'auto';
  });
  const [compact, setCompact] = useState(
    () => window.innerWidth < 800 || window.innerWidth / window.innerHeight < 0.95
  );
  const failed = useRef(false);
  const contentHost = useRef<HTMLDivElement>(null);
  const selector = useRef<HTMLElement>(null);
  const expedition = useRef<ExpeditionHandle>(null);
  const expeditionFrame = useRef<ExpeditionFrame>({
    world: null,
    phase: 'orbit',
    approach: 0,
    entry: 0,
    readProgress: 0,
    jumpRevision: 0,
  });
  const interaction = useRef<WorldInteraction | null>(null);
  const [interactionRevision, setInteractionRevision] = useState(0);
  const pendingGoal = useRef<{ world: WorldId | null } | null>({ world: navigation.world });
  const previousNavigation = useRef<UniverseNavigation | null>(null);
  const world = navigation.world ? getWorld(navigation.world) : null;
  const quality =
    qualitySetting === 'auto'
      ? compact || navigator.hardwareConcurrency <= 4
        ? 'low'
        : 'high'
      : qualitySetting;
  const markers = useMemo(
    () =>
      content.projects.slice(0, 4).map(project => ({ slug: project.slug, title: project.title })),
    [content.projects]
  );

  const select = useCallback(
    (patch: Partial<UniverseNavigation>) => {
      const next = updateNavigation(navigationState.current, patch);
      const unchanged = routeHref(next) === routeHref(navigationState.current);
      pendingGoal.current = {
        world: patch.world !== undefined ? patch.world : navigationState.current.world,
      };
      setMobileMenu(false);
      navigate(patch);
      if (unchanged) {
        if (next.mode === 'explore') {
          if (next.world) expedition.current?.scrollToWorld(next.world, 'read', 'instant');
          else expedition.current?.scrollToOverview('instant');
        } else window.scrollTo({ top: 0, behavior: 'instant' });
        if (next.world) expedition.current?.focusWorld(next.world);
        pendingGoal.current = null;
      }
    },
    [navigate, navigationState]
  );
  const selectWorld = useCallback(
    (id: WorldId) => select({ world: id, projectSlug: null, articleSlug: null, vault: false }),
    [select]
  );
  const synchronizeScrollWorld = useCallback(
    (id: WorldId | null) => {
      if (navigationState.current.mode !== 'explore') return;
      if (
        cause.current !== 'scroll' &&
        (!previousNavigation.current ||
          routeHref(previousNavigation.current) !== routeHref(navigationState.current))
      )
        return;
      if (pendingGoal.current && pendingGoal.current.world !== id) return;
      if (pendingGoal.current?.world === id) pendingGoal.current = null;
      if (navigationState.current.world === id) return;
      navigate({ world: id, projectSlug: null, articleSlug: null, vault: false }, true, 'scroll');
    },
    [navigate, navigationState, cause]
  );
  const emitWorldInteraction = useCallback((event: Omit<WorldInteraction, 'at'>) => {
    interaction.current = { ...event, at: performance.now() };
    setInteractionRevision(previous => previous + 1);
  }, []);
  const sceneError = useCallback(
    (reason: string) => {
      if (failed.current) return;
      failed.current = true;
      setFailure(reason);
      setSupport('unavailable');
      setReady(false);
      navigate({ mode: 'browse' }, true, 'mode');
    },
    [navigate]
  );
  useEffect(() => {
    if (navigation.mode === 'browse') setReady(false);
  }, [navigation.mode]);
  useEffect(() => {
    if (navigation.mode !== 'explore') return;
    if (support === 'unavailable') {
      navigate({ mode: 'browse' }, true, 'mode');
      return;
    }
    if (support !== 'checking') return;
    if (canRender3D()) setSupport('supported');
    else
      sceneError(
        'WebGL 2 is unavailable on this device. Browse Mode keeps every destination accessible.'
      );
  }, [navigation.mode, support, navigate, sceneError]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 799px), (max-aspect-ratio: 19/20)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const project = content.projects.find(project => project.slug === navigation.projectSlug);
    const article = content.articles.find(article => article.slug === navigation.articleSlug);
    document.title = `${project?.title || article?.title || world?.name || 'CJ Universe'} — Chiranjeev Singh`;
  }, [content, navigation.projectSlug, navigation.articleSlug, world]);
  useEffect(() => {
    const host = contentHost.current;
    if (!host) return;
    const previous = previousNavigation.current;
    previousNavigation.current = navigation;
    if (cause.current === 'scroll') return;
    const modeChanged = previous?.mode !== navigation.mode;
    const routeChanged =
      !previous ||
      previous.world !== navigation.world ||
      previous.projectSlug !== navigation.projectSlug ||
      previous.articleSlug !== navigation.articleSlug ||
      previous.vault !== navigation.vault;
    if (!modeChanged && !routeChanged) return;
    pendingGoal.current = { world: navigation.world };
    if (navigation.mode === 'explore') {
      if (navigation.world) expedition.current?.scrollToWorld(navigation.world, 'read', 'instant');
      else expedition.current?.scrollToOverview('instant');
    } else {
      host.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    pendingGoal.current = null;
    if (navigation.world && routeChanged) expedition.current?.focusWorld(navigation.world);
  }, [navigation, cause]);
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    if (navigation.mode === 'explore') window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, [navigation.mode]);
  useEffect(() => {
    const keydown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOverlay(previous => (previous === 'palette' ? null : 'palette'));
        return;
      }
      if (overlay) return;
      if (event.key === 'Escape' && mobileMenu) {
        setMobileMenu(false);
        return;
      }
      const target = event.target as HTMLElement;
      if (target.matches('input,textarea,select') || target.isContentEditable) return;
      if (event.key === '`') {
        event.preventDefault();
        setOverlay('terminal');
      }
      if (event.key === 'Escape' && navigation.world) {
        setMobileMenu(false);
        select(
          navigation.projectSlug || navigation.articleSlug
            ? { projectSlug: null, articleSlug: null }
            : { world: null, vault: false }
        );
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [
    navigation.world,
    navigation.projectSlug,
    navigation.articleSlug,
    overlay,
    mobileMenu,
    select,
  ]);

  const link = (event: MouseEvent<HTMLAnchorElement>, patch: Partial<UniverseNavigation>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    select(patch);
  };
  const home = () => {
    select({ world: null, projectSlug: null, articleSlug: null, vault: false });
  };
  const brandHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    home();
  };
  const worldKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(
      selector.current?.querySelectorAll<HTMLButtonElement>('button[data-world-choice]') || []
    );
    const index = buttons.indexOf(event.currentTarget);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length;
    buttons[next]?.focus();
  };

  const overlayProps = { content, navigation, navigate: select, close: () => setOverlay(null) };
  const renderWorld = (id: WorldId) => {
    const destination: UniverseNavigation = {
      ...navigation,
      world: id,
      projectSlug: id === 'projects' ? navigation.projectSlug : null,
      articleSlug: id === 'writing' ? navigation.articleSlug : null,
      vault: id === 'projects' && navigation.vault,
    };
    return (
      <WorldView
        navigation={destination}
        navigate={select}
        content={content}
        feed={feed}
        active={navigation.world === id}
        onWorldInteraction={emitWorldInteraction}
        lab={
          <ResearchLab
            content={content}
            navigation={destination}
            navigate={select}
            onRun={matched =>
              emitWorldInteraction({ world: 'ai-lab', kind: 'research', value: matched })
            }
          />
        }
        openTerminal={() => setOverlay('terminal')}
      />
    );
  };
  const intro = (
    <section className={styles.landing} aria-labelledby="landing-heading">
      <span className={styles.eyebrow}>A PERSONAL UNIVERSE / BY CHIRANJEEV SINGH</span>
      <h1 id="landing-heading">
        CJ
        <br />
        <span>UNIVERSE</span>
      </h1>
      <p className={styles.tagline}>
        <span>Engineering ideas.</span> <span>Building experiences.</span>{' '}
        <em>Exploring what&apos;s next.</em>
      </p>
      <p className={styles.introduction}>
        I&apos;m Chiranjeev Singh — software engineer at Microsoft, AI enthusiast, and independent
        builder.
      </p>
      <div className={styles.landingActions}>
        <button
          className={styles.primaryButton}
          onClick={() =>
            expedition.current?.scrollToWorld(
              'about',
              'approach',
              reducedMotion ? 'instant' : 'smooth'
            )
          }
        >
          Begin the journey <UniverseIcon name="arrow" size={18} />
        </button>
        <a
          href={routeHref({ ...navigation, world: 'projects' })}
          onClick={event => link(event, { world: 'projects' })}
        >
          View Projects <UniverseIcon name="arrow" size={16} />
        </a>
      </div>
      <button
        className={styles.terminalShortcut}
        aria-label="Launch Terminal from landing"
        onClick={() => setOverlay('terminal')}
      >
        <UniverseIcon name="terminal" size={16} />
        Launch Terminal<span>For the keyboard-curious.</span>
      </button>
    </section>
  );
  return (
    <div
      className={styles.universe}
      data-universe-mode={navigation.mode}
      data-world={navigation.world || 'overview'}
      data-render-state={
        navigation.mode === 'browse' ? (failure ? 'fallback' : 'browse') : ready ? 'ready' : support
      }
      data-camera-phase={cameraPhase}
      data-expedition-phase={expeditionPhase}
      data-quality={quality}
      style={{ '--u-accent': world?.color || '#e5cda9' } as React.CSSProperties}
    >
      <a
        className="skip-link"
        href={routeHref({ ...navigation, mode: 'browse' })}
        onClick={event => {
          if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
          event.preventDefault();
          select({ mode: 'browse' });
          requestAnimationFrame(() => {
            if (navigationState.current.world) {
              expedition.current?.focusWorld(navigationState.current.world);
              return;
            }
            const heading = contentHost.current?.querySelector<HTMLElement>('h1, h2');
            heading?.setAttribute('tabindex', '-1');
            (heading || contentHost.current)?.focus({ preventScroll: true });
          });
        }}
      >
        Skip to accessible Browse Mode
      </a>
      {navigation.mode === 'explore' && (
        <div className={styles.sceneLayer} aria-label="Interactive 3D universe">
          {support === 'supported' && (
            <SceneBoundary onError={sceneError}>
              <Suspense fallback={null}>
                <UniverseScene
                  selected={navigation.world}
                  entered={Boolean(navigation.world)}
                  journey={expeditionFrame}
                  interaction={interaction}
                  interactionRevision={interactionRevision}
                  quality={quality}
                  reducedMotion={reducedMotion}
                  onSelect={selectWorld}
                  onReady={() => setReady(true)}
                  onError={sceneError}
                  onCameraState={setCameraPhase}
                  projectMarkers={markers}
                  onProjectSelect={slug =>
                    select({
                      world: 'projects',
                      projectSlug: slug,
                      articleSlug: null,
                      vault: false,
                    })
                  }
                />
              </Suspense>
            </SceneBoundary>
          )}
          {!ready && (
            <div className={styles.sceneLoading} role="status">
              <OrbitIllustration />
              <span>Preparing the observatory.</span>
              <small>Content and navigation are already available.</small>
              <button onClick={() => select({ mode: 'browse' })}>
                Browse without 3D <UniverseIcon name="arrow" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      <header className={styles.header}>
        <a
          href={routeHref({
            ...navigation,
            world: null,
            projectSlug: null,
            articleSlug: null,
            vault: false,
          })}
          onClick={brandHome}
          className={styles.brand}
          aria-label="CJ Universe home"
        >
          <span>
            cj<span>.</span>
          </span>
          <b>
            UNIVERSE<small>CHIRANJEEV SINGH</small>
          </b>
        </a>
        <nav
          className={`${styles.mainNav} ${mobileMenu ? styles.menuOpen : ''}`}
          aria-label="Main navigation"
        >
          {(['about', 'projects', 'creative', 'writing', 'contact'] as WorldId[]).map(id => (
            <a
              key={id}
              href={routeHref({
                ...navigation,
                world: id,
                projectSlug: null,
                articleSlug: null,
                vault: false,
              })}
              aria-current={navigation.world === id ? 'page' : undefined}
              onClick={event =>
                link(event, { world: id, projectSlug: null, articleSlug: null, vault: false })
              }
            >
              {getWorld(id).name}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <div className={styles.modeToggle} aria-label="Navigation mode">
            <button
              aria-pressed={navigation.mode === 'explore'}
              onClick={() => select({ mode: 'explore' })}
            >
              Explore
            </button>
            <button
              aria-pressed={navigation.mode === 'browse'}
              onClick={() => select({ mode: 'browse' })}
            >
              Browse
            </button>
          </div>
          <button
            className={styles.iconButton}
            aria-label="Open command palette"
            title="Ctrl+K / Cmd+K"
            onClick={() => setOverlay('palette')}
          >
            <UniverseIcon name="search" />
          </button>
          <button
            data-terminal-trigger
            className={styles.iconButton}
            aria-label="Launch Terminal"
            title="Launch Terminal (backtick)"
            onClick={() => setOverlay('terminal')}
          >
            <UniverseIcon name="terminal" />
          </button>
          <button
            className={`${styles.iconButton} ${styles.mobileMenuButton}`}
            aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(previous => !previous)}
          >
            <UniverseIcon name={mobileMenu ? 'close' : 'menu'} />
          </button>
        </div>
      </header>
      {failure && (
        <div className={styles.fallbackBanner} role="status">
          <span>{failure}</span>
          <button
            onClick={() => window.location.assign(routeHref({ ...navigation, mode: 'explore' }))}
          >
            Try 3D again
          </button>
        </div>
      )}
      {navigation.world && (
        <div className={styles.breadcrumb}>
          <button onClick={home}>
            <UniverseIcon name="back" size={15} />
            {navigation.mode === 'explore' ? 'Full universe' : 'All worlds'}
          </button>
          <span>/</span>
          <strong>{world?.name}</strong>
        </div>
      )}
      <main>
        <div
          ref={contentHost}
          id="universe-content"
          tabIndex={-1}
          className={`${styles.contentHost} ${navigation.mode === 'explore' ? styles.expeditionHost : navigation.world ? styles.destinationHost : styles.browseHost}`}
        >
          {navigation.mode === 'browse' && !navigation.world && (
            <div className={styles.browseOverview}>
              <header>
                <span className={styles.eyebrow}>CJ UNIVERSE / BROWSE MODE</span>
                <h1>
                  Seven worlds.
                  <br />
                  <em>One curious human.</em>
                </h1>
                <p>
                  Software engineer at Microsoft / Azure Direct Drive. Distributed computing,
                  Agentic AI, backend engineering, and the ideas that connect them.
                </p>
                <div className={styles.browseActions}>
                  <button
                    className={styles.primaryButton}
                    onClick={() => select({ mode: 'explore' })}
                  >
                    Explore in 3D <UniverseIcon name="orbit" />
                  </button>
                  <button
                    aria-label="Launch Terminal from Browse"
                    onClick={() => setOverlay('terminal')}
                  >
                    <UniverseIcon name="terminal" size={16} />
                    Launch Terminal
                  </button>
                </div>
              </header>
              <div className={styles.browseWorlds}>
                {WORLDS.map(item => (
                  <a
                    key={item.id}
                    href={routeHref({ ...navigation, world: item.id })}
                    style={{ '--world-color': item.color } as React.CSSProperties}
                    onClick={event => link(event, { world: item.id })}
                  >
                    <span>{item.number} / WORLD</span>
                    <i />
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <small>
                      Enter {item.name} <UniverseIcon name="arrow" size={14} />
                    </small>
                  </a>
                ))}
              </div>
              <section className={styles.browseProjects}>
                <div>
                  <span className={styles.eyebrow}>RECENT INVESTIGATIONS</span>
                  <h2>Built to be explored.</h2>
                </div>
                {content.projects.slice(0, 3).map(project => (
                  <a
                    key={project.id}
                    href={routeHref({
                      ...navigation,
                      world: 'projects',
                      projectSlug: project.slug,
                    })}
                    onClick={event => link(event, { world: 'projects', projectSlug: project.slug })}
                  >
                    <span>
                      <strong>{project.title}</strong>
                      <small>{project.summary}</small>
                    </span>
                    <UniverseIcon name="arrow" />
                  </a>
                ))}
              </section>
            </div>
          )}
          <Expedition
            ref={expedition}
            navigation={navigation}
            reducedMotion={reducedMotion}
            frame={expeditionFrame}
            onWorldChange={synchronizeScrollWorld}
            onPhaseChange={setExpeditionPhase}
            intro={intro}
            renderWorld={renderWorld}
          />
        </div>
      </main>
      <nav ref={selector} className={styles.worldNav} aria-label="Planet selector">
        {WORLDS.map(item => (
          <button
            key={item.id}
            data-world-choice={item.id}
            aria-current={navigation.world === item.id ? 'page' : undefined}
            onKeyDown={worldKeys}
            onClick={() => selectWorld(item.id)}
            style={{ '--world-color': item.color } as React.CSSProperties}
          >
            <i />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      {navigation.mode === 'explore' && (
        <div className={styles.sceneHUD}>
          <span>
            <i />
            {ready
              ? world
                ? `${world.name} / ${expeditionPhase === 'inside' ? 'on the surface' : expeditionPhase}`
                : `${WORLDS.length} worlds / scroll to begin`
              : 'Preparing the 3D view'}
          </span>
          <a
            className={styles.assetCredits}
            href="/assets/CREDITS.txt"
            target="_blank"
            rel="noreferrer"
          >
            Scene credits ↗
          </a>
          <label>
            Quality
            <select
              aria-label="Render quality"
              value={qualitySetting}
              onChange={event => setQualitySetting(event.target.value as 'auto' | 'low' | 'high')}
            >
              <option value="auto">Auto</option>
              <option value="low">Low</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      )}
      <div className={styles.screenReaderOnly} aria-live="polite">
        {navigation.world
          ? `${world?.name} selected. ${cameraPhase === 'moving' && navigation.mode === 'explore' ? 'Camera approaching.' : 'Destination content is available.'}`
          : 'Universe overview.'}
      </div>
      {overlay === 'palette' && <UniversePalette {...overlayProps} />}
      {overlay === 'terminal' && <UniverseTerminal {...overlayProps} />}
    </div>
  );
}
