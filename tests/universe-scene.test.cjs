const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} = require('three');
const {
  orbitPosition,
  overviewPose,
  focusPose,
  cameraTransitionProgress,
  seededRandom,
} = require('../src/universe/scene/math.ts');
const {
  chapterReveal,
  expeditionProgress,
  expeditionVisibility,
  interiorLandmark,
  interiorPose,
  interiorTransform,
  projectBeaconPosition,
  scrollCameraPose,
  signalSeed,
} = require('../src/universe/scene/scrollMath.ts');
const { WORLDS } = require('../src/universe/worlds.ts');
const { createExpeditionLayer } = require('../src/universe/scene/expeditionLayer.ts');
const {
  createGhostGeometry,
  createCognitionGeometry,
} = require('../src/universe/scene/formGeometry.ts');

test('celestial ghost is a synchronous scalloped body that fits its framing and restores picking', () => {
  for (const high of [false, true]) {
    const root = new Group();
    const geometry = createGhostGeometry(high);
    const material = new MeshStandardMaterial();
    const ghost = new Mesh(geometry, material);
    root.add(ghost);
    root.updateMatrixWorld(true);
    const positions = geometry.getAttribute('position');
    let minHem = 0;
    let maxHem = -1;
    for (let index = 0; index < positions.count; index++) {
      const point = new Vector3().fromBufferAttribute(positions, index);
      assert.ok(point.length() <= 1, 'cloth stays inside the configured radius');
      if (point.y < -0.5) {
        minHem = Math.min(minHem, point.y);
        maxHem = Math.max(maxHem, point.y);
      }
    }
    assert.ok(maxHem - minHem > 0.15, 'a visible scalloped hem, not a spherical silhouette');
    const raycaster = new Raycaster(new Vector3(0, 0, 3), new Vector3(0, 0, -1), 0, 10);
    const hits = () => raycaster.intersectObject(root, true);
    const initial = hits();
    assert.ok(initial.length > 0, 'the original cloth surface is pickable before any assets load');
    assert.ok(initial[0].point.z > 0.4 && initial[0].point.z < 0.5);
    const layer = createExpeditionLayer(root);
    try {
      layer.setOpacity(0);
      assert.equal(hits().length, 0);
      layer.setOpacity(1);
      assert.ok(hits().length > 0, 'scrolling back restores the ghost raycast, not an old sphere');
      assert.equal(material.opacity, 1);
    } finally {
      layer.dispose();
      geometry.dispose();
      material.dispose();
    }
  }
});

test('folded cognition geometry has real surface relief and bounded, finite normals at both qualities', () => {
  for (const high of [false, true]) {
    const geometry = createCognitionGeometry(high);
    try {
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      let minimum = Infinity;
      let maximum = 0;
      for (let index = 0; index < positions.count; index++) {
        const radius = new Vector3().fromBufferAttribute(positions, index).length();
        minimum = Math.min(minimum, radius);
        maximum = Math.max(maximum, radius);
        assert.ok(
          [normals.getX(index), normals.getY(index), normals.getZ(index)].every(Number.isFinite)
        );
      }
      assert.ok(maximum - minimum > 0.08);
      assert.ok(maximum <= 1.066);
    } finally {
      geometry.dispose();
    }
  }
});

const orbit = { orbitRadius: 13.6, phase: 1.65, inclination: 0.04, orbitalSpeed: 0.0035 };
const tangent = Math.tan((21 * Math.PI) / 180);

function projected(point, pose, aspect) {
  const depth = pose.position[2] - point[2];
  return {
    x: (point[0] - pose.target[0]) / (depth * tangent * aspect),
    y: (point[1] - pose.target[1]) / (depth * tangent),
  };
}

test('orbit motion is deterministic, continuous, and stays on its inclined elliptical guide', () => {
  const a = orbitPosition(orbit, 120);
  assert.deepEqual(a, orbitPosition(orbit, 120));
  assert.notDeepEqual(a, orbitPosition(orbit, 121));
  const angle = orbit.phase + 120 * orbit.orbitalSpeed;
  assert.ok(Math.abs(a[0] / orbit.orbitRadius - Math.cos(angle)) < 1e-12);
  assert.ok(Math.abs(a[2] - a[1] * (0.16 / 0.57) - orbit.inclination * orbit.orbitRadius) < 1e-12);
  const mobile = orbitPosition(orbit, 120, true);
  assert.ok(Math.abs(mobile[0] - a[0] * 0.56) < 1e-12);
});

test('entered overview fits a complete orbit on narrow mobile, and desktop fits both modes', () => {
  for (const aspect of [0.35, 0.46, 0.75, 1, 1.33, 1.78, 2.4]) {
    const mobile = aspect < 0.95;
    for (const entered of [false, true]) {
      if (mobile && !entered) continue;
      const pose = overviewPose(aspect, entered);
      for (let i = 0; i < 80; i++) {
        const point = orbitPosition({ ...orbit, phase: (i / 80) * Math.PI * 2 }, 0, mobile);
        const screen = projected(point, pose, aspect);
        assert.ok(Math.abs(screen.x) < 0.99, `horizontal fit: ${aspect}, ${entered}`);
        assert.ok(Math.abs(screen.y) < 0.93, `vertical fit: ${aspect}, ${entered}`);
      }
    }
  }
});

test('mobile landing keeps the Sun below the intro, then Explore recenters the whole system', () => {
  for (const aspect of [0.35, 0.46, 0.75]) {
    const landing = overviewPose(aspect, false);
    const entered = overviewPose(aspect, true);
    const landingSun = projected([0, 0, 0], landing, aspect);
    const enteredSun = projected([0, 0, 0], entered, aspect);
    const landingViewportY = (1 - landingSun.y) / 2;
    assert.ok(landingViewportY >= 0.8 && landingViewportY <= 0.88);
    assert.ok(Math.abs(enteredSun.y) < 0.05);
    const pick = projected(orbitPosition(orbit, 0, true), landing, aspect);
    assert.ok(Math.abs(pick.x) < 0.95 && Math.abs(pick.y) < 0.95);
    assert.notDeepEqual(landing.target, entered.target);
  }
});

test('entering recenters the overview while preserving landing identity space', () => {
  const landing = projected([0, 0, 0], overviewPose(1.78, false), 1.78);
  const entered = projected([0, 0, 0], overviewPose(1.78, true), 1.78);
  assert.ok(landing.x > 0.2);
  assert.ok(Math.abs(entered.x) < 1e-12);
});

test('focus framing reserves the right panel on desktop and lower sheet on mobile', () => {
  const center = [4.1, -3.2, 1.7];
  for (const radius of [0.53, 0.83, 1.1]) {
    for (const aspect of [0.35, 0.46, 0.75, 1.2, 1.78, 2.4]) {
      const pose = focusPose(center, radius, aspect);
      const screen = projected(center, pose, aspect);
      if (aspect >= 0.95) {
        assert.ok(Math.abs(screen.x + 0.51) < 1e-12);
        assert.ok(Math.abs(screen.y) < 1e-12);
      } else {
        assert.ok(Math.abs(screen.x) < 1e-12);
        assert.ok(screen.y > 0.2 && screen.y < 0.5);
      }
      assert.ok(pose.position[2] > center[2] + radius * 4);
    }
  }
});

test('camera easing completes after 1.1 seconds even with sparse frames or a suspended tab', () => {
  assert.equal(cameraTransitionProgress(-100), 0);
  assert.equal(cameraTransitionProgress(0), 0);
  assert.equal(cameraTransitionProgress(550), 0.5);
  assert.ok(cameraTransitionProgress(1099) < 1);
  assert.equal(cameraTransitionProgress(1100), 1);
  assert.equal(cameraTransitionProgress(8000), 1);
  for (const samples of [
    [0, 16, 550, 1100],
    [0, 550, 1600],
    [0, 60000],
  ]) {
    const progress = samples.map(elapsed => cameraTransitionProgress(elapsed));
    assert.equal(progress.at(-1), 1);
    assert.ok(
      progress.every((value, i) => value >= 0 && value <= 1 && (!i || value >= progress[i - 1]))
    );
  }
});

test('procedural detail seeds reproduce assets without sharing a repeating seed sequence', () => {
  const a = seededRandom(42);
  const b = seededRandom(42);
  const c = seededRandom(43);
  const samples = Array.from({ length: 12 }, () => a());
  assert.deepEqual(
    samples,
    Array.from({ length: 12 }, () => b())
  );
  assert.notDeepEqual(
    samples,
    Array.from({ length: 12 }, () => c())
  );
  assert.ok(samples.every(value => value >= 0 && value < 1));
});

function frame(world, phase, approach = 1, entry = 0, readProgress = 0) {
  return { world, phase, approach, entry, readProgress, jumpRevision: 0 };
}

function cameraProjection(point, pose, aspect) {
  const camera = new PerspectiveCamera(42, aspect, 0.005, 350);
  camera.position.fromArray(pose.position);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  return new Vector3(...point).project(camera);
}

test('mobile journey orbit and initial approaches frame the unchanged Sun radius between intro and dock', () => {
  for (const aspect of [0.35, 0.46, 390 / 664, 0.75]) {
    const landing = overviewPose(aspect, false);
    const overview = scrollCameraPose(frame(null, 'orbit'), undefined, undefined, aspect);
    const sun = cameraProjection([0, 0, 0], overview, aspect);
    const sunViewportY = (1 - sun.y) / 2;
    assert.ok(
      sunViewportY >= 0.75 && sunViewportY <= 0.78,
      'Sun fits below intro text and above the fixed selector'
    );
    const radius = cameraProjection([1.58, 0, 0], overview, aspect).distanceTo(sun);
    const legacyRadius = cameraProjection([1.58, 0, 0], landing, aspect).distanceTo(
      cameraProjection([0, 0, 0], landing, aspect)
    );
    assert.ok(Math.abs(radius - legacyRadius) < 1e-12, 'journey framing does not resize the Sun');
    for (const world of WORLDS) {
      const center = orbitPosition(world, 0, true);
      assert.deepEqual(
        scrollCameraPose(frame(world.id, 'approach', 0), world, center, aspect),
        overview,
        'URL/semantic world changes cannot recenter the mobile endpoint'
      );
      const nearStart = scrollCameraPose(frame(world.id, 'approach', 0.001), world, center, aspect);
      assert.ok(
        new Vector3(...nearStart.position).distanceTo(new Vector3(...overview.position)) < 0.001
      );
    }
  }
  for (const aspect of [1, 1.78, 2.4]) {
    assert.deepEqual(
      scrollCameraPose(frame(null, 'orbit'), undefined, undefined, aspect),
      overviewPose(aspect, true),
      'desktop retains its centered composition'
    );
  }
});

test('native scroll directly and reversibly grows the actual projected planet radius', () => {
  for (const aspect of [0.35, 0.75, 1, 1.78, 2.4]) {
    for (const world of WORLDS) {
      const center = orbitPosition(world, 42, aspect < 0.95);
      const samples = [0, 0.15, 0.4, 0.7, 1];
      const poses = samples.map(approach =>
        scrollCameraPose(frame(world.id, 'approach', approach), world, center, aspect)
      );
      const radii = poses.map(pose => {
        const origin = cameraProjection(center, pose, aspect);
        const limb = cameraProjection(
          [center[0] + world.radius, center[1], center[2]],
          pose,
          aspect
        );
        return limb.distanceTo(origin);
      });
      assert.ok(radii.at(-1) > radii[0] * 5, `${world.id}: substantial real approach`);
      assert.ok(radii.every((radius, i) => !i || radius > radii[i - 1]));
      for (let i = samples.length - 1; i >= 0; i--) {
        assert.deepEqual(
          scrollCameraPose(frame(world.id, 'approach', samples[i]), world, center, aspect),
          poses[i],
          'reverse scrolling recovers the same pose without a timer'
        );
      }
    }
  }
});

test('approach and entry endpoints join continuously and entry crosses the actual planet surface', () => {
  for (const world of WORLDS) {
    const center = orbitPosition(world, 0);
    for (const aspect of [0.35, 0.75, 1, 1.78, 2.8]) {
      const approach = scrollCameraPose(frame(world.id, 'approach'), world, center, aspect);
      assert.deepEqual(
        approach,
        scrollCameraPose(frame(world.id, 'entry', 1, 0), world, center, aspect)
      );
      assert.ok(
        new Vector3(...approach.position).distanceTo(new Vector3(...center)) > world.radius
      );
      const inside = scrollCameraPose(frame(world.id, 'inside'), world, center, aspect);
      assert.deepEqual(
        inside,
        scrollCameraPose(frame(world.id, 'entry', 1, 1), world, center, aspect)
      );
      assert.ok(
        new Vector3(...inside.position).distanceTo(new Vector3(...center)) < world.radius,
        `${world.id}: camera is geometrically inside the old sphere`
      );
      assert.deepEqual(expeditionVisibility(frame(world.id, 'inside')), {
        exterior: 0,
        interior: 1,
      });
      const sequence = [0, 0.2, 0.5, 0.8, 1, 0.8, 0.5, 0.2, 0];
      const poses = sequence.map(entry =>
        scrollCameraPose(frame(world.id, 'entry', 1, entry), world, center, aspect)
      );
      for (let i = 0; i < 4; i++) assert.deepEqual(poses[i], poses[8 - i]);
    }
  }
});

test('each entered landmark is in the actual environment and framed away from documents', () => {
  for (const world of WORLDS) {
    const center = orbitPosition(world, 0);
    const transform = interiorTransform(center, world.radius);
    const landmark = interiorLandmark(world.id).map(
      (coordinate, i) => transform.position[i] + coordinate * transform.scale
    );
    assert.ok(new Vector3(...landmark).distanceTo(new Vector3(...center)) < world.radius);
    for (const aspect of [0.35, 0.46, 0.75, 1, 1.78, 2.8]) {
      for (const read of [0, 0.5, 1]) {
        const pose = interiorPose(world.id, center, world.radius, aspect, read);
        const screen = cameraProjection(landmark, pose, aspect);
        assert.ok(screen.z > -1 && screen.z < 1, `${world.id}: rendered landmark depth`);
        if (aspect >= 0.95) {
          assert.ok(screen.x < -0.3 && screen.x > -0.7, `${world.id}: left scenic half`);
          assert.ok(Math.abs(screen.y) < 0.6);
        } else {
          assert.ok(Math.abs(screen.x) < 0.01);
          assert.ok(screen.y > 0.2 && screen.y < 0.65, `${world.id}: above mobile document`);
        }
      }
    }
  }
});

test('scroll poses stay finite and bounded for overscroll, invalid progress and narrow viewports', () => {
  for (const world of WORLDS) {
    const center = orbitPosition(world, 900, true);
    for (const aspect of [0, 0.2, 0.46, 1.78, 3, NaN, Infinity]) {
      for (const progress of [-Infinity, -10, 0, 0.4, 1, 90, NaN, Infinity]) {
        for (const phase of ['orbit', 'approach', 'entry', 'inside']) {
          const pose = scrollCameraPose(
            frame(world.id, phase, progress, progress, progress),
            world,
            center,
            aspect
          );
          assert.ok(
            [...pose.position, ...pose.target].every(n => Number.isFinite(n) && Math.abs(n) < 200)
          );
        }
      }
    }
  }
  assert.deepEqual(
    scrollCameraPose(frame(null, 'orbit'), undefined, undefined, 1.78, true),
    overviewPose(1.78, true)
  );
});

test('reduced motion is static within each space and switches immediately, including deep links', () => {
  for (const world of WORLDS) {
    const center = orbitPosition(world, 0);
    const pose = current => scrollCameraPose(current, world, center, 1.78, true, true);
    assert.deepEqual(
      pose(frame(world.id, 'approach', 0.01)),
      pose(frame(world.id, 'approach', 0.99))
    );
    assert.deepEqual(
      pose(frame(world.id, 'inside', 1, 1, 0)),
      pose(frame(world.id, 'inside', 1, 1, 1))
    );
    assert.deepEqual(pose(frame(world.id, 'entry', 1, 0.5)), pose(frame(world.id, 'inside')));
    assert.deepEqual(expeditionProgress(frame(world.id, 'entry', 1, 0.49), true), {
      approach: 1,
      entry: 0,
      read: 0,
    });
    assert.deepEqual(expeditionVisibility(frame(world.id, 'inside'), true), {
      exterior: 0,
      interior: 1,
    });
  }
});

test('spaceport beacon placements stay distinct and project into the usable scenery', () => {
  const world = WORLDS.find(world => world.id === 'projects');
  const center = orbitPosition(world, 0);
  const transform = interiorTransform(center, world.radius);
  for (const aspect of [0.46, 1.78]) {
    const mobile = aspect < 0.95;
    const positions = Array.from({ length: mobile ? 3 : 6 }, (_, index) =>
      projectBeaconPosition(index, mobile)
    );
    assert.equal(new Set(positions.map(point => point.join(','))).size, positions.length);
    for (const point of positions) {
      const position = point.map((n, i) => transform.position[i] + n * transform.scale);
      const projected = cameraProjection(
        position,
        interiorPose(world.id, center, world.radius, aspect),
        aspect
      );
      assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1);
      assert.ok(projected.z > -1 && projected.z < 1);
    }
  }
  assert.equal(signalSeed('seed from the creative UI'), signalSeed('seed from the creative UI'));
  assert.notEqual(signalSeed('seed A'), signalSeed('seed B'));
});

test('returning to overview restores actual solar raycasting, materials and shader opacity', () => {
  const root = new Group();
  const geometry = new SphereGeometry(1, 16, 12);
  const material = new MeshStandardMaterial({ opacity: 0.6 });
  const mesh = new Mesh(geometry, material);
  const shader = new ShaderMaterial({ uniforms: { uOpacity: { value: 1 } }, depthWrite: false });
  const glow = new Mesh(geometry, shader);
  glow.position.x = 4;
  root.add(mesh, glow);
  root.updateMatrixWorld(true);
  const raycaster = new Raycaster(new Vector3(0, 0, 3), new Vector3(0, 0, -1), 0, 10);
  const raycast = mesh.raycast;
  const layer = createExpeditionLayer(root);
  try {
    layer.setOpacity(expeditionVisibility(frame('about', 'inside')).exterior);
    assert.equal(root.visible, false);
    assert.equal(
      raycaster.intersectObject(root, true).length,
      0,
      'hidden spheres cannot steal clicks'
    );
    assert.equal(shader.uniforms.uOpacity.value, 0);
    layer.setOpacity(0.5);
    assert.equal(material.opacity, 0.3);
    assert.equal(material.depthWrite, false);
    assert.equal(shader.uniforms.uOpacity.value, 0.5);
    layer.setOpacity(expeditionVisibility(frame(null, 'orbit')).exterior);
    assert.equal(root.visible, true);
    assert.equal(mesh.raycast, raycast);
    assert.ok(
      raycaster.intersectObject(root, true).length > 0,
      'revealed sphere has real ray hits'
    );
    assert.equal(material.opacity, 0.6);
    assert.equal(material.depthWrite, true);
    assert.equal(shader.uniforms.uOpacity.value, 1);
    layer.setOpacity(0);
    layer.dispose();
    assert.equal(material.transparent, false);
    assert.equal(material.opacity, 0.6);
    assert.equal(shader.depthWrite, false);
    assert.equal(shader.uniforms.uOpacity.value, 1);
    assert.equal(root.visible, true);
    assert.ok(raycaster.intersectObject(root, true).length > 0, 'cleanup restores the legacy path');
  } finally {
    layer.dispose();
    geometry.dispose();
    material.dispose();
    shader.dispose();
  }
});

test('native chapter seams fade out and in reversibly without overlapping interiors or timers', () => {
  for (let index = 0; index < WORLDS.length - 1; index++) {
    const previous = WORLDS[index];
    const next = WORLDS[index + 1];
    const end = frame(previous.id, 'inside', 1, 1, 1);
    const start = frame(next.id, 'approach', 0);
    assert.deepEqual(expeditionVisibility(end), { exterior: 0, interior: 0 });
    assert.deepEqual(expeditionVisibility(start), { exterior: 0, interior: 0 });
    assert.equal(
      chapterReveal(end),
      chapterReveal(start),
      'camera switch occurs under the same black sky'
    );
    const reading = [0.92, 0.94, 0.98, 1];
    const approaching = [0, 0.03, 0.08, 0.12];
    const outgoing = reading.map(read => chapterReveal(frame(previous.id, 'inside', 1, 1, read)));
    const incoming = approaching.map(approach =>
      chapterReveal(frame(next.id, 'approach', approach))
    );
    assert.ok(outgoing.every((opacity, i) => !i || opacity < outgoing[i - 1]));
    assert.ok(incoming.every((opacity, i) => !i || opacity > incoming[i - 1]));
    for (let i = reading.length - 1; i >= 0; i--) {
      assert.equal(chapterReveal(frame(previous.id, 'inside', 1, 1, reading[i])), outgoing[i]);
      assert.equal(chapterReveal(frame(next.id, 'approach', approaching[i])), incoming[i]);
    }
    assert.deepEqual(expeditionVisibility(end, true), { exterior: 0, interior: 1 });
    assert.deepEqual(expeditionVisibility(start, true), { exterior: 1, interior: 0 });
  }
  assert.deepEqual(expeditionVisibility(frame('about', 'approach', 0)), {
    exterior: 1,
    interior: 0,
  });
  assert.deepEqual(expeditionVisibility(frame('contact', 'inside', 1, 1, 1)), {
    exterior: 0,
    interior: 1,
  });
});
