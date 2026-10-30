import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from 'three';

// A closed, scalloped cloth volume, not a sphere concealed beneath a transparent sheet.
export function createGhostGeometry(high: boolean) {
  const segments = high ? 64 : 32;
  const rings = high ? 40 : 24;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const dome = Math.sqrt(Math.max(0, 1 - ((0.4 - t) / 0.4) ** 2));
    const radius = t < 0.4 ? 0.57 * dome : 0.57 + (t - 0.4) * 0.06;
    for (let segment = 0; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2;
      const pleat = Math.cos(angle * 7) * 0.035 * t * t;
      positions.push(
        Math.cos(angle) * (radius + pleat),
        0.88 - t * 1.52 + Math.cos(angle * 7) * 0.1 * t ** 5,
        Math.sin(angle) * (radius + pleat) * 0.76
      );
      if (ring < rings && segment < segments) {
        const a = ring * (segments + 1) + segment;
        const b = a + segments + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const center = positions.length / 3;
  positions.push(0, -0.64, 0);
  for (let segment = 0; segment < segments; segment++) {
    const a = rings * (segments + 1) + segment;
    indices.push(center, a, a + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createCognitionGeometry(high: boolean) {
  const geometry = new SphereGeometry(1, high ? 48 : 24, high ? 32 : 20);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const fold = 1 + 0.065 * Math.sin(y * 24 + z * 7) * Math.cos(x * 13 - z * 12);
    positions.setXYZ(index, x * fold, y * fold, z * fold);
  }
  geometry.computeVertexNormals();
  return geometry;
}
