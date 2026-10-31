import { useGSAP } from '@gsap/react';
import type { DependencyList, RefObject } from 'react';
import { ScrollTrigger } from './gsap.ts';

type Task = { run: () => void; cancelled: boolean };

const queue: Task[] = [];
let scheduled = false;
let resolveDrained: () => void = () => undefined;
let drained = new Promise<void>(resolve => (resolveDrained = resolve));
let pending = false;

const idle: (callback: (deadline?: IdleDeadline) => void) => void =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? callback => window.requestIdleCallback(callback, { timeout: 400 })
    : callback => window.setTimeout(callback, 16);

function drain(deadline?: IdleDeadline) {
  scheduled = false;
  // One setup per slice when time is short, more when the browser is idle.
  do {
    const task = queue.shift();
    if (task && !task.cancelled) task.run();
  } while (queue.length && deadline && deadline.timeRemaining() > 10);
  if (queue.length) schedule();
  else if (pending) {
    pending = false;
    // A single re-measure once every section has built its pins and triggers.
    ScrollTrigger.refresh();
    resolveDrained();
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  idle(drain);
}

/** Queues scroll choreography setup so it runs in idle slices, in mount (document) order. */
export function enqueueMotion(run: () => void) {
  if (!pending) {
    pending = true;
    drained = new Promise<void>(resolve => (resolveDrained = resolve));
  }
  const task: Task = { run, cancelled: false };
  queue.push(task);
  schedule();
  return () => {
    task.cancelled = true;
  };
}

/** Resolves when all queued setups have run and triggers have been measured. */
export function motionReady() {
  return pending ? drained : Promise.resolve();
}

type ContextSafe = <T extends (...args: never[]) => unknown>(fn: T) => T;

/**
 * `useGSAP`, but the setup runs from the idle queue inside the component's
 * context, so it is still reverted on unmount. `contextSafe` wraps any later
 * callbacks that create animations.
 */
export function useQueuedGSAP(
  setup: (contextSafe: ContextSafe) => void | (() => void),
  config: { scope?: RefObject<Element>; dependencies?: DependencyList } = {}
) {
  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return;
      let cleanup: void | (() => void);
      const cancel = enqueueMotion(
        contextSafe(() => {
          cleanup = setup(contextSafe as unknown as ContextSafe);
        })
      );
      return () => {
        cancel();
        if (typeof cleanup === 'function') cleanup();
      };
    },
    { scope: config.scope, dependencies: [...(config.dependencies ?? [])] }
  );
}
