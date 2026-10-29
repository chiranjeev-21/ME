import type { UsePinnedQuestsState } from '../hooks/usePinnedQuests';
import type { HiddenQuestResponse } from '../types';

export type AppId =
  | 'terminal'
  | 'explorer'
  | 'lab'
  | 'monitor'
  | 'resume'
  | 'project'
  | 'reader'
  | 'vault'
  | 'settings';
export type OSIconName =
  | 'terminal'
  | 'folder'
  | 'spark'
  | 'activity'
  | 'file'
  | 'settings'
  | 'vault'
  | 'image'
  | 'close'
  | 'minus'
  | 'maximize'
  | 'restore'
  | 'search'
  | 'arrow'
  | 'chevron'
  | 'home'
  | 'check';
export interface AppPayload {
  path?: string;
  projectId?: string;
  command?: string;
}
export interface AppDefinition {
  id: AppId;
  title: string;
  description: string;
  icon: OSIconName;
  color: string;
  launcher: boolean;
  width: number;
  height: number;
}
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Viewport {
  width: number;
  height: number;
}
export interface OSWindow {
  id: string;
  appId: AppId;
  title: string;
  payload: AppPayload;
  rect: Rect;
  minimized: boolean;
  maximized: boolean;
  launchCount: number;
}
export interface VfsEntry {
  path: string;
  name: string;
  kind: 'directory' | 'file';
  description?: string;
  content?: string;
  mime?: string;
  assetUrl?: string;
  appId?: AppId;
  projectId?: string;
  hidden?: boolean;
}
export interface ProjectCaseStudy {
  id: string;
  slug: string;
  title: string;
  summary: string;
  problem: string;
  approach: string[];
  architecture: string[];
  stack: string[];
  outcomes: string[];
  limitations?: string[];
  repoUrl?: string;
  demoUrl?: string;
  source: 'local' | 'github';
}
export interface DesktopSettings {
  wallpaper: 'aurora' | 'midnight' | 'blueprint';
  accent: 'green' | 'amber' | 'violet' | 'cyan';
  fontSize: 'small' | 'normal' | 'large';
}
export interface LabRun {
  id: string;
  query: string;
  at: number;
  durationMs: number;
  documents: number;
  topScore: number;
  matched: number;
}
export interface DesktopAppProps {
  window: OSWindow;
  files: readonly VfsEntry[];
  projects: readonly ProjectCaseStudy[];
  apps: readonly AppDefinition[];
  feed: UsePinnedQuestsState;
  visible: boolean;
  openApp: (id: AppId, payload?: AppPayload) => void;
  openPath: (path: string) => void;
  closeWindow: () => void;
  notify: (message: string) => void;
  recordLabRun: (run: LabRun) => void;
  labRuns: readonly LabRun[];
  system: {
    windows: number;
    minimized: number;
    startedAt: number;
    version: string;
    hostname: string;
    viewport: Viewport;
  };
  settings: DesktopSettings;
  setSettings: (settings: Partial<DesktopSettings>) => void;
}
export type PortfolioFeed = HiddenQuestResponse;
