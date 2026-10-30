import { useEffect, useRef, useState } from 'react';
import type { WorldViewProps } from '../types';
import { Eyebrow } from './shared';

export function HushWorld({
  onWorldInteraction,
  active = true,
}: Pick<WorldViewProps, 'onWorldInteraction' | 'active'>) {
  const [lantern, setLantern] = useState(false);
  const lastSelection = useRef<boolean | null>(null);
  useEffect(() => {
    if (!active || lastSelection.current === null) return;
    onWorldInteraction?.({
      world: 'hush',
      kind: 'hush',
      value: lastSelection.current ? 'light-on' : 'light-off',
    });
  }, [active, onWorldInteraction]);
  const toggleLantern = () => {
    const next = !lantern;
    setLantern(next);
    lastSelection.current = next;
    onWorldInteraction?.({
      world: 'hush',
      kind: 'hush',
      value: next ? 'light-on' : 'light-off',
    });
  };
  return (
    <section
      className="uw-world uw-haunted"
      aria-labelledby="uw-hush-title"
      data-hush-active="true"
      data-lantern={lantern}
    >
      <header className="uw-hush-header">
        <Eyebrow>06 / After hours · Game development</Eyebrow>
        <h1 id="uw-hush-title">Hush.</h1>
        <p className="uw-lead">
          A little curiosity.
          <br />
          <em>A little unease.</em>
        </p>
        <p>
          Hush is my horror-game project. This ghost-lit detour is an atmosphere study: an empty
          arcade, something between the trees, and one light you control.
        </p>
      </header>
      <figure className="uw-hush uw-hush-stage" data-reveal="section">
        <div className="uw-hush-scenery" id="uw-hush-set">
          <svg
            viewBox="0 0 720 380"
            fill="none"
            role="img"
            aria-labelledby="uw-hush-art-title"
            aria-describedby="uw-hush-art-description"
          >
            <title id="uw-hush-art-title">The moonlit arcade</title>
            <desc id="uw-hush-art-description">
              An original haunted illustration: two ghosts among bare trees, a crescent-lit arcade,
              and three abandoned cabinets.{' '}
              {lantern
                ? 'An amber lantern illuminates the doorway and windows.'
                : 'The lantern is dark; pale moonlight catches the ghosts.'}
            </desc>
            <defs>
              <radialGradient id="uw-hush-glow">
                <stop stopColor="#f4cc83" stopOpacity=".65" />
                <stop offset="1" stopColor="#f4cc83" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="uw-hush-night" x2="0" y2="1">
                <stop stopColor="#101c29" />
                <stop offset="1" stopColor="#18292c" />
              </linearGradient>
            </defs>
            <path fill="url(#uw-hush-night)" d="M0 0h720v380H0z" />
            <circle cx="550" cy="76" r="44" fill="#c2d3b9" opacity=".8" />
            <circle cx="568" cy="64" r="39" fill="#101c29" />
            {[30, 95, 162, 570, 645, 700].map((x, index) => (
              <path
                key={x}
                d={`M${x} 350V${60 + (index % 3) * 35}m0 65l-24-30m24 65l30-45`}
                stroke="#0c171f"
                strokeWidth="13"
              />
            ))}
            <path d="M0 350q180-55 360-10t360-8v48H0z" fill="#0b151d" />
            <path
              d="M225 330V145L360 80l135 65v185"
              fill="#16292c"
              stroke="#688077"
              strokeWidth="2"
            />
            <path d="M211 149l149-74 149 74" stroke="#8e9e87" strokeWidth="3" />
            <text
              x="360"
              y="145"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="13"
              letterSpacing="5"
              fill="#9eb4aa"
            >
              AFTER HOURS
            </text>
            {[253, 426].map(x => (
              <g key={x}>
                <path
                  d={`M${x} 169h41v60h-41z`}
                  fill={lantern ? '#d9ac68' : '#71958a'}
                  opacity={lantern ? 0.8 : 0.18}
                />
                <path d={`M${x + 20} 169v60m-20-30h41`} stroke="#142326" strokeWidth="4" />
              </g>
            ))}
            <path
              d="M316 330V216a44 44 0 0188 0v114"
              fill="#080f17"
              stroke="#8f9c82"
              strokeWidth="2"
            />
            {[330, 353, 376].map((x, index) => (
              <g key={x}>
                <path d={`M${x} 308v-43l3-10h15l3 10v43z`} fill="#263e3f" stroke="#63847d" />
                <path
                  d={`M${x + 5} 260h11v18h-11z`}
                  fill={['#9bc7b9', '#b6acc9', '#d2b58a'][index]}
                  opacity={lantern ? 0.75 : 0.22}
                />
                <path d={`M${x + 3} 286h15`} stroke="#8fa69e" />
              </g>
            ))}
            <ellipse
              className="uw-lantern-glow"
              cx="360"
              cy="276"
              rx="205"
              ry="150"
              fill="url(#uw-hush-glow)"
              opacity={lantern ? 1 : 0}
            />
            {[190, 525].map((x, index) => (
              <g key={x} transform={`translate(${x} ${150 + index * 55})`}>
                <g className="uw-hush-spirit">
                  <path
                    d="M-25 50V0a25 25 0 0150 0v50L13 42 0 53-13 42z"
                    fill="#bedbd0"
                    opacity={lantern ? 0.95 : 0.65}
                  />
                  <ellipse cx="-9" cy="5" rx="4" ry="7" fill="#15222d" />
                  <ellipse cx="9" cy="5" rx="4" ry="7" fill="#15222d" />
                </g>
              </g>
            ))}
            <path d="M0 337q180-25 360 6t360-8" stroke="#8fa9a0" opacity=".2" strokeWidth="18" />
            <path d="M350 335v-25a10 10 0 0120 0v25" stroke="#a8b9ac" strokeWidth="2" />
            <path
              d="M349 320h22v26h-22z"
              fill={lantern ? '#f4cc83' : '#31463f'}
              stroke="#b6bf9e"
              strokeWidth="2"
            />
            <path d="M345 347h30m-27-29h24" stroke="#b6bf9e" strokeWidth="3" />
          </svg>
        </div>
        <figcaption className="uw-hush-copy">
          <h2>A light in the wrong window.</h2>
          <div className="uw-hush-controls">
            <button
              type="button"
              className="uw-button"
              aria-pressed={lantern}
              aria-controls="uw-hush-set"
              onClick={toggleLantern}
            >
              {lantern ? 'Lower the lantern' : 'Raise the lantern'}
              <span aria-hidden="true">{lantern ? '↓' : '↑'}</span>
            </button>
            <p className="uw-hush-status" role="status">
              {lantern
                ? 'Lantern raised. The doorway glows; the ghosts remain.'
                : 'Moonlight only. Something is still watching.'}
            </p>
          </div>
          <p className="uw-hush-disclaimer">
            Original portfolio set, not actual Hush gameplay or a playable build; game media is not
            included here.
          </p>
        </figcaption>
      </figure>
    </section>
  );
}
