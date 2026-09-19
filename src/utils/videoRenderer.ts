import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { renderCardToCanvas } from './canvasRenderer';

export interface VideoQuestionConfig {
  readTime: number;       // Time to read question before options (sec)
  optionTime: number;     // Time spent highlighting each option (sec)
  timerTime: number;      // Countdown seconds (5s default)
  revealTime: number;     // Time to show correct answer (sec)
}

export interface VideoStudioConfig {
  fps: number;
  width: number;
  height: number;
  enableSoundEffects: boolean;
  enableVoiceover: boolean;
  voiceRate: number;
  channelWatermarkText?: string;
  defaultQuestionConfig: VideoQuestionConfig;
}

export const DEFAULT_STUDIO_CONFIG: VideoStudioConfig = {
  fps: 30,
  width: 1920,
  height: 1080,
  enableSoundEffects: true,
  enableVoiceover: true,
  voiceRate: 1.0,
  channelWatermarkText: 'Daily Knowledge',
  defaultQuestionConfig: {
    readTime: 2.5,
    optionTime: 1.2,
    timerTime: 5,
    revealTime: 2.5,
  },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Web Audio API synthesizer for clock tick sound
 */
export function playClockTickSound(audioCtx?: AudioContext, dest?: AudioNode) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(dest || audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // Ignore audio context errors
  }
}

/**
 * Web Audio API synthesizer for correct answer chime / ding sound
 */
export function playAnswerDingSound(audioCtx?: AudioContext, dest?: AudioNode) {
  if (!audioCtx) return;
  try {
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      const startT = audioCtx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.35, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.5);
      osc.connect(gain);
      gain.connect(dest || audioCtx.destination);
      osc.start(startT);
      osc.stop(startT + 0.5);
    });
  } catch (e) {
    // Ignore audio context errors
  }
}

/**
 * Generates natural Hindi voiceover script for a question card
 */
export function generateVoiceoverScript(q: GKQuestion): string {
  const correctLetter = q.correctAnswer || 'A';
  const correctText = (q as any)[`option${correctLetter}`] || '';
  return `सवाल नंबर ${q.questionNumber || 1}. ${q.question}. विकल्प ए. ${q.optionA}. विकल्प बी. ${q.optionB}. विकल्प सी. ${q.optionC}. विकल्प डी. ${q.optionD}. सही जवाब है विकल्प ${correctLetter}. ${correctText}`;
}

/**
 * Text to speech trigger using Web Speech API (runs offline on Chrome/Android)
 */
export function speakHindiText(text: string, rate: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      resolve();
      return;
    }

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = rate;

    // Pick Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find((v) => v.lang.includes('hi') || v.name.includes('Hindi'));
    if (hiVoice) utter.voice = hiVoice;

    utter.onend = () => resolve();
    utter.onerror = () => resolve();

    // Safety timeout in case speech synth hangs
    const timer = setTimeout(() => resolve(), 6000);
    utter.onend = () => {
      clearTimeout(timer);
      resolve();
    };

    window.speechSynthesis.speak(utter);
  });
}

/**
 * Draws the EXACT Reference Video Timer:
 * - Position: x=1720, y=440, radius=95
 * - Outer split ring: Left Blue arc, Right Red arc
 * - Inner White disc
 * - Bold number in brown/red (5, 4, 3, 2, 1)
 */
export function drawReferenceTimer(
  ctx: CanvasRenderingContext2D,
  remainingSeconds: number,
  cx: number = 1720,
  cy: number = 440,
  radius: number = 95
) {
  ctx.save();

  // White inner circular background
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const ringThickness = 18;
  const outerR = radius - ringThickness / 2;

  // Left Half Arc: BLUE (#1d4ed8)
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.lineWidth = ringThickness;
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineCap = 'butt';
  ctx.stroke();

  // Right Half Arc: RED (#dc2626)
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, -Math.PI / 2, Math.PI / 2);
  ctx.lineWidth = ringThickness;
  ctx.strokeStyle = '#dc2626';
  ctx.lineCap = 'butt';
  ctx.stroke();

  // Center Digit: Brown / Dark Red font (#78350f)
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(remainingSeconds.toString(), cx, cy + 4);

  ctx.restore();
}

/**
 * Draws the EXACT Reference Video "TIME OUT" Stamp (Frame 20):
 * - Red outer circle
 * - Blue inner circular border
 * - White center disc
 * - Bold red text:
 *   "TIME"
 *   "OUT"
 */
export function drawReferenceTimeOutStamp(
  ctx: CanvasRenderingContext2D,
  cx: number = 1720,
  cy: number = 440,
  radius: number = 95
) {
  ctx.save();

  // Red outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // Blue inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4ed8';
  ctx.fill();

  // White center disc
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 16, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // TIME OUT Text
  ctx.fillStyle = '#dc2626';
  ctx.font = '900 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TIME', cx, cy - 18);
  ctx.fillText('OUT', cx, cy + 24);

  ctx.restore();
}

/**
 * Draws the Center Channel Watermark ("Daily Knowledge" style badge)
 */
export function drawCenterWatermark(
  ctx: CanvasRenderingContext2D,
  text: string = 'Daily Knowledge',
  cx: number = 920,
  cy: number = 510
) {
  ctx.save();
  ctx.globalAlpha = 0.45;

  // Circular badge glow
  ctx.beginPath();
  ctx.arc(cx, cy, 75, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Graduation cap / globe icon hint
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', cx, cy - 25);

  // Watermark text
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(text, cx, cy + 18);

  ctx.restore();
}

/**
 * Main Video Generator with Exact Reference Reproduction:
 * - Slide-in entrance
 * - Question reading
 * - Sequential Option Red Dashed Border (A -> B -> C -> D)
 * - 5-Second Split Blue/Red Timer with Clock Tick audio
 * - TIME OUT Stamp
 * - Vibrant Green Correct Answer Reveal with Chime audio
 * - Smooth slide-up transition to next question
 */
export async function generateExactQuizVideo(
  questions: GKQuestion[],
  designConfig: CardDesignConfig,
  studioConfig: VideoStudioConfig = DEFAULT_STUDIO_CONFIG,
  onProgress: (status: string, percent: number) => void
): Promise<string> {
  const { width, height, fps } = studioConfig;
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;

  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = width;
  mainCanvas.height = height;
  const ctx = mainCanvas.getContext('2d')!;

  // Setup Web Audio MediaStream for output video
  let audioCtx: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      audioDest = audioCtx.createMediaStreamDestination();
    }
  } catch (e) {
    console.warn('AudioContext not available:', e);
  }

  // Combine Canvas Video Stream + Synthesized Audio Stream
  const canvasStream = mainCanvas.captureStream(fps);
  const combinedTracks = [...canvasStream.getVideoTracks()];
  if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
    combinedTracks.push(...audioDest.stream.getAudioTracks());
  }
  const stream = new MediaStream(combinedTracks);

  let mimeType = 'video/webm; codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm; codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    recorder.onerror = (err) => {
      if (audioCtx) audioCtx.close().catch(() => {});
      reject(err);
    };

    recorder.start();

    try {
      const totalQ = questions.length;
      const qCfg = studioConfig.defaultQuestionConfig;

      for (let i = 0; i < totalQ; i++) {
        const q = questions[i];
        const basePct = Math.round((i / totalQ) * 100);

        // ── 1. Slide-in entrance (0.3s) ──
        onProgress(`Question ${i + 1}/${totalQ} — Entrance`, basePct);
        const entranceFrames = Math.round(0.35 * fps);
        for (let f = 0; f <= entranceFrames; f++) {
          const p = f / entranceFrames;
          const offsetY = (1 - p) * 260; // Slide from bottom up

          await renderCardToCanvas(offscreen, q, designConfig, width, height, false, null);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          ctx.save();
          ctx.translate(0, offsetY);
          ctx.drawImage(offscreen, 0, 0);
          ctx.restore();

          if (studioConfig.channelWatermarkText) {
            drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
          }

          await sleep(1000 / fps);
        }

        // ── 2. Read Question (Base card) ──
        onProgress(`Question ${i + 1}/${totalQ} — Reading Question`, basePct + 2);
        if (studioConfig.enableVoiceover) {
          const speechText = q.voiceoverScript || `सवाल नंबर ${q.questionNumber || i + 1}. ${q.question}`;
          speakHindiText(speechText, q.voiceoverSpeed || studioConfig.voiceRate);
        }

        const readFrames = Math.round(qCfg.readTime * fps);
        for (let f = 0; f < readFrames; f++) {
          await renderCardToCanvas(offscreen, q, designConfig, width, height, false, null);
          ctx.drawImage(offscreen, 0, 0);
          if (studioConfig.channelWatermarkText) {
            drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
          }
          await sleep(1000 / fps);
        }

        // ── 3. Sequential Options Reading (Red Dashed Border around A, B, C, D) ──
        const optionsList: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }> = [
          { letter: 'A', text: q.optionA },
          { letter: 'B', text: q.optionB },
          { letter: 'C', text: q.optionC },
          { letter: 'D', text: q.optionD },
        ];

        for (const opt of optionsList) {
          onProgress(`Question ${i + 1}/${totalQ} — Option ${opt.letter}`, basePct + 5);
          if (studioConfig.enableVoiceover) {
            speakHindiText(`ऑप्शन ${opt.letter}. ${opt.text}`, studioConfig.voiceRate);
          }

          const optFrames = Math.round(qCfg.optionTime * fps);
          for (let f = 0; f < optFrames; f++) {
            await renderCardToCanvas(offscreen, q, designConfig, width, height, false, opt.letter);
            ctx.drawImage(offscreen, 0, 0);
            if (studioConfig.channelWatermarkText) {
              drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
            }
            await sleep(1000 / fps);
          }
        }

        // ── 4. 5-Second Circular Timer (Split Blue / Red Ring) ──
        onProgress(`Question ${i + 1}/${totalQ} — Timer Countdown`, basePct + 12);
        for (let sec = qCfg.timerTime; sec >= 1; sec--) {
          // Play clock tick sound
          if (studioConfig.enableSoundEffects && audioCtx) {
            playClockTickSound(audioCtx, audioDest || undefined);
          }

          const secFrames = Math.round(1.0 * fps);
          for (let f = 0; f < secFrames; f++) {
            await renderCardToCanvas(offscreen, q, designConfig, width, height, false, null);
            ctx.drawImage(offscreen, 0, 0);
            if (studioConfig.channelWatermarkText) {
              drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
            }

            // Draw the exact reference timer
            drawReferenceTimer(ctx, sec);
            await sleep(1000 / fps);
          }
        }

        // ── 5. TIME OUT Stamp (1.0s) ──
        onProgress(`Question ${i + 1}/${totalQ} — Time Out!`, basePct + 18);
        const timeoutFrames = Math.round(1.0 * fps);
        for (let f = 0; f < timeoutFrames; f++) {
          await renderCardToCanvas(offscreen, q, designConfig, width, height, false, null);
          ctx.drawImage(offscreen, 0, 0);
          if (studioConfig.channelWatermarkText) {
            drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
          }

          drawReferenceTimeOutStamp(ctx);
          await sleep(1000 / fps);
        }

        // ── 6. Correct Answer Reveal (Vibrant Green Highlight + Ding Chime) ──
        onProgress(`Question ${i + 1}/${totalQ} — Correct Answer!`, basePct + 22);
        if (studioConfig.enableSoundEffects && audioCtx) {
          playAnswerDingSound(audioCtx, audioDest || undefined);
        }

        if (studioConfig.enableVoiceover) {
          const correctLetter = q.correctAnswer || 'A';
          const correctText = (q as any)[`option${correctLetter}`] || '';
          speakHindiText(`सही जवाब है: ${correctLetter}. ${correctText}`, studioConfig.voiceRate);
        }

        const revealFrames = Math.round(qCfg.revealTime * fps);
        for (let f = 0; f < revealFrames; f++) {
          await renderCardToCanvas(offscreen, q, designConfig, width, height, true, null);
          ctx.drawImage(offscreen, 0, 0);
          if (studioConfig.channelWatermarkText) {
            drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
          }
          await sleep(1000 / fps);
        }

        // ── 7. Slide-up transition to next question ──
        if (i < totalQ - 1) {
          const transFrames = Math.round(0.4 * fps);
          for (let f = 0; f <= transFrames; f++) {
            const p = f / transFrames;
            const offsetY = -p * 300; // Slide current card up

            await renderCardToCanvas(offscreen, q, designConfig, width, height, true, null);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.translate(0, offsetY);
            ctx.drawImage(offscreen, 0, 0);
            ctx.restore();

            await sleep(1000 / fps);
          }
        }
      }

      onProgress('Finalizing & Saving MP4/WebM...', 100);
      await sleep(400);
      recorder.stop();
    } catch (err) {
      if (audioCtx) audioCtx.close().catch(() => {});
      recorder.stop();
      reject(err);
    }
  });
}
