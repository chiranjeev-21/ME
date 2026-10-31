import { planStrum } from './music.ts';
import type { Frets, StrumDirection, StrumNote } from './music.ts';
import { karplusStrong } from './physics.ts';

/** A plucked note on the audio clock. Everything that sounds goes through one of these. */
export interface NoteEvent {
  hz: number;
  /** Seconds on the owning context's clock. */
  time: number;
  /** 0–1. */
  velocity: number;
  /** Karplus–Strong excitation brightness. */
  brightness: number;
  /** When set, a new note on the same string chokes the one still ringing there. */
  string?: number;
  /** Display only. */
  fret?: number;
}

export interface BusOptions {
  /** Gain before the limiter. */
  volume?: number;
  /** A gentle peak limiter, for chords where six voices sum. */
  limiter?: boolean;
}

/** Length of every synthesised note; the voice fades out over its last moments. */
export const NOTE_SECONDS = 2.8;
const RELEASE = 0.12;
const CHOKE = 0.015;

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  level: number;
  start: number;
  end: number;
}

export type Bus = ReturnType<typeof createBus>;

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * The plucked-string voice graph — a cached Karplus–Strong buffer through a
 * velocity-dependent lowpass and gain — shared by live playback and offline
 * renders, so a recording sounds exactly like what was heard.
 */
export function createBus(
  context: BaseAudioContext,
  destination: AudioNode,
  options: BusOptions = {}
) {
  const input = context.createGain();
  input.gain.value = options.volume ?? 1;
  let output: AudioNode = input;
  if (options.limiter) {
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -9;
    limiter.knee.value = 8;
    limiter.ratio.value = 10;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    input.connect(limiter);
    output = limiter;
  }
  output.connect(destination);

  const buffers = new Map<string, AudioBuffer>();
  const voices = new Set<Voice>();
  const strings = new Map<number, Voice>();

  const bufferFor = (hz: number, brightness: number) => {
    const key = `${Math.round(hz * 100)}:${Math.round(brightness * 100)}`;
    let buffer = buffers.get(key);
    if (!buffer) {
      const data = karplusStrong(hz, context.sampleRate, NOTE_SECONDS, brightness);
      buffer = context.createBuffer(1, data.length, context.sampleRate);
      buffer.copyToChannel(data, 0);
      buffers.set(key, buffer);
    }
    return buffer;
  };

  const choke = (voice: Voice, at: number) => {
    if (at >= voice.end - RELEASE) return;
    const gain = voice.gain.gain;
    gain.cancelScheduledValues(at);
    gain.setValueAtTime(voice.level, at);
    gain.setTargetAtTime(0, at, CHOKE);
    try {
      voice.source.stop(at + CHOKE * 8);
    } catch {
      // Already stopped.
    }
  };

  const play = (event: NoteEvent) => {
    const start = Math.max(event.time, context.currentTime);
    const velocity = clamp01(event.velocity);
    const buffer = bufferFor(event.hz, event.brightness);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800 + velocity * 2860;
    const gain = context.createGain();
    const level = Math.min(0.55, 0.12 + (velocity * 26) / 60);
    const end = start + buffer.duration;
    gain.gain.setValueAtTime(level, start);
    gain.gain.setValueAtTime(level, end - RELEASE);
    gain.gain.linearRampToValueAtTime(0, end);
    source.connect(filter).connect(gain).connect(input);
    source.start(start);
    const voice: Voice = { source, gain, level, start, end };
    voices.add(voice);
    source.onended = () => {
      voices.delete(voice);
      if (event.string !== undefined && strings.get(event.string) === voice)
        strings.delete(event.string);
      gain.disconnect();
    };
    if (event.string !== undefined) {
      const previous = strings.get(event.string);
      // A string sounds one note at a time; whichever comes later cuts the other.
      if (previous && previous.start > start) choke(voice, previous.start);
      else {
        if (previous) choke(previous, start);
        strings.set(event.string, voice);
      }
    }
    return start;
  };

  /** Quickly fades everything that is ringing or scheduled. */
  const silence = () => {
    const now = context.currentTime;
    voices.forEach(voice => {
      const gain = voice.gain.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(voice.start > now ? 0 : gain.value, now);
      gain.setTargetAtTime(0, now, CHOKE);
      try {
        voice.source.stop(now + CHOKE * 8);
      } catch {
        // Already stopped.
      }
    });
    strings.clear();
  };

  const dispose = () => {
    silence();
    input.disconnect();
    output.disconnect();
  };

  return { output, play, silence, dispose };
}

type AudioContextConstructor = typeof AudioContext;
type OfflineContextConstructor = typeof OfflineAudioContext;

function audioContextClass(): AudioContextConstructor | undefined {
  const scope = window as unknown as { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? scope.webkitAudioContext;
}

function offlineContextClass(): OfflineContextConstructor | undefined {
  const scope = window as unknown as { webkitOfflineAudioContext?: OfflineContextConstructor };
  return typeof OfflineAudioContext !== 'undefined'
    ? OfflineAudioContext
    : scope.webkitOfflineAudioContext;
}

export interface PluckOptions {
  velocity?: number;
  /** Audio-clock seconds; defaults to now. */
  when?: number;
  brightness?: number;
  string?: number;
  fret?: number;
}

export interface StrumOptions {
  direction?: StrumDirection;
  /** Milliseconds between successive strings. */
  spread?: number;
  velocity?: number;
  when?: number;
}

export interface AudioEngine {
  /** Creates the context on first use and resumes it. Call from a user gesture. */
  ensure(): AudioContext | null;
  readonly context: AudioContext | null;
  now(): number;
  pluckNote(hz: number, options?: PluckOptions): number | null;
  strum(frets: Frets, options?: StrumOptions): StrumNote[];
  setMuted(muted: boolean): void;
  /** Fades out everything ringing or scheduled. */
  silence(): void;
  /** A live stream of the output, for the MediaRecorder fallback. */
  stream(): MediaStream | null;
  releaseStream(): void;
  dispose(): void;
}

/**
 * One lazily created AudioContext per instrument. No context exists until the
 * first call to `ensure()` (or a pluck), which should follow a user gesture.
 */
export function createAudioEngine(
  options: BusOptions & { onNote?: (event: NoteEvent) => void } = {}
): AudioEngine {
  let context: AudioContext | null = null;
  let bus: Bus | null = null;
  let monitor: GainNode | null = null;
  let tap: MediaStreamAudioDestinationNode | null = null;
  let muted = false;
  let disposed = false;

  const ensure = () => {
    if (disposed) return null;
    if (!context) {
      const Context = audioContextClass();
      if (!Context) return null;
      try {
        context = new Context();
      } catch {
        return null;
      }
      monitor = context.createGain();
      monitor.gain.value = muted ? 0 : 1;
      monitor.connect(context.destination);
      bus = createBus(context, monitor, options);
    }
    // Suspended (autoplay policy) or interrupted (iOS): ask again on each gesture.
    if (context.state !== 'running' && context.state !== 'closed')
      void context.resume().catch(() => undefined);
    return context;
  };

  const pluckNote = (hz: number, pluck: PluckOptions = {}) => {
    try {
      const ctx = ensure();
      if (!ctx || !bus) return null;
      const event: NoteEvent = {
        hz,
        time: Math.max(pluck.when ?? ctx.currentTime, ctx.currentTime),
        velocity: clamp01(pluck.velocity ?? 0.7),
        brightness: pluck.brightness ?? 0.5,
        string: pluck.string,
        fret: pluck.fret,
      };
      event.time = bus.play(event);
      options.onNote?.(event);
      return event.time;
    } catch {
      // Audio is an enhancement; the instrument keeps working without it.
      return null;
    }
  };

  const strum = (frets: Frets, strumOptions: StrumOptions = {}) => {
    const ctx = ensure();
    if (!ctx) return [];
    const direction = strumOptions.direction ?? 'down';
    const notes = planStrum(frets, {
      ...strumOptions,
      direction,
      when: strumOptions.when ?? ctx.currentTime + 0.01,
    });
    notes.forEach(note =>
      pluckNote(note.hz, {
        velocity: note.velocity,
        when: note.time,
        brightness: direction === 'up' ? 0.6 : 0.5,
        string: note.string,
        fret: note.fret,
      })
    );
    return notes;
  };

  return {
    ensure,
    get context() {
      return context;
    },
    now: () => context?.currentTime ?? 0,
    pluckNote,
    strum,
    setMuted(value) {
      muted = value;
      if (monitor && context)
        monitor.gain.setTargetAtTime(value ? 0 : 1, context.currentTime, 0.02);
    },
    silence: () => bus?.silence(),
    stream() {
      if (!ensure() || !context || !bus || !('createMediaStreamDestination' in context))
        return null;
      if (!tap) {
        tap = context.createMediaStreamDestination();
        bus.output.connect(tap);
      }
      return tap.stream;
    },
    releaseStream() {
      if (tap) bus?.output.disconnect(tap);
      tap = null;
    },
    dispose() {
      disposed = true;
      bus?.dispose();
      void context?.close().catch(() => undefined);
      context = null;
      bus = null;
      monitor = null;
      tap = null;
    },
  };
}

export function canRenderOffline() {
  return typeof window !== 'undefined' && Boolean(offlineContextClass());
}

/**
 * Re-synthesises recorded notes into a mono buffer with exactly the live voice
 * graph. Event times are seconds from the start of the take.
 */
export async function renderOffline(
  events: readonly NoteEvent[],
  seconds: number,
  options: BusOptions & { sampleRate?: number } = {}
): Promise<AudioBuffer> {
  const Offline = offlineContextClass();
  if (!Offline) throw new Error('OfflineAudioContext is unavailable');
  const sampleRate = options.sampleRate ?? 44100;
  const context = new Offline(1, Math.max(1, Math.ceil(seconds * sampleRate)), sampleRate);
  const bus = createBus(context, context.destination, options);
  [...events].sort((a, b) => a.time - b.time).forEach(event => bus.play(event));
  return context.startRendering();
}
