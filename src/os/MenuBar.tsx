import { useEffect, useRef, useState } from 'react';
import { HOME, OS_VERSION } from './registry';
import type { DesktopAction } from './state';
import type { AppId, AppPayload, OSWindow } from './types';
import { OSIcon } from './Icons';
import styles from './Desktop.module.css';

interface Props {
  active?: OSWindow;
  windows: OSWindow[];
  clock: Date;
  openApp: (id: AppId, payload?: AppPayload) => void;
  openPath: (path: string) => void;
  showDesktop: () => void;
  dispatch: (action: DesktopAction) => void;
  onPalette: () => void;
  notify: (message: string) => void;
}
interface Item {
  label?: string;
  run?: () => void;
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
}

export function MenuBar({
  active,
  windows,
  clock,
  openApp,
  openPath,
  showDesktop,
  dispatch,
  onPalette,
  notify,
}: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const selectedText = useRef('');

  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')
      )
        setOpen(null);
    };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        editor.current = event.target;
    };
    window.addEventListener('pointerdown', pointer);
    window.addEventListener('keydown', keyboard);
    window.addEventListener('focusin', focus);
    return () => {
      window.removeEventListener('pointerdown', pointer);
      window.removeEventListener('keydown', keyboard);
      window.removeEventListener('focusin', focus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      root.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus()
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const rememberSelection = () => {
    const target = editor.current;
    selectedText.current =
      target?.isConnected &&
      target.closest('[data-window-id]')?.getAttribute('data-window-id') === active?.id
        ? target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0)
        : window.getSelection()?.toString() || '';
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText.current);
    } catch {
      notify('Clipboard permission is unavailable. Use Ctrl+C or Cmd+C instead.');
    }
  };
  const selectAll = () => {
    const target = editor.current;
    if (
      target?.isConnected &&
      target.closest('[data-window-id]')?.getAttribute('data-window-id') === active?.id
    ) {
      target.focus();
      target.select();
      return;
    }
    const element = Array.from(document.querySelectorAll<HTMLElement>('[data-window-id]')).find(
      element => element.dataset.windowId === active?.id
    );
    const body = element?.querySelector('[data-window-body]');
    if (!body) return;
    const range = document.createRange();
    range.selectNodeContents(body);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  };
  const action = (type: 'close' | 'minimize' | 'maximize') => {
    if (active) dispatch({ type, id: active.id });
  };
  const menus: Record<string, Item[]> = {
    system: [
      { label: 'About CJ OS', run: () => openPath(`${HOME}/about.md`) },
      { separator: true },
      { label: 'System Settings…', run: () => openApp('settings') },
      { label: 'Show Desktop', run: showDesktop },
    ],
    File: [
      { label: 'Open Projects', run: () => openApp('explorer', { path: `${HOME}/projects` }) },
      { label: 'Open Terminal', run: () => openApp('terminal'), shortcut: '`' },
      { label: 'Open Resume', run: () => openApp('resume') },
      { separator: true },
      { label: 'Close Window', run: () => action('close'), disabled: !active },
    ],
    Edit: [
      {
        label: 'Copy',
        run: () => {
          void copy();
        },
        disabled: !selectedText.current,
        shortcut: '⌘ C',
      },
      { label: 'Select All', run: selectAll, disabled: !active, shortcut: '⌘ A' },
    ],
    View: [
      { label: 'Show Desktop', run: showDesktop },
      {
        label: active?.maximized ? 'Restore Window' : 'Fill Workspace',
        run: () => action('maximize'),
        disabled: !active,
      },
      { separator: true },
      { label: 'Change Wallpaper…', run: () => openApp('settings') },
    ],
    Go: [
      { label: 'Home', run: () => openPath(HOME) },
      { label: 'Projects', run: () => openPath(`${HOME}/projects`) },
      { label: 'Experiments', run: () => openPath(`${HOME}/experiments`) },
      { label: 'Writing', run: () => openPath(`${HOME}/writing`) },
      { separator: true },
      { label: 'Contact CJ', run: () => openPath(`${HOME}/contact.md`) },
    ],
    Window: [
      { label: 'Minimize', run: () => action('minimize'), disabled: !active },
      {
        label: 'Show All Windows',
        run: () =>
          windows.forEach(item =>
            openApp(item.appId, { path: item.payload.path, projectId: item.payload.projectId })
          ),
        disabled: !windows.length,
      },
      { separator: true },
      ...windows.map(item => ({
        label: `${item.id === active?.id ? '✓ ' : ''}${item.title}${item.minimized ? ' — minimized' : ''}`,
        run: () =>
          openApp(item.appId, { path: item.payload.path, projectId: item.payload.projectId }),
      })),
    ],
    Help: [
      { label: 'CJ OS Help', run: () => openApp('terminal', { command: 'help' }) },
      { label: 'Design Notes', run: () => openPath(`${HOME}/writing/design notes.md`) },
      { label: 'Search Everything…', run: onPalette, shortcut: '⌘ K' },
    ],
  };

  return (
    <header className={styles.menuBar}>
      <div ref={root} className={styles.menuCluster}>
        {['system', 'File', 'Edit', 'View', 'Go', 'Window', 'Help'].map(name => (
          <div key={name} className={styles.menuGroup}>
            <button
              className={name === 'system' ? styles.osMenu : styles.menuTrigger}
              aria-label={name === 'system' ? 'CJ OS menu' : `${name} menu`}
              aria-expanded={open === name}
              aria-haspopup="menu"
              data-open={open === name}
              onPointerDown={rememberSelection}
              onClick={() => setOpen(previous => (previous === name ? null : name))}
              onPointerEnter={() => {
                if (open && open !== name) setOpen(name);
              }}
            >
              {name === 'system' ? 'cj' : name}
            </button>
            {name === 'system' && (
              <strong className={styles.menuApp}>{active?.title || 'Chiranjeev Singh'}</strong>
            )}
            {open === name && (
              <div
                role="menu"
                aria-label={name === 'system' ? 'CJ OS applications' : `${name} actions`}
                className={styles.systemMenu}
                onKeyDown={event => {
                  const items = Array.from(
                    event.currentTarget.querySelectorAll<HTMLButtonElement>(
                      '[role="menuitem"]:not(:disabled)'
                    )
                  );
                  const current = items.indexOf(document.activeElement as HTMLButtonElement);
                  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                    event.preventDefault();
                    const next =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? items.length - 1
                          : (current + (event.key === 'ArrowDown' ? 1 : items.length - 1)) %
                            items.length;
                    items[next]?.focus();
                  }
                  if (event.key === 'Escape') {
                    setOpen(null);
                    event.currentTarget.parentElement
                      ?.querySelector<HTMLButtonElement>('[aria-haspopup]')
                      ?.focus();
                  }
                }}
              >
                {name === 'system' && (
                  <div className={styles.menuVersion}>
                    CJ OS <span>{OS_VERSION}</span>
                  </div>
                )}
                {menus[name].map((item, index) =>
                  item.separator ? (
                    <hr key={`separator-${index}`} />
                  ) : (
                    <button
                      key={`${item.label}-${index}`}
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => {
                        setOpen(null);
                        item.run?.();
                      }}
                    >
                      {item.label}
                      {item.shortcut && <kbd>{item.shortcut}</kbd>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.menuRight}>
        <button
          aria-label="Open command palette"
          title="Search (Ctrl+K / Cmd+K)"
          onClick={onPalette}
        >
          <OSIcon name="search" size={14} />
        </button>
        <button className={styles.contactShortcut} onClick={() => openPath(`${HOME}/contact.md`)}>
          Contact CJ
        </button>
        <time dateTime={clock.toISOString()}>
          {clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          <span>
            {clock.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
        </time>
      </div>
    </header>
  );
}
