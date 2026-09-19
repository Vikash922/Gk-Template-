import { GKQuestion } from '../../types/question';
import { findCuratedAssetByQuery } from '../../constants/curatedImages';
import {
  VideoProject,
  Track,
  TrackType,
  Clip,
  TextElement,
  AudioElement,
  ImageElement,
} from '../types';

export interface GKGeneratorSettings {
  aspectRatio: '9:16' | '16:9';
  stylePreset?: 'reference' | 'darkStudio';
  readTime: number; // e.g. 2.5s
  optionIntervalTime: number; // e.g. 0.8s per option
  timerTime: number; // e.g. 5.0s
  revealTime: number; // e.g. 2.5s
  enableVoiceover: boolean;
  voiceoverSpeed: number;
  enableSfx: boolean;
  questionBgColor?: string;
  optionBgColor?: string;
  correctOptionBgColor?: string;
  canvasBgColor?: string;
}

export const DEFAULT_GK_SETTINGS: GKGeneratorSettings = {
  aspectRatio: '16:9',
  stylePreset: 'reference',
  readTime: 2.5,
  optionIntervalTime: 0.75,
  timerTime: 5.0,
  revealTime: 2.5,
  enableVoiceover: true,
  voiceoverSpeed: 1.0,
  enableSfx: true,
  questionBgColor: '#c6ec02',
  optionBgColor: '#fff000',
  correctOptionBgColor: '#15803d',
  canvasBgColor: '#ffffff',
};

export function createEmptyProject(
  name: string = 'GK_Quiz_Episode',
  aspectRatio: '9:16' | '16:9' = '16:9'
): VideoProject {
  const isPortrait = aspectRatio === '9:16';
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1920 : 1080;

  const tracks: Track[] = [
    { id: 'track_video', type: 'video', name: 'Background Frame', order: 0, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_image', type: 'image', name: 'Illustration PNG', order: 1, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_text_q', type: 'text', name: 'Question Text', order: 2, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_opt_a', type: 'text', name: 'Option (A)', order: 3, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_opt_b', type: 'text', name: 'Option (B)', order: 4, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_opt_c', type: 'text', name: 'Option (C)', order: 5, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_opt_d', type: 'text', name: 'Option (D)', order: 6, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_timer', type: 'sticker', name: 'Timer & Stamps', order: 7, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_voice', type: 'voiceover', name: 'Hindi Voiceover', order: 8, muted: false, locked: false, hidden: false, clips: [] },
    { id: 'track_sfx', type: 'audio', name: 'Sound FX', order: 9, muted: false, locked: false, hidden: false, clips: [] },
  ];

  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    width,
    height,
    aspectRatio,
    fps: 30,
    duration: 0,
    backgroundColor: isPortrait ? '#090d16' : '#ffffff',
    tracks,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateTimelineFromQuestions(
  questions: GKQuestion[],
  settings: GKGeneratorSettings = DEFAULT_GK_SETTINGS,
  existingProject?: VideoProject
): VideoProject {
  const project = existingProject
    ? JSON.parse(JSON.stringify(existingProject)) as VideoProject
    : createEmptyProject('GK_Quiz_Episode', settings.aspectRatio);

  const isPortrait = settings.aspectRatio === '9:16';
  const isReferenceStyle = settings.stylePreset !== 'darkStudio';
  const W = project.width;
  const H = project.height;

  project.backgroundColor = isPortrait && !isReferenceStyle ? '#090d16' : '#ffffff';

  // Ensure all 10 tracks exist on the project
  const expectedTrackDefs = [
    { id: 'track_video', type: 'video' as TrackType, name: 'Background Frame', order: 0 },
    { id: 'track_image', type: 'image' as TrackType, name: 'Illustration PNG', order: 1 },
    { id: 'track_text_q', type: 'text' as TrackType, name: 'Question Text', order: 2 },
    { id: 'track_opt_a', type: 'text' as TrackType, name: 'Option (A)', order: 3 },
    { id: 'track_opt_b', type: 'text' as TrackType, name: 'Option (B)', order: 4 },
    { id: 'track_opt_c', type: 'text' as TrackType, name: 'Option (C)', order: 5 },
    { id: 'track_opt_d', type: 'text' as TrackType, name: 'Option (D)', order: 6 },
    { id: 'track_timer', type: 'sticker' as TrackType, name: 'Timer & Stamps', order: 7 },
    { id: 'track_voice', type: 'voiceover' as TrackType, name: 'Hindi Voiceover', order: 8 },
    { id: 'track_sfx', type: 'audio' as TrackType, name: 'Sound FX', order: 9 },
  ];

  expectedTrackDefs.forEach((def) => {
    if (!project.tracks.some((t) => t.id === def.id)) {
      project.tracks.push({
        id: def.id,
        type: def.type,
        name: def.name,
        order: def.order,
        muted: false,
        locked: false,
        hidden: false,
        clips: [],
      });
    }
  });

  // Clear existing clips on tracks
  project.tracks.forEach((t) => (t.clips = []));

  let currentTimelineCursor = 0;

  const totalCardTime =
    settings.readTime +
    settings.optionIntervalTime * 4 +
    settings.timerTime +
    settings.revealTime;

  questions.forEach((q, qIndex) => {
    const cardStartTime = currentTimelineCursor;
    const qNum = q.questionNumber || qIndex + 1;

    // ── 1. Background / Question Card Frame Clip (on track_video) ──
    const bgClip: Clip = {
      id: `bg_${q.id || qIndex}_${Date.now()}`,
      trackId: 'track_video',
      type: 'video',
      name: `Q${qNum} Backdrop Frame`,
      startTime: cardStartTime,
      duration: totalCardTime,
      x: W / 2,
      y: H / 2,
      width: W,
      height: H,
      scale: 1,
      rotation: 0,
      opacity: 1,
      keyframes: [],
      effects: [],
      gkQuestionId: q.id,
      gkRole: 'background',
    };
    findTrack(project, 'track_video')?.clips.push(bgClip);

    // ── 2. Image / PNG Clip (on track_image) ──
    const resolvedImgSrc =
      q.image ||
      (q.imageTopic ? findCuratedAssetByQuery(q.imageTopic).svgDataUri : '') ||
      (q.question ? findCuratedAssetByQuery(q.question).svgDataUri : '');

    if (resolvedImgSrc) {
      const imgX = isPortrait ? W / 2 : 1380;
      const imgY = isPortrait ? H * 0.36 : 510;
      const imgW = isPortrait ? W * 0.75 : 700;
      const imgH = isPortrait ? H * 0.22 : 460;

      const imgData: ImageElement = {
        src: resolvedImgSrc,
        topic: q.imageTopic,
        fit: 'contain',
        mask: 'rounded',
        borderRadius: 20,
        borderColor: isReferenceStyle ? '#15803d' : '#38bdf8',
        borderWidth: 3,
        shadowBlur: 16,
        shadowColor: 'rgba(0,0,0,0.25)',
      };

      const imgClip: Clip = {
        id: `img_${q.id || qIndex}_${Date.now()}`,
        trackId: 'track_image',
        type: 'image',
        name: `Q${qNum} Illustration`,
        startTime: cardStartTime,
        duration: totalCardTime,
        x: imgX,
        y: imgY,
        width: imgW,
        height: imgH,
        scale: 1,
        rotation: 0,
        opacity: 1,
        image: imgData,
        keyframes: [],
        effects: [],
        inTransition: { type: 'zoom', duration: 0.4 },
        gkQuestionId: q.id,
      };
      findTrack(project, 'track_image')?.clips.push(imgClip);
    }

    // ── 3. Question Text Clip (on track_text_q) ──
    const qX = W / 2;
    const qY = isPortrait ? H * 0.16 : 160;
    const qW = isPortrait ? W * 0.9 : 1760;
    const qH = isPortrait ? 200 : 210;

    const qTextData: TextElement = {
      content: `सवाल ${qNum}: ${q.question}`,
      fontFamily: 'Noto Sans Devanagari',
      fontSize: isPortrait ? 46 : 50,
      fontWeight: '800',
      color: '#ffffff',
      gradient: isReferenceStyle
        ? ['#e11d48', '#c026d3', '#6366f1', '#1d4ed8']
        : ['#fbbf24', '#f59e0b', '#ec4899'],
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 12,
      backgroundColor: isReferenceStyle ? '#c6ec02' : 'rgba(15, 23, 42, 0.88)',
      backgroundPadding: 24,
      backgroundRadius: 24,
      alignment: 'center',
      inAnimation: 'slide',
      animationDuration: 0.45,
    };

    const qTextClip: Clip = {
      id: `qtext_${q.id || qIndex}_${Date.now()}`,
      trackId: 'track_text_q',
      type: 'text',
      name: `Q${qNum} Question Box`,
      startTime: cardStartTime,
      duration: totalCardTime,
      x: qX,
      y: qY,
      width: qW,
      height: qH,
      scale: 1,
      rotation: 0,
      opacity: 1,
      text: qTextData,
      keyframes: [],
      effects: [],
      gkQuestionId: q.id,
      gkRole: 'question',
    };
    findTrack(project, 'track_text_q')?.clips.push(qTextClip);

    // ── 4. Option A, B, C, D Clips (Dedicated layers track_opt_a/b/c/d) ──
    const options = [
      { key: 'A', text: q.optionA, trackId: 'track_opt_a' },
      { key: 'B', text: q.optionB, trackId: 'track_opt_b' },
      { key: 'C', text: q.optionC, trackId: 'track_opt_c' },
      { key: 'D', text: q.optionD, trackId: 'track_opt_d' },
    ];

    const correctLetter = (q.correctAnswer || 'A').toUpperCase();

    options.forEach((opt, optIdx) => {
      const optStartTime = cardStartTime + settings.readTime + optIdx * settings.optionIntervalTime;
      const optDuration = cardStartTime + totalCardTime - optStartTime;
      const isThisCorrect = opt.key === correctLetter;

      const optY = isPortrait
        ? H * 0.54 + optIdx * 125
        : 360 + optIdx * 145;
      const optX = isPortrait ? W / 2 : 460;
      const optW = isPortrait ? W * 0.88 : 760;
      const optH = isPortrait ? 96 : 115;

      const optTextData: TextElement = {
        content: `(${opt.key})  ${opt.text}`,
        fontFamily: 'Noto Sans Devanagari',
        fontSize: isPortrait ? 38 : 42,
        fontWeight: '800',
        color: isReferenceStyle ? '#000000' : '#ffffff',
        backgroundColor: isReferenceStyle ? '#fff000' : 'rgba(30, 41, 59, 0.92)',
        backgroundPadding: 18,
        backgroundRadius: 18,
        strokeColor: isReferenceStyle ? '#e11d48' : '#000000',
        strokeWidth: isReferenceStyle ? 3 : 2,
        alignment: 'left',
        inAnimation: 'pop',
        animationDuration: 0.3,
      };

      const revealTimestamp = cardStartTime + totalCardTime - settings.revealTime;

      const optClip: Clip = {
        id: `opt_${opt.key}_${q.id || qIndex}_${Date.now()}`,
        trackId: opt.trackId,
        type: 'text',
        name: `Q${qNum} Opt (${opt.key})`,
        startTime: optStartTime,
        duration: optDuration,
        x: optX,
        y: optY,
        width: optW,
        height: optH,
        scale: 1,
        rotation: 0,
        opacity: 1,
        text: optTextData,
        keyframes: [],
        effects: [],
        gkQuestionId: q.id,
        gkRole: `option${opt.key}` as any,
        dashedActiveStart: optStartTime,
        dashedActiveEnd: optStartTime + settings.optionIntervalTime,
        revealStart: revealTimestamp,
        isCorrectOption: isThisCorrect,
      };

      // If correct answer, add keyframe at reveal time to scale up with victory pop!
      if (isThisCorrect) {
        const revealOffset = totalCardTime - settings.revealTime - (optStartTime - cardStartTime);
        optClip.keyframes.push({
          id: `kf_rev_${optClip.id}`,
          time: Math.max(0, revealOffset),
          property: 'scale',
          value: 1.08,
          easing: 'easeInOut',
        });
      }

      findTrack(project, opt.trackId)?.clips.push(optClip);
    });

    // ── 5. Split Ring Timer Clip (on track_timer) ──
    const timerStartTime = cardStartTime + settings.readTime + settings.optionIntervalTime * 4;
    const timerClip: Clip = {
      id: `timer_${q.id || qIndex}_${Date.now()}`,
      trackId: 'track_timer',
      type: 'sticker',
      name: `Q${qNum} 5s Countdown`,
      startTime: timerStartTime,
      duration: settings.timerTime,
      x: isPortrait ? W * 0.82 : 1380,
      y: isPortrait ? H * 0.48 : 840,
      width: isPortrait ? 130 : 165,
      height: isPortrait ? 130 : 165,
      scale: 1,
      rotation: 0,
      opacity: 1,
      keyframes: [],
      effects: [],
      gkQuestionId: q.id,
      gkRole: 'timer',
    };
    findTrack(project, 'track_timer')?.clips.push(timerClip);

    // ── 6. Hindi Voiceover Script Clip (on track_voice) ──
    if (settings.enableVoiceover) {
      const voiceScript =
        q.voiceoverScript ||
        `सवाल नंबर ${qNum}. ${q.question}। ऑप्शन ए. ${q.optionA}। ऑप्शन बी. ${q.optionB}। ऑप्शन सी. ${q.optionC}। ऑप्शन डी. ${q.optionD}। सही उत्तर है ऑप्शन ${correctLetter}।`;

      const voiceAudioData: AudioElement = {
        volume: 1.0,
        speed: settings.voiceoverSpeed || 1.0,
        synthText: voiceScript,
        synthLang: 'hi-IN',
      };

      const voiceClip: Clip = {
        id: `voice_${q.id || qIndex}_${Date.now()}`,
        trackId: 'track_voice',
        type: 'voiceover',
        name: `Q${qNum} Hindi Voice`,
        startTime: cardStartTime,
        duration: totalCardTime,
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        audio: voiceAudioData,
        keyframes: [],
        effects: [],
        gkQuestionId: q.id,
      };
      findTrack(project, 'track_voice')?.clips.push(voiceClip);
    }

    // ── 7. SFX Clips (Tick Tock & Answer Ding) on track_sfx ──
    if (settings.enableSfx) {
      const tickClip: Clip = {
        id: `sfx_tick_${q.id || qIndex}_${Date.now()}`,
        trackId: 'track_sfx',
        type: 'audio',
        name: `Q${qNum} Clock Tick`,
        startTime: timerStartTime,
        duration: settings.timerTime,
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        audio: {
          volume: 0.8,
          isSfx: true,
          sfxType: 'clockTick',
        },
        keyframes: [],
        effects: [],
        gkQuestionId: q.id,
      };
      findTrack(project, 'track_sfx')?.clips.push(tickClip);

      const chimeStartTime = cardStartTime + totalCardTime - settings.revealTime;
      const chimeClip: Clip = {
        id: `sfx_ding_${q.id || qIndex}_${Date.now()}`,
        trackId: 'track_sfx',
        type: 'audio',
        name: `Q${qNum} Answer Chime`,
        startTime: chimeStartTime,
        duration: 1.5,
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        audio: {
          volume: 0.9,
          isSfx: true,
          sfxType: 'correctDing',
        },
        keyframes: [],
        effects: [],
        gkQuestionId: q.id,
      };
      findTrack(project, 'track_sfx')?.clips.push(chimeClip);
    }

    currentTimelineCursor += totalCardTime;
  });

  project.duration = Math.max(1, Math.round(currentTimelineCursor * 10) / 10);
  project.updatedAt = Date.now();

  return project;
}

function findTrack(project: VideoProject, trackId: string): Track | undefined {
  return project.tracks.find((t) => t.id === trackId);
}
