import type { OSIconName } from './types';

const paths: Record<OSIconName, string> = {
  terminal: 'm4 6 6 6-6 6m9 0h7',
  folder: 'M3 6h7l2 3h9v11H3V6Zm0 0V4h7l2 2',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  activity: 'M2 12h5l3-8 4 16 3-8h5',
  file: 'M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8m-8 4h6',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-1-6h2l1 3 3 1 3-1 1 2-2 2v4l2 2-1 2-3-1-3 1-1 3h-2l-1-3-3-1-3 1-1-2 2-2V9L3 7l1-2 3 1 3-1 1-3Z',
  vault: 'M4 8h16v13H4V8Zm1 0V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M4 13h16m-9-2h2v5h-2z',
  image: 'M3 3h18v18H3zM3 17l5-6 4 4 3-3 6 5M15 7h.01',
  close: 'm6 6 12 12M6 18 18 6',
  minus: 'M5 12h14',
  maximize: 'M4 4h16v16H4z',
  restore: 'M4 8h12v12H4zM8 8V4h12v12h-4',
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6',
  arrow: 'M7 17 17 7M7 7h10v10',
  chevron: 'm9 5 7 7-7 7',
  home: 'm3 10 9-7 9 7v11H3V10Zm6 11v-7h6v7',
  check: 'm4 12 5 5L20 6',
};

export function OSIcon({ name, size = 20 }: { name: OSIconName; size?: number }) {
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
