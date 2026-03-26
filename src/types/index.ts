// ─── Experience ────────────────────────────────────────────────────────────────

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  logoInitial: string;
  logoVariant: 'amazon' | 'oyo' | 'samsung';
  highlights: string[];
  tags: string[];
}

// ─── Projects ──────────────────────────────────────────────────────────────────

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  gradientVariant: 'violet' | 'indigo' | 'crimson';
  href?: string;
  featured?: boolean;
}

export type HiddenQuestSource = 'github' | 'fallback';

export interface HiddenQuestLanguage {
  name: string;
  color?: string | null;
}

export interface HiddenQuestProject {
  id: string;
  name: string;
  description: string;
  url: string;
  homepageUrl?: string | null;
  primaryLanguage?: HiddenQuestLanguage | null;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
  topics: string[];
}

export interface HiddenQuestProfile {
  login: string;
  name?: string | null;
  url: string;
}

export interface HiddenQuestResponse {
  source: HiddenQuestSource;
  profile: HiddenQuestProfile;
  items: HiddenQuestProject[];
  message?: string;
}

// ─── Skills ────────────────────────────────────────────────────────────────────

export interface SkillItem {
  label: string;
  hot?: boolean;
}

// ─── Education / Certifications ────────────────────────────────────────────────

export interface EducationItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export interface StatItem {
  value: string;
  suffix?: string;
  label: string;
}

// ─── Navigation ────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  cta?: boolean;
}

// ─── Hero Badges ───────────────────────────────────────────────────────────────

export interface HeroBadge {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  iconVariant: 'gold' | 'purple' | 'pink';
  position: 'topLeft' | 'right' | 'bottomLeft';
}

// ─── Contact ───────────────────────────────────────────────────────────────────

export interface SocialLink {
  label: string;
  href: string;
}
