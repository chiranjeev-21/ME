import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { ExpeditionFrame, ExpeditionHandle, ExpeditionProps, WorldId } from '../types';
import { WORLDS } from '../worlds';
import { expeditionJump, frameAtScroll, measureExpedition, progressBetween } from './mapping';
import type { ExpeditionLayout } from './mapping';
import styles from './Expedition.module.css';

type Jump = {
  world: WorldId | null;
  phase: 'approach' | 'read';
  behavior: ScrollBehavior;
  notify: boolean;
};

interface Controller {
  jump: (jump: Jump) => void;
  refresh: () => void;
  focus: () => void;
}

export const Expedition = forwardRef<ExpeditionHandle, ExpeditionProps>(
  function Expedition(props, forwardedRef) {
    const { navigation, reducedMotion, frame, intro, renderWorld } = props;
    const root = useRef<HTMLDivElement>(null);
    const overview = useRef<HTMLElement>(null);
    const chapters = useRef(new Map<WorldId, HTMLElement>());
    const documents = useRef(new Map<WorldId, HTMLDivElement>());
    const currentProps = useRef(props);
    currentProps.current = props;
    const pending = useRef<Jump | null>(null);
    const pendingFocus = useRef<WorldId | null>(null);
    const controller = useRef<Controller | null>(null);

    useImperativeHandle(
      forwardedRef,
      () => ({
        scrollToWorld(world, phase = 'read', behavior = 'instant') {
          const jump: Jump = { world, phase, behavior, notify: false };
          if (controller.current) controller.current.jump(jump);
          else pending.current = jump;
        },
        scrollToOverview(behavior = 'instant') {
          const jump: Jump = { world: null, phase: 'approach', behavior, notify: false };
          if (controller.current) controller.current.jump(jump);
          else pending.current = jump;
        },
        focusWorld(world) {
          pendingFocus.current = world;
          controller.current?.focus();
        },
      }),
      []
    );

    useLayoutEffect(() => {
      const host = root.current;
      if (!host) return;
      const exploring = navigation.mode === 'explore';
      let layout: ExpeditionLayout = measureExpedition([], 1, 0);
      let dirty = true;
      let animationFrame = 0;
      let alive = true;
      let lastBoundary = { world: frame.current.world, phase: frame.current.phase };
      const written = new Map<HTMLElement, string>();
      let overviewProgress = '';

      const measure = () => {
        const scrollTop = window.scrollY;
        const height = Math.max(1, window.innerHeight);
        const headerOffset =
          Number.parseFloat(
            getComputedStyle(host).getPropertyValue('--expedition-header-offset')
          ) || 128;
        const measurements = WORLDS.flatMap(({ id }) => {
          const chapter = chapters.current.get(id);
          const content = documents.current.get(id);
          if (!chapter || !content || chapter.hidden) return [];
          const chapterRect = chapter.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          return [
            {
              world: id,
              top: chapterRect.top + scrollTop,
              readTop: contentRect.top + scrollTop,
              readBottom: contentRect.bottom + scrollTop,
            },
          ];
        });
        layout = measureExpedition(
          measurements,
          height,
          headerOffset,
          (overview.current && !overview.current.hidden
            ? overview.current.getBoundingClientRect().top
            : host.getBoundingClientRect().top) + scrollTop
        );
        dirty = false;
      };

      const write = (next: ExpeditionFrame, position: number, notify: boolean) => {
        frame.current = next;
        if (host.dataset.expeditionPhase !== next.phase) host.dataset.expeditionPhase = next.phase;
        for (const chapter of layout.chapters) {
          const element = chapters.current.get(chapter.world);
          if (!element) continue;
          const approach = reducedMotion
            ? 1
            : progressBetween(position, chapter.approachStart, chapter.entryStart);
          const entry = reducedMotion
            ? 1
            : progressBetween(position, chapter.entryStart, chapter.entryEnd);
          const reading = progressBetween(position, chapter.readStart, chapter.readEnd);
          const values = [approach, entry, reading].map(value => value.toFixed(4));
          const key = values.join(',');
          if (written.get(element) !== key) {
            element.style.setProperty('--chapter-progress', values[0]);
            element.style.setProperty('--entry-progress', values[1]);
            element.style.setProperty('--reading-progress', values[2]);
            written.set(element, key);
          }
        }
        if (!exploring && next.world) {
          const selected = chapters.current.get(next.world);
          selected?.style.setProperty('--chapter-progress', '1');
          selected?.style.setProperty('--entry-progress', '1');
          selected?.style.setProperty('--reading-progress', '0');
          if (selected) written.delete(selected);
        }
        const firstApproach = layout.chapters[0]?.approachStart ?? layout.overviewTop + 1;
        const progress = progressBetween(position, layout.overviewTop, firstApproach).toFixed(4);
        if (overviewProgress !== progress) {
          host.style.setProperty('--overview-progress', progress);
          overviewProgress = progress;
        }
        const previous = lastBoundary;
        lastBoundary = { world: next.world, phase: next.phase };
        // Advance the boundary before callbacks: a parent may synchronously issue a route jump.
        if (notify && previous.world !== next.world) currentProps.current.onWorldChange(next.world);
        if (previous.phase !== next.phase && frame.current.phase === next.phase)
          currentProps.current.onPhaseChange?.(next.phase);
      };

      const flush = () => {
        animationFrame = 0;
        if (!alive || !exploring || document.hidden) return;
        if (dirty) measure();
        const position = window.scrollY;
        write(
          frameAtScroll(layout, position, frame.current.jumpRevision, reducedMotion),
          position,
          true
        );
      };
      const schedule = () => {
        if (alive && exploring && !document.hidden && !animationFrame)
          animationFrame = requestAnimationFrame(flush);
      };
      const invalidate = () => {
        dirty = true;
        schedule();
      };

      const browseFrame = (): ExpeditionFrame => ({
        world: currentProps.current.navigation.world,
        phase: currentProps.current.navigation.world ? 'inside' : 'orbit',
        approach: currentProps.current.navigation.world ? 1 : 0,
        entry: currentProps.current.navigation.world ? 1 : 0,
        readProgress: 0,
        jumpRevision: frame.current.jumpRevision,
      });

      const focus = () => {
        const world = pendingFocus.current;
        if (!world || chapters.current.get(world)?.hidden) return;
        const content = documents.current.get(world);
        const heading =
          content?.querySelector<HTMLElement>('h1') || content?.querySelector<HTMLElement>('h2');
        if (!heading) return;
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        pendingFocus.current = null;
      };

      const jump = (request: Jump) => {
        if (
          request.world &&
          (!chapters.current.get(request.world) || chapters.current.get(request.world)?.hidden)
        ) {
          pending.current = request;
          return;
        }
        pending.current = null;
        // Explicit navigation reads fresh geometry, including newly opened articles/lab results.
        measure();
        const behavior = reducedMotion ? 'instant' : request.behavior;
        const destination = expeditionJump(
          layout,
          request.world,
          request.phase,
          frame.current.jumpRevision,
          reducedMotion,
          Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
          behavior
        );
        if (!destination) {
          pending.current = request;
          return;
        }
        if (!exploring) {
          write(
            { ...browseFrame(), jumpRevision: destination.frame.jumpRevision },
            destination.top,
            false
          );
        } else if (behavior === 'smooth') {
          // Native smooth scrolling owns the movement; do not teleport the scene to its endpoint.
          write(
            frameAtScroll(layout, window.scrollY, destination.frame.jumpRevision, reducedMotion),
            window.scrollY,
            false
          );
        } else {
          write(destination.frame, destination.top, request.notify);
        }
        window.scrollTo({
          top: !exploring && request.world === null ? 0 : destination.top,
          behavior,
        });
        focus();
        schedule();
      };

      const refresh = () => {
        if (pending.current) jump(pending.current);
        else if (!exploring) write(browseFrame(), window.scrollY, false);
        focus();
      };
      controller.current = { jump, refresh, focus };

      const resizeObserver = exploring ? new ResizeObserver(invalidate) : null;
      const observe = () => {
        resizeObserver?.observe(host);
        if (overview.current) resizeObserver?.observe(overview.current);
        for (const element of chapters.current.values()) resizeObserver?.observe(element);
        for (const element of documents.current.values()) resizeObserver?.observe(element);
      };
      const visibilityChanged = () => {
        if (document.hidden) {
          if (animationFrame) cancelAnimationFrame(animationFrame);
          animationFrame = 0;
          resizeObserver?.disconnect();
        } else {
          observe();
          invalidate();
        }
      };

      if (exploring) {
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', invalidate, { passive: true });
        window.visualViewport?.addEventListener('resize', invalidate, { passive: true });
        document.addEventListener('visibilitychange', visibilityChanged);
        if (!document.hidden) observe();
        void document.fonts?.ready.then(() => {
          if (alive) invalidate();
        });
        if (pending.current) jump(pending.current);
        else if (currentProps.current.navigation.world)
          jump({
            world: currentProps.current.navigation.world,
            phase: 'read',
            behavior: 'instant',
            notify: false,
          });
        else {
          measure();
          write(
            frameAtScroll(layout, window.scrollY, frame.current.jumpRevision, reducedMotion),
            window.scrollY,
            true
          );
          schedule();
        }
      } else refresh();

      return () => {
        alive = false;
        controller.current = null;
        if (animationFrame) cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', invalidate);
        window.visualViewport?.removeEventListener('resize', invalidate);
        document.removeEventListener('visibilitychange', visibilityChanged);
      };
    }, [navigation.mode, reducedMotion, frame]);

    useLayoutEffect(() => {
      controller.current?.refresh();
    }, [navigation.mode, navigation.world]);

    const readChapter = (event: MouseEvent<HTMLAnchorElement>, world: WorldId) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      controller.current?.jump({ world, phase: 'read', behavior: 'instant', notify: true });
    };

    return (
      <div
        ref={root}
        className={styles.expedition}
        data-expedition-mode={navigation.mode}
        data-expedition-phase={frame.current.phase}
        data-reduced-motion={reducedMotion}
      >
        <section
          ref={overview}
          id="expedition-overview"
          className={styles.overview}
          aria-label="CJ Universe overview"
          hidden={navigation.mode === 'browse'}
        >
          <div className={styles.intro}>{intro}</div>
          <p className={styles.scrollCue}>
            <span aria-hidden="true">↓</span> Scroll to travel · seven worlds
          </p>
        </section>
        {WORLDS.map(world => (
          <section
            key={world.id}
            ref={element => {
              if (element) chapters.current.set(world.id, element);
              else chapters.current.delete(world.id);
            }}
            id={`expedition-world-${world.id}`}
            className={styles.chapter}
            style={{ '--chapter-accent': world.color } as CSSProperties}
            data-expedition-world={world.id}
            data-current={navigation.world === world.id}
            aria-label={`Chapter ${world.number}: ${world.name}`}
            hidden={navigation.mode === 'browse' && navigation.world !== world.id}
          >
            <div className={styles.landing} hidden={navigation.mode === 'browse'}>
              <header className={styles.chapterTitle}>
                <p className={styles.chapterNumber}>Chapter {world.number} / 07</p>
                <h2>{world.name}</h2>
                <p className={styles.subtitle}>{world.subtitle}</p>
                <a
                  href={`#expedition-read-${world.id}`}
                  onClick={event => readChapter(event, world.id)}
                >
                  Read chapter <span aria-hidden="true">↘</span>
                </a>
                <span className={styles.entryLine} aria-hidden="true" />
              </header>
            </div>
            <div
              ref={element => {
                if (element) documents.current.set(world.id, element);
                else documents.current.delete(world.id);
              }}
              id={`expedition-read-${world.id}`}
              className={styles.document}
              data-world-content
            >
              {renderWorld(world.id)}
            </div>
          </section>
        ))}
      </div>
    );
  }
);
