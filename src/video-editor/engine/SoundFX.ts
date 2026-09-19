import { SfxType } from '../types';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playSfx(
  type: SfxType,
  destNode?: AudioNode,
  customCtx?: AudioContext
) {
  const ctx = customCtx || getAudioContext();
  if (!ctx) return;

  const dest = destNode || ctx.destination;
  const now = ctx.currentTime;

  switch (type) {
    case 'clockTick': {
      // 1. Mechanical Clock Tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }

    case 'correctDing': {
      // 2. Celebratory Double Bell Chime (C6 -> G6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.1); // G6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc1.stop(now + 0.8);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.8);
      break;
    }

    case 'timeoutBuzzer': {
      // 3. Low Game Show Timeout Buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.setValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.45);
      break;
    }

    case 'pop': {
      // 4. Snappy Pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }

    case 'whoosh': {
      // 5. White Noise Swish / Sweep
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(now);
      noise.stop(now + 0.25);
      break;
    }

    case 'tadaFanfare': {
      // 6. Victory Fanfare Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.25, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        o.connect(g);
        g.connect(dest);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.4);
      });
      break;
    }

    case 'drumroll': {
      // 7. Drumroll Sweep
      for (let i = 0; i < 12; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 30, now + i * 0.05);
        g.gain.setValueAtTime(0.15 + (i / 12) * 0.2, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.04);
        osc.connect(g);
        g.connect(dest);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.04);
      }
      break;
    }

    case 'laser': {
      // 8. Laser Beam Zap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }
  }
}

export function speakHindiVoice(
  text: string,
  speed: number = 1.0,
  pitch: number = 1.0
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = Math.max(0.6, Math.min(1.8, speed));
    utter.pitch = Math.max(0.7, Math.min(1.4, pitch));
    utter.lang = 'hi-IN';

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.startsWith('hi') || v.name.includes('Hindi') || v.lang.includes('IN')
    );
    if (hindiVoice) {
      utter.voice = hindiVoice;
    }

    utter.onend = () => resolve();
    utter.onerror = () => resolve();

    // Safety timeout
    const timer = setTimeout(() => resolve(), 8000);
    utter.onend = () => {
      clearTimeout(timer);
      resolve();
    };

    window.speechSynthesis.speak(utter);
  });
}
