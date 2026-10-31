import { useSyncExternalStore } from 'react';
import type { ChapterId } from '../data/chapters.ts';

let current: ChapterId = 'opening';
const listeners = new Set<() => void>();

export const chapterStore = {
  get: () => current,
  set(next: ChapterId) {
    if (next === current) return;
    current = next;
    listeners.forEach(listener => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** The chapter nearest the reading line; changes only at chapter boundaries. */
export function useActiveChapter() {
  return useSyncExternalStore(chapterStore.subscribe, chapterStore.get, chapterStore.get);
}
