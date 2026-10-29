import type { AppDefinition, AppId, AppPayload, ProjectCaseStudy, VfsEntry } from '../types';
import { parseCommand, quoteToken, tokenize } from './parser.ts';
import { getEntry, HOME, listDirectory, normalizePath, readFile } from './vfs.ts';

export { parseCommand } from './parser.ts';
export { normalizePath } from './vfs.ts';

export type ShellAction =
  | { kind: 'app'; appId: AppId; payload?: AppPayload }
  | { kind: 'path'; path: string }
  | { kind: 'command'; command: string };

export type ShellEffect =
  | Exclude<ShellAction, { kind: 'command' }>
  | { kind: 'clear' }
  | { kind: 'close' };

export interface ShellLine {
  text: string;
  tone?: 'muted' | 'accent' | 'error';
  action?: ShellAction;
}

export interface ShellContext {
  cwd: string;
  files: readonly VfsEntry[];
  apps: readonly AppDefinition[];
  projects: readonly ProjectCaseStudy[];
  history?: readonly string[];
  system?: { hostname: string; version: string };
}

export interface ShellResult {
  cwd: string;
  lines: ShellLine[];
  effects: ShellEffect[];
}

const COMMANDS: Record<string, string> = {
  help: 'Commands and available applications',
  whoami: 'Meet the person behind this workspace',
  pwd: 'Print the virtual working directory',
  ls: 'List files: ls [-a] [path]',
  cd: 'Change directory: cd [path]',
  cat: 'Read a text file: cat <path>',
  open: 'Open an app, path, or project: open <target>',
  projects: 'Browse the supplied project case studies',
  resume: 'Open the resume',
  contact: 'Read contact information',
  about: 'Read the biography',
  lab: 'Open the local experiment',
  monitor: 'Open real workspace measurements',
  neofetch: 'Show identity and workspace information',
  echo: 'Print literal text (no variable expansion)',
  clear: 'Clear terminal scrollback',
  history: 'Show this terminal’s command history',
  exit: 'Close this terminal window',
};

const identity = [
  'Chiranjeev Singh',
  'Software engineer · builder / experimenter',
  'Current work: Microsoft / Azure Direct Drive.',
  'Skills: Distributed Computing · Agentic AI · Backend Engineering.',
];

export function welcomeLines(): ShellLine[] {
  return [
    { text: 'CJ OS · read-only virtual terminal', tone: 'accent' },
    ...identity.map(text => ({ text })),
    {
      text: 'Type help to explore. Paths and commands stay inside this virtual workspace.',
      tone: 'muted',
    },
  ];
}

function registeredApp(context: ShellContext, appId: AppId, payload?: AppPayload): ShellEffect {
  if (!context.apps.some(app => app.id === appId)) {
    throw new Error(`Application unavailable: ${appId}`);
  }
  return { kind: 'app', appId, ...(payload ? { payload } : {}) };
}

function resolveOpen(target: string, context: ShellContext): ShellEffect {
  const query = target.toLowerCase();
  const app = context.apps.find(
    candidate => candidate.id === query || candidate.title.toLowerCase() === query
  );
  if (app) return registeredApp(context, app.id);
  if (query === 'projects') {
    return registeredApp(context, 'explorer', { path: `${HOME}/projects` });
  }
  if (query === 'about' || query === 'contact') {
    return registeredApp(context, 'reader', { path: `${HOME}/${query}.md` });
  }
  const project = context.projects.find(
    candidate =>
      candidate.slug.toLowerCase() === query ||
      candidate.id.toLowerCase() === query ||
      candidate.title.toLowerCase() === query
  );
  if (project) return registeredApp(context, 'project', { projectId: project.id });
  const path = normalizePath(target, context.cwd);
  if (getEntry(context.files, path)) return { kind: 'path', path };
  throw new Error(`Cannot open ${quoteToken(target)}: no matching app, project, or virtual path.`);
}

/** Return data and explicit effects only. The caller owns all window-manager actions. */
export function executeCommand(source: string, context: ShellContext): ShellResult {
  const result: ShellResult = { cwd: normalizePath(context.cwd), lines: [], effects: [] };
  try {
    const [command, ...args] = parseCommand(source);
    if (!command) return result;
    const usage = (max: number, hint: string) => {
      if (args.length > max) throw new Error(`Usage: ${hint}. Quote paths containing spaces.`);
    };
    const launch = (effect: ShellEffect) => {
      result.effects.push(effect);
      if (effect.kind === 'app') {
        const app = context.apps.find(candidate => candidate.id === effect.appId);
        result.lines.push({
          text: `Opened ${app?.title ?? effect.appId}${effect.payload?.path ? ` · ${effect.payload.path}` : ''}`,
          action: effect,
        });
      } else if (effect.kind === 'path') {
        result.lines.push({ text: `Opened ${effect.path}`, action: effect });
      }
    };
    switch (command) {
      case 'help':
        usage(0, 'help');
        result.lines = [
          {
            text: 'Read-only commands · no host shell, writes, pipes, or redirection',
            tone: 'accent',
          },
          ...Object.entries(COMMANDS).map(([name, description]) => ({
            text: `${name.padEnd(10)} ${description}`,
            action: { kind: 'command' as const, command: name },
          })),
          { text: 'Applications · open an id or a quoted title', tone: 'accent' },
          ...context.apps.map(app => ({
            text: `${app.id.padEnd(10)} ${app.title} — ${app.description}`,
            action: { kind: 'app' as const, appId: app.id },
          })),
          {
            text: 'Tips: Tab completes; ↑/↓ recall commands. Try cat ~/projects/ai-lab/README.md when present.',
            tone: 'muted',
          },
        ];
        break;
      case 'whoami':
        usage(0, 'whoami');
        result.lines = identity.map(text => ({ text }));
        break;
      case 'pwd':
        usage(0, 'pwd');
        result.lines = [{ text: result.cwd }];
        break;
      case 'echo':
        result.lines = [{ text: args.join(' ') }];
        break;
      case 'cd': {
        usage(1, 'cd [path]');
        const path = normalizePath(args[0] ?? HOME, context.cwd);
        const entry = getEntry(context.files, path);
        if (!entry) throw new Error(`No such file or directory: ${path}`);
        if (entry.kind !== 'directory') throw new Error(`Not a directory: ${path}`);
        result.cwd = path;
        break;
      }
      case 'ls': {
        let all = false;
        const paths: string[] = [];
        let options = true;
        for (const arg of args) {
          if (options && arg === '--') options = false;
          else if (options && arg === '-a') all = true;
          else if (options && arg.startsWith('-'))
            throw new Error(`Unknown ls option: ${arg}. Use ls [-a] [path].`);
          else paths.push(arg);
        }
        if (paths.length > 1)
          throw new Error('Usage: ls [-a] [path]. Quote paths containing spaces.');
        const path = normalizePath(paths[0] ?? '.', context.cwd);
        const entry = getEntry(context.files, path);
        if (!entry) throw new Error(`No such file or directory: ${path}`);
        const entries =
          entry.kind === 'file' ? [entry] : listDirectory(context.files, path, context.cwd, all);
        result.lines = entries.length
          ? entries.map(file => ({
              text: `${file.name}${file.kind === 'directory' ? '/' : ''}${file.description ? ` — ${file.description}` : ''}`,
              action:
                file.kind === 'directory'
                  ? { kind: 'command' as const, command: `cd ${quoteToken(file.path)}` }
                  : { kind: 'path' as const, path: file.path },
            }))
          : [{ text: '(empty directory)', tone: 'muted' }];
        break;
      }
      case 'cat':
        usage(1, 'cat <path>');
        if (!args.length) throw new Error('Usage: cat <path>. Try ls to find a text file.');
        result.lines = readFile(context.files, args[0], context.cwd)
          .split(/\r?\n/)
          .map(text => ({ text }));
        break;
      case 'open':
        if (!args.length)
          throw new Error('Usage: open <app | path | project slug>. Try help or projects.');
        launch(resolveOpen(args.join(' '), context));
        break;
      case 'projects':
        usage(0, 'projects');
        result.lines = context.projects.length
          ? context.projects.map(project => ({
              text: `${project.title} (${project.slug}) — ${project.summary}`,
              action: {
                kind: 'app' as const,
                appId: 'project',
                payload: { projectId: project.id },
              },
            }))
          : [{ text: 'No project case studies are available in this workspace.', tone: 'muted' }];
        break;
      case 'about':
      case 'contact':
        usage(0, command);
        launch(registeredApp(context, 'reader', { path: `${HOME}/${command}.md` }));
        break;
      case 'resume':
      case 'lab':
      case 'monitor':
        usage(0, command);
        launch(registeredApp(context, command));
        break;
      case 'vault':
        usage(0, 'vault');
        result.lines.push({ text: 'A little curiosity opens another layer.', tone: 'accent' });
        launch(registeredApp(context, 'vault'));
        break;
      case 'sudo':
        if (args.join(' ') !== 'hire cj') {
          throw new Error('No elevated privileges here. This workspace is read-only.');
        }
        result.lines.push({
          text: 'No sudo required. Start a conversation with Chiranjeev.',
          tone: 'accent',
        });
        launch(registeredApp(context, 'reader', { path: `${HOME}/contact.md` }));
        result.lines.push({
          text: 'View resume',
          action: { kind: 'app', appId: 'resume' },
        });
        break;
      case 'neofetch':
        usage(0, 'neofetch');
        result.lines = [
          { text: '┌─ CJ OS ─┐', tone: 'accent' },
          ...identity.map(text => ({ text })),
          {
            text: `Workspace: ${context.system?.hostname ?? 'CJ OS'}${context.system?.version ? ` · ${context.system.version}` : ''}`,
          },
          { text: `Directory: ${result.cwd}` },
          {
            text: 'Filesystem: virtual / read-only · commands run locally in this page',
            tone: 'muted',
          },
        ];
        break;
      case 'history':
        usage(0, 'history');
        result.lines = context.history?.length
          ? context.history.map((entry, index) => ({
              text: `${String(index + 1).padStart(3)}  ${entry}`,
              action: { kind: 'command' as const, command: entry },
            }))
          : [{ text: 'No commands in this terminal yet.', tone: 'muted' }];
        break;
      case 'clear':
        usage(0, 'clear');
        result.effects.push({ kind: 'clear' });
        break;
      case 'exit':
        usage(0, 'exit');
        result.effects.push({ kind: 'close' });
        break;
      default:
        throw new Error(`Command not found: ${command}. Type help to see read-only commands.`);
    }
  } catch (error) {
    return {
      cwd: result.cwd,
      lines: [
        { text: error instanceof Error ? error.message : 'Unable to run command.', tone: 'error' },
      ],
      effects: [],
    };
  }
  return result;
}

export interface CompletionSuggestion {
  value: string;
  label: string;
  description?: string;
  input: string;
  cursor: number;
}

export interface ShellCompletion {
  suggestions: CompletionSuggestion[];
  input: string;
  cursor: number;
}

interface Candidate {
  value: string;
  label: string;
  description?: string;
  directory?: boolean;
}

function pathCandidates(
  prefix: string,
  context: ShellContext,
  directoriesOnly: boolean
): Candidate[] {
  if (prefix === '~') return [{ value: '~/', label: '~/', directory: true }];
  const slash = prefix.lastIndexOf('/');
  const parent = slash === -1 ? '' : prefix.slice(0, slash + 1);
  const name = prefix.slice(slash + 1);
  try {
    const entries = listDirectory(context.files, parent || '.', context.cwd, name.startsWith('.'));
    const candidates: Candidate[] = entries
      .filter(
        entry => entry.name.startsWith(name) && (!directoriesOnly || entry.kind === 'directory')
      )
      .map(entry => ({
        value: `${parent}${entry.name}${entry.kind === 'directory' ? '/' : ''}`,
        label: `${parent}${entry.name}${entry.kind === 'directory' ? '/' : ''}`,
        description: entry.description,
        directory: entry.kind === 'directory',
      }));
    if (!parent && (name === '.' || name === '..')) {
      candidates.unshift({ value: `${name}/`, label: `${name}/`, directory: true });
    }
    return candidates;
  } catch {
    return [];
  }
}

/** Complete only the token at the cursor. Every result remains quoted shell data. */
export function completeCommand(
  source: string,
  context: ShellContext,
  cursor = source.length
): ShellCompletion {
  const unchanged: ShellCompletion = { suggestions: [], input: source, cursor };
  const before = source.slice(0, cursor);
  let tokens;
  try {
    tokens = tokenize(before, true);
  } catch {
    return unchanged;
  }
  const last = tokens[tokens.length - 1];
  const current = last?.end === cursor ? last : undefined;
  const prefix = current?.value ?? '';
  const argument = current ? tokens.length - 1 : tokens.length;
  const start = current?.start ?? cursor;
  let end = cursor;
  try {
    const full = tokenize(source, true).find(token => token.start === start);
    if (full) end = full.end;
  } catch {
    return unchanged;
  }
  const command = tokens[0]?.value;
  let candidates: Candidate[];
  if (argument === 0) {
    candidates = Object.entries(COMMANDS)
      .filter(([name]) => name.startsWith(prefix))
      .map(([value, description]) => ({ value, label: value, description }));
  } else if (argument === 1 && command === 'open') {
    const query = prefix.toLowerCase();
    candidates = [
      ...context.apps
        .filter(app => app.id.startsWith(query) || app.title.toLowerCase().startsWith(query))
        .map(app => ({
          value: app.id.startsWith(query) ? app.id : app.title.toLowerCase(),
          label: app.title,
          description: app.description,
        })),
      ...context.projects
        .filter(
          project =>
            project.slug.toLowerCase().startsWith(query) ||
            project.title.toLowerCase().startsWith(query)
        )
        .map(project => ({
          value: project.slug,
          label: project.title,
          description: project.summary,
        })),
      ...['projects', 'about', 'contact']
        .filter(value => value.startsWith(query))
        .map(value => ({ value, label: value })),
      ...pathCandidates(prefix, context, false),
    ];
  } else if (
    ((command === 'cd' || command === 'cat') && argument === 1) ||
    (command === 'ls' &&
      (argument === 1 || (argument === 2 && ['-a', '--'].includes(tokens[1]?.value))))
  ) {
    candidates = pathCandidates(prefix, context, command === 'cd');
  } else {
    return unchanged;
  }
  candidates = [...new Map(candidates.map(candidate => [candidate.value, candidate])).values()];
  const replacement = (value: string, trailingSpace = false) => {
    const token = quoteToken(value);
    const space = trailingSpace && !/^\s/.test(source.slice(end)) ? ' ' : '';
    return {
      input: `${source.slice(0, start)}${token}${space}${source.slice(end)}`,
      cursor: start + token.length + space.length,
    };
  };
  const suggestions = candidates.map(candidate => ({
    value: candidate.value,
    label: candidate.label,
    description: candidate.description,
    ...replacement(candidate.value, !candidate.directory),
  }));
  if (!candidates.length) return unchanged;
  if (candidates.length === 1)
    return { suggestions, ...replacement(candidates[0].value, !candidates[0].directory) };
  let common = candidates[0].value;
  for (const candidate of candidates.slice(1)) {
    while (common && !candidate.value.startsWith(common)) common = common.slice(0, -1);
  }
  return {
    suggestions,
    ...(common.length > prefix.length ? replacement(common) : { input: source, cursor }),
  };
}
