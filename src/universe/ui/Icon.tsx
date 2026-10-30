const paths = {
  arrow: 'M7 17 17 7M7 7h10v10',
  back: 'M20 12H4m6-6-6 6 6 6',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  terminal: 'm4 6 6 6-6 6m9 0h7',
  orbit: 'M17 7c5-1 8 0 5 5s-9 10-15 10-7-4-3-9S14 5 17 7ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  file: 'M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8m-8 4h6',
} as const;
export function UniverseIcon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

const worldPaths: Record<WorldId, string> = {
  about: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z',
  engineering: 'M5 8h14v11H5V8Zm3 0V4h8v4M9 12h6v4H9v-4ZM2 11h3m-3 5h3m14-5h3m-3 5h3M8 19v3m8-3v3',
  'ai-lab':
    'm6 6 6 6 6-7m-6 7 6 6m-6-6-7 6M8 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6-8a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm1 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  projects:
    'M2 21h20M4 21V10h5v11m6 0V7h5v14M6 13h1m-1 4h1m10-6h1m-1 4h1M11 17V7l2-4 2 4v10m-4 0h4',
  creative: 'M7 21c-6-7 0-11 5-9s11-4 5-8C9-2 2 7 8 11s15 3 10 10M5 21h15',
  hush: 'M5 20V10a7 7 0 0 1 14 0v10l-3-2-4 3-4-3-3 2ZM9 10v2m6-2v2',
  writing:
    'M12 6C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15M5 8l4 1m-4 3 4 1m6-4 4-1m-4 5 4-1',
  contact: 'M12 11v10m-4 0h8M9 7a3 3 0 0 1 6 0m-9 3a7 7 0 0 1 0-8m12 0a7 7 0 0 1 0 8M12 7h.01',
};

export function WorldSymbol({ world }: { world: WorldId }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-world-symbol={world}
    >
      <path d={worldPaths[world]} />
    </svg>
  );
}
import type { WorldId } from '../types';
