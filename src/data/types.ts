// ─── Profile & career ──────────────────────────────────────────────────────────

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  /** Résumé bullets. `<strong>` marks emphasis; no other markup is permitted. */
  highlights: string[];
  tags: string[];
}

export interface SkillItem {
  label: string;
  hot?: boolean;
}

export interface EducationItem {
  id: string;
  title: string;
  subtitle: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

// ─── Public GitHub feed (served by /api/github-pinned) ─────────────────────────

export type GitHubFeedSource = 'github' | 'fallback';

export interface GitHubLanguage {
  name: string;
  color?: string | null;
}

export interface GitHubRepository {
  id: string;
  name: string;
  description: string;
  url: string;
  homepageUrl?: string | null;
  primaryLanguage?: GitHubLanguage | null;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
  topics: string[];
}

export interface GitHubFeed {
  source: GitHubFeedSource;
  selection?: 'pinned' | 'recent';
  profile: { login: string; name?: string | null; url: string };
  items: GitHubRepository[];
  message?: string;
}

// ─── Work & notes ──────────────────────────────────────────────────────────────

export type ProjectCategory = 'AI/ML' | 'Web' | 'Systems' | 'Games' | 'Experiments';

/** How a featured project is staged in the Work chapter. */
export type ProjectTreatment = 'monitor' | 'surveillance';

/** How a side quest is staged: its live site, a real source excerpt, or its name alone. */
export type QuestTreatment = 'site' | 'source' | 'swarm' | 'type';

export interface ProjectImage {
  /** Large source, used for full-bleed expansion. */
  src: string;
  /** Smaller source for narrow viewports. */
  srcSmall: string;
  width: number;
  height: number;
  alt: string;
}

export interface Project {
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
  image?: ProjectImage;
  treatment?: ProjectTreatment;
  provenance: string;
  source: 'curated' | 'github' | 'fallback';
}

export interface NoteSection {
  heading: string;
  paragraphs: string[];
  code?: string;
}

export interface Note {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  kind: 'Studio note';
  context: string;
  sections: NoteSection[];
}

export interface PortfolioContent {
  projects: Project[];
  notes: Note[];
}
