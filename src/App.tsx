import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CloudTransition } from '@/components/layout/CloudTransition/CloudTransition';
import { Treasure } from '@/components/layout/Treasure/Treasure';
import { Portfolio } from '@/components/portfolio/Portfolio';
import { Terminal } from '@/components/portfolio/Terminal';
import { ACTIVE_CONCEPT, CONCEPTS } from '@/constants/concept';
import { usePinnedQuests } from '@/hooks/usePinnedQuests';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SideQuests = lazy(() =>
  import('@/components/sections/SideQuests/SideQuests').then(module => ({
    default: module.SideQuests,
  }))
);

type View = 'main' | 'vault';

function App() {
  const [view, setView] = useState<View>('main');
  const [transitioning, setTransitioning] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const timeoutRef = useRef(0);
  const savedScroll = useRef(0);
  const destination = useRef<string | null>(window.location.hash.slice(1) || null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const quests = usePinnedQuests();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.title = `Chiranjeev Singh — ${CONCEPTS[ACTIVE_CONCEPT].name}`;
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (view === 'main' && destination.current) {
        const section = document.getElementById(destination.current);
        section?.scrollIntoView();
        const heading = section?.querySelector<HTMLElement>('h1, h2');
        heading?.setAttribute('tabindex', '-1');
        heading?.focus({ preventScroll: true });
        destination.current = null;
      } else {
        window.scrollTo({ top: view === 'vault' ? 0 : savedScroll.current, behavior: 'instant' });
        if (view === 'main' && focusReturn.current) {
          const label = focusReturn.current.getAttribute('aria-label');
          const selector = label
            ? `[aria-label="${CSS.escape(label)}"]`
            : focusReturn.current.hasAttribute('data-vault-trigger')
              ? '[data-vault-trigger]'
              : '[aria-label="Open side quests"]';
          document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
        }
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [view]);

  const closeTerminal = useCallback(() => {
    setTerminalOpen(false);
  }, []);

  useEffect(() => {
    if (terminalOpen) return;
    const frame = requestAnimationFrame(() => {
      if (focusReturn.current?.isConnected) focusReturn.current.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [terminalOpen]);

  const openTerminal = useCallback(() => {
    focusReturn.current = document.activeElement as HTMLElement | null;
    setTerminalOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (terminalOpen) closeTerminal();
        else openTerminal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [terminalOpen, closeTerminal, openTerminal]);

  const changeView = (next: View) => {
    if (transitioning || next === view) return;
    setTerminalOpen(false);
    if (next === 'vault') {
      savedScroll.current = window.scrollY;
      focusReturn.current = document.activeElement as HTMLElement | null;
    }
    if (reducedMotion) {
      setView(next);
      return;
    }
    setTransitioning(true);
    timeoutRef.current = window.setTimeout(() => {
      setView(next);
      setTransitioning(false);
    }, 700);
  };

  const navigate = (section: string) => {
    closeTerminal();
    if (view === 'vault') {
      destination.current = section;
      changeView('main');
    } else {
      const target = document.getElementById(section);
      target?.scrollIntoView();
      const heading = target?.querySelector<HTMLElement>('h1, h2');
      heading?.setAttribute('tabindex', '-1');
      if (heading) focusReturn.current = heading;
    }
  };

  return (
    <>
      <a className="skip-link" href={view === 'main' ? '#main-content' : '#side-quests'}>
        Skip to content
      </a>
      {view === 'main' ? (
        <>
          <Portfolio
            quests={quests}
            onVault={() => changeView('vault')}
            onTerminal={openTerminal}
          />
          <Treasure
            quiet={ACTIVE_CONCEPT === 'command'}
            onTreasureClick={() => changeView('vault')}
          />
        </>
      ) : (
        <main id="main-content">
          <Suspense
            fallback={
              <p role="status" style={{ padding: '100px 24px' }}>
                Opening the hidden vault...
              </p>
            }
          >
            <SideQuests quests={quests} onBack={() => changeView('main')} />
          </Suspense>
        </main>
      )}
      <CloudTransition visible={transitioning} />
      {terminalOpen && (
        <Terminal
          onClose={closeTerminal}
          onNavigate={navigate}
          onVault={() => changeView('vault')}
        />
      )}
    </>
  );
}

export default App;
