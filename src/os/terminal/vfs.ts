import type { VfsEntry } from '../types';

export const HOME = '/home/cj';

/** Resolve only inside the virtual POSIX tree; no host filesystem is involved. */
export function normalizePath(input: string, cwd = HOME): string {
  const resolve = (path: string): string => {
    const parts: string[] = [];
    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return `/${parts.join('/')}`;
  };
  const expanded =
    input === '~' ? HOME : input.startsWith('~/') ? `${HOME}/${input.slice(2)}` : input;
  const base = cwd === '~' ? HOME : cwd.startsWith('~/') ? `${HOME}/${cwd.slice(2)}` : cwd;
  return resolve(expanded.startsWith('/') ? expanded : `${resolve(base)}/${expanded}`);
}

export class VfsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VfsError';
  }
}

function indexFiles(files: readonly VfsEntry[]): Map<string, VfsEntry> {
  const index = new Map<string, VfsEntry>();
  const addDirectory = (path: string) => {
    if (!index.has(path)) {
      index.set(path, {
        path,
        name: path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1),
        kind: 'directory',
      });
    }
  };
  addDirectory('/');
  addDirectory('/home');
  addDirectory(HOME);
  for (const entry of files) {
    const path = normalizePath(entry.path, '/');
    let parent = path;
    while (parent !== '/') {
      parent = parent.slice(0, parent.lastIndexOf('/')) || '/';
      addDirectory(parent);
    }
    index.set(path, { ...entry, path });
  }
  return index;
}

export function getEntry(
  files: readonly VfsEntry[],
  input: string,
  cwd = HOME
): VfsEntry | undefined {
  return indexFiles(files).get(normalizePath(input, cwd));
}

export function listDirectory(
  files: readonly VfsEntry[],
  input = '.',
  cwd = HOME,
  includeHidden = false
): VfsEntry[] {
  const path = normalizePath(input, cwd);
  const index = indexFiles(files);
  const entry = index.get(path);
  if (!entry) throw new VfsError(`No such file or directory: ${path}`);
  if (entry.kind !== 'directory') throw new VfsError(`Not a directory: ${path}`);
  return [...index.values()]
    .filter(candidate => {
      const parent = candidate.path.slice(0, candidate.path.lastIndexOf('/')) || '/';
      return (
        candidate.path !== path &&
        parent === path &&
        (includeHidden || (!candidate.hidden && !candidate.name.startsWith('.')))
      );
    })
    .sort(
      (a, b) =>
        Number(b.kind === 'directory') - Number(a.kind === 'directory') ||
        a.name.localeCompare(b.name)
    );
}

export function readFile(files: readonly VfsEntry[], input: string, cwd = HOME): string {
  const path = normalizePath(input, cwd);
  const entry = getEntry(files, path);
  if (!entry) throw new VfsError(`No such file or directory: ${path}`);
  if (entry.kind !== 'file') throw new VfsError(`Is a directory: ${path}`);
  if (entry.content === undefined) {
    throw new VfsError(`Not a text-readable file: ${path}. Use open to view it.`);
  }
  return entry.content;
}
