import { useEffect, useRef } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { OSIcon } from './Icons';
import { clampRect } from './state';
import type { DesktopAction } from './state';
import { getApp } from './registry';
import type { OSWindow, Rect, Viewport } from './types';
import styles from './Desktop.module.css';

interface Props {
  window: OSWindow;
  active: boolean;
  index: number;
  viewport: Viewport;
  dispatch: (action: DesktopAction) => void;
  children: ReactNode;
}

export function DesktopWindow({
  window: item,
  active,
  index,
  viewport,
  dispatch,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const animation = useRef<Animation | null>(null);
  const pending = useRef<Rect | null>(null);
  const gesture = useRef<{
    pointer: number;
    x: number;
    y: number;
    rect: Rect;
    resize: boolean;
  } | null>(null);
  const app = getApp(item.appId);
  const mobile = window.innerWidth <= 760;
  const rect = mobile || item.maximized ? { x: 0, y: 0, ...viewport } : item.rect;
  const style: CSSProperties = {
    transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
    width: rect.width,
    height: rect.height,
    zIndex: index + 1,
  };

  useEffect(() => {
    if (active && !item.minimized && !ref.current?.contains(document.activeElement))
      ref.current?.focus({ preventScroll: true });
  }, [active, item.minimized]);

  useEffect(() => {
    const element = ref.current;
    if (!element || gesture.current) return;
    element.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
  }, [rect.x, rect.y, rect.width, rect.height]);

  useEffect(() => () => animation.current?.cancel(), []);

  const dismiss = (type: 'close' | 'minimize') => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type, id: item.id });
      return;
    }
    animation.current?.cancel();
    const effect = ref.current.animate(
      [
        { opacity: 1, scale: '1' },
        { opacity: 0, scale: type === 'minimize' ? '0.9' : '0.97' },
      ],
      { duration: 140, easing: 'ease-in' }
    );
    animation.current = effect;
    effect.onfinish = () => dispatch({ type, id: item.id });
  };
  const maximize = () => {
    if (mobile) return;
    const before = {
      transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
    dispatch({ type: 'maximize', id: item.id });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => {
      const element = ref.current;
      if (!element) return;
      animation.current?.cancel();
      animation.current = element.animate(
        [
          before,
          {
            transform: element.style.transform,
            width: element.style.width,
            height: element.style.height,
          },
        ],
        { duration: 190, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
    });
  };

  const start = (event: PointerEvent<HTMLElement>, resize: boolean) => {
    if (
      mobile ||
      item.maximized ||
      event.button !== 0 ||
      (!resize && (event.target as HTMLElement).closest('button,a,input'))
    )
      return;
    event.preventDefault();
    dispatch({ type: 'focus', id: item.id });
    gesture.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rect: item.rect,
      resize,
    };
    pending.current = item.rect;
    event.currentTarget.setPointerCapture(event.pointerId);
    ref.current?.setAttribute('data-gesture', 'true');
  };
  const move = (event: PointerEvent<HTMLElement>) => {
    const start = gesture.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const next = clampRect(
      start.resize
        ? { ...start.rect, width: start.rect.width + dx, height: start.rect.height + dy }
        : { ...start.rect, x: start.rect.x + dx, y: start.rect.y + dy },
      viewport
    );
    pending.current = next;
    if (ref.current) {
      ref.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      ref.current.style.width = `${next.width}px`;
      ref.current.style.height = `${next.height}px`;
    }
  };
  const finish = () => {
    const start = gesture.current;
    const next = pending.current;
    gesture.current = null;
    pending.current = null;
    ref.current?.removeAttribute('data-gesture');
    if (!start || !next) return;
    dispatch(
      start.resize
        ? { type: 'resize', id: item.id, width: next.width, height: next.height }
        : { type: 'move', id: item.id, x: next.x, y: next.y }
    );
  };
  const keyboardGeometry = (event: KeyboardEvent<HTMLElement>, resize: boolean) => {
    if (
      mobile ||
      item.maximized ||
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    event.preventDefault();
    const amount = event.shiftKey ? 30 : 10;
    const x = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
    const y = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
    dispatch(
      resize
        ? { type: 'resize', id: item.id, width: item.rect.width + x, height: item.rect.height + y }
        : { type: 'move', id: item.id, x: item.rect.x + x, y: item.rect.y + y }
    );
  };

  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={item.title}
      tabIndex={-1}
      hidden={item.minimized || (mobile && !active)}
      data-window-id={item.id}
      data-active={active}
      data-maximized={item.maximized || mobile}
      className={styles.window}
      style={style}
      onPointerDownCapture={() => dispatch({ type: 'focus', id: item.id })}
      onFocusCapture={() => dispatch({ type: 'focus', id: item.id })}
    >
      <header
        className={styles.titlebar}
        onPointerDown={event => start(event, false)}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      >
        <div className={styles.windowControls}>
          <button
            aria-label={`Close ${item.title}`}
            title="Close"
            className={styles.closeControl}
            onClick={() => dismiss('close')}
          >
            <OSIcon name="close" size={11} />
          </button>
          <button
            aria-label={`Minimize ${item.title}`}
            title="Minimize"
            className={styles.minimizeControl}
            onClick={() => dismiss('minimize')}
          >
            <OSIcon name="minus" size={11} />
          </button>
          <button
            aria-label={`${item.maximized ? 'Restore' : 'Maximize'} ${item.title}`}
            title={item.maximized ? 'Restore' : 'Maximize'}
            disabled={mobile}
            className={styles.maximizeControl}
            onClick={maximize}
          >
            <OSIcon name={item.maximized ? 'restore' : 'maximize'} size={10} />
          </button>
        </div>
        <div
          role="button"
          tabIndex={mobile ? -1 : 0}
          aria-label={`Move ${item.title} window`}
          className={styles.windowTitle}
          onKeyDown={event => keyboardGeometry(event, false)}
          onDoubleClick={maximize}
        >
          <span style={{ color: app.color }}>
            <OSIcon name={app.icon} size={14} />
          </span>
          {item.title}
        </div>
        <span className={styles.windowScope} aria-hidden="true" />
      </header>
      <div className={styles.windowBody} data-window-body>
        {children}
      </div>
      {!mobile && !item.maximized && (
        <button
          className={styles.resizeHandle}
          aria-label={`Resize ${item.title}`}
          title="Drag to resize, or use arrow keys"
          onPointerDown={event => start(event, true)}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
          onKeyDown={event => keyboardGeometry(event, true)}
        />
      )}
    </section>
  );
}
