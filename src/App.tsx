import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, LazyMotion } from 'motion/react';
import { RouterProvider } from './app/router.tsx';
import { scrollToElement, useRouter } from './app/routerContext.ts';
import type { Route } from './app/routes.ts';
import { SiteHeader } from './components/navigation/SiteHeader';
import { buildContent } from './data/content.ts';
import type { PortfolioContent } from './data/types.ts';
import { useGitHubFeed } from './hooks/useGitHubFeed.ts';
import { ScrollTrigger } from './lib/gsap.ts';
import { motionReady } from './lib/motionQueue.ts';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { NotePage } from './pages/NotePage';
import { loadPlaybox } from './pages/Playbox/load.ts';
import { ProjectPage } from './pages/ProjectPage';

// Development-only scene tuning view; excluded from production bundles.
const loadMotionFeatures = () => import('./lib/motionFeatures.ts').then(module => module.default);

const SceneHarness = import.meta.env.DEV
  ? lazy(() => import('./scenes/orbital/SceneHarness'))
  : null;

// The instrument space loads only when someone opens it.
const Playbox = lazy(() => loadPlaybox().then(module => ({ default: module.Playbox })));

function titleFor(route: Route, content: PortfolioContent) {
  const base = 'Chiranjeev Singh — Personal Universe';
  if (route.name === 'project') {
    const project = content.projects.find(item => item.slug === route.slug);
    return project ? `${project.title} — Chiranjeev Singh` : base;
  }
  if (route.name === 'note') {
    const note = content.notes.find(item => item.slug === route.slug);
    return note ? `${note.title} — Chiranjeev Singh` : base;
  }
  if (route.name === 'playbox') return 'Playbox — Chiranjeev Singh';
  if (route.name === 'not-found') return 'Not found — Chiranjeev Singh';
  return base;
}

function Site() {
  const { route } = useRouter();
  const feed = useGitHubFeed();
  const content = useMemo(() => buildContent(feed.data), [feed.data]);
  const overlay = route.name !== 'home';
  const previous = useRef<Route | null>(null);

  useEffect(() => {
    document.title = titleFor(route, content);
  }, [route, content]);

  // Overlays make the home page inert, lock its scroll and pause its scenes.
  useEffect(() => {
    const main = document.getElementById('main');
    document.documentElement.classList.toggle('is-locked', overlay);
    document.documentElement.dataset.overlay = overlay ? 'open' : 'closed';
    if (overlay) main?.setAttribute('inert', '');
    else main?.removeAttribute('inert');
    window.dispatchEvent(new Event('portfolio:overlay'));
  }, [overlay]);

  // Deep links, and returns from an overlay, land on the requested chapter.
  useEffect(() => {
    const before = previous.current;
    const target = route.name === 'home' ? route.anchor || route.chapter : null;
    if (!target || (before && before.name === 'home')) {
      previous.current = route;
      return;
    }
    let cancelled = false;
    // The route counts as handled only once the scroll has actually happened.
    const go = () => {
      if (cancelled) return;
      previous.current = route;
      scrollToElement(target, true);
    };
    const settle = () => requestAnimationFrame(() => requestAnimationFrame(go));
    // First loads wait for fonts and for every chapter to finish building its pins.
    if (before) settle();
    else void Promise.all([document.fonts.ready, motionReady()]).then(settle);
    return () => {
      cancelled = true;
    };
  }, [route]);

  // Layout that changes after load (live feed, late fonts) re-measures every trigger, once settled.
  useEffect(() => {
    let timer = 0;
    let height = document.body.scrollHeight;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        height = document.body.scrollHeight;
        ScrollTrigger.refresh();
      }, 250);
    };
    const observer = new ResizeObserver(() => {
      if (Math.abs(document.body.scrollHeight - height) >= 4) refresh();
    });
    let active = true;
    // The initial build already measures once; observe changes only after it.
    void motionReady().then(() => {
      if (!active) return;
      height = document.body.scrollHeight;
      observer.observe(document.body);
    });
    void Promise.all([document.fonts.ready, motionReady()]).then(() => {
      if (active && document.body.scrollHeight !== height) refresh();
    });
    return () => {
      active = false;
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <SiteHeader />
      <Home content={content} feed={feed} />
      <AnimatePresence>
        {route.name === 'project' && (
          <ProjectPage
            key={`project-${route.slug}`}
            project={content.projects.find(item => item.slug === route.slug)}
            projects={content.projects}
          />
        )}
        {route.name === 'note' && (
          <NotePage
            key={`note-${route.slug}`}
            note={content.notes.find(item => item.slug === route.slug)}
            notes={content.notes}
          />
        )}
        {route.name === 'playbox' && (
          <Suspense key="playbox" fallback={null}>
            <Playbox />
          </Suspense>
        )}
        {route.name === 'not-found' && <NotFound key="not-found" path={route.path} />}
      </AnimatePresence>
      <div className="grain" aria-hidden="true" />
    </>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const harness = import.meta.env.DEV ? params.get('scene') : null;
  const progress = useRef(Number(params.get('p') || 0));
  if (SceneHarness && (harness === 'dawn' || harness === 'eclipse'))
    return (
      <Suspense fallback={null}>
        <SceneHarness preset={harness} progress={progress} />
      </Suspense>
    );
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <RouterProvider>
        <Site />
      </RouterProvider>
    </LazyMotion>
  );
}
