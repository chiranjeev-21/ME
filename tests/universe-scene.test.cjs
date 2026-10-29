const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  orbitPosition,
  overviewPose,
  focusPose,
  cameraTransitionProgress,
  seededRandom,
} = require('../src/universe/scene/math.ts');

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
