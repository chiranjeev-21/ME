/**
 * Canvas painting shared by the guitar necks: rosewood, bone nut, nickel frets
 * at equal-tempered positions, pearl inlays, and wound or plain strings lit by
 * a single tungsten source.
 */

interface StringLook {
  gauge: number;
  wound: boolean;
}

/** x of fret n for a neck whose nut is at x0 and whose last fret (plus `tail`) ends at x1. */
export function fretPositions(x0: number, x1: number, frets: number, tail = 0.6) {
  const scale = (x1 - x0) / (1 - Math.pow(2, -(frets + tail) / 12));
  return (n: number) => x0 + scale * (1 - Math.pow(2, -n / 12));
}

/** Dark warm base, long grain streaks, light falling off toward the edges. */
export function paintRosewood(
  b: CanvasRenderingContext2D,
  x0: number,
  boardTop: number,
  width: number,
  boardHeight: number
) {
  const boardBottom = boardTop + boardHeight;
  const wood = b.createLinearGradient(0, boardTop, 0, boardBottom);
  wood.addColorStop(0, '#1a110b');
  wood.addColorStop(0.5, '#24170e');
  wood.addColorStop(1, '#140d08');
  b.fillStyle = wood;
  b.fillRect(x0, boardTop, width - x0, boardHeight);
  let seed = 7;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 140; i++) {
    const y = boardTop + rand() * boardHeight;
    const length = width * (0.15 + rand() * 0.6);
    const start = x0 + rand() * (width - x0);
    b.strokeStyle = rand() > 0.5 ? 'rgba(60, 38, 22, 0.35)' : 'rgba(8, 5, 3, 0.45)';
    b.lineWidth = 0.5 + rand() * 1.4;
    b.beginPath();
    b.moveTo(start, y);
    b.bezierCurveTo(
      start + length * 0.33,
      y + (rand() - 0.5) * 3,
      start + length * 0.66,
      y + (rand() - 0.5) * 3,
      start + length,
      y + (rand() - 0.5) * 2
    );
    b.stroke();
  }
  const pool = b.createRadialGradient(
    width * 0.42,
    boardTop + boardHeight * 0.3,
    10,
    width * 0.42,
    boardTop + boardHeight * 0.3,
    width * 0.6
  );
  pool.addColorStop(0, 'rgba(255, 196, 128, 0.10)');
  pool.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  b.fillStyle = pool;
  b.fillRect(x0, boardTop, width - x0, boardHeight);
}

export function paintNut(
  b: CanvasRenderingContext2D,
  x0: number,
  boardTop: number,
  boardHeight: number
) {
  b.fillStyle = '#d8cfbf';
  b.fillRect(x0 - 7, boardTop - 2, 7, boardHeight + 4);
  b.fillStyle = 'rgba(0,0,0,0.35)';
  b.fillRect(x0, boardTop, 3, boardHeight);
}

export function paintFret(
  b: CanvasRenderingContext2D,
  x: number,
  boardTop: number,
  boardHeight: number
) {
  const fret = b.createLinearGradient(x - 2, 0, x + 2, 0);
  fret.addColorStop(0, '#5a564f');
  fret.addColorStop(0.45, '#d9d4c9');
  fret.addColorStop(1, '#3d3a35');
  b.fillStyle = 'rgba(0,0,0,0.45)';
  b.fillRect(x + 1.5, boardTop, 3, boardHeight);
  b.fillStyle = fret;
  b.fillRect(x - 1.5, boardTop - 1, 3, boardHeight + 2);
}

export function paintInlay(b: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const pearl = b.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  pearl.addColorStop(0, '#f1ece2');
  pearl.addColorStop(1, '#a9a196');
  b.fillStyle = pearl;
  b.beginPath();
  b.arc(x, y, r, 0, Math.PI * 2);
  b.fill();
}

/** Pearl inlays at 3, 5, 7, 9 and a pair at 12, centred between the middle strings. */
export function paintInlays(
  b: CanvasRenderingContext2D,
  fretX: (n: number) => number,
  frets: number,
  middle: number,
  spacing: number
) {
  const r = Math.min(spacing * 0.22, 9);
  [3, 5, 7, 9]
    .filter(n => n <= frets)
    .forEach(n => paintInlay(b, (fretX(n - 1) + fretX(n)) / 2, middle, r));
  if (frets >= 12) {
    const twelve = (fretX(11) + fretX(12)) / 2;
    paintInlay(b, twelve, middle - spacing * 1.05, r);
    paintInlay(b, twelve, middle + spacing * 1.05, r);
  }
}

/** Fades the far end into darkness so the neck feels lit, not boxed. */
export function paintFade(
  b: CanvasRenderingContext2D,
  from: number,
  width: number,
  boardTop: number,
  boardHeight: number
) {
  const fade = b.createLinearGradient(from, 0, width, 0);
  fade.addColorStop(0, 'rgba(15, 11, 8, 0)');
  fade.addColorStop(1, 'rgba(15, 11, 8, 0.85)');
  b.fillStyle = fade;
  b.fillRect(from, boardTop - 2, width - from, boardHeight + 4);
}

/** Long-exposure band: the blur a camera sees on a fast-moving string. */
export function paintBlurBand(
  ctx: CanvasRenderingContext2D,
  points: readonly [number, number][],
  envelope: readonly number[],
  y0: number,
  strength: number
) {
  const last = points.length - 1;
  ctx.beginPath();
  points.forEach(([x], i) =>
    i ? ctx.lineTo(x, y0 - envelope[i]) : ctx.moveTo(x, y0 - envelope[i])
  );
  for (let i = last; i >= 0; i--) ctx.lineTo(points[i][0], y0 + envelope[i]);
  ctx.closePath();
  ctx.fillStyle = `rgba(220, 157, 87, ${Math.min(0.13, strength * 0.006)})`;
  ctx.fill();
}

/** A string with its shadow on the board, winding texture, and a specular line. */
export function strokeString(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  look: StringLook,
  live: boolean
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 6;
  ctx.lineWidth = look.gauge;
  ctx.strokeStyle = look.wound ? '#9a7e5c' : '#b9b4aa';
  ctx.stroke(path);
  ctx.restore();

  if (look.wound) {
    ctx.save();
    ctx.setLineDash([0.9, 1.5]);
    ctx.lineWidth = look.gauge;
    ctx.strokeStyle = 'rgba(20, 12, 6, 0.45)';
    ctx.stroke(path);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(0, -look.gauge * 0.32);
  ctx.lineWidth = Math.max(0.5, look.gauge * 0.32);
  ctx.strokeStyle = live ? 'rgba(255, 228, 190, 0.85)' : 'rgba(255, 236, 210, 0.5)';
  ctx.stroke(path);
  ctx.restore();
}
