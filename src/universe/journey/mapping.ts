import type { ExpeditionFrame, WorldId } from '../types.ts';

export interface ChapterMeasurement {
  world: WorldId;
  top: number;
  readTop: number;
  readBottom: number;
}

export interface ChapterAnchors extends ChapterMeasurement {
  approachStart: number;
  entryStart: number;
  entryEnd: number;
  readStart: number;
  readEnd: number;
}

export interface ExpeditionLayout {
  chapters: ChapterAnchors[];
  viewportHeight: number;
  headerOffset: number;
  overviewTop: number;
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function progressBetween(position: number, start: number, end: number): number {
  if (end <= start) return finite(position) >= end ? 1 : 0;
  return Math.max(0, Math.min(1, (finite(position) - start) / Math.max(1, end - start)));
}

export function measureExpedition(
  measurements: readonly ChapterMeasurement[],
  viewportHeight: number,
  headerOffset: number,
  overviewTop = 0
): ExpeditionLayout {
  const height = Math.max(1, finite(viewportHeight, 1));
  const offset = Math.max(0, finite(headerOffset));
  const chapters = measurements
    .filter(chapter => [chapter.top, chapter.readTop, chapter.readBottom].every(Number.isFinite))
    .map(chapter => {
      const readTop = Math.max(chapter.top, chapter.readTop);
      const readBottom = Math.max(readTop, chapter.readBottom);
      const approachStart = Math.max(0, chapter.top - height * 0.65);
      const readStart = Math.max(0, readTop - offset);
      const entryStart = Math.min(
        readStart,
        Math.max(approachStart + 1, chapter.top + height * 0.18)
      );
      const entryEnd = Math.min(readStart, Math.max(entryStart + 1, readTop - height * 0.28));
      return {
        ...chapter,
        readTop,
        readBottom,
        approachStart,
        entryStart,
        entryEnd,
        readStart,
        readEnd: Math.max(readStart + 1, readBottom - height + Math.min(96, height * 0.16)),
      };
    })
    .sort((a, b) => a.top - b.top);
  return {
    chapters,
    viewportHeight: height,
    headerOffset: offset,
    overviewTop: Math.max(0, finite(overviewTop)),
  };
}

export function frameAtScroll(
  layout: ExpeditionLayout,
  scrollTop: number,
  jumpRevision = 0,
  reducedMotion = false
): ExpeditionFrame {
  const position = Math.max(0, finite(scrollTop));
  let active: ChapterAnchors | undefined;
  for (const chapter of layout.chapters) {
    const start = reducedMotion
      ? Math.max(0, chapter.top - layout.headerOffset)
      : chapter.approachStart;
    if (position < start) break;
    active = chapter;
  }
  if (!active) {
    return { world: null, phase: 'orbit', approach: 0, entry: 0, readProgress: 0, jumpRevision };
  }
  const approach = reducedMotion
    ? 1
    : progressBetween(position, active.approachStart, active.entryStart);
  const entry = reducedMotion ? 1 : progressBetween(position, active.entryStart, active.entryEnd);
  return {
    world: active.world,
    phase:
      reducedMotion || position >= active.entryEnd
        ? 'inside'
        : position >= active.entryStart
          ? 'entry'
          : 'approach',
    approach,
    entry,
    readProgress: progressBetween(position, active.readStart, active.readEnd),
    jumpRevision,
  };
}

export function expeditionJump(
  layout: ExpeditionLayout,
  world: WorldId | null,
  phase: 'approach' | 'read',
  previousRevision: number,
  reducedMotion = false,
  maxScroll = Infinity,
  behavior: ScrollBehavior = 'instant'
): { top: number; frame: ExpeditionFrame } | null {
  const chapter = world ? layout.chapters.find(chapter => chapter.world === world) : null;
  if (world && !chapter) return null;
  const target = chapter
    ? phase === 'read'
      ? chapter.readStart
      : reducedMotion
        ? Math.max(0, chapter.top - layout.headerOffset)
        : chapter.approachStart
    : layout.overviewTop;
  const top = Math.max(0, Math.min(Math.max(0, maxScroll), target));
  return {
    top,
    frame: frameAtScroll(
      layout,
      top,
      previousRevision + (behavior === 'smooth' ? 0 : 1),
      reducedMotion
    ),
  };
}
