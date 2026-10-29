import { useEffect, useMemo, useRef, useState } from 'react';
import { APPS } from './registry';
import { OSIcon } from './Icons';
import type { AppId, AppPayload, ProjectCaseStudy, VfsEntry } from './types';
import styles from './Desktop.module.css';

interface Props {
  files: readonly VfsEntry[];
  projects: readonly ProjectCaseStudy[];
  onOpen: (app: AppId, payload?: AppPayload) => void;
  onPath: (path: string) => void;
  onClose: () => void;
}

export function CommandPalette({ files, projects, onOpen, onPath, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const previous = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const element = dialog.current;
    const returnTarget = previous.current;
    element?.showModal();
    input.current?.focus();
    return () => {
      element?.close();
      if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
    };
  }, []);

  const results = useMemo(() => {
    const all = [
      ...APPS.filter(app => app.launcher || app.id === 'settings').map(app => ({
        key: app.id,
        title: app.title,
        detail: app.description,
        group: 'Application',
        icon: app.icon,
        run: () => onOpen(app.id),
      })),
      ...projects.map(project => ({
        key: `project:${project.id}`,
        title: project.title,
        detail: project.summary,
        group: 'Project',
        icon: 'folder' as const,
        run: () => onOpen('project', { projectId: project.id }),
      })),
      ...files
        .filter(file => file.kind === 'file' && file.path.includes('/writing/') && !file.hidden)
        .map(file => ({
          key: file.path,
          title: file.name,
          detail: file.path,
          group: 'Note',
          icon: 'file' as const,
          run: () => onPath(file.path),
        })),
      ...['help', 'whoami', 'neofetch', 'ls -a', 'projects', 'contact'].map(command => ({
        key: `command:${command}`,
        title: command,
        detail: `Run ${command} in Terminal`,
        group: 'Command',
        icon: 'terminal' as const,
        run: () => onOpen('terminal', { command }),
      })),
    ];
    const text = query.trim().toLowerCase().replace(/^>\s*/, '');
    return all
      .filter(item => `${item.title} ${item.detail} ${item.group}`.toLowerCase().includes(text))
      .slice(0, 12);
  }, [files, projects, query, onOpen, onPath]);

  const run = (index: number) => {
    const result = results[index];
    if (!result) return;
    onClose();
    result.run();
  };
  return (
    <dialog
      ref={dialog}
      className={styles.palette}
      aria-label="Command palette"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.paletteSearch}>
        <OSIcon name="search" size={22} />
        <input
          ref={input}
          aria-label="Search apps, projects, commands, and notes"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={results[selected] ? `palette-option-${selected}` : undefined}
          placeholder="Where do you want to go?"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setSelected(index => Math.min(index + 1, results.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setSelected(index => Math.max(0, index - 1));
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              run(selected);
            }
          }}
        />
        <button onClick={onClose} aria-label="Close command palette">
          esc
        </button>
      </div>
      <div
        id="palette-results"
        role="listbox"
        aria-label="Search results"
        className={styles.paletteResults}
      >
        {results.map((result, index) => (
          <button
            key={result.key}
            id={`palette-option-${index}`}
            role="option"
            aria-selected={selected === index}
            onClick={() => run(index)}
            onPointerMove={() => setSelected(index)}
          >
            <OSIcon name={result.icon} />
            <span>
              <strong>{result.title}</strong>
              <small>{result.detail}</small>
            </span>
            <em>{result.group}</em>
          </button>
        ))}
        {!results.length && <p>No matches. Try an app name, a project, or &quot;help&quot;.</p>}
      </div>
      <footer>
        <span>Apps, projects, notes, and shell commands.</span>
        <span>↑ ↓ navigate · ↵ open</span>
      </footer>
    </dialog>
  );
}
