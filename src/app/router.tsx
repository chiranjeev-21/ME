import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { canonicalHref, parseRoute } from './routes.ts';
import type { Route } from './routes.ts';
import { RouterContext, scrollToElement, useRouter } from './routerContext.ts';
import type { NavigateOptions } from './routerContext.ts';

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.href));

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Legacy /world/* and ?vault=1 links collapse to their canonical address.
    const current = window.location.pathname + window.location.search + window.location.hash;
    const canonical = canonicalHref(window.location.href);
    if (route.name !== 'not-found' && canonical !== current)
      history.replaceState(history.state, '', canonical);
    const onPop = () => setRoute(parseRoute(window.location.href));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((href: string, options: NavigateOptions = {}) => {
    const next = parseRoute(href);
    const canonical = canonicalHref(href);
    if (options.replace) history.replaceState(null, '', canonical);
    else history.pushState({ from: 'app' }, '', canonical);
    setRoute(next);
  }, []);

  const scrollToAnchor = useCallback((id: string, options: { instant?: boolean } = {}) => {
    if (scrollToElement(id, options.instant))
      history.replaceState(history.state, '', id === 'opening' ? '/' : `/#${id}`);
  }, []);

  const value = useMemo(
    () => ({ route, navigate, scrollToAnchor }),
    [route, navigate, scrollToAnchor]
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Runs before client navigation, e.g. to close a menu. */
  onNavigate?: () => void;
}

/**
 * A real anchor for internal destinations. Modified clicks keep native browser
 * behaviour (new tab, download); ordinary clicks navigate in place.
 */
export function AppLink({ href, onNavigate, onClick, children, ...rest }: AppLinkProps) {
  const { route, navigate, scrollToAnchor } = useRouter();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!isPlainClick(event)) return;
    const target = parseRoute(href);
    event.preventDefault();
    onNavigate?.();
    if (target.name === 'home' && route.name === 'home') {
      const id = target.anchor || target.chapter || 'opening';
      // Let an overlay that closed in onNavigate release the page before scrolling.
      if (onNavigate) requestAnimationFrame(() => requestAnimationFrame(() => scrollToAnchor(id)));
      else scrollToAnchor(id);
      return;
    }
    navigate(href);
  };
  return (
    <a href={canonicalHref(href)} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
