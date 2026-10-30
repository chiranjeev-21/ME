import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorldViewProps } from '../types';
import { Eyebrow } from './shared';

const PALETTES = [
  {
    name: 'Sage & parchment',
    paper: '#ececda',
    ink: '#33544b',
    secondary: '#a5b88c',
    sun: '#c88d68',
  },
  { name: 'Rose & clay', paper: '#f0dfd3', ink: '#824d50', secondary: '#bf8974', sun: '#cdad6b' },
  { name: 'Ink & tide', paper: '#dce7e4', ink: '#294c62', secondary: '#87b4b1', sun: '#b88b60' },
];

function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateGarden(seed: number, density: number) {
  const random = randomGenerator(seed);
  const phase = random() * Math.PI * 2;
  const hills = Array.from({ length: 4 }, () => ({
    x: random() * 800,
    y: 170 + random() * 300,
    radius: 75 + random() * 170,
    amplitude: 25 + random() * 55,
  }));
  const contours = Array.from({ length: density }, (_, row) => {
    const baseY = 90 + row * (480 / density);
    const points = Array.from({ length: 101 }, (_, column) => {
      const x = column * 8;
      const displacement = hills.reduce(
        (sum, hill) =>
          sum +
          hill.amplitude *
            Math.exp(-((x - hill.x) ** 2 + (baseY - hill.y) ** 2) / (2 * hill.radius ** 2)),
        0
      );
      return `${column ? 'L' : 'M'}${x.toFixed(1)},${(baseY - displacement + Math.sin(x / 110 + row / 7 + phase) * 12).toFixed(1)}`;
    });
    return points.join(' ');
  });
  const stems = Array.from({ length: 5 }, (_, index) => {
    const x = 170 + index * 110 + random() * 35;
    const y = 470 + random() * 55;
    const height = 100 + random() * 160;
    const bend = random() * 70 - 35;
    return {
      x,
      y,
      height,
      bend,
      leaves: Array.from({ length: 5 }, (_, leaf) => ({
        t: 0.22 + leaf * 0.14,
        size: 12 + random() * 18,
        side: leaf % 2 ? 1 : -1,
      })),
    };
  });
  return {
    contours,
    stems,
    sun: { x: 580 + random() * 85, y: 110 + random() * 70, r: 38 + random() * 20 },
  };
}

export function CreativeWorld({
  onWorldInteraction,
  active = true,
}: Pick<WorldViewProps, 'onWorldInteraction' | 'active'>) {
  const [seed, setSeed] = useState(2106);
  const [density, setDensity] = useState(42);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const committedDensity = useRef(density);
  const hush = useRef<HTMLElement>(null);
  const insideHush = useRef(false);
  const [haunting, setHaunting] = useState(false);
  const [lantern, setLantern] = useState(false);
  const changeEnvironment = useCallback(
    (next: boolean) => {
      if (insideHush.current === next) return;
      insideHush.current = next;
      setHaunting(next);
      onWorldInteraction?.({
        world: 'creative',
        kind: 'environment',
        value: next ? 'hush' : 'studio',
      });
    },
    [onWorldInteraction]
  );
  useEffect(() => {
    if (!active) {
      changeEnvironment(false);
      return;
    }
    if (!hush.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => changeEnvironment(entry.isIntersecting),
      {
        rootMargin: '-120px 0px -18% 0px',
        threshold: 0.12,
      }
    );
    observer.observe(hush.current);
    return () => observer.disconnect();
  }, [active, changeEnvironment]);
  const palette = PALETTES[paletteIndex];
  const garden = useMemo(() => generateGarden(seed, density), [seed, density]);
  const changeSeed = (next: number) => {
    if (next === seed) return;
    setSeed(next);
    setExportMessage('');
    onWorldInteraction?.({ world: 'creative', kind: 'creative', value: next });
  };
  // Range previews stay local; scene coupling happens once per committed adjustment.
  const commitDensity = () => {
    if (density === committedDensity.current) return;
    committedDensity.current = density;
    onWorldInteraction?.({
      world: 'creative',
      kind: 'creative',
      value: seed,
    });
  };
  const exportSvg = () => {
    try {
      if (!svgRef.current) throw new Error('No artwork');
      const svg = new XMLSerializer().serializeToString(svgRef.current);
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `cj-contour-garden-${seed}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportMessage('SVG export requested. Your browser controls the download.');
    } catch {
      setExportMessage(
        'The export could not be created in this browser. The sketch is still available here.'
      );
    }
  };
  return (
    <section className="uw-world uw-creative" aria-labelledby="uw-creative-title">
      <header className="uw-creative-header">
        <Eyebrow>05 / The organic studio</Eyebrow>
        <h1 id="uw-creative-title">
          A little structure.
          <br />
          <em>A little wandering.</em>
        </h1>
        <p className="uw-lead">
          An original sketch, made from a seed,
          <br />a few contours, and room to play.
        </p>
      </header>
      <section className="uw-sketch" aria-labelledby="uw-sketch-title" data-reveal="garden">
        <div className="uw-sketch-heading">
          <div>
            <Eyebrow>Generative study / 001</Eyebrow>
            <h2 id="uw-sketch-title">Contour garden</h2>
          </div>
          <span className="uw-meta">SEED {seed}</span>
        </div>
        <figure className="uw-artwork">
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 640"
            role="img"
            aria-labelledby="uw-artwork-title"
            aria-describedby="uw-artwork-desc"
          >
            <title id="uw-artwork-title">{`Contour garden, seed ${seed}`}</title>
            <desc id="uw-artwork-desc">
              An original generated botanical drawing: curved terrain contours, five leafy stems,
              and a warm circular sun. Palette: {palette.name}.
            </desc>
            <rect width="800" height="640" fill={palette.paper} />
            <circle
              cx={garden.sun.x}
              cy={garden.sun.y}
              r={garden.sun.r}
              fill={palette.sun}
              opacity=".7"
            />
            <g
              key={seed}
              className="uw-garden-contours"
              fill="none"
              stroke={palette.secondary}
              strokeWidth="1.15"
              opacity=".8"
            >
              {garden.contours.map((path, index) => (
                <path d={path} key={index} pathLength="1" />
              ))}
            </g>
            <g stroke={palette.ink} fill={palette.ink}>
              {garden.stems.map((stem, index) => (
                <g key={index}>
                  <path
                    d={`M${stem.x},${stem.y} Q${stem.x + stem.bend},${stem.y - stem.height * 0.5} ${stem.x + stem.bend * 0.6},${stem.y - stem.height}`}
                    fill="none"
                    strokeWidth="1.8"
                  />
                  {stem.leaves.map((leaf, leafIndex) => {
                    const x = stem.x + Math.sin(leaf.t * Math.PI) * stem.bend * 0.7;
                    const y = stem.y - stem.height * leaf.t;
                    return (
                      <path
                        key={leafIndex}
                        d={`M${x},${y} q${leaf.side * leaf.size},${-leaf.size * 1.4} ${leaf.side * leaf.size * 1.6},${-leaf.size * 1.2} q${-leaf.side * leaf.size * 0.15},${leaf.size * 1.15} ${-leaf.side * leaf.size * 1.6},${leaf.size * 1.2}`}
                        opacity=".86"
                        strokeWidth=".6"
                      />
                    );
                  })}
                </g>
              ))}
            </g>
            <line x1="48" x2="752" y1="592" y2="592" stroke={palette.ink} opacity=".4" />
            <text
              x="48"
              y="616"
              fontFamily="monospace"
              fontSize="11"
              letterSpacing="2"
              fill={palette.ink}
            >
              CJ / CONTOUR GARDEN
            </text>
            <text
              x="752"
              y="616"
              textAnchor="end"
              fontFamily="monospace"
              fontSize="11"
              fill={palette.ink}
            >
              SEED {seed}
            </text>
          </svg>
          <figcaption>
            An original procedural study, generated locally from the seed and controls.
          </figcaption>
        </figure>
        <div className="uw-sketch-controls">
          <label>
            <span>Composition seed</span>
            <input
              type="number"
              min="1"
              max="999999"
              step="1"
              value={seed}
              onChange={event => {
                if (event.target.value)
                  changeSeed(
                    Math.max(1, Math.min(999999, Math.floor(Number(event.target.value) || 1)))
                  );
              }}
            />
          </label>
          <label>
            <span>
              Contour density <output>{density}</output>
            </span>
            <input
              type="range"
              min="16"
              max="70"
              value={density}
              onChange={event => setDensity(Number(event.target.value))}
              onPointerUp={commitDensity}
              onKeyUp={commitDensity}
              onBlur={commitDensity}
            />
          </label>
          <label>
            <span>Color study</span>
            <select
              value={paletteIndex}
              onChange={event => {
                const next = Number(event.target.value);
                if (next === paletteIndex) return;
                setPaletteIndex(next);
                onWorldInteraction?.({
                  world: 'creative',
                  kind: 'creative',
                  value: seed,
                });
              }}
            >
              {PALETTES.map((item, index) => (
                <option key={item.name} value={index}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="uw-palette-swatches" aria-hidden="true">
              {[palette.paper, palette.secondary, palette.ink, palette.sun].map((color, index) => (
                <i key={index} style={{ backgroundColor: color }} />
              ))}
            </span>
          </label>
          <div className="uw-sketch-buttons">
            <button
              type="button"
              className="uw-button"
              onClick={() => {
                changeSeed((((Math.imul(seed, 1664525) + 1013904223) >>> 0) % 999999) + 1);
              }}
            >
              New composition ↻
            </button>
            <button type="button" className="uw-text-link" onClick={exportSvg}>
              Export original SVG ↗
            </button>
          </div>
        </div>
        <p className="uw-export-status" role="status">
          {exportMessage ||
            'Deterministic by design: the same seed and controls produce the same drawing. No network request or uploaded media.'}
        </p>
      </section>
      <div className="uw-creative-context">
        <section data-reveal="section">
          <Eyebrow>Behind the sketch</Eyebrow>
          <h2>
            Rules that leave
            <br />
            <em>room for surprise.</em>
          </h2>
          <p>
            A seeded number generator places soft terrain influences and botanical stems. Each
            contour samples the same field; changing the density reveals a different rhythm without
            changing the underlying composition.
          </p>
          <p>
            It is a small, inspectable creative system, not a claim about a separate artwork
            collection.
          </p>
        </section>
        <aside
          ref={hush}
          className="uw-hush uw-hush-stage"
          data-reveal="section"
          data-hush-active={haunting}
          data-lantern={lantern}
        >
          <div className="uw-hush-scenery" aria-hidden="true">
            <svg viewBox="0 0 720 320" fill="none">
              <circle cx="550" cy="76" r="44" fill="#c2d3b9" opacity=".8" />
              {[30, 95, 162, 570, 645, 700].map((x, i) => (
                <path
                  key={x}
                  d={`M${x} 320V${60 + (i % 3) * 35}m0 65l-24-30m24 65l30-45`}
                  stroke="#182b31"
                  strokeWidth="13"
                />
              ))}
              <path
                d="M225 310V145L360 80l135 65v165"
                fill="#16292c"
                stroke="#688077"
                strokeWidth="2"
              />
              <path
                d="M318 310v-92a42 42 0 0184 0v92"
                fill="#080f17"
                stroke="#8f9c82"
                strokeWidth="2"
              />
              <path
                d="M250 160h45v60h-45zM425 160h45v60h-45z"
                fill="#71958a"
                opacity={lantern ? 0.9 : 0.25}
              />
              {[190, 515].map((x, i) => (
                <g key={x} transform={`translate(${x} ${150 + i * 55})`} className="uw-hush-spirit">
                  <path
                    d="M-25 50V0a25 25 0 0150 0v50L13 42 0 53-13 42z"
                    fill="#bedbd0"
                    opacity=".8"
                  />
                  <ellipse cx="-9" cy="5" rx="4" ry="7" fill="#15222d" />
                  <ellipse cx="9" cy="5" rx="4" ry="7" fill="#15222d" />
                </g>
              ))}
              <path d="M0 300q180-40 360 0t360-8" stroke="#8fa9a0" opacity=".35" strokeWidth="18" />
            </svg>
          </div>
          <div className="uw-hush-copy">
            <Eyebrow>After hours / Game development</Eyebrow>
            <h2>
              HUSH<span>A little curiosity. A little unease.</span>
            </h2>
            <p>
              Leave the garden for a moonlit arcade. Ghosts drift between the trees, abandoned
              cabinets glow, and a lantern changes the atmosphere.
            </p>
            <div className="uw-hush-controls">
              <button
                type="button"
                className="uw-button"
                aria-pressed={lantern}
                onClick={() => {
                  const next = !lantern;
                  setLantern(next);
                  insideHush.current = true;
                  setHaunting(true);
                  onWorldInteraction?.({
                    world: 'creative',
                    kind: 'hush',
                    value: next ? 'light-on' : 'light-off',
                  });
                }}
              >
                {lantern ? 'Lower the lantern' : 'Raise the lantern'}{' '}
                <span aria-hidden="true">↗</span>
              </button>
              <button
                type="button"
                className="uw-text-link"
                onClick={() => {
                  changeEnvironment(false);
                  svgRef.current
                    ?.closest('.uw-sketch')
                    ?.scrollIntoView({ block: 'start', behavior: 'instant' });
                }}
              >
                Return to the garden ↑
              </button>
            </div>
            <p className="uw-hush-status" role="status">
              {lantern
                ? 'Lantern raised. The spectral set is illuminated.'
                : 'Moonlight only. Scroll into the set, or raise the lantern.'}
            </p>
            <p className="uw-hush-disclaimer">
              An original interactive portfolio set inspired by my horror-game project, Hush — not
              gameplay footage. Actual Hush screenshots, clips, and a public build have not been
              supplied. No audio autoplays.
            </p>
          </div>
        </aside>
        <section data-reveal="section">
          <Eyebrow>Music &amp; guitar</Eyebrow>
          <h2>Original recordings, when they are ready.</h2>
          <p>
            No original audio assets were supplied in this portfolio repository. There is no
            simulated track library and nothing autoplays. The contour studio above is a working
            original experiment; recordings can be added here when real media is available.
          </p>
        </section>
      </div>
    </section>
  );
}
