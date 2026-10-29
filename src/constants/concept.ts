export type ConceptId = 'os' | 'universe' | 'command';

export const ACTIVE_CONCEPT: ConceptId = 'os';

export const CONCEPTS = {
  os: {
    name: 'CJ OS',
    version: 'personal operating system / 2026',
    eyebrow: "CHIRANJEEV'S CORNER OF THE INTERNET",
    headline: 'Chiranjeev',
    accent: 'Singh.',
    note: 'Good questions. Useful things. A little play.',
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
    name: 'CJ / Control',
    version: 'engineering command center / 2026',
    eyebrow: 'DISTRIBUTED SYSTEMS. CONNECTED THINKING.',
    headline: 'Built for complexity.',
    accent: 'Designed for impact.',
    note: 'The human behind the systems.',
    projectTitle: 'Experiments beyond production.',
  },
} as const;
