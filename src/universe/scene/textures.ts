import { CanvasTexture, SRGBColorSpace, RepeatWrapping } from 'three';
import type { WorldDefinition } from '../types';
import { seededRandom } from './math.ts';

const palettes: Record<WorldDefinition['kind'], [number[], number[], number[]]> = {
  ocean: [
    [15, 41, 58],
    [47, 105, 121],
    [153, 170, 140],
  ],
  industrial: [
    [59, 57, 57],
    [124, 112, 94],
    [190, 166, 130],
  ],
  research: [
    [39, 43, 62],
    [91, 94, 122],
    [161, 162, 175],
  ],
  terracotta: [
    [89, 46, 37],
    [164, 94, 65],
    [216, 164, 112],
  ],
  garden: [
    [30, 55, 45],
    [80, 110, 75],
    [160, 164, 112],
  ],
  archive: [
    [99, 111, 121],
    [175, 186, 190],
    [226, 224, 211],
  ],
  beacon: [
    [91, 62, 33],
    [170, 123, 61],
    [224, 191, 118],
  ],
};

// Sampling the same continuous field on a sphere keeps the longitude seam invisible.
function terrain(x: number, y: number, z: number, seed: number): number {
  return (
    Math.sin(x * 3.8 + Math.sin(z * 4.2 + seed) + y * 2.8) * 0.24 +
    Math.sin(y * 9.1 + Math.cos(x * 6.7 + seed) + z * 7.3) * 0.14 +
    Math.sin(z * 21.3 + Math.sin(y * 14.5) + x * 17.1) * 0.075 +
    Math.sin(x * 67 + y * 53 + z * 41 + seed) * 0.025 +
    0.5
  );
}

export function surfaceTexture(kind: WorldDefinition['kind'], seed: number, high: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = high ? 512 : 256;
  canvas.height = canvas.width / 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Procedural surface canvas is unavailable.');
  const image = context.createImageData(canvas.width, canvas.height);
  const random = seededRandom(seed);
  const craters = Array.from({ length: 14 }, () => {
    const azimuth = random() * Math.PI * 2;
    const y = random() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    return { x: Math.cos(azimuth) * r, y, z: Math.sin(azimuth) * r, size: 25 + random() * 95 };
  });
  const colors = palettes[kind];
  for (let row = 0; row < canvas.height; row++) {
    const latitude = (row / (canvas.height - 1)) * Math.PI;
    const y = Math.cos(latitude);
    for (let column = 0; column < canvas.width; column++) {
      const longitude = (column / canvas.width) * Math.PI * 2;
      const x = Math.sin(latitude) * Math.cos(longitude);
      const z = Math.sin(latitude) * Math.sin(longitude);
      let value = terrain(x, y, z, seed);
      if (kind === 'ocean') {
        value = value < 0.64 ? value * 0.63 : 0.69 + value * 0.28;
        value = Math.max(value, Math.pow(Math.abs(y), 18) * 0.95);
      } else if (kind === 'archive' || kind === 'research') {
        for (const crater of craters) {
          const distance = Math.max(0, 1 - (x * crater.x + y * crater.y + z * crater.z));
          value -= Math.exp(-distance * crater.size * 3) * 0.18;
          value += Math.exp(-Math.pow(distance * crater.size - 0.9, 2) * 12) * 0.1;
        }
      } else if (kind === 'terracotta' || kind === 'industrial') {
        value += Math.sin(y * 105 + terrain(x, y, z, seed + 3) * 5) * 0.055;
      }
      const scaled = Math.min(1, Math.max(0, value)) * 2;
      const first = scaled < 1 ? colors[0] : colors[1];
      const second = scaled < 1 ? colors[1] : colors[2];
      const mix = scaled < 1 ? scaled : scaled - 1;
      const offset = (row * canvas.width + column) * 4;
      for (let channel = 0; channel < 3; channel++) {
        image.data[offset + channel] = first[channel] * (1 - mix) + second[channel] * mix;
      }
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.anisotropy = high ? 4 : 1;
  return texture;
}

export function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Procedural glow canvas is unavailable.');
  const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,244,206,1)');
  glow.addColorStop(0.13, 'rgba(255,210,126,.86)');
  glow.addColorStop(0.3, 'rgba(237,153,66,.33)');
  glow.addColorStop(0.58, 'rgba(167,89,35,.07)');
  glow.addColorStop(1, 'rgba(78,39,20,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function cloudTexture(high: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = high ? 1024 : 512;
  canvas.height = canvas.width / 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Cloud surface canvas is unavailable.');
  const image = context.createImageData(canvas.width, canvas.height);
  for (let row = 0; row < canvas.height; row++) {
    const latitude = (row / (canvas.height - 1)) * Math.PI;
    for (let column = 0; column < canvas.width; column++) {
      const longitude = (column / canvas.width) * Math.PI * 2;
      const x = Math.sin(latitude) * Math.cos(longitude),
        y = Math.cos(latitude),
        z = Math.sin(latitude) * Math.sin(longitude);
      const field = terrain(x * 1.7, y * 1.7, z * 1.7, 42);
      const alpha = Math.min(1, Math.max(0, (field - 0.54) * 5)) * 255;
      const offset = (row * canvas.width + column) * 4;
      image.data.set([alpha, alpha, alpha, 255], offset);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  return texture;
}
