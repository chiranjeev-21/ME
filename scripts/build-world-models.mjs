import { mkdir, writeFile } from 'node:fs/promises';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  CylinderGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
  Matrix4,
  Quaternion,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const output = new URL('../public/assets/worlds/', import.meta.url);
await mkdir(output, { recursive: true });
const material = (color, roughness = 0.6, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness });
const sphere = (parent, name, position, scale, surface, detail = 24) => {
  const mesh = new Mesh(new SphereGeometry(1, detail, 16), surface);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
};
const exportModel = async (name, scene) => {
  const bytes = await new GLTFExporter().parseAsync(scene, { binary: true });
  await writeFile(new URL(name, output), new Uint8Array(bytes));
  console.log(name, bytes.byteLength);
};

const alien = new Group();
const jade = material('#537d78', 0.38, 0.12);
const dark = material('#09141d', 0.18, 0.28);
const light = material('#b4e8ce', 0.25);
const suit = material('#303b58', 0.66);
sphere(alien, 'body', [0, 0.9, 0], [0.35, 0.43, 0.23], suit);
sphere(alien, 'head', [0, 1.53, 0.02], [0.49, 0.43, 0.33], jade, 32);
for (const side of [-1, 1]) {
  sphere(alien, `ear${side}`, [side * 0.46, 1.56, 0], [0.19, 0.13, 0.08], jade);
  const leg = new Group();
  leg.name = side < 0 ? 'leftLeg' : 'rightLeg';
  leg.position.set(side * 0.18, 0.62, 0);
  sphere(leg, 'leg', [0, -0.26, 0], [0.115, 0.3, 0.12], suit);
  sphere(leg, 'boot', [0, -0.52, 0.07], [0.14, 0.1, 0.22], dark);
  alien.add(leg);
  const arm = new Group();
  arm.name = side < 0 ? 'leftArm' : 'rightArm';
  arm.position.set(side * 0.36, 1.16, 0);
  sphere(arm, 'arm', [side * 0.04, -0.24, 0], [0.09, 0.3, 0.1], jade);
  alien.add(arm);
  sphere(alien, 'eye', [side * 0.21, 1.57, 0.286], [0.155, 0.205, 0.075], dark, 32);
  sphere(alien, 'catchlight', [side * 0.21 - 0.035, 1.63, 0.351], [0.035, 0.055, 0.013], light);
}
sphere(alien, 'thirdEye', [0, 1.82, 0.25], [0.06, 0.075, 0.035], light);
await exportModel('alien.glb', alien);

const ghost = new Group();
const vertices = [],
  indices = [],
  uvs = [];
const columns = 48,
  rows = 32;
for (let row = 0; row <= rows; row++) {
  const t = row / rows;
  for (let column = 0; column <= columns; column++) {
    const theta = (column / columns) * Math.PI * 2;
    const radius =
      0.64 * Math.sin((Math.min(1, t / 0.4) * Math.PI) / 2) + Math.max(0, t - 0.4) * 0.17;
    vertices.push(
      Math.cos(theta) * radius,
      (t <= 0.4
        ? 1.9 - 0.66 * (1 - Math.cos(((t / 0.4) * Math.PI) / 2))
        : 1.24 - (t - 0.4) * 1.65) +
        Math.sin(theta * 7) * 0.12 * t ** 8,
      Math.sin(theta) * radius
    );
    uvs.push(column / columns, t);
    if (row < rows && column < columns) {
      const a = row * (columns + 1) + column,
        b = a + columns + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
}
const cloth = new BufferGeometry();
cloth.setAttribute('position', new Float32BufferAttribute(vertices, 3));
cloth.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
cloth.setIndex(indices);
cloth.computeVertexNormals();
const normals = cloth.getAttribute('normal');
for (let index = 0; index < normals.count; index++) {
  const normal = new Vector3().fromBufferAttribute(normals, index);
  if (normal.lengthSq() < 0.0001) normals.setXYZ(index, 0, 1, 0);
}
const silk = material('#c6e7dc', 0.27, 0.12);
const sheet = new Mesh(cloth, silk);
sheet.name = 'spectralCloth';
ghost.add(sheet);
for (const side of [-1, 1]) {
  sphere(ghost, 'eye', [side * 0.22, 1.3, 0.6], [0.105, 0.17, 0.04], dark);
  sphere(ghost, 'catchlight', [side * 0.22 - 0.025, 1.36, 0.64], [0.028, 0.04, 0.01], light);
}
sphere(ghost, 'mouth', [0, 1.02, 0.65], [0.06, 0.085, 0.025], dark);
await exportModel('ghost.glb', ghost);

const tree = new Group(),
  wood = [],
  leaves = [];
const up = new Vector3(0, 1, 0);
const branch = (from, to, radius) => {
  const a = new Vector3(...from),
    b = new Vector3(...to),
    direction = b.clone().sub(a);
  const geometry = new CylinderGeometry(radius * 0.58, radius, direction.length(), 12);
  geometry.applyMatrix4(
    new Matrix4().compose(
      a.add(b).multiplyScalar(0.5),
      new Quaternion().setFromUnitVectors(up, direction.normalize()),
      new Vector3(1, 1, 1)
    )
  );
  wood.push(geometry);
};
branch([0, 0, 0], [0.12, 3.2, 0], 0.22);
for (let i = 0; i < 13; i++) {
  const angle = i * 2.4,
    radius = 0.45 + (i % 3) * 0.35;
  const x = Math.cos(angle) * radius,
    z = Math.sin(angle) * radius;
  const y = 2.6 + Math.sin(i * 3.1) * 0.5;
  branch([0.08, 1.5 + (i % 3) * 0.3, 0], [x, y, z], 0.075);
  const crown = new SphereGeometry(1, 16, 12);
  crown.applyMatrix4(
    new Matrix4().compose(new Vector3(x, y, z), new Quaternion(), new Vector3(0.9, 0.7, 0.85))
  );
  leaves.push(crown);
}
tree.add(new Mesh(mergeGeometries(wood), material('#5e4d3e', 0.94)));
tree.add(new Mesh(mergeGeometries(leaves), material('#507356', 0.87)));
await exportModel('tree.glb', tree);
