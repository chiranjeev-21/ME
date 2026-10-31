import type { SVGProps } from 'react';

type IconName =
  | 'arrow-up-right'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'copy'
  | 'check'
  | 'plus'
  | 'close'
  | 'sound'
  | 'mute'
  | 'arrow-up'
  | 'minus'
  | 'play'
  | 'stop'
  | 'record'
  | 'loop'
  | 'download';

const PATHS: Record<IconName, string> = {
  'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  'arrow-down': 'M12 4v16m-6-6 6 6 6-6',
  'arrow-left': 'M20 12H4m6-6-6 6 6 6',
  'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  sound: 'M4 10v4h4l5 4V6L8 10H4zm12-1.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12',
  mute: 'M4 10v4h4l5 4V6L8 10H4zm12.5 0 4 4m0-4-4 4',
  'arrow-up': 'M12 20V4m-6 6 6-6 6 6',
  minus: 'M5 12h14',
  play: 'M8 5.5v13L18.5 12z',
  stop: 'M7 7h10v10H7z',
  record: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
  loop: 'M17 3l3 3-3 3M4 12v-1a5 5 0 0 1 5-5h11M7 21l-3-3 3-3M20 12v1a5 5 0 0 1-5 5H4',
  download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
};

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
