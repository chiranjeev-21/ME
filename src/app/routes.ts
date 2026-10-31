import { isChapterId } from '../data/chapters.ts';
import type { ChapterId } from '../data/chapters.ts';

export type Route =
  | { name: 'home'; chapter: ChapterId | null; anchor: string | null }
  | { name: 'project'; slug: string }
  | { name: 'note'; slug: string }
  | { name: 'not-found'; path: string };

/** Destinations from the previous CJ Universe build keep working as chapter links. */
const LEGACY_WORLDS: Record<string, { chapter: ChapterId; anchor?: string }> = {
  about: { chapter: 'identity' },
  engineering: { chapter: 'work' },
  'ai-lab': { chapter: 'work' },
  projects: { chapter: 'work' },
  creative: { chapter: 'beyond' },
  hush: { chapter: 'beyond', anchor: 'hush' },
  writing: { chapter: 'work', anchor: 'notes' },
  contact: { chapter: 'contact' },
};

const SLUG = /^[a-z0-9][a-z0-9-]{0,100}$/i;
const ANCHOR = /^[a-z][a-z0-9-]{0,60}$/i;

export function parseRoute(input: string): Route {
  let url: URL;
  try {
    url = new URL(input, 'https://portfolio.local');
  } catch {
    return { name: 'not-found', path: String(input) };
  }
  let parts: string[];
  try {
    parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return { name: 'not-found', path: url.pathname };
  }
  const hash = url.hash.slice(1);
  if (!parts.length) {
    if (url.searchParams.get('vault') === '1')
      return { name: 'home', chapter: 'work', anchor: 'side-quests' };
    if (isChapterId(hash)) return { name: 'home', chapter: hash, anchor: null };
    return { name: 'home', chapter: null, anchor: ANCHOR.test(hash) ? hash : null };
  }
  const [section, value, ...rest] = parts;
  if (rest.length) return { name: 'not-found', path: url.pathname };
  if (section === 'projects') {
    if (value && SLUG.test(value)) return { name: 'project', slug: value.toLowerCase() };
    if (!value) return { name: 'home', chapter: 'work', anchor: null };
  }
  if (section === 'writing') {
    if (value && SLUG.test(value)) return { name: 'note', slug: value.toLowerCase() };
    if (!value) return { name: 'home', chapter: 'work', anchor: 'notes' };
  }
  if (section === 'world' && value && Object.prototype.hasOwnProperty.call(LEGACY_WORLDS, value)) {
    const legacy = LEGACY_WORLDS[value];
    const vault = value === 'projects' && url.searchParams.get('vault') === '1';
    return vault
      ? { name: 'home', chapter: 'work', anchor: 'side-quests' }
      : { name: 'home', chapter: legacy.chapter, anchor: legacy.anchor ?? null };
  }
  return { name: 'not-found', path: url.pathname };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'project':
      return `/projects/${encodeURIComponent(route.slug)}`;
    case 'note':
      return `/writing/${encodeURIComponent(route.slug)}`;
    case 'home':
      return route.anchor ? `/#${route.anchor}` : route.chapter ? `/#${route.chapter}` : '/';
    default:
      return route.path;
  }
}

/** The canonical address for a parsed route; legacy and query forms collapse to it. */
export function canonicalHref(input: string): string {
  return routeHref(parseRoute(input));
}
