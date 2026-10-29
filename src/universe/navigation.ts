import { isWorldId } from './worlds.ts';
import type { UniverseMode, UniverseNavigation } from './types';

export function homeNavigation(mode: UniverseMode = 'explore'): UniverseNavigation {
  return { world: null, projectSlug: null, articleSlug: null, mode, vault: false };
}
function slug(value: string | null): string | null {
  return value && /^[a-z0-9][a-z0-9-]{0,100}$/i.test(value) ? value : null;
}
export function parseUniverseUrl(
  input: string,
  defaultMode: UniverseMode = 'explore'
): UniverseNavigation {
  const url = new URL(input, 'https://cj-universe.local');
  const mode = url.searchParams.get('mode');
  const result = homeNavigation(mode === 'browse' || mode === 'explore' ? mode : defaultMode);
  let parts: string[];
  try {
    parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return result;
  }
  if (parts[0] === 'world' && isWorldId(parts[1])) result.world = parts[1];
  if (parts[0] === 'projects') {
    result.world = 'projects';
    result.projectSlug = slug(parts[1] || null);
  }
  if (parts[0] === 'writing') {
    result.world = 'writing';
    result.articleSlug = slug(parts[1] || null);
  }
  result.vault = result.world === 'projects' && url.searchParams.get('vault') === '1';
  return result;
}
export function updateNavigation(
  previous: UniverseNavigation,
  patch: Partial<UniverseNavigation>
): UniverseNavigation {
  const changedWorld = patch.world !== undefined && patch.world !== previous.world;
  const next = {
    ...previous,
    ...(changedWorld ? { projectSlug: null, articleSlug: null, vault: false } : {}),
    ...patch,
  };
  if (next.world !== null && !isWorldId(next.world)) next.world = null;
  next.mode = next.mode === 'browse' ? 'browse' : 'explore';
  next.projectSlug = next.world === 'projects' ? slug(next.projectSlug) : null;
  next.articleSlug = next.world === 'writing' ? slug(next.articleSlug) : null;
  next.vault = next.world === 'projects' && Boolean(next.vault);
  return next;
}
export function routeHref(navigation: UniverseNavigation): string {
  const route =
    navigation.world === 'projects' && navigation.projectSlug
      ? `/projects/${encodeURIComponent(navigation.projectSlug)}`
      : navigation.world === 'writing' && navigation.articleSlug
        ? `/writing/${encodeURIComponent(navigation.articleSlug)}`
        : navigation.world
          ? `/world/${navigation.world}`
          : '/';
  const query = new URLSearchParams({ mode: navigation.mode });
  if (navigation.vault) query.set('vault', '1');
  return `${route}?${query}`;
}
