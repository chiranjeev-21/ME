import { getApp } from './registry.ts';
import type { AppId, AppPayload, DesktopSettings, OSWindow, Rect, Viewport } from './types';

export interface DesktopState {
  windows: OSWindow[];
  activeId: string | null;
  viewport: Viewport;
}

export type DesktopAction =
  | { type: 'open'; appId: AppId; payload?: AppPayload; title?: string }
  | { type: 'focus' | 'minimize' | 'maximize' | 'close'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'resize'; id: string; width: number; height: number }
  | { type: 'viewport'; viewport: Viewport };

export const DEFAULT_SETTINGS: DesktopSettings = {
  wallpaper: 'aurora',
  accent: 'green',
  fontSize: 'normal',
};

export function normalizeSettings(value: unknown): DesktopSettings {
  const candidate = value && typeof value === 'object' ? (value as Partial<DesktopSettings>) : {};
  return {
    wallpaper: ['aurora', 'midnight', 'blueprint'].includes(candidate.wallpaper ?? '')
      ? candidate.wallpaper!
      : 'aurora',
    accent: ['green', 'amber', 'violet', 'cyan'].includes(candidate.accent ?? '')
      ? candidate.accent!
      : 'green',
    fontSize: ['small', 'normal', 'large'].includes(candidate.fontSize ?? '')
      ? candidate.fontSize!
      : 'normal',
  };
}

export function windowId(appId: AppId, payload: AppPayload = {}): string {
  if (appId === 'project') return `project:${payload.projectId || 'cj-os'}`;
  if (appId === 'reader') return `reader:${payload.path || '/home/cj/about.md'}`;
  return appId;
}

export function clampRect(rect: Rect, viewport: Viewport): Rect {
  const maxWidth = Math.max(1, viewport.width);
  const maxHeight = Math.max(1, viewport.height);
  const width = Math.min(maxWidth, Math.max(Math.min(360, maxWidth), rect.width));
  const height = Math.min(maxHeight, Math.max(Math.min(240, maxHeight), rect.height));
  return {
    width,
    height,
    x: Math.max(0, Math.min(Number.isFinite(rect.x) ? rect.x : 0, maxWidth - width)),
    y: Math.max(0, Math.min(Number.isFinite(rect.y) ? rect.y : 0, maxHeight - height)),
  };
}

function lastVisible(windows: OSWindow[]): string | null {
  return [...windows].reverse().find(item => !item.minimized)?.id ?? null;
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  if (action.type === 'viewport') {
    return {
      ...state,
      viewport: action.viewport,
      windows: state.windows.map(item => ({
        ...item,
        rect: clampRect(item.rect, action.viewport),
      })),
    };
  }
  if (action.type === 'open') {
    const id = windowId(action.appId, action.payload);
    const previous = state.windows.find(item => item.id === id);
    const rememberedPayload: AppPayload = previous
      ? { path: previous.payload.path, projectId: previous.payload.projectId }
      : {};
    const app = getApp(action.appId);
    const offset = (state.windows.length % 5) * 30;
    const item: OSWindow = previous
      ? {
          ...previous,
          payload: action.payload ?? rememberedPayload,
          title: action.title ?? previous.title,
          minimized: false,
          launchCount: previous.launchCount + 1,
        }
      : {
          id,
          appId: action.appId,
          title: action.title ?? app.title,
          payload: action.payload ?? {},
          rect: clampRect(
            { x: 90 + offset, y: 58 + offset, width: app.width, height: app.height },
            state.viewport
          ),
          minimized: false,
          maximized: false,
          launchCount: 1,
        };
    return {
      ...state,
      windows: [...state.windows.filter(item => item.id !== id), item],
      activeId: id,
    };
  }
  const current = state.windows.find(item => item.id === action.id);
  if (!current) return state;
  if (action.type === 'focus') {
    if (current.minimized || state.activeId === current.id) return state;
    return {
      ...state,
      windows: [...state.windows.filter(item => item.id !== current.id), current],
      activeId: current.id,
    };
  }
  if (action.type === 'close') {
    const windows = state.windows.filter(item => item.id !== current.id);
    return {
      ...state,
      windows,
      activeId: state.activeId === current.id ? lastVisible(windows) : state.activeId,
    };
  }
  const windows = state.windows.map(item => {
    if (item.id !== current.id) return item;
    if (action.type === 'minimize') return { ...item, minimized: true };
    if (action.type === 'maximize') return { ...item, maximized: !item.maximized };
    if (item.maximized) return item;
    if (action.type === 'move')
      return {
        ...item,
        rect: clampRect({ ...item.rect, x: action.x, y: action.y }, state.viewport),
      };
    if (action.type === 'resize')
      return {
        ...item,
        rect: clampRect(
          { ...item.rect, width: action.width, height: action.height },
          state.viewport
        ),
      };
    return item;
  });
  return {
    ...state,
    windows,
    activeId:
      action.type === 'minimize' && state.activeId === current.id
        ? lastVisible(windows)
        : state.activeId,
  };
}

export function initialDesktop(viewport: Viewport): DesktopState {
  return { windows: [], activeId: null, viewport };
}
