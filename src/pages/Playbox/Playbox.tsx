import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useIsPresent } from 'motion/react';
import { Icon } from '../../components/ui/Icon';
import {
  NOTE_SECONDS,
  canRenderOffline,
  createAudioEngine,
  renderOffline,
} from '../../scenes/strings/audio.ts';
import type { AudioEngine, NoteEvent } from '../../scenes/strings/audio.ts';
import {
  PRESETS,
  STRINGS,
  chordName,
  chordNotes,
  fretCode,
  fretHz,
} from '../../scenes/strings/music.ts';
import type { Frets, StrumDirection } from '../../scenes/strings/music.ts';
import { encodeWav } from '../../scenes/strings/wav.ts';
import { Overlay } from '../Overlay';
import { Fretboard } from './Fretboard';
import type { FretboardHandle } from './Fretboard';
import { Timeline } from './Timeline';
import {
  formatBeats,
  formatBytes,
  formatClock,
  formatSeconds,
  stepTitle,
  takeFilename,
  timelineGeometry,
} from './format.ts';
import {
  BEATS,
  MAX_STEPS,
  STORAGE_KEY,
  TEMPO,
  clampBeats,
  clampTempo,
  createSequencer,
  emptySong,
  parseSong,
  serializeSong,
  songTimes,
  stepId,
  stepSeconds,
} from './song.ts';
import type { Song, Step } from './song.ts';
import styles from './Playbox.module.css';

/** Six voices can sum past full scale, so the playbox mixes lower and limits peaks. */
const MIX = { volume: 0.42, limiter: true };
const RECORD_LIMIT = 300;
const SAMPLE_RATE = 44100;
const SILENT: Frets = Array.from({ length: STRINGS }, () => null);
const EXAMPLE = ['Em', 'C', 'G', 'D'];

interface Take {
  url: string;
  filename: string;
  bytes: number;
  seconds: number;
  extension: string;
}

type Recording =
  | { mode: 'events'; start: number; startedAt: Date; events: NoteEvent[] }
  | { mode: 'stream'; startedAt: Date; recorder: MediaRecorder; chunks: Blob[] };

function loadSong(): Song {
  try {
    return parseSong(window.localStorage.getItem(STORAGE_KEY)) ?? emptySong();
  } catch {
    return emptySong();
  }
}

const sameShape = (a: Frets, b: Frets) => a.every((fret, index) => fret === b[index]);
const pad = (value: number) => String(value).padStart(2, '0');

function canRecord() {
  return canRenderOffline() || typeof MediaRecorder !== 'undefined';
}

export function Playbox() {
  const present = useIsPresent();
  const [song, setSong] = useState(loadSong);
  const [frets, setFrets] = useState<Frets>(SILENT);
  const [direction, setDirection] = useState<StrumDirection>('down');
  const [beats, setBeats] = useState<number>(BEATS.initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [undo, setUndo] = useState<Song | null>(null);
  const [recording, setRecording] = useState<'idle' | 'recording' | 'rendering'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState<Take | null>(null);
  const [takeNote, setTakeNote] = useState('');
  const [status, setStatus] = useState('');

  const engineRef = useRef<AudioEngine | null>(null);
  const fretboardRef = useRef<FretboardHandle>(null);
  const recordingRef = useRef<Recording | null>(null);
  const recentRef = useRef<NoteEvent[]>([]);
  const recordStart = useRef(0);
  const takeUrl = useRef<string | null>(null);
  const mounted = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const songRef = useRef(song);
  songRef.current = song;
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const sequenceRef = useRef<HTMLElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const geometry = useMemo(
    () => timelineGeometry(song.steps, song.bpm, trackWidth),
    [song.steps, song.bpm, trackWidth]
  );
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;

  const [sequencer] = useState(() =>
    createSequencer({
      now: () => engineRef.current?.now() ?? 0,
      durations: () =>
        songRef.current.steps.map(step => stepSeconds(step.beats, songRef.current.bpm)),
      loop: () => songRef.current.loop,
      play: (index, time) => {
        const step = songRef.current.steps[index];
        if (step)
          engineRef.current?.strum(step.frets, {
            direction: step.direction,
            velocity: 0.78,
            when: time,
          });
      },
    })
  );

  // One engine per visit; no AudioContext exists until the first gesture asks for one.
  useEffect(() => {
    mounted.current = true;
    const engine = createAudioEngine({
      ...MIX,
      onNote: event => {
        fretboardRef.current?.ring(event);
        const current = recordingRef.current;
        if (current?.mode === 'events') {
          if (event.time >= current.start) current.events.push(event);
          return;
        }
        // Notes already scheduled when Record is pressed still belong to the take.
        const recent = recentRef.current;
        recent.push(event);
        while (recent.length && recent[0].time < event.time - 1) recent.shift();
      },
    });
    engine.setMuted(!soundRef.current);
    engineRef.current = engine;
    return () => {
      mounted.current = false;
      sequencer.stop();
      const current = recordingRef.current;
      recordingRef.current = null;
      if (current?.mode === 'stream' && current.recorder.state !== 'inactive')
        current.recorder.stop();
      engine.dispose();
      engineRef.current = null;
      if (takeUrl.current) URL.revokeObjectURL(takeUrl.current);
      takeUrl.current = null;
    };
  }, [sequencer]);

  useEffect(() => engineRef.current?.setMuted(!sound), [sound]);

  useEffect(() => {
    const section = sequenceRef.current;
    if (!section) return;
    const observer = new ResizeObserver(([entry]) =>
      setTrackWidth(Math.round(entry.contentRect.width))
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeSong(song));
    } catch {
      // Private mode or full storage: the song simply lasts for this visit.
    }
  }, [song]);

  const stopPlayback = useCallback(() => {
    sequencer.stop();
    engineRef.current?.silence();
    setPlaying(false);
    setActiveIndex(null);
  }, [sequencer]);

  const discardRecording = useCallback(() => {
    const current = recordingRef.current;
    recordingRef.current = null;
    if (current?.mode === 'stream') {
      if (current.recorder.state !== 'inactive') current.recorder.stop();
      engineRef.current?.releaseStream();
    }
    setRecording(state => (state === 'recording' ? 'idle' : state));
  }, []);

  // Closing the overlay or hiding the tab stops the music.
  useEffect(() => {
    if (present) return;
    stopPlayback();
    discardRecording();
  }, [present, stopPlayback, discardRecording]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopPlayback();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stopPlayback]);

  // Transport: a coarse timer feeds the lookahead scheduler; the playhead follows the audio clock.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!sequencer.tick()) {
        setPlaying(false);
        setActiveIndex(null);
      }
    }, 25);
    let frame = 0;
    const follow = () => {
      const now = engineRef.current?.now() ?? 0;
      const cue = sequencer.cueAt(now);
      const geo = geometryRef.current;
      const playhead = playheadRef.current;
      const scroller = scrollerRef.current;
      if (cue && geo.widths[cue.index] !== undefined && playhead) {
        const progress = Math.min(1, Math.max(0, (now - cue.time) / cue.seconds));
        const x = geo.lefts[cue.index] + progress * geo.widths[cue.index];
        playhead.style.transform = `translateX(${x.toFixed(1)}px)`;
        setActiveIndex(cue.index);
        if (
          scroller &&
          (x < scroller.scrollLeft || x > scroller.scrollLeft + scroller.clientWidth - 48)
        )
          scroller.scrollLeft = Math.max(0, x - 48);
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [playing, sequencer]);

  const notes = chordNotes(frets);
  const name = chordName(frets);
  const editing = song.steps.findIndex(step => step.id === editingId);
  const editingStep = editing >= 0 ? song.steps[editing] : null;
  const { total } = songTimes(song.steps, song.bpm);

  const preview = (string: number, fret: number, velocity: number) => {
    if (!soundRef.current) return;
    engineRef.current?.pluckNote(fretHz(string, fret), { velocity, string, fret });
  };

  const toggle = (string: number, fret: number) => {
    const selecting = frets[string] !== fret;
    setFrets(frets.map((value, index) => (index === string ? (selecting ? fret : null) : value)));
    if (selecting) preview(string, fret, 0.62);
  };

  const hover = (string: number, fret: number) => {
    if (engineRef.current?.context?.state === 'running') preview(string, fret, 0.3);
  };

  const mute = (string: number) =>
    setFrets(frets.map((value, index) => (index === string ? (value === null ? 0 : null) : value)));

  const strum = (shape: Frets = frets, stroke: StrumDirection = direction) =>
    engineRef.current?.strum(shape, { direction: stroke, velocity: 0.8 });

  const applyPreset = (shape: Frets) => {
    setFrets([...shape]);
    strum(shape);
  };

  const edit = (update: (steps: Step[]) => Step[]) => {
    setUndo(null);
    setSong(current => ({ ...current, steps: update(current.steps) }));
  };

  const addStep = () => {
    if (song.steps.length >= MAX_STEPS) {
      setStatus(`A sequence holds up to ${MAX_STEPS} steps.`);
      return;
    }
    edit(steps => [...steps, { id: stepId(), frets: [...frets], beats, direction }]);
    setEditingId(null);
    setStatus(`Added step ${song.steps.length + 1}: ${stepTitle(frets)}.`);
    requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (scroller) scroller.scrollLeft = scroller.scrollWidth;
    });
  };

  const updateStep = () => {
    if (!editingStep) return;
    edit(steps =>
      steps.map(step =>
        step.id === editingStep.id ? { ...step, frets: [...frets], beats, direction } : step
      )
    );
    setStatus(`Step ${editing + 1} updated.`);
  };

  const selectStep = (id: string) => {
    if (editingId === id) {
      setEditingId(null);
      return;
    }
    const step = song.steps.find(item => item.id === id);
    if (!step) return;
    setEditingId(id);
    setFrets([...step.frets]);
    setBeats(step.beats);
    setDirection(step.direction);
  };

  const moveStep = (delta: number) => {
    if (!editingStep) return;
    edit(steps => {
      const from = steps.findIndex(step => step.id === editingStep.id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= steps.length) return steps;
      const next = [...steps];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setStatus(`Step moved to position ${editing + delta + 1}.`);
  };

  const duplicateStep = () => {
    if (!editingStep) return;
    if (song.steps.length >= MAX_STEPS) {
      setStatus(`A sequence holds up to ${MAX_STEPS} steps.`);
      return;
    }
    const copy = { ...editingStep, id: stepId() };
    edit(steps => {
      const at = steps.findIndex(step => step.id === editingStep.id);
      return [...steps.slice(0, at + 1), copy, ...steps.slice(at + 1)];
    });
    setEditingId(copy.id);
    setStatus(`Step ${editing + 1} repeated as step ${editing + 2}.`);
  };

  const removeStep = () => {
    if (!editingStep) return;
    edit(steps => steps.filter(step => step.id !== editingStep.id));
    setEditingId(null);
    setStatus(`Step ${editing + 1} removed.`);
  };

  const clearSequence = () => {
    stopPlayback();
    setUndo(song);
    setSong(current => ({ ...current, steps: [] }));
    setEditingId(null);
    setStatus('Sequence cleared. Undo is available.');
  };

  const restore = () => {
    if (!undo) return;
    setSong(undo);
    setUndo(null);
    setStatus('Sequence restored.');
  };

  const loadExample = () => {
    edit(() =>
      EXAMPLE.map(chord => ({
        id: stepId(),
        frets: [...(PRESETS.find(preset => preset.name === chord)?.frets ?? SILENT)],
        beats: 2,
        direction: 'down' as const,
      }))
    );
    setStatus('Loaded a four-chord progression: Em, C, G, D.');
  };

  const play = () => {
    const context = engineRef.current?.ensure();
    if (!context || !song.steps.length) return;
    sequencer.start(context.currentTime + 0.08);
    setPlaying(true);
  };

  const startRecording = () => {
    const engine = engineRef.current;
    const context = engine?.ensure();
    if (!engine || !context) {
      setTakeNote('Audio isn’t available in this browser, so there is nothing to record.');
      return;
    }
    const startedAt = new Date();
    if (canRenderOffline()) {
      const start = context.currentTime;
      const events = recentRef.current.filter(event => event.time >= start);
      recordingRef.current = { mode: 'events', start, startedAt, events };
    } else {
      const stream = engine.stream();
      if (!stream || typeof MediaRecorder === 'undefined') {
        setTakeNote('Recording isn’t supported in this browser.');
        return;
      }
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
        candidate => MediaRecorder.isTypeSupported?.(candidate)
      );
      const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.start(1000);
      recordingRef.current = { mode: 'stream', startedAt, recorder, chunks };
    }
    recordStart.current = performance.now();
    setElapsed(0);
    setRecording('recording');
    setTakeNote('Recording. Every note and strum you play is captured — no microphone involved.');
  };

  const stopRecording = async (capped = false) => {
    const current = recordingRef.current;
    if (!current) return;
    recordingRef.current = null;
    setRecording('rendering');
    setTakeNote('Rendering the take…');
    try {
      let blob: Blob;
      let extension = 'wav';
      let seconds: number;
      if (current.mode === 'stream') {
        await new Promise<void>(resolve => {
          current.recorder.onstop = () => resolve();
          current.recorder.stop();
        });
        engineRef.current?.releaseStream();
        const type = current.recorder.mimeType || 'audio/webm';
        blob = new Blob(current.chunks, { type });
        extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        seconds = (performance.now() - recordStart.current) / 1000;
      } else {
        const events = current.events;
        if (!events.length) {
          setTakeNote('Nothing was played during that take, so there is nothing to save.');
          return;
        }
        const first = events.reduce((min, event) => Math.min(min, event.time), Infinity);
        const last = events.reduce((max, event) => Math.max(max, event.time), -Infinity);
        // Trim the silence before the first note; let the last one ring out.
        const offset = Math.max(current.start, first - 0.25);
        const length = last - offset + NOTE_SECONDS + 0.1;
        const buffer = await renderOffline(
          events.map(event => ({ ...event, time: event.time - offset })),
          length,
          { ...MIX, sampleRate: SAMPLE_RATE }
        );
        blob = new Blob([encodeWav([buffer.getChannelData(0)], buffer.sampleRate)], {
          type: 'audio/wav',
        });
        seconds = buffer.duration;
      }
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob);
      if (takeUrl.current) URL.revokeObjectURL(takeUrl.current);
      takeUrl.current = url;
      setTake({
        url,
        filename: takeFilename(current.startedAt, extension),
        bytes: blob.size,
        seconds,
        extension,
      });
      setTakeNote(
        capped
          ? 'Recording stops at five minutes, so this take was capped there. It’s ready below.'
          : 'Take ready. Play it back, or download it.'
      );
    } catch {
      if (mounted.current) setTakeNote('That take couldn’t be rendered. Try recording again.');
    } finally {
      if (mounted.current) setRecording('idle');
    }
  };
  const stopRecordingRef = useRef(stopRecording);
  stopRecordingRef.current = stopRecording;

  useEffect(() => {
    if (recording !== 'recording') return;
    const timer = window.setInterval(() => {
      const seconds = (performance.now() - recordStart.current) / 1000;
      setElapsed(Math.min(RECORD_LIMIT, seconds));
      if (seconds >= RECORD_LIMIT) void stopRecordingRef.current(true);
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  const discardTake = () => {
    if (takeUrl.current) URL.revokeObjectURL(takeUrl.current);
    takeUrl.current = null;
    setTake(null);
    setTakeNote('Take discarded.');
  };

  const recordable = canRecord();
  const isRecording = recording === 'recording';
  const actions = (
    <>
      <button
        type="button"
        className={styles.barKey}
        aria-pressed={sound}
        onClick={() => {
          engineRef.current?.ensure();
          setSound(value => !value);
        }}
      >
        <Icon name={sound ? 'sound' : 'mute'} />
        <span className={styles.barText}>{sound ? 'Sound on' : 'Sound off'}</span>
      </button>
      <button
        type="button"
        className={styles.record}
        data-state={recording}
        aria-label={isRecording ? 'Stop recording' : 'Record'}
        disabled={!recordable || recording === 'rendering'}
        title={recordable ? undefined : 'Recording isn’t supported in this browser'}
        onClick={() => (isRecording ? void stopRecording() : startRecording())}
      >
        <span className={styles.recordDot} aria-hidden="true" />
        <span aria-hidden="true">
          {isRecording ? 'Stop' : recording === 'rendering' ? 'Saving' : 'Rec'}
        </span>
        {isRecording && (
          <span className={styles.recordTime} aria-hidden="true">
            {formatClock(elapsed)}
          </span>
        )}
      </button>
    </>
  );

  const displayName =
    notes.length === 0 ? 'Silence' : notes.length === 1 ? notes[0].name : (name ?? 'Unnamed');
  const stepLength = stepSeconds(beats, song.bpm);

  return (
    <Overlay
      labelledBy="playbox-title"
      tone="tungsten"
      backLabel="Back to the guitar"
      backHref="/#beyond"
      actions={actions}
    >
      <article className={styles.page}>
        <header className={styles.head}>
          <div className={styles.intro}>
            <p className="u-label">05.1 — After hours · Playbox</p>
            <h1 id="playbox-title" tabIndex={-1} className={styles.title}>
              The <em>playbox.</em>
            </h1>
            <p className={styles.lede}>
              Choose a fret on each string to make a chord, give it a length, and line chords up
              into a phrase. Record what you play and take it with you.
            </p>
          </div>
          <dl className={styles.spec}>
            <div>
              <dt>Tuning</dt>
              <dd>Standard — E A D G B E</dd>
            </div>
            <div>
              <dt>Voice</dt>
              <dd>Karplus–Strong plucked string, synthesised here</dd>
            </div>
            <div>
              <dt>Takes</dt>
              <dd>Re-rendered note for note as 16-bit WAV. No microphone.</dd>
            </div>
          </dl>
        </header>

        <section className={styles.section} aria-labelledby="playbox-chord">
          <div className={styles.sectionHead}>
            <span className="u-label">01</span>
            <h2 id="playbox-chord">Chord</h2>
            <p>One strum. At most one position per string; × leaves a string silent.</p>
          </div>

          <div className={styles.readout}>
            <div className={styles.chord}>
              <p className="u-label">
                {editingStep ? `Editing step ${pad(editing + 1)}` : 'In your hand'}
              </p>
              <output
                className={styles.chordName}
                data-testid="chord-name"
                data-empty={notes.length === 0 || undefined}
                data-unnamed={(notes.length > 1 && !name) || undefined}
                aria-live="polite"
              >
                {displayName}
              </output>
            </div>
            <dl className={styles.notes}>
              <div>
                <dt>Notes</dt>
                <dd>{notes.length ? notes.map(note => note.name).join(' · ') : '—'}</dd>
              </div>
              <div>
                <dt>Shape</dt>
                <dd>{fretCode(frets)}</dd>
              </div>
            </dl>
            <div className={styles.presets} role="group" aria-label="Chord presets">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={sameShape(frets, preset.frets)}
                  title={preset.label}
                  onClick={() => applyPreset(preset.frets)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <Fretboard
            ref={fretboardRef}
            frets={frets}
            onToggle={toggle}
            onMute={mute}
            onHover={hover}
            clock={() => engineRef.current?.now() ?? 0}
          />

          <div className={styles.controls}>
            <div className={styles.segmented} role="group" aria-label="Strum direction">
              <button
                type="button"
                aria-pressed={direction === 'down'}
                onClick={() => setDirection('down')}
              >
                <Icon name="arrow-down" /> Down
              </button>
              <button
                type="button"
                aria-pressed={direction === 'up'}
                onClick={() => setDirection('up')}
              >
                <Icon name="arrow-up" /> Up
              </button>
            </div>
            <div className={styles.stepper} role="group" aria-label="Step length">
              <span className={styles.controlLabel}>Length</span>
              <button
                type="button"
                aria-label="Shorter"
                disabled={beats <= BEATS.min}
                onClick={() => setBeats(value => clampBeats(value - BEATS.step))}
              >
                <Icon name="minus" />
              </button>
              <output aria-live="polite">
                {formatBeats(beats)}
                <small>{stepLength.toFixed(2)} s</small>
              </output>
              <button
                type="button"
                aria-label="Longer"
                disabled={beats >= BEATS.max}
                onClick={() => setBeats(value => clampBeats(value + BEATS.step))}
              >
                <Icon name="plus" />
              </button>
            </div>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.secondary}
                disabled={!notes.length}
                onClick={() => strum()}
              >
                <Icon name={direction === 'down' ? 'arrow-down' : 'arrow-up'} /> Strum
              </button>
              {editingStep ? (
                <>
                  <button type="button" className={styles.secondary} onClick={addStep}>
                    <Icon name="plus" /> Add as new step
                  </button>
                  <button type="button" className={styles.primary} onClick={updateStep}>
                    <Icon name="check" /> Update step
                  </button>
                </>
              ) : (
                <button type="button" className={styles.primary} onClick={addStep}>
                  <Icon name="plus" /> Add to sequence
                </button>
              )}
            </div>
          </div>
        </section>

        <section ref={sequenceRef} className={styles.section} aria-labelledby="playbox-sequence">
          <div className={styles.sectionHead}>
            <span className="u-label">02</span>
            <h2 id="playbox-sequence">Sequence</h2>
            <p>Each step strums its chord, then holds for its length before the next one plays.</p>
          </div>

          <div className={styles.transport}>
            <button
              type="button"
              className={styles.primary}
              disabled={!song.steps.length}
              onClick={() => (playing ? stopPlayback() : play())}
            >
              <Icon name={playing ? 'stop' : 'play'} /> {playing ? 'Stop' : 'Play'}
            </button>
            <button
              type="button"
              className={styles.secondary}
              aria-pressed={song.loop}
              onClick={() => setSong(current => ({ ...current, loop: !current.loop }))}
            >
              <Icon name="loop" /> Loop
            </button>
            <label className={styles.tempo}>
              <span className={styles.controlLabel}>Tempo</span>
              <input
                type="range"
                min={TEMPO.min}
                max={TEMPO.max}
                step={1}
                value={song.bpm}
                aria-valuetext={`${song.bpm} beats per minute`}
                onChange={event =>
                  setSong(current => ({ ...current, bpm: clampTempo(Number(event.target.value)) }))
                }
              />
              <span className={styles.tempoValue}>{song.bpm} BPM</span>
            </label>
            <p className={styles.summary}>
              {song.steps.length} {song.steps.length === 1 ? 'step' : 'steps'} ·{' '}
              {formatSeconds(total)}
            </p>
            {undo ? (
              <button type="button" className={styles.text} onClick={restore}>
                Undo clear
              </button>
            ) : (
              <button
                type="button"
                className={styles.text}
                disabled={!song.steps.length}
                onClick={clearSequence}
              >
                Clear sequence
              </button>
            )}
          </div>

          {song.steps.length ? (
            <Timeline
              steps={song.steps}
              bpm={song.bpm}
              geometry={geometry}
              selectedId={editingId}
              activeIndex={activeIndex}
              playing={playing}
              onSelect={selectStep}
              scrollerRef={scrollerRef}
              playheadRef={playheadRef}
            />
          ) : (
            <div className={styles.empty}>
              <p>
                No steps yet. Build a chord above and add it — or start from a progression and
                change it.
              </p>
              <button type="button" className={styles.text} onClick={loadExample}>
                Load Em · C · G · D
              </button>
            </div>
          )}

          {editingStep && (
            <div className={styles.inspector} role="group" aria-label="Selected step">
              <p>
                <span className="u-label">
                  Step {pad(editing + 1)} / {pad(song.steps.length)}
                </span>
                <span>
                  {stepTitle(editingStep.frets)} · {editingStep.direction} ·{' '}
                  {formatBeats(editingStep.beats)} ·{' '}
                  {stepSeconds(editingStep.beats, song.bpm).toFixed(2)} s
                </span>
              </p>
              <div className={styles.inspectorActions}>
                <button
                  type="button"
                  aria-label="Move step earlier"
                  disabled={editing === 0}
                  onClick={() => moveStep(-1)}
                >
                  <Icon name="arrow-left" /> Earlier
                </button>
                <button
                  type="button"
                  aria-label="Move step later"
                  disabled={editing === song.steps.length - 1}
                  onClick={() => moveStep(1)}
                >
                  Later <Icon name="arrow-right" />
                </button>
                <button type="button" aria-label="Repeat step" onClick={duplicateStep}>
                  <Icon name="copy" /> Repeat
                </button>
                <button type="button" aria-label="Remove step" onClick={removeStep}>
                  <Icon name="close" /> Remove
                </button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Done
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="playbox-take">
          <div className={styles.sectionHead}>
            <span className="u-label">03</span>
            <h2 id="playbox-take">Take</h2>
            <p>
              Press Rec in the bar above and play — single notes, strums, the sequence. Stop, and
              the take is rebuilt note for note.
            </p>
          </div>
          <div className={styles.take} data-state={recording}>
            {isRecording && (
              <div className={styles.meter}>
                <span className={styles.meterTime}>
                  {formatClock(elapsed)} <small>/ {formatClock(RECORD_LIMIT)}</small>
                </span>
                <span
                  className={styles.meterBar}
                  style={{ '--progress': elapsed / RECORD_LIMIT } as CSSProperties}
                  aria-hidden="true"
                />
              </div>
            )}
            {takeNote && <p className={styles.takeNote}>{takeNote}</p>}
            {!takeNote && !take && (
              <p className={styles.takeNote}>
                {recordable
                  ? 'No take yet. Takes last up to five minutes and download as WAV.'
                  : 'Recording isn’t supported in this browser.'}
              </p>
            )}
            {take && (
              <div className={styles.takeReady}>
                <audio controls src={take.url} preload="metadata" aria-label="Your take" />
                <p className={styles.takeMeta}>
                  <span>{take.filename}</span>
                  <span>{formatClock(take.seconds)}</span>
                  <span>{formatBytes(take.bytes)}</span>
                </p>
                <div className={styles.buttons}>
                  <a className={styles.primary} href={take.url} download={take.filename}>
                    <Icon name="download" /> Download (.{take.extension})
                  </a>
                  <button type="button" className={styles.text} onClick={discardTake}>
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        <p className="u-sr" role="status">
          {status}
        </p>
      </article>
    </Overlay>
  );
}
