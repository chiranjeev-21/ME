import type { MutableRefObject, ReactNode } from 'react';
import type { UsePinnedQuestsState } from '../hooks/usePinnedQuests';
import type { HiddenQuestResponse } from '../types';

export type WorldId =
  | 'about'
  | 'engineering'
  | 'ai-lab'
  | 'projects'
  | 'creative'
  | 'writing'
  | 'contact';
export type UniverseMode = 'explore' | 'browse';
export interface UniverseNavigation {
  world: WorldId | null;
  projectSlug: string | null;
  articleSlug: string | null;
  mode: UniverseMode;
  vault: boolean;
}
export interface WorldDefinition {
  id: WorldId;
  name: string;
  number: string;
  subtitle: string;
  description: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitalSpeed: number;
  phase: number;
  inclination: number;
  kind: 'ocean' | 'industrial' | 'research' | 'terracotta' | 'garden' | 'archive' | 'beacon';
}
export type ProjectCategory = 'AI/ML' | 'Web' | 'Systems' | 'Games' | 'Experiments';
export interface UniverseProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categories: ProjectCategory[];
  problem: string;
  constraints: string[];
  architecture: string[];
  decisions: string[];
  tradeoffs: string[];
  technologies: string[];
  outcomes: string[];
  sourceUrl?: string;
  demoUrl?: string;
  image?: string;
  imageAlt?: string;
  provenance: string;
  source: 'curated' | 'github' | 'fallback';
}
export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  code?: string;
}
export interface UniverseArticle {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  kind: 'Studio note';
  sections: ArticleSection[];
}
export interface UniverseContent {
  projects: UniverseProject[];
  articles: UniverseArticle[];
}
export interface WorldViewProps {
  navigation: UniverseNavigation;
  navigate: (patch: Partial<UniverseNavigation>) => void;
  content: UniverseContent;
  feed: UsePinnedQuestsState;
  lab: ReactNode;
  openTerminal: () => void;
  active?: boolean;
  onWorldInteraction?: (event: Omit<WorldInteraction, 'at'>) => void;
}
export interface ExpeditionFrame {
  world: WorldId | null;
  phase: 'orbit' | 'approach' | 'entry' | 'inside';
  approach: number;
  entry: number;
  readProgress: number;
  jumpRevision: number;
}
export interface WorldInteraction {
  world: WorldId;
  kind: 'research' | 'creative' | 'article' | 'project';
  value?: string | number;
  at: number;
}
export interface ExpeditionHandle {
  scrollToWorld: (world: WorldId, phase?: 'approach' | 'read', behavior?: ScrollBehavior) => void;
  scrollToOverview: (behavior?: ScrollBehavior) => void;
  focusWorld: (world: WorldId) => void;
}
export interface ExpeditionProps {
  navigation: UniverseNavigation;
  reducedMotion: boolean;
  frame: MutableRefObject<ExpeditionFrame>;
  onWorldChange: (world: WorldId | null) => void;
  onPhaseChange?: (phase: ExpeditionFrame['phase']) => void;
  intro: ReactNode;
  renderWorld: (world: WorldId) => ReactNode;
}
export interface UniverseSceneProps {
  selected: WorldId | null;
  entered?: boolean;
  quality: 'low' | 'high';
  reducedMotion: boolean;
  onSelect: (world: WorldId) => void;
  onReady: () => void;
  onError: (reason: string) => void;
  onCameraState: (phase: 'overview' | 'moving' | 'focused') => void;
  projectMarkers: readonly Pick<UniverseProject, 'slug' | 'title'>[];
  onProjectSelect: (slug: string) => void;
  journey?: MutableRefObject<ExpeditionFrame>;
  interaction?: MutableRefObject<WorldInteraction | null>;
}
export type ContentFeed = HiddenQuestResponse;
