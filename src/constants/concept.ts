export type ConceptId = 'os' | 'universe' | 'command';

export const ACTIVE_CONCEPT: ConceptId = 'command';

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
    eyebrow: 'A FEW IDEAS. INFINITE POSSIBILITIES.',
    headline: 'Follow the curiosity.',
    accent: 'Find a new orbit.',
    note: 'Every good system starts with a little exploration.',
    projectTitle: 'Dispatches from other orbits.',
  },
  command: {
    name: 'CJ / Workbench',
    version: 'a personal engineering workbench / 2026',
    eyebrow: 'CHIRANJEEV SINGH / A PERSONAL WORKBENCH',
    headline: 'Chiranjeev',
    accent: 'Singh.',
    note: 'Serious about the work. Curious about everything else.',
    projectTitle: 'Experiments beyond production.',
  },
} as const;
