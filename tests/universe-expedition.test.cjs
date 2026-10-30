const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  measureExpedition,
  frameAtScroll,
  expeditionJump,
  progressBetween,
} = require('../src/universe/journey/mapping.ts');

const measurements = [
  { world: 'about', top: 1000, readTop: 2250, readBottom: 6250 },
  { world: 'engineering', top: 6250, readTop: 7500, readBottom: 12500 },
];
const layout = measureExpedition(measurements, 1000, 128);

test('overview stays in orbit until the measured first approach reaches the viewport', () => {
  for (const y of [-500, 0, 349]) {
    assert.deepEqual(frameAtScroll(layout, y, 4), {
      world: null,
      phase: 'orbit',
      approach: 0,
      entry: 0,
      readProgress: 0,
      jumpRevision: 4,
    });
  }
  assert.equal(frameAtScroll(layout, 350).world, 'about');
  assert.equal(frameAtScroll(layout, 350).phase, 'approach');
});

test('approach, entry and reading use distinct measured boundaries without discontinuities', () => {
  const chapter = layout.chapters[0];
  assert.equal(chapter.approachStart, 350);
  assert.equal(chapter.entryStart, 1180);
  assert.equal(chapter.entryEnd, 1970);
  assert.equal(chapter.readStart, 2122);
  const approach = frameAtScroll(layout, (chapter.approachStart + chapter.entryStart) / 2);
  assert.equal(approach.approach, 0.5);
  assert.equal(approach.entry, 0);
  assert.equal(approach.phase, 'approach');
  const entry = frameAtScroll(layout, (chapter.entryStart + chapter.entryEnd) / 2);
  assert.equal(entry.approach, 1);
  assert.equal(entry.entry, 0.5);
  assert.equal(entry.phase, 'entry');
  assert.equal(frameAtScroll(layout, chapter.entryEnd).phase, 'inside');
  assert.equal(frameAtScroll(layout, chapter.entryEnd).readProgress, 0);
  assert.equal(frameAtScroll(layout, chapter.readStart).readProgress, 0);
  assert.equal(frameAtScroll(layout, chapter.readEnd).readProgress, 1);
});

test('reverse scrolling exactly retraces forward frames, including world boundaries', () => {
  const positions = [0, 350, 700, 1180, 1600, 1970, 2122, 4000, 5599, 5600, 6500, 9000];
  const forward = positions.map(y => frameAtScroll(layout, y));
  assert.deepEqual(
    [...positions].reverse().map(y => frameAtScroll(layout, y)),
    [...forward].reverse()
  );
  assert.equal(frameAtScroll(layout, 6122).world, 'about');
  assert.equal(frameAtScroll(layout, 6123).world, 'engineering');
  assert.equal(frameAtScroll(layout, 6123).approach, 0);
  assert.equal(frameAtScroll(layout, 6123).entry, 0);
  assert.equal(frameAtScroll(layout, 0).world, null);
});

test('long and dynamically resized documents move subsequent chapter anchors and reading progress', () => {
  const at4000 = frameAtScroll(layout, 4000);
  const expanded = measureExpedition(
    [
      { ...measurements[0], readBottom: 14250 },
      { ...measurements[1], top: 14250, readTop: 15500, readBottom: 20500 },
    ],
    1000,
    128
  );
  assert.ok(frameAtScroll(expanded, 4000).readProgress < at4000.readProgress);
  assert.equal(frameAtScroll(expanded, 10000).world, 'about');
  assert.equal(frameAtScroll(expanded, 14123).world, 'engineering');
  const contracted = measureExpedition(
    [
      { ...measurements[0], readBottom: 3250 },
      { ...measurements[1], top: 3250, readTop: 4500, readBottom: 9500 },
    ],
    1000,
    128
  );
  assert.equal(frameAtScroll(contracted, 4000).world, 'engineering');
});

test('viewport and header changes are measured rather than assuming fixed document heights', () => {
  const resized = measureExpedition(measurements, 600, 112);
  assert.equal(resized.chapters[0].approachStart, 610);
  assert.equal(resized.chapters[0].readStart, 2138);
  assert.equal(resized.chapters[0].readEnd, 6138);
  assert.equal(frameAtScroll(resized, 600).phase, 'orbit');
  assert.equal(frameAtScroll(layout, 600).phase, 'approach');
});

test('all eight chapters hold their world through reading and hand off at the next measured approach', () => {
  const worlds = [
    'about',
    'engineering',
    'ai-lab',
    'projects',
    'creative',
    'hush',
    'writing',
    'contact',
  ];
  let top = 900;
  const chapters = worlds.map((world, index) => {
    const readTop = top + 1125;
    const readBottom = readTop + 1000 + index * 700;
    const measurement = { world, top, readTop, readBottom };
    top = readBottom;
    return measurement;
  });
  const expedition = measureExpedition(chapters, 900, 128);
  for (let index = 0; index < worlds.length; index++) {
    const chapter = expedition.chapters[index];
    assert.equal(frameAtScroll(expedition, chapter.approachStart).world, worlds[index]);
    assert.equal(frameAtScroll(expedition, chapter.readStart).world, worlds[index]);
    assert.equal(frameAtScroll(expedition, chapter.readEnd).world, worlds[index]);
    const next = expedition.chapters[index + 1];
    if (next) {
      assert.equal(frameAtScroll(expedition, next.approachStart - 1).world, worlds[index]);
      assert.equal(frameAtScroll(expedition, next.approachStart).world, worlds[index + 1]);
    }
  }
  assert.equal(frameAtScroll(expedition, top + 10000).world, 'contact');
});

test('direct read and approach jumps increment revisions and compute the destination synchronously', () => {
  const read = expeditionJump(layout, 'engineering', 'read', 8);
  assert.equal(read.top, 7372);
  assert.deepEqual(read.frame, {
    world: 'engineering',
    phase: 'inside',
    approach: 1,
    entry: 1,
    readProgress: 0,
    jumpRevision: 9,
  });

  const approach = expeditionJump(layout, 'about', 'approach', read.frame.jumpRevision);
  assert.equal(approach.top, 350);
  assert.equal(approach.frame.phase, 'approach');
  assert.equal(approach.frame.approach, 0);
  assert.equal(approach.frame.jumpRevision, 10);
  const overview = expeditionJump(layout, null, 'approach', 10);
  assert.equal(overview.top, 0);
  assert.equal(overview.frame.world, null);
  assert.equal(overview.frame.phase, 'orbit');
  assert.equal(overview.frame.jumpRevision, 11);
  assert.equal(expeditionJump(layout, 'contact', 'read', 0), null);
});

test('interactive chapter tails keep their own scenery until the document clears the header', () => {
  const tail = measurements[0].readBottom - 650;
  assert.equal(frameAtScroll(layout, tail).world, 'about');
  assert.ok(frameAtScroll(layout, tail).readProgress < 0.92);
  assert.equal(frameAtScroll(layout, measurements[0].readBottom - 128).world, 'about');
  assert.equal(frameAtScroll(layout, measurements[0].readBottom - 127).world, 'engineering');
  assert.ok(layout.chapters[1].entryStart - layout.chapters[1].approachStart >= 600);
});

test('clamped direct jumps describe the actual reachable position, not a stale requested world', () => {
  const jump = expeditionJump(layout, 'engineering', 'read', 1, false, 200);
  assert.equal(jump.top, 200);
  assert.equal(jump.frame.world, null);
  assert.equal(jump.frame.phase, 'orbit');
  assert.equal(jump.frame.jumpRevision, 2);
  const exhausted = frameAtScroll(layout, 100000);
  assert.equal(exhausted.world, 'engineering');
  assert.equal(exhausted.readProgress, 1);
});

test('native smooth destinations preserve jumpRevision instead of announcing a scene teleport', () => {
  const smooth = expeditionJump(layout, 'about', 'approach', 12, false, Infinity, 'smooth');
  assert.equal(smooth.top, 350);
  assert.equal(smooth.frame.world, 'about');
  assert.equal(smooth.frame.jumpRevision, 12);
  assert.equal(frameAtScroll(layout, 200, smooth.frame.jumpRevision).world, null);
  assert.equal(frameAtScroll(layout, 600, smooth.frame.jumpRevision).phase, 'approach');
});

test('reduced motion is a readable chapter path with no approach or entry sequence', () => {
  const readable = measureExpedition(
    [
      { world: 'about', top: 1000, readTop: 1200, readBottom: 3500 },
      { world: 'engineering', top: 3500, readTop: 3700, readBottom: 6500 },
    ],
    800,
    112
  );
  assert.equal(frameAtScroll(readable, 887, 0, true).world, null);
  assert.equal(frameAtScroll(readable, 888, 0, true).phase, 'inside');
  assert.equal(frameAtScroll(readable, 888, 0, true).entry, 1);
  assert.equal(frameAtScroll(readable, 3387, 0, true).world, 'about');
  assert.equal(frameAtScroll(readable, 3388, 0, true).world, 'engineering');
  const jump = expeditionJump(readable, 'engineering', 'approach', 2, true);
  assert.equal(jump.top, 3388);
  assert.equal(jump.frame.phase, 'inside');
  assert.equal(jump.frame.jumpRevision, 3);
});

test('empty, invalid, short and unordered measurements stay finite and bounded', () => {
  const empty = measureExpedition([], 0, -20);
  assert.equal(frameAtScroll(empty, 100).phase, 'orbit');
  const measured = measureExpedition(
    [...[...measurements].reverse(), { world: 'contact', top: NaN, readTop: 10, readBottom: 20 }],
    1000,
    128
  );
  assert.deepEqual(
    measured.chapters.map(chapter => chapter.world),
    ['about', 'engineering']
  );
  const short = measureExpedition(
    [{ world: 'about', top: 1000, readTop: 1050, readBottom: 1050 }],
    1000,
    128
  );
  for (const position of [-1, 0, 500, 922, 1000, 1e9, NaN]) {
    const result = frameAtScroll(short, position);
    for (const value of [result.approach, result.entry, result.readProgress])
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
  }
  assert.equal(frameAtScroll(short, short.chapters[0].readStart).entry, 1);
  assert.equal(progressBetween(10, 10, 10), 1);
  assert.equal(progressBetween(20, 10, 10), 1);
});
