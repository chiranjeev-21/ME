import type { CSSProperties } from 'react';

const paths = {
  arrow: 'M7 17 17 7M7 7h10v10',
  down: 'M12 4v16m-6-6 6 6 6-6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
  terminal: 'm4 6 6 6-6 6m9 0h7',
  mail: 'M3 5h18v14H3zM3 5l9 8 9-8',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
  check: 'm4 12 5 5L20 6',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
} as const;

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
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
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
