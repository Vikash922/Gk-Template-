import { VideoProject } from '../types';
import { PreviewEngine } from './PreviewEngine';

export interface ExportOptions {
  resolution: '4k' | '1080p' | '720p';
  fps: 30 | 60;
  format: 'webm' | 'mp4';
}

export class ExportEngine {
  private isCancelled: boolean = false;
  private recorder: MediaRecorder | null = null;
  private audioCtx: AudioContext | null = null;

  cancel() {
    this.isCancelled = true;
    if (this.recorder && this.recorder.state === 'recording') {
      try {
        this.recorder.stop();
      } catch {}
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
  }

  async exportVideo(
    project: VideoProject,
    options: ExportOptions,
    onProgress: (percent: number, status: string, estimatedSecLeft?: number) => void
  ): Promise<string> {
    this.isCancelled = false;

    // Determine target dimensions
    const isPortrait = project.aspectRatio === '9:16';
    let targetW = 1080;
    let targetH = 1920;

    if (options.resolution === '4k') {
      targetW = isPortrait ? 2160 : 3840;
      targetH = isPortrait ? 3840 : 2160;
    } else if (options.resolution === '720p') {
      targetW = isPortrait ? 720 : 1280;
      targetH = isPortrait ? 1280 : 720;
    } else {
      targetW = isPortrait ? 1080 : 1920;
      targetH = isPortrait ? 1920 : 1080;
    }

    const fps = options.fps || 30;
    const totalDuration = Math.max(1, project.duration);
    const totalFrames = Math.ceil(totalDuration * fps);

    // Create rendering offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const previewEngine = new PreviewEngine(canvas);

    // Audio stream destination
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        audioDest = this.audioCtx.createMediaStreamDestination();
      }
    } catch (e) {
      console.warn('AudioContext not supported for video export:', e);
    }

    // Capture Canvas Stream
    const canvasStream = canvas.captureStream(fps);
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
      combinedTracks.push(...audioDest.stream.getAudioTracks());
    }

    const outputStream = new MediaStream(combinedTracks);

    // Pick best supported MIME type
    let mimeType = 'video/webm; codecs=vp9';
    if (options.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm; codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const bitrate =
      options.resolution === '4k'
        ? (options.fps === 60 ? 40_000_000 : 30_000_000)
        : options.resolution === '1080p'
        ? (options.fps === 60 ? 14_000_000 : 8_000_000)
        : 4_000_000;

    const recordedChunks: Blob[] = [];
    this.recorder = new MediaRecorder(outputStream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      this.recorder!.onstop = () => {
        if (this.isCancelled) {
          reject(new Error('Export was cancelled by user'));
          return;
        }
        const blob = new Blob(recordedChunks, { type: mimeType });
        const downloadUrl = URL.createObjectURL(blob);
        resolve(downloadUrl);
      };

      this.recorder!.onerror = (err) => {
        reject(err);
      };

      this.recorder!.start();

      // Render frame by frame
      let currentFrame = 0;
      const startTimeStamp = performance.now();

      // Scaled project clone matching target canvas
      const renderProject: VideoProject = {
        ...project,
        width: targetW,
        height: targetH,
        tracks: project.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => ({
            ...c,
            x: (c.x / project.width) * targetW,
            y: (c.y / project.height) * targetH,
            width: (c.width / project.width) * targetW,
            height: (c.height / project.height) * targetH,
          })),
        })),
      };

      const renderNextBatch = () => {
        if (this.isCancelled) {
          try {
            this.recorder?.stop();
          } catch {}
          reject(new Error('Export cancelled'));
          return;
        }

        // Render in slices per tick for responsiveness
        const batchSize = Math.max(1, Math.min(5, Math.floor(fps / 10)));
        for (let b = 0; b < batchSize && currentFrame <= totalFrames; b++) {
          const currentTime = currentFrame / fps;

          previewEngine.render(renderProject, currentTime, undefined, {
            showSafeGuides: false,
            showSelectionHandles: false,
          });

          // Play synth audio clicks / tones if at key moments
          if (this.audioCtx && audioDest) {
            this.injectAudioEvents(project, currentTime, this.audioCtx, audioDest);
          }

          currentFrame++;
        }

        const pct = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
        const elapsed = (performance.now() - startTimeStamp) / 1000;
        const speed = currentFrame / Math.max(0.1, elapsed); // frames per second
        const framesLeft = totalFrames - currentFrame;
        const estSec = Math.max(0, Math.round(framesLeft / Math.max(1, speed)));

        onProgress(pct, `Rendering Frame ${currentFrame}/${totalFrames} (${pct}%)`, estSec);

        if (currentFrame <= totalFrames) {
          // Keep loop going smoothly
          setTimeout(renderNextBatch, 1000 / (fps * 2));
        } else {
          // Finished rendering
          setTimeout(() => {
            try {
              this.recorder?.stop();
            } catch (err) {
              reject(err);
            }
          }, 300);
        }
      };

      renderNextBatch();
    });
  }

  private injectAudioEvents(
    project: VideoProject,
    time: number,
    ctx: AudioContext,
    dest: MediaStreamAudioDestinationNode
  ) {
    for (const track of project.tracks) {
      if (track.muted) continue;
      for (const clip of track.clips) {
        if (clip.audio?.isSfx) {
          // Check if tick matches second boundary
          if (clip.audio.sfxType === 'clockTick') {
            const rel = time - clip.startTime;
            if (rel >= 0 && rel < clip.duration && Math.abs(rel - Math.round(rel)) < 0.02) {
              this.playTickTone(ctx, dest);
            }
          } else if (clip.audio.sfxType === 'correctDing') {
            if (Math.abs(time - clip.startTime) < 0.03) {
              this.playDingChime(ctx, dest);
            }
          }
        }
      }
    }
  }

  private playTickTone(ctx: AudioContext, dest: MediaStreamAudioDestinationNode) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  private playDingChime(ctx: AudioContext, dest: MediaStreamAudioDestinationNode) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {}
  }
}
