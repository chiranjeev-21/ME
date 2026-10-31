const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let camera;
let physics;
before(async () => {
  camera = await import('../src/scenes/orbital/camera.ts');
  physics = await import('../src/scenes/strings/physics.ts');
});

const length = v => Math.hypot(v[0], v[1], v[2]);

test('camera frames are orthonormal and finite across every preset and aspect ratio', () => {
  const { PRESETS, buildFrame, mixPose, dot } = camera;
  for (const [from, to] of [
    [PRESETS.dawnStart, PRESETS.dawnEnd],
    [PRESETS.eclipseStart, PRESETS.eclipseEnd],
  ]) {
    for (const t of [0, 0.25, 0.5, 1, -2, 7, Number.NaN]) {
      for (const aspect of [0.46, 1, 1.6, 2.4]) {
        const frame = buildFrame(mixPose(from, to, t), aspect);
        for (const v of [frame.forward, frame.right, frame.up, frame.sun])
          assert.ok(Math.abs(length(v) - 1) < 1e-6);
        assert.ok(Math.abs(dot(frame.forward, frame.up)) < 1e-6);
        assert.ok(Math.abs(dot(frame.forward, frame.right)) < 1e-6);
        assert.ok(length(frame.position) > 1, 'the camera stays above the surface');
        assert.ok(
          [...frame.position, ...frame.sunScreen, frame.sunVisibility].every(Number.isFinite)
        );
      }
    }
  }
});

test('the opening scroll is a sunrise: hidden behind the limb at the top, clear by the end', () => {
  const { PRESETS, buildFrame, mixPose } = camera;
  const at = t => buildFrame(mixPose(PRESETS.dawnStart, PRESETS.dawnEnd, t), 1.6).sunVisibility;
  assert.equal(at(0), 0);
  assert.equal(at(1), 1);
  let previous = -1;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const visibility = at(t);
    assert.ok(visibility >= previous - 1e-9, 'sunrise never reverses while scrolling forward');
    previous = visibility;
  }
});

test('the opening looks across southern India and the closing eclipse keeps the sun at the limb', () => {
  const { PRESETS, buildFrame, surfacePoint, dot } = camera;
  const bengaluru = surfacePoint(12.97, 77.59);
  const dawn = buildFrame(PRESETS.dawnEnd, 1.6);
  const toCity = dawn.position.map((value, index) => bengaluru[index] - value);
  const distance = length(toCity);
  assert.ok(
    dot(
      toCity.map(v => v / distance),
      dawn.forward
    ) > 0.9,
    'Bengaluru is ahead of the camera'
  );
  const eclipse = buildFrame(PRESETS.eclipseEnd, 1.6);
  assert.ok(eclipse.sunVisibility > 0 && eclipse.sunVisibility < 1, 'the sun grazes the limb');
});

test('a plucked string is pinned at both ends, oscillates, and rings down', () => {
  const { createString, pluck, displacement, energy } = physics;
  const string = createString(0);
  pluck(string, 0.3, 20);
  assert.equal(displacement(string, 0), 0);
  assert.ok(Math.abs(displacement(string, 1)) < 1e-9);
  assert.ok(
    Math.abs(displacement(string, 0.3)) > 15,
    'the pluck point starts near the pluck amplitude'
  );
  const initial = energy(string);
  string.age = 0.5;
  const later = energy(string);
  string.age = 6;
  assert.ok(
    later < initial && energy(string) < initial * 0.05,
    'higher modes decay and the string settles'
  );
});

test('Karplus–Strong synthesis is pitched, bounded, and deterministic', () => {
  const { karplusStrong, TUNING } = physics;
  const rate = 44100;
  const a = karplusStrong(TUNING[1].hz, rate, 1);
  const b = karplusStrong(TUNING[1].hz, rate, 1);
  assert.deepEqual(a, b);
  assert.ok(a.every(sample => Number.isFinite(sample) && Math.abs(sample) <= 0.9 + 1e-6));
  // Autocorrelation peaks at the string's period (110 Hz → ~401 samples).
  const period = Math.round(rate / TUNING[1].hz);
  const correlate = lag => {
    let sum = 0;
    for (let i = 2000; i < 12000; i++) sum += a[i] * a[i + lag];
    return sum;
  };
  assert.ok(correlate(period) > correlate(Math.round(period * 1.5)) * 2);
});
