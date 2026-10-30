import { useCallback, useEffect, useRef, useState } from 'react';
import { parseUniverseUrl, routeHref, updateNavigation } from './navigation';
import type { UniverseMode, UniverseNavigation } from './types';

export type NavigationCause = 'initial' | 'user' | 'scroll' | 'history' | 'mode';
function preferredMode(): UniverseMode {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'browse';
  try {
    return localStorage.getItem('cj-universe-mode') === 'browse' ? 'browse' : 'explore';
  } catch {
    return 'explore';
  }
}
export function useUniverseNavigation() {
  const [navigation, setNavigation] = useState(() =>
    parseUniverseUrl(window.location.href, preferredMode())
  );
  const current = useRef(navigation);
  const cause = useRef<NavigationCause>('initial');
  current.current = navigation;
  const navigate = useCallback(
    (patch: Partial<UniverseNavigation>, replace = false, source: NavigationCause = 'user') => {
      const next = updateNavigation(current.current, patch);
      cause.current = source;
      current.current = next;
      setNavigation(next);
      const href = routeHref(next);
      if (`${window.location.pathname}${window.location.search}` !== href) {
        window.history[replace ? 'replaceState' : 'pushState'](null, '', href);
      }
    },
    []
  );
  useEffect(() => {
    const back = () => {
      cause.current = 'history';
      const next = parseUniverseUrl(window.location.href, current.current.mode);
      current.current = next;
      setNavigation(next);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('cj-universe-mode', navigation.mode);
    } catch {
      /* Optional local preference. */
    }
  }, [navigation.mode]);
  return { navigation, navigate, current, cause };
}
