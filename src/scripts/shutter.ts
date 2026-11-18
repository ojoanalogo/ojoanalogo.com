/**
 * A tiny synthesized "film advance" click for the landing dial.
 * No audio files: a short burst of filtered noise shaped like a ratchet tick.
 */
const KEY = 'ojoanalogo:sound';

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let soundOn: boolean | null = null;

export function isSoundOn(): boolean {
  if (soundOn === null) {
    try {
      soundOn = localStorage.getItem(KEY) === 'on';
    } catch {
      soundOn = false;
    }
  }
  return soundOn;
}

export function setSoundOn(on: boolean) {
  soundOn = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private mode — keep in-memory state only */
  }
  if (on) {
    ensureContext();
    click(0.9);
  }
}

function ensureContext() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();

  const length = Math.floor(ctx.sampleRate * 0.04);
  noise = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Play one detent tick. `strength` 0..1 scales loudness/brightness. */
export function click(strength = 1) {
  if (!isSoundOn()) return;
  const ac = ensureContext();
  if (!ac || !noise) return;

  const now = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noise;

  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2400 + Math.random() * 900 * strength;
  band.Q.value = 4.5;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35 * strength, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

  src.connect(band).connect(gain).connect(ac.destination);
  src.start(now);
  src.stop(now + 0.04);
}
