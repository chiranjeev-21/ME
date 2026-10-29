export type ConceptId = 'os' | 'universe' | 'command';

export const ACTIVE_CONCEPT: ConceptId = 'universe';

export const CONCEPTS = {
  os: {
    name: 'CJ OS',
    version: 'personal operating system / 2026',
    eyebrow: 'ENGINEER BY TRADE. CURIOUS BY DEFAULT.',
    headline: 'Human curiosity.',
    accent: 'Engineered impact.',
    note: 'A small interface to a much bigger world.',
    projectTitle: 'Serious work. Side-quest energy.',
  },
  universe: {
    name: 'CJ Universe',
    version: 'a personal universe / 2026',
    eyebrow: 'A PERSONAL UNIVERSE / BY CHIRANJEEV SINGH',
    headline: 'Chiranjeev',
    accent: 'Singh.',
    note: 'From orbit to the details. One scroll at a time.',
    projectTitle: 'A little beyond the main orbit.',
  },
  command: {
    name: 'CJ / Control',
    version: 'engineering command center / 2026',
    eyebrow: 'DISTRIBUTED SYSTEMS. CONNECTED THINKING.',
    headline: 'Built for complexity.',
    accent: 'Designed for impact.',
    note: 'The human behind the systems.',
    projectTitle: 'Experiments beyond production.',
  },
} as const;
