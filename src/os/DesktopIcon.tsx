import { useId } from 'react';
import type { AppId } from './types';

export function DesktopIcon({ appId, size = 56 }: { appId: AppId; size?: number }) {
  const id = useId().replace(/:/g, '');
  const folder = appId === 'explorer' || appId === 'project';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`${id}-blue`}
          x1="30"
          y1="13"
          x2="30"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#83D3FF" />
          <stop offset="1" stopColor="#2288DD" />
        </linearGradient>
        <linearGradient
          id={`${id}-dark`}
          x1="32"
          y1="3"
          x2="32"
          y2="61"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#50545C" />
          <stop offset="1" stopColor="#202329" />
        </linearGradient>
        <linearGradient
          id={`${id}-violet`}
          x1="8"
          y1="5"
          x2="56"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#BEA7FF" />
          <stop offset=".45" stopColor="#8054E5" />
          <stop offset="1" stopColor="#4A2DA0" />
        </linearGradient>
        <linearGradient
          id={`${id}-silver`}
          x1="12"
          y1="4"
          x2="51"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E4E7ED" />
          <stop offset="1" stopColor="#868E9D" />
        </linearGradient>
        <linearGradient
          id={`${id}-gold`}
          x1="31"
          y1="15"
          x2="34"
          y2="57"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFCF6B" />
          <stop offset="1" stopColor="#9F5F20" />
        </linearGradient>
      </defs>
      {folder ? (
        <>
          <path d="M5 18a5 5 0 0 1 5-5h15l6 7h23a5 5 0 0 1 5 5v27H5V18Z" fill="#4B9DDF" />
          <path d="M5 23h54v29a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V23Z" fill={`url(#${id}-blue)`} />
          <path d="M7 25h50" stroke="#C1E8FF" strokeOpacity=".7" strokeWidth="1.5" />
          <path d="M6 49h52" stroke="#1270BD" strokeOpacity=".18" />
        </>
      ) : appId === 'resume' || appId === 'reader' ? (
        <>
          <path
            d="M15 5h25l11 12v40a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"
            fill="#F8F9FC"
          />
          <path d="M40 5v10a3 3 0 0 0 3 3h8" fill="#CED5E0" />
          <path
            d="M20 24h23M20 30h19M20 36h23M20 42h15"
            stroke="#AEB7C5"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="7"
            y="46"
            width="31"
            height="13"
            rx="3"
            fill={appId === 'resume' ? '#D75857' : '#7188AD'}
          />
          <text
            x="22.5"
            y="55"
            fill="white"
            textAnchor="middle"
            fontFamily="system-ui,sans-serif"
            fontWeight="700"
            fontSize="8"
          >
            {appId === 'resume' ? 'PDF' : 'TXT'}
          </text>
        </>
      ) : appId === 'lab' ? (
        <>
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="14"
            fill={`url(#${id}-violet)`}
            stroke="#D7C8FF"
            strokeOpacity=".4"
          />
          <path
            d="M26 16h12m-9 0v15L19 46a4 4 0 0 0 3 6h21a4 4 0 0 0 3-6L35 31V16"
            stroke="#F3EDFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 39h17l5 8a3 3 0 0 1-3 4H22a3 3 0 0 1-3-4l5-8Z"
            fill="#C5E6FF"
            fillOpacity=".65"
          />
          <circle cx="30" cy="43" r="2" fill="#FFF" />
          <circle cx="36" cy="47" r="1.5" fill="#FFF" />
        </>
      ) : appId === 'monitor' ? (
        <>
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="14"
            fill={`url(#${id}-silver)`}
            stroke="#F3F4F7"
            strokeOpacity=".5"
          />
          <rect x="9" y="11" width="46" height="40" rx="6" fill="#203237" />
          <path
            d="M10 22h44M10 32h44M10 42h44M21 12v38m11-38v38m11-38v38"
            stroke="#8CB4AF"
            strokeOpacity=".16"
          />
          <path
            d="M12 35h9l5-13 7 22 6-14h13"
            stroke="#8CEDC1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : appId === 'settings' ? (
        <>
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="14"
            fill={`url(#${id}-silver)`}
            stroke="#F2F4F8"
            strokeOpacity=".5"
          />
          <path
            d="m27 13 10 0 2 6 6 3 6-1 5 9-5 5-1 6 3 5-7 7-6-3-6 1-5 5-9-5 1-6-3-6-6-2V27l6-2 3-6-1-6 9-5 3 5Z"
            transform="translate(0 3) scale(.9)"
            fill="#5C6572"
            stroke="#E4E7ED"
            strokeWidth="1.5"
          />
          <circle cx="32" cy="32" r="12" fill="#AEB8C6" stroke="#E8ECF3" strokeWidth="2" />
          <circle cx="32" cy="32" r="7" fill="#505B6B" stroke="#7C899A" strokeWidth="2" />
        </>
      ) : appId === 'vault' ? (
        <>
          <ellipse cx="32" cy="56" rx="24" ry="4" fill="#02040A" fillOpacity=".25" />
          <path
            d="M8 31a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v21a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V31Z"
            fill={`url(#${id}-gold)`}
            stroke="#AC6B24"
          />
          <path d="M9 34h46" stroke="#7C481D" strokeWidth="3" />
          <path d="M20 17v39m24-39v39" stroke="#FFE09C" strokeWidth="5" />
          <rect x="27" y="31" width="10" height="14" rx="3" fill="#FFE6AB" stroke="#A06B2A" />
          <circle cx="32" cy="36" r="2" fill="#845320" />
          <path d="M32 37v3" stroke="#845320" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="14"
            fill={`url(#${id}-dark)`}
            stroke="#ADB3BE"
            strokeOpacity=".5"
          />
          <rect
            x="9"
            y="14"
            width="46"
            height="38"
            rx="5"
            fill="#11151B"
            stroke="#858C98"
            strokeOpacity=".4"
          />
          <path
            d="m17 24 9 8-9 8m16 0h12"
            stroke="#F0F3F7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
