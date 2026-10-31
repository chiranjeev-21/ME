const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let music;
let physics;
let wav;
let song;
let format;
before(async () => {
  music = await import('../src/scenes/strings/music.ts');
  physics = await import('../src/scenes/strings/physics.ts');
  wav = await import('../src/scenes/strings/wav.ts');
  song = await import('../src/pages/Playbox/song.ts');
  format = await import('../src/pages/Playbox/format.ts');
});

const close = (actual, expected, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);

test('every string and fret sounds its equal-tempered pitch and is named for it', () => {
  const { fretHz, fretMidi, noteName, positionLabel, STRINGS, MAX_FRET } = music;
  for (let string = 0; string < STRINGS; string++) {
    assert.equal(fretHz(string, 0), physics.TUNING[string].hz);
    close(fretHz(string, 12), physics.TUNING[string].hz * 2);
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const ideal = 440 * 2 ** ((fretMidi(string, fret) - 69) / 12);
      assert.ok(Math.abs(fretHz(string, fret) / ideal - 1) < 0.001, `${string}/${fret}`);
    }
  }
  close(fretHz(0, 5), 110, 0.02);
  close(fretHz(4, 5), 329.63, 0.05);
  assert.equal(noteName(fretMidi(1, 3)), 'C3');
  assert.equal(noteName(fretMidi(0, 6)), 'A♯2');
  assert.equal(positionLabel(1, 3), 'A string, fret 3, C3');
  assert.equal(positionLabel(0, 0), 'Low E string, open, E2');
  assert.equal(positionLabel(5, 12), 'High E string, fret 12, E5');
});

test('common chord shapes are named, and anything uncertain is left unnamed', () => {
  const { chordName, recogniseChord, PRESETS } = music;
  for (const preset of PRESETS.filter(item => item.name !== 'Open'))
    assert.equal(chordName(preset.frets), preset.name, preset.label);
  assert.equal(chordName([1, 3, 3, 2, 1, 1]), 'F', 'F barre at the first fret');
  assert.equal(chordName([0, 2, 2, null, null, null]), 'E5', 'power chord');
  assert.equal(chordName([null, 2, 0, 0, 3, 3]), 'G/B', 'first inversion keeps its bass');
  assert.equal(chordName([null, 0, 2, 0, 1, 0]), 'Am7');
  assert.equal(chordName([null, 3, 2, 3, 1, 0]), 'C7', 'open C7 omits the fifth');
  assert.equal(chordName([null, null, 0, 2, 2, 2]), 'Dmaj7');
  assert.equal(chordName([null, null, 0, 2, 3, 0]), 'Dsus2');
  assert.equal(chordName([null, null, 0, 2, 3, 3]), 'Dsus4');
  assert.equal(recogniseChord([47, 50, 53]), 'Bdim');
  assert.equal(
    recogniseChord([48, 52, 56]),
    'Caug',
    'a symmetric chord takes its root from the bass'
  );

  assert.equal(chordName([0, 0, 0, 0, 0, 0]), undefined, 'open strings are not a common chord');
  assert.equal(chordName([null, null, 0, 0, 1, null]), undefined, 'Csus2 or Gsus4 over D');
  assert.equal(recogniseChord([48, 50, 52]), undefined, 'a cluster');
  assert.equal(recogniseChord([48, 50, 52, 55]), undefined, 'add9 is not supported');
  assert.equal(recogniseChord([48, 60]), undefined, 'an octave');
  assert.equal(recogniseChord([48]), undefined);
  assert.equal(recogniseChord([]), undefined);
  assert.equal(music.fretCode([null, 3, 2, 0, 1, 0]), 'x32010');
});

test('a down strum crosses low to high and an up strum high to low, a few ms apart', () => {
  const { planStrum, fretHz } = music;
  const c = [null, 3, 2, 0, 1, 0];
  const down = planStrum(c, { direction: 'down', spread: 25, velocity: 0.8, when: 10 });
  assert.deepEqual(
    down.map(note => note.string),
    [1, 2, 3, 4, 5]
  );
  down.forEach((note, order) => {
    close(note.time, 10 + order * 0.025, 1e-9);
    close(note.hz, fretHz(note.string, note.fret), 1e-9);
  });
  const up = planStrum(c, { direction: 'up', spread: 25, velocity: 0.8, when: 10 });
  assert.deepEqual(
    up.map(note => note.string),
    [5, 4, 3, 2, 1]
  );
  assert.ok(up[0].velocity < down[0].velocity, 'up strokes are lighter');
  for (const notes of [down, up])
    for (let i = 1; i < notes.length; i++) {
      assert.ok(notes[i].time > notes[i - 1].time);
      assert.ok(notes[i].velocity < notes[i - 1].velocity);
    }
  const clamped = planStrum([0, 0, 0, 0, 0, 0], { spread: 500, when: 0 });
  close(clamped[1].time, 0.06, 1e-9);
  assert.deepEqual(planStrum([null, null, null, null, null, null]), []);
});

test('the WAV encoder writes a valid 16-bit PCM RIFF file and clamps samples', () => {
  const { encodeWav } = wav;
  const samples = new Float32Array([0, 1, -1, 2, -2, 0.5, Number.NaN]);
  const buffer = encodeWav([samples], 44100);
  const view = new DataView(buffer);
  const text = (offset, length) => String.fromCharCode(...new Uint8Array(buffer, offset, length));
  assert.equal(buffer.byteLength, 44 + samples.length * 2);
  assert.equal(text(0, 4), 'RIFF');
  assert.equal(view.getUint32(4, true), 36 + samples.length * 2);
  assert.equal(text(8, 4), 'WAVE');
  assert.equal(text(12, 4), 'fmt ');
  assert.equal(view.getUint32(16, true), 16);
  assert.equal(view.getUint16(20, true), 1, 'PCM');
  assert.equal(view.getUint16(22, true), 1, 'mono');
  assert.equal(view.getUint32(24, true), 44100);
  assert.equal(view.getUint32(28, true), 88200, 'byte rate');
  assert.equal(view.getUint16(32, true), 2, 'block align');
  assert.equal(view.getUint16(34, true), 16, 'bits per sample');
  assert.equal(text(36, 4), 'data');
  assert.equal(view.getUint32(40, true), samples.length * 2);
  const pcm = Array.from({ length: samples.length }, (_, i) => view.getInt16(44 + i * 2, true));
  assert.deepEqual(pcm, [0, 32767, -32768, 32767, -32768, 16384, 0]);

  const stereo = new DataView(
    encodeWav([new Float32Array([0.25, 0.25, 0.25]), new Float32Array([-0.25, -0.25])], 48000)
  );
  assert.equal(stereo.getUint16(22, true), 2);
  assert.equal(stereo.getUint32(28, true), 48000 * 4);
  assert.equal(stereo.getUint32(40, true), 2 * 4, 'frames follow the shortest channel');
  assert.ok(stereo.getInt16(44, true) > 0 && stereo.getInt16(46, true) < 0, 'interleaved L, R');
});

test('a stored song round-trips, and malformed or out-of-range input is rejected', () => {
  const { parseSong, serializeSong, emptySong, MAX_STEPS } = song;
  const original = {
    bpm: 96,
    loop: false,
    steps: [
      { id: 'a', frets: [null, 3, 2, 0, 1, 0], beats: 2, direction: 'down' },
      { id: 'b', frets: [null, null, null, null, null, null], beats: 0.5, direction: 'up' },
    ],
  };
  const restored = parseSong(serializeSong(original));
  assert.equal(restored.bpm, 96);
  assert.equal(restored.loop, false);
  assert.deepEqual(
    restored.steps.map(({ frets, beats, direction }) => ({ frets, beats, direction })),
    original.steps.map(({ frets, beats, direction }) => ({ frets, beats, direction }))
  );
  assert.ok(restored.steps.every(step => typeof step.id === 'string' && step.id.length));
  assert.deepEqual(parseSong(serializeSong(emptySong())), emptySong());

  const valid = JSON.parse(serializeSong(original));
  const variant = change => JSON.stringify(change(structuredClone(valid)));
  const step = (field, value) =>
    variant(data => {
      data.steps[0][field] = value;
      return data;
    });
  for (const input of [
    null,
    '',
    'not json',
    '[]',
    '{}',
    variant(data => ({ ...data, version: 2 })),
    variant(data => ({ ...data, bpm: 10 })),
    variant(data => ({ ...data, bpm: 999 })),
    variant(data => ({ ...data, bpm: '96' })),
    variant(data => ({ ...data, loop: 'yes' })),
    variant(data => ({ ...data, steps: {} })),
    variant(data => ({ ...data, steps: Array(MAX_STEPS + 1).fill(data.steps[0]) })),
    variant(data => ({ ...data, steps: [null] })),
    step('frets', [0, 0, 0, 0, 0]),
    step('frets', [0, 0, 0, 0, 0, 13]),
    step('frets', [0, 0, 0, 0, 0, -1]),
    step('frets', [0, 0, 0, 0, 0, 1.5]),
    step('frets', [0, 0, 0, 0, 0, '3']),
    step('beats', 0),
    step('beats', 9),
    step('beats', '2'),
    step('direction', 'sideways'),
  ])
    assert.equal(parseSong(input), null, String(input).slice(0, 80));
});

test('step lengths are clamped and measured in beats at the song tempo', () => {
  const { stepSeconds, clampBeats, clampTempo, songTimes, BEATS, TEMPO } = song;
  assert.equal(stepSeconds(1, 60), 1);
  assert.equal(stepSeconds(2, 120), 1);
  assert.equal(stepSeconds(0.5, 200), 0.15);
  assert.equal(stepSeconds(100, 1), (BEATS.max * 60) / TEMPO.min);
  assert.equal(clampBeats(1.3), 1.5);
  assert.equal(clampBeats(0), BEATS.min);
  assert.equal(clampBeats(Number.NaN), BEATS.initial);
  assert.equal(clampTempo(1000), TEMPO.max);
  assert.equal(clampTempo(Number.POSITIVE_INFINITY), TEMPO.initial);
  assert.deepEqual(songTimes([{ beats: 1 }, { beats: 2 }, { beats: 0.5 }], 120), {
    starts: [0, 0.5, 1.5],
    total: 1.75,
  });
  assert.equal(format.formatBeats(0.5), '½ beat');
  assert.equal(format.formatBeats(1), '1 beat');
  assert.equal(format.formatBeats(2.5), '2½ beats');
  assert.equal(format.takeFilename(new Date(2026, 9, 31, 8, 5)), 'cj-playbox-20261031-0805.wav');
  const geometry = format.timelineGeometry(
    [
      { id: 'a', frets: [], beats: 1, direction: 'down' },
      { id: 'b', frets: [], beats: 2, direction: 'down' },
    ],
    60
  );
  close(geometry.widths[1], geometry.widths[0] * 2, 1e-9);
  close(geometry.lefts[1], geometry.widths[0], 1e-9);
});

test('the sequencer schedules ahead on the audio clock, loops, and stops at the end', () => {
  const { createSequencer } = song;
  let now = 0;
  let loop = true;
  const played = [];
  const sequencer = createSequencer({
    now: () => now,
    durations: () => [1, 0.5],
    loop: () => loop,
    play: (index, time) => played.push([index, time]),
    lookahead: 0.15,
  });
  sequencer.start(0.1);
  assert.deepEqual(played, [[0, 0.1]], 'only what falls inside the lookahead window');
  now = 0.9;
  sequencer.tick();
  assert.deepEqual(played, [[0, 0.1]]);
  now = 1.0;
  sequencer.tick();
  assert.deepEqual(played.at(-1), [1, 1.1]);
  assert.equal(sequencer.cueAt(1.05).index, 0);
  assert.equal(sequencer.cueAt(1.2).index, 1);
  now = 1.5;
  sequencer.tick();
  assert.deepEqual(played.at(-1), [0, 1.6], 'loops back to the first step');

  loop = false;
  now = 2.5;
  sequencer.tick();
  assert.deepEqual(played.at(-1), [1, 2.6]);
  now = 3.0;
  assert.equal(sequencer.tick(), true, 'still sounding the last step');
  now = 3.15;
  assert.equal(sequencer.tick(), false, 'ends once the last step has had its length');
  assert.equal(sequencer.running, false);
  assert.equal(played.length, 4);
});
