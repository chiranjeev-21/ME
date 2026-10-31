import type { CSSProperties } from 'react';
import type { ChapterId } from './chapters.ts';

export interface ChapterTheme {
  bg: string;
  fg: string;
  accent: string;
}

/** Each chapter's atmosphere. ChapterBackdrop scrubs between them at chapter seams. */
export const THEMES: Record<ChapterId, ChapterTheme> = {
  opening: { bg: '#040507', fg: '#ece6db', accent: '#e2a26a' },
  identity: { bg: '#e6dfd2', fg: '#17140f', accent: '#9c4f27' },
  journey: { bg: '#0b0c0e', fg: '#ece6db', accent: '#9cc0de' },
  work: { bg: '#07080a', fg: '#ece6db', accent: '#e2a26a' },
  beyond: { bg: '#0f0b08', fg: '#efe2cf', accent: '#dc9d57' },
  contact: { bg: '#040507', fg: '#ece6db', accent: '#d8c299' },
};

/**
 * Each chapter carries its own static palette (so text never re-styles while
 * scrolling); only the fixed backdrop colour is scrubbed between chapters.
 */
export function themeAttributes(chapter: ChapterId) {
  const theme = THEMES[chapter];
  return {
    'data-chapter': chapter,
    'data-bg': theme.bg,
    style: { '--bg': theme.bg, '--fg': theme.fg, '--accent': theme.accent } as CSSProperties,
  };
}
