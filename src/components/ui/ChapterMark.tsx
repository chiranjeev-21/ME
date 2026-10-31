import type { ReactNode } from 'react';
import { CHAPTERS } from '../../data/chapters.ts';
import type { ChapterId } from '../../data/chapters.ts';

/** The quiet mono marker that opens every chapter: number, rule, title. */
export function ChapterMark({ chapter, children }: { chapter: ChapterId; children?: ReactNode }) {
  const meta = CHAPTERS.find(item => item.id === chapter)!;
  return (
    <p className="u-label chapter-mark">
      <span>{meta.number}</span>
      <span aria-hidden="true" className="chapter-mark__rule" />
      <span>{children ?? meta.title}</span>
    </p>
  );
}
