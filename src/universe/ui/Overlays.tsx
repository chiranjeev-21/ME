import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import { HERO_SKILLS } from '../../constants';
import { WORLDS } from '../worlds';
import { routeHref } from '../navigation';
import type { UniverseContent, UniverseNavigation } from '../types';
import { UniverseIcon } from './Icon';
import styles from '../Universe.module.css';

interface Props {
  content: UniverseContent;
  navigation: UniverseNavigation;
  navigate: (patch: Partial<UniverseNavigation>) => void;
  close: () => void;
}
function Dialog({
  title,
  children,
  close,
  terminal = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  terminal?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = opener.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('input')?.focus();
    return () => {
      dialog?.close();
      requestAnimationFrame(() => {
        if (previous?.isConnected && !previous.closest('[inert]'))
          previous.focus({ preventScroll: true });
        else
          document
            .querySelector<HTMLElement>('[data-terminal-trigger]')
            ?.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${terminal ? styles.terminalDialog : ''}`}
      aria-label={title}
      onCancel={event => {
        event.preventDefault();
        close();
      }}
    >
      <header>
        <span>
          <UniverseIcon name={terminal ? 'terminal' : 'search'} size={17} />
          {title}
        </span>
        <button aria-label={`Close ${title}`} onClick={close}>
          <UniverseIcon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function UniversePalette({ content, navigation, navigate, close }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const entries = useMemo(
    () =>
      [
        ...WORLDS.map(world => ({
          key: `world:${world.id}`,
          label: world.name,
          detail: world.form ? `${world.subtitle} · ${world.form}` : world.subtitle,
          keywords: world.id,
          group: 'World',
          destination: {
            world: world.id,
            projectSlug: null,
            articleSlug: null,
            vault: false,
          } satisfies Partial<UniverseNavigation>,
        })),
        ...content.projects.map(project => ({
          key: `project:${project.slug}`,
          label: project.title,
          detail: project.summary,
          keywords: `${project.slug} ${project.technologies.join(' ')}`,
          group: 'Project',
          destination: {
            world: 'projects',
            projectSlug: project.slug,
            articleSlug: null,
            vault: false,
          } satisfies Partial<UniverseNavigation>,
        })),
        ...content.articles.map(article => ({
          key: `article:${article.slug}`,
          label: article.title,
          detail: article.summary,
          keywords: `${article.slug} ${article.tags.join(' ')}`,
          group: 'Studio note',
          destination: {
            world: 'writing',
            articleSlug: article.slug,
            projectSlug: null,
            vault: false,
          } satisfies Partial<UniverseNavigation>,
        })),
      ]
        .filter((entry, index, all) => all.findIndex(item => item.key === entry.key) === index)
        .filter(entry =>
          `${entry.label} ${entry.detail} ${entry.group} ${entry.keywords}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        )
        .slice(0, 10),
    [content, query]
  );
  const run = (index: number) => {
    if (!entries[index]) return;
    close();
    navigate(entries[index].destination);
  };
  return (
    <Dialog title="Command palette" close={close}>
      <div className={styles.paletteInput}>
        <UniverseIcon name="search" />
        <input
          autoComplete="off"
          aria-label="Search worlds, projects, and articles"
          role="combobox"
          aria-controls="universe-search-results"
          aria-expanded="true"
          aria-activedescendant={entries[selected] ? `search-result-${selected}` : undefined}
          value={query}
          placeholder="Where does your curiosity lead?"
          onChange={event => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setSelected(index => Math.min(index + 1, entries.length - 1));
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
      </div>
      <div
        id="universe-search-results"
        role="listbox"
        aria-label="Destinations"
        className={styles.paletteResults}
      >
        {entries.map((entry, index) => (
          <a
            key={entry.key}
            id={`search-result-${index}`}
            href={routeHref({ ...navigation, ...entry.destination })}
            role="option"
            aria-selected={selected === index}
            onClick={event => {
              if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                return;
              event.preventDefault();
              run(index);
            }}
            onPointerMove={() => setSelected(index)}
          >
            <span>
              <b>{entry.label}</b>
              <small>{entry.detail}</small>
            </span>
            <em>{entry.group}</em>
            <UniverseIcon name="arrow" size={15} />
          </a>
        ))}
        {!entries.length && <p>No destination found. Try a world name, a project, or a note.</p>}
      </div>
      <footer>
        <span>
          {navigation.mode === 'explore' ? 'Explore' : 'Browse'} Mode · same universe, different
          path
        </span>
        <span>↑ ↓ navigate · ↵ open · esc close</span>
      </footer>
    </Dialog>
  );
}

function tokens(input: string): string[] {
  const output: string[] = [];
  let word = '',
    quote = '',
    escaped = false,
    started = false;
  for (const character of input) {
    if (escaped) {
      word += character;
      escaped = false;
      started = true;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      started = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = '';
      else word += character;
      started = true;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      started = true;
      continue;
    }
    if (';|&><'.includes(character))
      throw new Error('This read-only portfolio shell does not run operators or system commands.');
    if (/\s/.test(character)) {
      if (started) {
        output.push(word);
        word = '';
        started = false;
      }
    } else {
      word += character;
      started = true;
    }
  }
  if (quote || escaped)
    throw new Error('Unfinished quote or escape. Complete the argument and try again.');
  if (started) output.push(word);
  return output;
}
interface Line {
  text: string;
  action?: Partial<UniverseNavigation>;
  tone?: string;
}
export function UniverseTerminal({ content, navigation, navigate, close }: Props) {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { text: 'CJ UNIVERSE / portfolio shell', tone: 'accent' },
    { text: 'Type help. No operating-system commands are executed here.', tone: 'muted' },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const draft = useRef('');
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (output.current) output.current.scrollTop = output.current.scrollHeight;
  }, [lines]);
  const visit = (patch: Partial<UniverseNavigation>) => {
    close();
    navigate(patch);
  };
  const follow = (event: MouseEvent<HTMLAnchorElement>, patch: Partial<UniverseNavigation>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    visit(patch);
  };
  const run = (source: string) => {
    if (!source.trim()) return;
    history.current = [...history.current, source].slice(-50);
    historyIndex.current = -1;
    draft.current = '';
    setInput('');
    setSuggestions([]);
    const results: Line[] = [];
    try {
      const [command, ...args] = tokens(source.trim());
      const name = command?.toLowerCase();
      const target = args.join(' ').toLowerCase();
      if (name === 'clear') {
        setLines([]);
        return;
      }
      if (name === 'exit') {
        close();
        return;
      }
      if (name === 'help')
        results.push({
          text: `help · whoami · skills · worlds · projects · writing · open <world or project> · read <article> · contact · vault · pwd · echo · history · clear · exit\n${WORLDS.length} worlds: ${WORLDS.map(world => world.id).join(', ')}. Try open hush.`,
        });
      else if (name === 'whoami' || name === 'neofetch')
        results.push({
          text: 'Chiranjeev Singh / CJ\nSoftware engineer, AI enthusiast, independent builder.\nMicrosoft · Azure Direct Drive. Previously Amazon and Oyo.\nDistributed computing, useful AI, and a little curiosity.',
        });
      else if (name === 'skills')
        results.push({ text: HERO_SKILLS.map(skill => skill.label).join(' / ') });
      else if (name === 'worlds' || name === 'ls')
        results.push(
          ...WORLDS.map(world => ({
            text: `${world.number} / ${world.name} — ${world.form || world.subtitle} ↗`,
            action: { world: world.id, projectSlug: null, articleSlug: null, vault: false },
          }))
        );
      else if (name === 'projects')
        results.push(
          ...content.projects.map(project => ({
            text: `${project.title} ↗`,
            action: {
              world: 'projects' as const,
              projectSlug: project.slug,
              articleSlug: null,
              vault: false,
            },
          }))
        );
      else if (name === 'writing')
        results.push(
          ...content.articles.map(article => ({
            text: `${article.title} ↗`,
            action: {
              world: 'writing' as const,
              articleSlug: article.slug,
              projectSlug: null,
              vault: false,
            },
          }))
        );
      else if (name === 'contact' || (name === 'sudo' && target === 'hire cj')) {
        visit({ world: 'contact' });
        return;
      } else if (name === 'vault') {
        visit({ world: 'projects', vault: true, projectSlug: null });
        return;
      } else if (name === 'pwd')
        results.push({
          text: `~/universe/${navigation.world || 'orbit'}${navigation.projectSlug ? `/${navigation.projectSlug}` : navigation.articleSlug ? `/${navigation.articleSlug}` : ''}`,
        });
      else if (name === 'echo') results.push({ text: args.join(' ') });
      else if (name === 'history')
        results.push({
          text: history.current.map((value, index) => `${index + 1}  ${value}`).join('\n'),
        });
      else if (name === 'open' || name === 'read') {
        const world = WORLDS.find(
          world => world.id === target || world.name.toLowerCase() === target
        );
        const project = content.projects.find(
          project => project.slug === target || project.title.toLowerCase() === target
        );
        const article = content.articles.find(
          article => article.slug === target || article.title.toLowerCase() === target
        );
        if (name === 'open' && world) {
          visit({ world: world.id, projectSlug: null, articleSlug: null, vault: false });
          return;
        }
        if (name === 'open' && project) {
          visit({
            world: 'projects',
            projectSlug: project.slug,
            articleSlug: null,
            vault: false,
          });
          return;
        }
        if (article) {
          visit({
            world: 'writing',
            articleSlug: article.slug,
            projectSlug: null,
            vault: false,
          });
          return;
        }
        results.push({
          text: `No destination: ${target || '(missing argument)'}. Use worlds, projects, or writing to list choices.`,
          tone: 'error',
        });
      } else
        results.push({
          text: `Unknown command: ${command}. Type help to see the available commands.`,
          tone: 'error',
        });
    } catch (error) {
      results.push({
        text: error instanceof Error ? error.message : 'Unable to parse command.',
        tone: 'error',
      });
    }
    setLines(previous =>
      [...previous, { text: `$ ${source}`, tone: 'accent' }, ...results].slice(-100)
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(input);
  };
  return (
    <Dialog title="Launch Terminal" terminal close={close}>
      <div ref={output} role="log" aria-label="Terminal output" className={styles.terminalOutput}>
        {lines.map((line, index) =>
          line.action ? (
            <a
              key={index}
              href={routeHref({ ...navigation, ...line.action })}
              onClick={event => follow(event, line.action!)}
            >
              {line.text}
            </a>
          ) : (
            <p key={index} data-tone={line.tone}>
              {line.text}
            </p>
          )
        )}
      </div>
      <div className={styles.terminalSuggestions}>
        {(suggestions.length ? suggestions : ['help', 'worlds', 'open hush']).map(suggestion => (
          <button
            key={suggestion}
            onClick={() =>
              suggestions.length ? (setInput(suggestion), setSuggestions([])) : run(suggestion)
            }
          >
            {suggestion}
          </button>
        ))}
      </div>
      <form className={styles.terminalForm} onSubmit={submit}>
        <label htmlFor="universe-command">cj@universe:~$</label>
        <input
          id="universe-command"
          aria-label="Terminal command"
          value={input}
          onChange={event => setInput(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={400}
          onKeyDown={event => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              if (!history.current.length) return;
              event.preventDefault();
              if (historyIndex.current === -1) draft.current = input;
              historyIndex.current =
                event.key === 'ArrowUp'
                  ? Math.min(historyIndex.current + 1, history.current.length - 1)
                  : Math.max(-1, historyIndex.current - 1);
              setInput(
                historyIndex.current < 0
                  ? draft.current
                  : history.current[history.current.length - 1 - historyIndex.current]
              );
            }
            if (event.key === 'Tab' && input.trim()) {
              const words = [
                'help',
                'whoami',
                'worlds',
                'projects',
                'writing',
                'open',
                'read',
                'skills',
                'contact',
                'vault',
                'history',
                'clear',
                'exit',
              ];
              const candidates = input.startsWith('open ')
                ? [
                    ...WORLDS.map(world => `open ${world.id}`),
                    ...content.projects.map(project => `open ${project.slug}`),
                  ]
                : input.startsWith('read ')
                  ? content.articles.map(article => `read ${article.slug}`)
                  : words;
              const matches = candidates.filter(word => word.startsWith(input));
              if (matches.length) {
                event.preventDefault();
                if (matches.length === 1) setInput(matches[0]);
                else setSuggestions(matches);
              }
            }
          }}
        />
        <button type="submit" aria-label="Run command">
          <UniverseIcon name="arrow" size={17} />
        </button>
      </form>
      <footer>
        <span>Read-only portfolio commands. No server shell.</span>
        <span>↑ ↓ history · tab complete</span>
      </footer>
    </Dialog>
  );
}
