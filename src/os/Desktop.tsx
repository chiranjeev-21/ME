import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { usePinnedQuests } from '../hooks/usePinnedQuests';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { APPS, HOME, OS_VERSION, getApp } from './registry';
import { buildPortfolioFiles, buildProjectCaseStudies } from './filesystem';
import { normalizePath } from './terminal/vfs';
import { TerminalApp } from './terminal/TerminalApp';
import {
  ExplorerApp,
  ProjectApp,
  ReaderApp,
  ResumeApp,
  VaultApp,
} from './apps/portfolio/PortfolioApps';
import { desktopReducer, initialDesktop, normalizeSettings, windowId } from './state';
import { DesktopWindow } from './Window';
import { CommandPalette } from './Palette';
import { SettingsApp } from './Settings';
import { OSIcon } from './Icons';
import { DesktopIcon } from './DesktopIcon';
import { MenuBar } from './MenuBar';
import type {
  AppId,
  AppPayload,
  DesktopAppProps,
  DesktopSettings,
  LabRun,
  Viewport,
} from './types';
import styles from './Desktop.module.css';

const LabApp = lazy(() => import('./apps/lab/LabApp').then(module => ({ default: module.LabApp })));
const MonitorApp = lazy(() =>
  import('./apps/monitor/MonitorApp').then(module => ({ default: module.MonitorApp }))
);
const LAUNCHERS = APPS.filter(app => app.launcher).sort((a, b) =>
  a.id === 'explorer' ? -1 : b.id === 'explorer' ? 1 : 0
);
const SHORTCUTS = ['explorer', 'resume', 'terminal', 'lab', 'monitor', 'vault'].map(id =>
  getApp(id as AppId)
);

function viewport(): Viewport {
  return {
    width: Math.max(1, window.innerWidth - (window.innerWidth <= 760 ? 16 : 28)),
    height: Math.max(1, window.innerHeight - (window.innerWidth <= 760 ? 128 : 148)),
  };
}
function hashFor(appId: AppId, payload: AppPayload = {}): string {
  const params = new URLSearchParams({ app: appId });
  if (payload.path) params.set('path', payload.path);
  if (payload.projectId) params.set('project', payload.projectId);
  return `#${params}`;
}
function readHash(): { appId: AppId; payload: AppPayload } | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const id = params.get('app');
  if (!APPS.some(app => app.id === id)) return null;
  return {
    appId: id as AppId,
    payload: {
      ...(params.get('path') ? { path: params.get('path')! } : {}),
      ...(params.get('project') ? { projectId: params.get('project')! } : {}),
    },
  };
}
function readSettings(): DesktopSettings {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem('cj-os-settings') || 'null'));
  } catch {
    return normalizeSettings(null);
  }
}
function renderApp(props: DesktopAppProps) {
  switch (props.window.appId) {
    case 'terminal':
      return <TerminalApp {...props} />;
    case 'explorer':
      return <ExplorerApp {...props} />;
    case 'resume':
      return <ResumeApp {...props} />;
    case 'project':
      return <ProjectApp {...props} />;
    case 'reader':
      return <ReaderApp {...props} />;
    case 'vault':
      return <VaultApp {...props} />;
    case 'settings':
      return <SettingsApp {...props} />;
    case 'lab':
      return <LabApp {...props} />;
    case 'monitor':
      return <MonitorApp {...props} />;
  }
}

export function Desktop() {
  const feed = usePinnedQuests();
  const reducedMotion = useReducedMotion();
  const [settings, updateSettings] = useState(readSettings);
  const [state, dispatch] = useReducer(desktopReducer, viewport(), size => {
    const initial = initialDesktop(size);
    const target = readHash();
    return target ? desktopReducer(initial, { type: 'open', ...target }) : initial;
  });
  const [booting, setBooting] = useState(() => {
    try {
      return (
        !sessionStorage.getItem('cj-os-booted') &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch {
      return false;
    }
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<AppId | null>(null);
  const [toast, setToast] = useState('');
  const [clock, setClock] = useState(() => new Date());
  const [labRuns, setLabRuns] = useState<LabRun[]>([]);
  const [startedAt] = useState(Date.now);
  const workspace = useRef<HTMLElement>(null);
  const iconList = useRef<HTMLDivElement>(null);
  const toastTimer = useRef(0);
  const files = useMemo(() => buildPortfolioFiles(feed.data), [feed.data]);
  const projects = useMemo(() => buildProjectCaseStudies(feed.data), [feed.data]);
  const data = useRef({ files, projects, windows: state.windows });
  data.current = { files, projects, windows: state.windows };
  const active = state.windows.find(item => item.id === state.activeId);
  const mobile = window.innerWidth <= 760;

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4500);
  }, []);
  const finishBoot = useCallback(() => {
    setBooting(false);
    try {
      sessionStorage.setItem('cj-os-booted', '1');
    } catch {
      /* Optional browser storage. */
    }
  }, []);
  useEffect(() => {
    if (!booting) return;
    if (reducedMotion) {
      finishBoot();
      return;
    }
    const timer = window.setTimeout(finishBoot, 850);
    return () => window.clearTimeout(timer);
  }, [booting, reducedMotion, finishBoot]);

  useEffect(() => {
    const element = workspace.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect();
      dispatch({ type: 'viewport', viewport: { width: bounds.width, height: bounds.height } });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('cj-os-settings', JSON.stringify(settings));
    } catch {
      /* The desktop still works with storage blocked. */
    }
  }, [settings]);
  const setSettings = useCallback((next: Partial<DesktopSettings>) => {
    updateSettings(previous => normalizeSettings({ ...previous, ...next }));
  }, []);
  const recordLabRun = useCallback(
    (run: LabRun) => setLabRuns(previous => [...previous, run].slice(-60)),
    []
  );

  const openApp = useCallback((appId: AppId, requested?: AppPayload) => {
    const remembered = data.current.windows.find(
      item => item.id === windowId(appId, requested)
    )?.payload;
    const payload = requested ?? { path: remembered?.path, projectId: remembered?.projectId };
    const title =
      appId === 'project'
        ? data.current.projects.find(project => project.id === payload.projectId)?.title ||
          'Project Investigation'
        : appId === 'reader'
          ? data.current.files.find(file => file.path === payload.path)?.name || 'Document'
          : getApp(appId).title;
    dispatch({ type: 'open', appId, payload, title });
    setSelectedIcon(null);
    const hash = hashFor(appId, payload);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  }, []);
  const openPath = useCallback(
    (input: string) => {
      const path = normalizePath(input, HOME);
      const entry = data.current.files.find(file => file.path === path);
      if (!entry) {
        notify(`No such virtual file: ${input}`);
        return;
      }
      if (entry.kind === 'directory') {
        openApp('explorer', { path });
        return;
      }
      if (entry.appId === 'project' && entry.projectId) {
        openApp('project', { projectId: entry.projectId });
        return;
      }
      if (entry.appId && !['explorer', 'reader'].includes(entry.appId)) {
        openApp(entry.appId, { path });
        return;
      }
      openApp('reader', { path });
    },
    [notify, openApp]
  );

  useEffect(() => {
    const onHash = () => {
      const target = readHash();
      if (target) openApp(target.appId, target.payload);
    };
    window.addEventListener('popstate', onHash);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('popstate', onHash);
      window.removeEventListener('hashchange', onHash);
    };
  }, [openApp]);
  useEffect(() => {
    document.title = `${active?.title ? `${active.title} — ` : ''}CJ OS · Chiranjeev Singh`;
    const hash = active ? hashFor(active.appId, active.payload) : '#desktop';
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [active]);

  useEffect(() => {
    const keydown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.matches('input,textarea,select') || target.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(previous => !previous);
      } else if (
        event.key === '`' &&
        !typing &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        openApp('terminal');
      } else if (event.key === 'Escape') {
        setSelectedIcon(null);
        if (booting) finishBoot();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  }, [openApp, booting, finishBoot]);

  const showDesktop = () =>
    state.windows.forEach(item => dispatch({ type: 'minimize', id: item.id }));

  return (
    <div
      className={styles.desktop}
      data-os-desktop
      data-wallpaper={settings.wallpaper}
      data-accent={settings.accent}
      data-font-size={settings.fontSize}
    >
      <a className="skip-link" href="#desktop-workspace">
        Skip to desktop applications
      </a>
      <div className={styles.wallpaper} aria-hidden="true">
        <div />
        <div />
        <div />
      </div>
      <MenuBar
        active={active}
        windows={state.windows}
        clock={clock}
        openApp={openApp}
        openPath={openPath}
        showDesktop={showDesktop}
        dispatch={dispatch}
        onPalette={() => setPaletteOpen(true)}
        notify={notify}
      />
      <main
        ref={workspace}
        id="desktop-workspace"
        className={styles.workspace}
        tabIndex={-1}
        aria-label="Desktop workspace"
        onPointerDown={event => {
          if (event.target === event.currentTarget) setSelectedIcon(null);
        }}
      >
        <h1 className={styles.screenReaderOnly}>
          Chiranjeev Singh — software engineer, builder, and experimenter
        </h1>
        <div
          ref={iconList}
          className={styles.desktopIcons}
          role="group"
          aria-label="Desktop applications"
        >
          {SHORTCUTS.map(app => (
            <button
              key={app.id}
              data-shortcut={app.id}
              aria-pressed={selectedIcon === app.id}
              onDoubleClick={() => openApp(app.id)}
              onClick={() => {
                setSelectedIcon(app.id);
                if (mobile) openApp(app.id);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  openApp(app.id);
                }
                if (
                  ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(
                    event.key
                  )
                ) {
                  event.preventDefault();
                  const buttons = Array.from(
                    iconList.current?.querySelectorAll<HTMLButtonElement>('button') || []
                  );
                  const index = buttons.indexOf(event.currentTarget);
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? buttons.length - 1
                        : (index +
                            (['ArrowDown', 'ArrowRight'].includes(event.key)
                              ? 1
                              : buttons.length - 1)) %
                          buttons.length;
                  buttons[next]?.focus();
                  setSelectedIcon(SHORTCUTS[next].id);
                }
              }}
              aria-label={app.id === 'vault' ? 'Open side quests' : `Open ${app.title}`}
              title={app.description}
            >
              <span className={styles.desktopIconImage}>
                <DesktopIcon appId={app.id} />
              </span>
              <span className={styles.desktopIconLabel}>
                {app.id === 'explorer'
                  ? 'Projects'
                  : app.id === 'resume'
                    ? 'Resume.pdf'
                    : app.id === 'vault'
                      ? 'Side quests'
                      : app.title}
              </span>
            </button>
          ))}
        </div>
        {[...state.windows]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(item => {
            const visible = !item.minimized && (!mobile || item.id === state.activeId);
            const props: DesktopAppProps = {
              window: item,
              files,
              projects,
              apps: APPS,
              feed,
              visible,
              openApp,
              openPath,
              closeWindow: () => dispatch({ type: 'close', id: item.id }),
              notify,
              recordLabRun,
              labRuns,
              system: {
                windows: state.windows.length,
                minimized: state.windows.filter(item => item.minimized).length,
                startedAt,
                version: OS_VERSION,
                hostname: window.location.hostname,
                viewport: state.viewport,
              },
              settings,
              setSettings,
            };
            return (
              <DesktopWindow
                key={item.id}
                window={item}
                active={state.activeId === item.id}
                index={state.windows.findIndex(window => window.id === item.id)}
                viewport={state.viewport}
                dispatch={dispatch}
              >
                <Suspense
                  fallback={
                    <div className={styles.loadingApp} role="status">
                      Opening {item.title}…
                    </div>
                  }
                >
                  {renderApp(props)}
                </Suspense>
              </DesktopWindow>
            );
          })}
      </main>
      <nav className={styles.dock} aria-label="Application dock">
        {LAUNCHERS.map(app => {
          const running = state.windows.find(item => item.appId === app.id);
          return (
            <button
              key={app.id}
              aria-label={app.title}
              aria-pressed={active?.appId === app.id}
              data-running={Boolean(running)}
              data-minimized={running?.minimized || false}
              onClick={() => openApp(app.id)}
            >
              <DesktopIcon appId={app.id} size={52} />
              <span className={styles.dockLabel}>
                {app.title === 'Project Explorer'
                  ? 'Projects'
                  : app.title === 'System Monitor'
                    ? 'Monitor'
                    : app.title}
              </span>
              <i />
            </button>
          );
        })}
        <span className={styles.dockDivider} />
        <button aria-label="Desktop Settings" onClick={() => openApp('settings')}>
          <DesktopIcon appId="settings" size={52} />
          <span className={styles.dockLabel}>Settings</span>
        </button>
      </nav>
      {toast && (
        <div className={styles.toast} role="status">
          <OSIcon name="spark" size={16} />
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <OSIcon name="close" size={14} />
          </button>
        </div>
      )}
      {paletteOpen && (
        <CommandPalette
          files={files}
          projects={projects}
          onOpen={openApp}
          onPath={openPath}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {booting && (
        <div className={styles.boot} role="status">
          <div className={styles.bootLogo}>
            cj<span>✳</span>
          </div>
          <p>
            CJ OS <span>v{OS_VERSION}</span>
          </p>
          <div className={styles.bootProgress}>
            <i />
          </div>
          <small>Preparing your personal workspace.</small>
          <button onClick={finishBoot}>
            Skip intro <OSIcon name="arrow" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
