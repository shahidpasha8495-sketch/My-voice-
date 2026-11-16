import type { SoundscapeType } from '../types';

let sharedAudioCtx: AudioContext | null = null;
let sfxMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => undefined);
  }
  return sharedAudioCtx;
}

export function setSfxMuted(muted: boolean): void {
  sfxMuted = muted;
}

function playTone(
  freqStart: number,
  freqEnd: number,
  durationSec = 0.09,
  peakGain = 0.045,
  type: OscillatorType = 'sine'
): void {
  if (sfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.01);
  } catch {
    // Gracefully ignore blocked autoplay audio contexts
  }
}

export function playMicOpenChime(): void {
  playTone(520, 780, 0.09, 0.045, 'sine');
}

export function playMicStopChime(): void {
  playTone(720, 480, 0.08, 0.04, 'sine');
}

export function playFirstTokenChime(): void {
  playTone(660, 880, 0.07, 0.025, 'triangle');
}

export function playModeSwitchChime(): void {
  playTone(587.33, 880, 0.06, 0.025, 'sine');
}

class AmbientSoundscapeEngine {
  private activeType: SoundscapeType = 'off';
  private stopFns: Array<() => void> = [];

  public setSoundscape(nextType: SoundscapeType): void {
    if (nextType === this.activeType) return;
    this.stop();
    this.activeType = nextType;
    if (nextType === 'off') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (nextType === 'rain') {
      try {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        for (let i = 0; i < bufferSize; i += 1) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.035;
        }
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 950;

        const gain = ctx.createGain();
        gain.gain.value = 0.18;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        this.stopFns.push(() => {
          try {
            source.stop();
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore audio graph errors
      }
    } else if (nextType === 'aurora') {
      try {
        const freqs = [174, 261.63];
        const oscs: OscillatorNode[] = [];
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.022;
        masterGain.connect(ctx.destination);

        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = f;
          osc.connect(masterGain);
          osc.start();
          oscs.push(osc);
        });

        this.stopFns.push(() => {
          oscs.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {
              // ignore
            }
          });
          try {
            masterGain.disconnect();
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore audio graph errors
      }
    }
  }

  public stop(): void {
    this.stopFns.forEach((fn) => fn());
    this.stopFns = [];
    this.activeType = 'off';
  }
}

export const soundscapeEngine = new AmbientSoundscapeEngine();
