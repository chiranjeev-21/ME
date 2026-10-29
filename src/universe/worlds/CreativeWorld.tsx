import { useMemo, useRef, useState } from 'react';
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

export function CreativeWorld() {
  const [seed, setSeed] = useState(2106);
  const [density, setDensity] = useState(42);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const palette = PALETTES[paletteIndex];
  const garden = useMemo(() => generateGarden(seed, density), [seed, density]);
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
      <section className="uw-sketch" aria-labelledby="uw-sketch-title">
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
            <title id="uw-artwork-title">Contour garden, seed {seed}</title>
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
            <g fill="none" stroke={palette.secondary} strokeWidth="1.15" opacity=".8">
              {garden.contours.map((path, index) => (
                <path d={path} key={index} />
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
            An original procedural study, generated locally from the seed and controls above.
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
                  setSeed(
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
            />
          </label>
          <label>
            <span>Color study</span>
            <select
              value={paletteIndex}
              onChange={event => setPaletteIndex(Number(event.target.value))}
            >
              {PALETTES.map((item, index) => (
                <option key={item.name} value={index}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="uw-sketch-buttons">
            <button
              type="button"
              className="uw-button"
              onClick={() => {
                setSeed(value => (((Math.imul(value, 1664525) + 1013904223) >>> 0) % 999999) + 1);
                setExportMessage('');
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
        <section>
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
        <aside className="uw-hush">
          <span aria-hidden="true">H</span>
          <div>
            <Eyebrow>Game development</Eyebrow>
            <h2>Hush</h2>
            <p>
              Hush is my horror-game project. Screenshots, gameplay clips, and implementation notes
              have not been added to this portfolio yet.
            </p>
            <p>
              No build or public project link is supplied here. This space is reserved for actual
              footage and development notes.
            </p>
          </div>
        </aside>
        <section>
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
