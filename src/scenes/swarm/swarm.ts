/**
 * The peer-to-peer swarm described in Decentralised-Package-manager's README,
 * drawn as a low-angle view across a CI fleet. Machines that already hold a
 * dependency bundle stream its chunks in parallel to one build; the assembled
 * bundle is checked against its SHA-256 before use, and the build then seeds
 * it too. The upstream registry stands in the distance as an idle fallback.
 *
 * Canvas 2D, deterministic per cycle. World units: a machine is ~1 wide, 2 tall.
 */

interface Machine {
  x: number;
  z: number;
  row: number;
  /** Holds other bundles already (steady seeding LED). */
  warm: boolean;
}

interface Point {
  x: number;
  y: number;
}

type MachineState = 'idle' | 'warm' | 'seeding' | 'fetching' | 'verified';

const BG = [6, 9, 11] as const;
const CYAN = '57, 198, 230';
const IVORY = '236, 230, 219';
const AMBER = '241, 199, 140';

const MACHINE = { w: 1.15, h: 2.05, d: 0.8 };
const ROWS = [6.2, 9.4, 13, 17.4, 22.6, 29, 37];
const SPACING = 2.55;
const CAMERA_HEIGHT = 3;
const CHUNKS = 18;
const SEEDERS = 5;

/** Length of one transfer → verify → seed cycle, seconds. */
export const SWARM_CYCLE = 8;
/** A composed still for reduced motion: verified, with the transfer paths still visible. */
export const SWARM_STILL = SWARM_CYCLE - 1.4;

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (t: number) => {
  const k = clamp(t);
  return k * k * (3 - 2 * k);
};

function mix(rgb: readonly number[], fog: number) {
  const channel = (index: number) => Math.round(rgb[index] + (BG[index] - rgb[index]) * fog);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function buildFleet(): { machines: Machine[]; hero: Machine } {
  const rng = random(21);
  const machines: Machine[] = [];
  ROWS.forEach((z, row) => {
    const reach = 7.5 + row * 3.4;
    const offset = row % 2 ? SPACING / 2 : 0;
    for (let x = -reach + offset; x <= reach; x += SPACING) {
      // An aisle and a few gaps, so the floor reads as a real room.
      if (Math.abs(x + 4.2) < 0.9 && row < 4) continue;
      if (rng() < 0.08 && row > 0) continue;
      machines.push({
        x: x + (rng() - 0.5) * 0.2,
        z: z + (rng() - 0.5) * 0.5,
        row,
        warm: rng() < 0.22,
      });
    }
  });
  const front = machines.filter(machine => machine.row === 0);
  const hero = front.reduce((best, machine) =>
    Math.abs(machine.x - 1.4) < Math.abs(best.x - 1.4) ? machine : best
  );
  hero.warm = false;
  return { machines, hero };
}

interface Chunk {
  seeder: number;
  launch: number;
  travel: number;
}

interface Cycle {
  seeders: Machine[];
  chunks: Chunk[];
  done: number;
  hash: string;
}

function planCycle(index: number, machines: Machine[], hero: Machine): Cycle {
  const rng = random(1000 + index * 7919);
  const pool = machines.filter(machine => machine !== hero && machine.row >= 1 && machine.row <= 5);
  const seeders: Machine[] = [];
  while (seeders.length < SEEDERS && pool.length) {
    const pick = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    // Spread the sources across the room so the parallel paths read clearly.
    if (seeders.some(other => Math.abs(other.x - pick.x) < 2.6 && Math.abs(other.z - pick.z) < 5))
      continue;
    seeders.push(pick);
  }
  const chunks = Array.from({ length: CHUNKS }, (_, chunk) => {
    const seeder = chunk % seeders.length;
    const source = seeders[seeder];
    const distance = Math.hypot(source.x - hero.x, source.z - hero.z);
    return { seeder, launch: 0.35 + chunk * 0.19 + rng() * 0.08, travel: 0.85 + distance * 0.032 };
  });
  const hex = () =>
    Math.floor(rng() * 0xffff)
      .toString(16)
      .padStart(4, '0');
  return {
    seeders,
    chunks,
    done: Math.max(...chunks.map(chunk => chunk.launch + chunk.travel)),
    hash: `${hex()}${hex()}…${hex()}`,
  };
}

export interface SwarmScene {
  resize(width: number, height: number, dpr: number): void;
  draw(time: number): void;
}

export function createSwarmScene(canvas: HTMLCanvasElement): SwarmScene | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx = context as CanvasRenderingContext2D & { letterSpacing?: string };
  const { machines, hero } = buildFleet();
  const ordered = [...machines].sort((a, b) => b.z - a.z || Math.abs(b.x) - Math.abs(a.x));
  const cycles = new Map<number, Cycle>();
  let width = 0;
  let height = 0;
  let dpr = 1;
  let cameraX = 0;

  const cycleAt = (index: number) => {
    let cycle = cycles.get(index);
    if (!cycle) {
      cycle = planCycle(index, machines, hero);
      cycles.set(index, cycle);
      if (cycles.size > 4) cycles.delete(cycles.keys().next().value as number);
    }
    return cycle;
  };

  const horizon = () => height * 0.4;
  const focal = () => Math.max(height * 0.95, width * 0.56);
  const project = (x: number, y: number, z: number): Point => {
    const depth = Math.max(0.5, z);
    return {
      x: width * 0.5 + (focal() * (x - cameraX)) / depth,
      y: horizon() - (focal() * (y - CAMERA_HEIGHT)) / depth,
    };
  };
  const fogAt = (z: number) => clamp((z - 6) / 38) * 0.86;

  const label = (
    text: string,
    x: number,
    y: number,
    alpha: number,
    align: CanvasTextAlign = 'left'
  ) => {
    ctx.font = `500 ${Math.round(clamp(width / 128, 9, 12))}px "Geist Mono Variable", ui-monospace, monospace`;
    ctx.letterSpacing = '0.14em';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(${IVORY}, ${alpha})`;
    ctx.fillText(text.toUpperCase(), x, y);
    ctx.letterSpacing = '0px';
  };

  const drawRoom = () => {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon());
    sky.addColorStop(0, '#040608');
    sky.addColorStop(1, '#0a1014');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, horizon() + 1);
    const floor = ctx.createLinearGradient(0, horizon(), 0, height);
    floor.addColorStop(0, '#0b1014');
    floor.addColorStop(1, '#06080a');
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon(), width, height - horizon());
    // A cool haze where the room dissolves into the distance.
    const haze = ctx.createLinearGradient(
      0,
      horizon() - height * 0.12,
      0,
      horizon() + height * 0.08
    );
    haze.addColorStop(0, `rgba(${CYAN}, 0)`);
    haze.addColorStop(0.6, `rgba(${CYAN}, 0.045)`);
    haze.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon() - height * 0.12, width, height * 0.2);

    ctx.lineWidth = 1;
    for (let z = 5; z < 60; z += 2.4) {
      const a = project(-60, 0, z);
      const b = project(60, 0, z);
      ctx.strokeStyle = `rgba(150, 185, 205, ${0.055 * (1 - fogAt(z))})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let x = -40; x <= 40; x += SPACING) {
      const a = project(x, 0, 4.5);
      const b = project(x, 0, 60);
      const line = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      line.addColorStop(0, 'rgba(150, 185, 205, 0.05)');
      line.addColorStop(1, 'rgba(150, 185, 205, 0)');
      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  };

  const drawRegistry = (time: number) => {
    const base = { x: -15, z: 58 };
    const w = 5;
    const h = 9;
    const tl = project(base.x - w / 2, h, base.z);
    const br = project(base.x + w / 2, 0, base.z);
    ctx.fillStyle = mix([28, 34, 40], 0.55);
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.strokeStyle = `rgba(${IVORY}, 0.12)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(tl.x + 0.5, tl.y + 0.5, br.x - tl.x - 1, br.y - tl.y - 1);
    label('Registry · fallback only', (tl.x + br.x) / 2, tl.y - 12, 0.42, 'center');
    // The path the build would take if no peer held the bundle — unused.
    const from = project(base.x + w / 2, h * 0.7, base.z);
    const to = project(hero.x, MACHINE.h + 0.95, hero.z);
    ctx.save();
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -time * 4;
    ctx.strokeStyle = `rgba(${IVORY}, 0.08)`;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo((from.x + to.x) / 2, Math.min(from.y, to.y) - height * 0.08, to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawMachine = (machine: Machine, state: MachineState, time: number) => {
    const { w, h, d } = MACHINE;
    const fog = fogAt(machine.z);
    const left = machine.x - w / 2;
    const right = machine.x + w / 2;
    const front = machine.z - d / 2;
    const back = machine.z + d / 2;
    const ftl = project(left, h, front);
    const ftr = project(right, h, front);
    const fbl = project(left, 0, front);
    const fbr = project(right, 0, front);
    const btl = project(left, h, back);
    const btr = project(right, h, back);
    const bbl = project(left, 0, back);
    const bbr = project(right, 0, back);

    // A contact shadow anchors each machine to the floor.
    ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * (1 - fog)})`;
    ctx.beginPath();
    ctx.ellipse(
      (fbl.x + fbr.x) / 2,
      fbl.y,
      (fbr.x - fbl.x) * 0.75,
      Math.max(1, (fbl.y - bbl.y + 2) * 0.9),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const side = left - cameraX > 0 ? 'left' : right - cameraX < 0 ? 'right' : null;
    if (side) {
      ctx.fillStyle = mix([15, 19, 23], fog);
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(ftl.x, ftl.y);
        ctx.lineTo(btl.x, btl.y);
        ctx.lineTo(bbl.x, bbl.y);
        ctx.lineTo(fbl.x, fbl.y);
      } else {
        ctx.moveTo(ftr.x, ftr.y);
        ctx.lineTo(btr.x, btr.y);
        ctx.lineTo(bbr.x, bbr.y);
        ctx.lineTo(fbr.x, fbr.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = mix([36, 44, 51], fog);
    ctx.beginPath();
    ctx.moveTo(ftl.x, ftl.y);
    ctx.lineTo(ftr.x, ftr.y);
    ctx.lineTo(btr.x, btr.y);
    ctx.lineTo(btl.x, btl.y);
    ctx.closePath();
    ctx.fill();

    const face = ctx.createLinearGradient(0, ftl.y, 0, fbl.y);
    face.addColorStop(0, mix([25, 31, 37], fog));
    face.addColorStop(1, mix([11, 14, 17], fog));
    ctx.fillStyle = face;
    ctx.fillRect(ftl.x, ftl.y, ftr.x - ftl.x, fbl.y - ftl.y);

    const faceW = ftr.x - ftl.x;
    const faceH = fbl.y - ftl.y;
    // Rack units, and a cool rim light along the top edge.
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.045 * (1 - fog)})`;
    ctx.lineWidth = 1;
    for (let unit = 1; unit < 8; unit++) {
      const y = Math.round(ftl.y + (faceH * unit) / 8) + 0.5;
      ctx.beginPath();
      ctx.moveTo(ftl.x + faceW * 0.08, y);
      ctx.lineTo(ftl.x + faceW * 0.72, y);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(175, 205, 222, ${0.22 * (1 - fog)})`;
    ctx.beginPath();
    ctx.moveTo(ftl.x, ftl.y + 0.5);
    ctx.lineTo(ftr.x, ftr.y + 0.5);
    ctx.stroke();

    const blink = 0.5 + 0.5 * Math.sin(time * 9 + machine.x * 3);
    const colour = state === 'fetching' ? AMBER : state === 'idle' ? '70, 80, 88' : CYAN;
    const strength =
      state === 'seeding'
        ? 0.6 + 0.4 * blink
        : state === 'fetching'
          ? 0.45 + 0.55 * blink
          : state === 'idle'
            ? 0.5
            : 0.85;
    const led = Math.max(1, faceW * 0.07);
    for (let index = 0; index < 3; index++) {
      const x = ftl.x + faceW * 0.84;
      const y = ftl.y + faceH * (0.12 + index * 0.09);
      const dim = index === 2 && state === 'idle' ? 0.4 : 1;
      ctx.fillStyle = `rgba(${colour}, ${strength * (1 - fog * 0.9) * dim})`;
      ctx.fillRect(x - led / 2, y - led / 2, led, led);
    }
    if (state !== 'idle' && fog < 0.6) {
      const x = ftl.x + faceW * 0.84;
      const y = ftl.y + faceH * 0.21;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, faceW * 0.9);
      glow.addColorStop(0, `rgba(${colour}, ${0.16 * strength * (1 - fog)})`);
      glow.addColorStop(1, `rgba(${colour}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - faceW, y - faceW, faceW * 2, faceW * 2);
    }
  };

  const bezier = (source: Machine, u: number) => {
    const p0 = { x: source.x, y: MACHINE.h + 0.08, z: source.z };
    const p2 = { x: hero.x, y: MACHINE.h + 0.95, z: hero.z };
    const lift = 2 + Math.hypot(p0.x - p2.x, p0.z - p2.z) * 0.11;
    const p1 = { x: (p0.x + p2.x) / 2, y: Math.max(p0.y, p2.y) + lift, z: (p0.z + p2.z) / 2 };
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    return project(
      a * p0.x + b * p1.x + c * p2.x,
      a * p0.y + b * p1.y + c * p2.y,
      a * p0.z + b * p1.z + c * p2.z
    );
  };

  const drawLock = (x: number, y: number, size: number, alpha: number) => {
    ctx.strokeStyle = `rgba(${IVORY}, ${alpha})`;
    ctx.fillStyle = `rgba(${IVORY}, ${alpha})`;
    ctx.lineWidth = Math.max(1.2, size * 0.12);
    ctx.beginPath();
    ctx.arc(x, y - size * 0.15, size * 0.32, Math.PI, 0);
    ctx.stroke();
    ctx.fillRect(x - size * 0.45, y - size * 0.15, size * 0.9, size * 0.7);
    ctx.fillStyle = 'rgba(6, 9, 11, 0.9)';
    ctx.fillRect(x - size * 0.05, y + size * 0.05, size * 0.1, size * 0.22);
  };

  const draw = (time: number) => {
    if (!width || !height) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cameraX = Math.sin(time * 0.06) * 0.35;
    const index = Math.floor(time / SWARM_CYCLE);
    const t = time - index * SWARM_CYCLE;
    const cycle = cycleAt(index);
    const verifyStart = cycle.done + 0.15;
    const verifyProgress = clamp((t - verifyStart) / 0.75);
    const verified = verifyProgress >= 1;
    const fade = 1 - smooth((t - (SWARM_CYCLE - 0.6)) / 0.6);
    const arrived = cycle.chunks.filter(chunk => chunk.launch + chunk.travel <= t).length;

    drawRoom();
    drawRegistry(time);

    // LAN links between neighbouring machines (mDNS discovery), barely there.
    ctx.lineWidth = 1;
    for (const machine of machines) {
      if (machine.row > 4) continue;
      for (const other of machines) {
        if (other === machine || other.z < machine.z) continue;
        if (Math.hypot(other.x - machine.x, other.z - machine.z) > 4.1) continue;
        const a = project(machine.x, 0.02, machine.z);
        const b = project(other.x, 0.02, other.z);
        ctx.strokeStyle = `rgba(${CYAN}, ${0.07 * (1 - fogAt(machine.z))})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const machine of ordered) {
      const state: MachineState =
        machine === hero
          ? verified
            ? 'verified'
            : 'fetching'
          : cycle.seeders.includes(machine)
            ? 'seeding'
            : machine.warm
              ? 'warm'
              : 'idle';
      drawMachine(machine, state, time);
    }

    // Transfer paths, brighter while a chunk is travelling along them.
    cycle.seeders.forEach((seeder, seederIndex) => {
      const own = cycle.chunks.filter(chunk => chunk.seeder === seederIndex);
      if (!own.length || t < own[0].launch) return;
      const active = own.some(chunk => t >= chunk.launch && t <= chunk.launch + chunk.travel);
      ctx.strokeStyle = `rgba(${CYAN}, ${(active ? 0.34 : verified ? 0.2 : 0.14) * fade})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let step = 0; step <= 36; step++) {
        const p = bezier(seeder, step / 36);
        if (step) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    });

    // Chunks in flight, each with a short exposure trail.
    for (const chunk of cycle.chunks) {
      const progress = (t - chunk.launch) / chunk.travel;
      if (progress <= 0 || progress >= 1) continue;
      const source = cycle.seeders[chunk.seeder];
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
      for (let trail = 5; trail >= 0; trail--) {
        const p = bezier(source, clamp(eased - trail * 0.018));
        const size = trail ? 1.6 : 3.2;
        ctx.fillStyle = trail ? `rgba(${CYAN}, ${0.32 - trail * 0.05})` : 'rgba(214, 244, 252, 1)';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }

    // The bundle assembling above the build, then its hash check.
    const centre = project(hero.x, MACHINE.h + 0.95, hero.z);
    const radius = (focal() * 0.42) / hero.z;
    const gap = 0.06;
    ctx.lineCap = 'butt';
    ctx.lineWidth = Math.max(2, radius * 0.11);
    for (let segment = 0; segment < CHUNKS; segment++) {
      const start = -Math.PI / 2 + (segment / CHUNKS) * Math.PI * 2 + gap / 2;
      const end = start + (Math.PI * 2) / CHUNKS - gap;
      ctx.strokeStyle = verified
        ? `rgba(${IVORY}, ${0.9 * fade})`
        : segment < arrived
          ? `rgba(${CYAN}, ${0.95 * fade})`
          : `rgba(${IVORY}, ${0.14 * fade})`;
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, radius, start, end);
      ctx.stroke();
    }
    if (verifyProgress > 0 && !verified) {
      ctx.strokeStyle = `rgba(${IVORY}, 0.95)`;
      ctx.beginPath();
      ctx.arc(
        centre.x,
        centre.y,
        radius * 1.22,
        -Math.PI / 2,
        -Math.PI / 2 + verifyProgress * Math.PI * 2
      );
      ctx.stroke();
    }
    if (verified) {
      ctx.strokeStyle = `rgba(${IVORY}, ${0.35 * fade})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, radius * 1.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawLock(
      centre.x,
      centre.y,
      radius * 0.62,
      (verified ? 0.95 : 0.35 + 0.25 * (arrived / CHUNKS)) * fade
    );

    const status = verified
      ? 'Hash verified · now seeding'
      : verifyProgress > 0
        ? 'Verifying sha-256…'
        : `${arrived} / ${CHUNKS} chunks · ${SEEDERS} peers`;
    // Narrow plates stack the readout under the ring so it never leaves the frame.
    const narrow = width < 620;
    const textX = narrow ? centre.x : centre.x + radius * 1.6;
    const textY = narrow ? centre.y + radius * 1.7 : centre.y - radius * 0.32;
    const lineGap = narrow ? 14 : radius * 0.64;
    const align: CanvasTextAlign = narrow ? 'center' : 'left';
    label(`sha256:${cycle.hash}`, textX, textY, 0.82 * fade, align);
    label(status, textX, textY + lineGap, (verified ? 0.82 : 0.55) * fade, align);
    const foot = project(hero.x, 0, hero.z - MACHINE.d / 2);
    if (!narrow) label('This build · npm install', foot.x, foot.y + 16, 0.5, 'center');

    // Vignette, so the light falls off like a real room.
    const vignette = ctx.createRadialGradient(
      width * 0.55,
      height * 0.55,
      Math.min(width, height) * 0.3,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  };

  return {
    resize(nextWidth: number, nextHeight: number, nextDpr: number) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    },
    draw,
  };
}
