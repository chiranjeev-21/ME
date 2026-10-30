const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public', 'assets', 'worlds');
function model(name) {
  const buffer = fs.readFileSync(path.join(root, `${name}.glb`));
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF');
  return JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)));
}

test('real walking characters contain playable skinned animation and embedded resources', () => {
  for (const name of ['walker', 'robot']) {
    const data = model(name);
    assert.ok(data.skins.length > 0);
    assert.ok(data.animations.some(animation => animation.channels.length > 4));
    for (const animation of data.animations) {
      for (const sampler of animation.samplers) assert.ok(data.accessors[sampler.input].max[0] > 0);
    }
    assert.ok(data.buffers.every(buffer => !buffer.uri));
    assert.ok((data.images || []).every(image => image.bufferView !== undefined));
    assert.equal(data.extensionsRequired?.includes('KHR_draco_mesh_compression') || false, false);
  }
});

test('the original creature assets have real surfaces and articulated alien limbs', () => {
  const alien = model('alien');
  for (const name of ['leftArm', 'rightArm', 'leftLeg', 'rightLeg']) {
    assert.ok(alien.nodes.some(node => node.name === name));
  }
  const ghost = model('ghost');
  assert.ok(ghost.nodes.some(node => node.name === 'spectralCloth' && node.mesh !== undefined));
  assert.ok(model('tree').meshes.length >= 2);
});

test('all local scene assets fit the bounded download budget and carry credits', async () => {
  const { WORLD_ASSETS } = await import('../src/universe/scene/assets/catalog.ts');
  let bytes = 0;
  for (const url of Object.values(WORLD_ASSETS)) {
    assert.match(url, /^\/assets\/worlds\/[\w.-]+$/);
    const file = path.join(root, path.basename(url));
    assert.ok(fs.statSync(file).size > 1000);
    bytes += fs.statSync(file).size;
  }
  assert.ok(bytes < 5 * 1024 * 1024, `${bytes} bytes exceeds the complete asset budget`);
  const credits = fs.readFileSync(path.join(root, '..', 'CREDITS.txt'), 'utf8');
  for (const source of ['NASA', 'Cesium', 'Quaternius', 'Poly Haven', 'not original Hush'])
    assert.ok(credits.includes(source));
});

test('citizens physically travel along bounded routes and face the route tangent', async () => {
  const { citizenPose } = await import('../src/universe/scene/assets/population.ts');
  for (const kind of ['human', 'robot', 'alien', 'ghost']) {
    const start = citizenPose(kind, 0, 0);
    const later = citizenPose(kind, 0, 4);
    assert.notDeepEqual(start.position, later.position);
    for (let time = 0; time < 100; time += 3) {
      const pose = citizenPose(kind, 1, time);
      assert.ok([...pose.position, pose.rotation, pose.stride].every(Number.isFinite));
      assert.ok(pose.position.every(value => Math.abs(value) < 30));
    }
  }
});

test('reduced motion freezes inhabitants, including their articulated stride', async () => {
  const { citizenPose } = await import('../src/universe/scene/assets/population.ts');
  for (const kind of ['human', 'robot', 'alien', 'ghost']) {
    assert.deepEqual(citizenPose(kind, 1, 0, true), citizenPose(kind, 1, 80, true));
    assert.equal(citizenPose(kind, 1, 80, true).stride, 0);
  }
});

test('late-loading glTF surfaces join the current scroll fade and restore correctly', async () => {
  const { Group, Mesh, BoxGeometry, MeshStandardMaterial } = await import('three');
  const { createExpeditionLayer } = await import('../src/universe/scene/expeditionLayer.ts');
  const root = new Group();
  const first = new MeshStandardMaterial();
  root.add(new Mesh(new BoxGeometry(), first));
  const layer = createExpeditionLayer(root);
  layer.setOpacity(0.25);
  const late = new MeshStandardMaterial({ opacity: 0.8 });
  root.add(new Mesh(new BoxGeometry(), late));
  layer.refresh();
  assert.equal(late.opacity, 0.2);
  assert.equal(first.opacity, 0.25);
  layer.setOpacity(0);
  assert.equal(late.opacity, 0);
  layer.dispose();
  assert.equal(late.opacity, 0.8);
  assert.equal(late.transparent, false);
  root.traverse(object => object.geometry?.dispose());
  first.dispose();
  late.dispose();
});
