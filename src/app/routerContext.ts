import { createContext, useContext } from 'react';
import type { Route } from './routes.ts';

export interface NavigateOptions {
  replace?: boolean;
}

export interface RouterValue {
  route: Route;
  navigate: (href: string, options?: NavigateOptions) => void;
  /** Smoothly brings a home anchor into view and records it without a history entry. */
  scrollToAnchor: (id: string, options?: { instant?: boolean }) => void;
}

export const RouterContext = createContext<RouterValue | null>(null);

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToElement(id: string, instant = false) {
  const element = document.getElementById(id);
  if (!element) return false;
  const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
  const top = element.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top, behavior: instant || prefersReduced() ? 'auto' : 'smooth' });
  return true;
}

export function useRouter() {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter must be used inside RouterProvider');
  return value;
}
