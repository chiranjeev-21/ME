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
