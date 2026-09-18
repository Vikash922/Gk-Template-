import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { renderCardToCanvas } from './canvasRenderer';

export interface VideoConfig {
  fps: number;
  readTime: number;       // seconds to show question before timer
  timerTime: number;      // seconds for countdown timer
  timeoutFlashTime: number; // seconds to show "TIME OUT"
  revealTime: number;     // seconds to show correct answer highlighted
  transitionTime: number; // seconds for fade transition between questions
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  fps: 30,
  readTime: 4,
  timerTime: 5,
  timeoutFlashTime: 1.2,
  revealTime: 3,
  transitionTime: 0.5,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Draws a smooth circular countdown timer overlay on the canvas
 */
function drawTimerOverlay(
  ctx: CanvasRenderingContext2D,
  progress: number,
  remainingSeconds: number,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();

  // Soft shadow
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // Background circle (white with slight transparency)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Track ring (gray)
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Animated progress arc
  const angle = Math.PI * 2 * (1 - progress);
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 10, -Math.PI / 2, -Math.PI / 2 + angle);
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  // Color: blue → orange → red as time runs out
  if (remainingSeconds <= 2) {
    ctx.strokeStyle = '#ef4444'; // red
  } else if (remainingSeconds <= 3) {
    ctx.strokeStyle = '#f97316'; // orange
  } else {
    ctx.strokeStyle = '#3b82f6'; // blue
  }
  ctx.stroke();

  // Timer number
  ctx.fillStyle = remainingSeconds <= 2 ? '#ef4444' : '#1e293b';
  ctx.font = `bold ${Math.round(radius * 0.9)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(remainingSeconds.toString(), cx, cy + 3);

  ctx.restore();
}

/**
 * Draws "TIME OUT" text overlay with a stamp-like effect
 */
function drawTimeoutOverlay(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-12 * Math.PI / 180);

  const s = Math.min(scale, 1);

  ctx.globalAlpha = s;
  ctx.font = `900 ${Math.round(70 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // White outline
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeText('TIME OUT!', 0, 0);

  // Red fill
  ctx.fillStyle = '#ef4444';
  ctx.fillText('TIME OUT!', 0, 0);

  ctx.restore();
}

/**
 * Draws a full-screen fade overlay for transitions
 */
function drawFade(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number) {
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Main video generation function.
 * For each question, renders 4 phases:
 *   1. Show question card (readTime)
 *   2. Countdown timer overlay (timerTime)
 *   3. "TIME OUT!" flash (timeoutFlashTime)
 *   4. Answer reveal - correct option turns green (revealTime)
 *   + fade transition to next question
 */
export async function generateQuizVideo(
  questions: GKQuestion[],
  designConfig: CardDesignConfig,
  videoConfig: VideoConfig,
  onProgress: (msg: string, percent: number) => void
): Promise<string> {
  const width = 1920;
  const height = 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(videoConfig.fps);

  // Try vp9 first, fall back to vp8, then default
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

  const totalQuestions = questions.length;
  const timePerQ = videoConfig.readTime + videoConfig.timerTime + videoConfig.timeoutFlashTime + videoConfig.revealTime + videoConfig.transitionTime;
  const totalTime = totalQuestions * timePerQ;

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    recorder.onerror = (e) => reject(e);
    recorder.start();

    try {
      for (let i = 0; i < totalQuestions; i++) {
        const q = questions[i];
        const elapsed = i * timePerQ;

        // ── Phase 1: Show Question Card ──
        onProgress(`Question ${i + 1}/${totalQuestions} — Reading...`, Math.round((elapsed / totalTime) * 100));
        await renderCardToCanvas(canvas, q, designConfig, width, height, false);
        await sleep(videoConfig.readTime * 1000);

        // ── Phase 2: Countdown Timer ──
        onProgress(`Question ${i + 1}/${totalQuestions} — Timer...`, Math.round(((elapsed + videoConfig.readTime) / totalTime) * 100));
        const timerFrames = Math.round(videoConfig.timerTime * videoConfig.fps);
        for (let frame = 0; frame <= timerFrames; frame++) {
          // Render base card
          await renderCardToCanvas(canvas, q, designConfig, width, height, false);

          const progress = frame / timerFrames;
          const remaining = Math.ceil(videoConfig.timerTime * (1 - progress));

          // Draw timer circle
          drawTimerOverlay(ctx, progress, remaining || 1, 1700, 820, 90);

          await sleep(1000 / videoConfig.fps);
        }

        // ── Phase 3: "TIME OUT!" Flash ──
        onProgress(`Question ${i + 1}/${totalQuestions} — Time Out!`, Math.round(((elapsed + videoConfig.readTime + videoConfig.timerTime) / totalTime) * 100));
        const flashFrames = Math.round(videoConfig.timeoutFlashTime * videoConfig.fps);
        for (let frame = 0; frame <= flashFrames; frame++) {
          await renderCardToCanvas(canvas, q, designConfig, width, height, false);
          const scale = Math.min(1, (frame / flashFrames) * 3); // quick scale-in
          drawTimeoutOverlay(ctx, 1700, 820, scale);
          await sleep(1000 / videoConfig.fps);
        }

        // ── Phase 4: Reveal Answer ──
        onProgress(`Question ${i + 1}/${totalQuestions} — Answer!`, Math.round(((elapsed + videoConfig.readTime + videoConfig.timerTime + videoConfig.timeoutFlashTime) / totalTime) * 100));
        await renderCardToCanvas(canvas, q, designConfig, width, height, true);
        await sleep(videoConfig.revealTime * 1000);

        // ── Phase 5: Fade Transition to next ──
        if (i < totalQuestions - 1) {
          const fadeFrames = Math.round(videoConfig.transitionTime * videoConfig.fps);
          for (let frame = 0; frame <= fadeFrames; frame++) {
            await renderCardToCanvas(canvas, q, designConfig, width, height, true);
            drawFade(ctx, width, height, frame / fadeFrames);
            await sleep(1000 / videoConfig.fps);
          }
        }
      }

      onProgress('Finalizing video...', 98);
      recorder.stop();
    } catch (err) {
      recorder.stop();
      reject(err);
    }
  });
}
