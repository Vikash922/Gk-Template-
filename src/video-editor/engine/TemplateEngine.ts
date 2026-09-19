import { VideoProject, VideoTemplate, Clip } from '../types';

export const BUILTIN_TEMPLATES: VideoTemplate[] = [
  {
    id: 'tmpl_reference_16_9',
    name: 'Reference 16:9 YouTube GK (Lime & Yellow)',
    description: 'Exact batch card layout: Lime-yellow question banner (#c6ec02), bright yellow options (#fff000) with red border (#e11d48), green card frame (#15803d), and 5s split circular timer.',
    aspectRatio: '16:9',
    backgroundColor: '#ffffff',
    questionStyle: {
      color: '#000000',
      fontSize: 48,
      fontWeight: '800',
      backgroundColor: '#c6ec02',
      strokeColor: '#15803d',
      strokeWidth: 3,
      backgroundRadius: 18,
      inAnimation: 'zoom',
    },
    optionStyle: {
      color: '#000000',
      fontSize: 36,
      fontWeight: '700',
      backgroundColor: '#fff000',
      strokeColor: '#e11d48',
      strokeWidth: 2.5,
      backgroundRadius: 14,
      inAnimation: 'pop',
    },
    correctOptionStyle: {
      color: '#ffffff',
      backgroundColor: '#15803d',
      strokeColor: '#15803d',
    },
    timerStyle: {
      type: 'circle',
      duration: 5,
      leftArcColor: '#2563eb',
      rightArcColor: '#dc2626',
      numberColor: '#b45309',
    },
    timing: {
      questionReadTime: 2.5,
      optionIntervalTime: 0.75,
      timerCountdownTime: 5.0,
      answerRevealTime: 2.5,
    },
    enableTts: true,
    ttsRate: 1.0,
    enableSfx: true,
  },
  {
    id: 'tmpl_viral_shorts',
    name: 'Viral Shorts (9:16 High Contrast)',
    description: 'Vibrant yellow/cyan gradients, pop animations, and bold outlined text optimized for YouTube Shorts and Instagram Reels.',
    aspectRatio: '9:16',
    backgroundColor: '#030712',
    questionStyle: {
      color: '#ffffff',
      gradient: ['#fbbf24', '#f59e0b', '#ef4444'],
      fontSize: 48,
      fontWeight: '900',
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      backgroundRadius: 22,
      inAnimation: 'slide',
    },
    optionStyle: {
      color: '#f8fafc',
      fontSize: 38,
      fontWeight: '700',
      backgroundColor: 'rgba(30, 41, 59, 0.94)',
      backgroundRadius: 16,
      inAnimation: 'pop',
    },
    correctOptionStyle: {
      color: '#ffffff',
      backgroundColor: '#059669',
      gradient: ['#10b981', '#059669'],
    },
    timerStyle: {
      type: 'circle',
      duration: 5,
      leftArcColor: '#2563eb',
      rightArcColor: '#dc2626',
      numberColor: '#78350f',
    },
    timing: {
      questionReadTime: 2.5,
      optionIntervalTime: 0.75,
      timerCountdownTime: 5.0,
      answerRevealTime: 2.5,
    },
    enableTts: true,
    ttsRate: 1.0,
    enableSfx: true,
  },
  {
    id: 'tmpl_classic_gk',
    name: 'Classic GK Studio (Green & Gold)',
    description: 'Traditional GK television quiz theme with emerald borders and golden text boxes.',
    aspectRatio: '9:16',
    backgroundColor: '#022c22',
    questionStyle: {
      color: '#fef08a',
      gradient: ['#fde047', '#eab308'],
      fontSize: 46,
      fontWeight: '800',
      backgroundColor: 'rgba(6, 78, 59, 0.95)',
      backgroundRadius: 18,
      inAnimation: 'zoom',
    },
    optionStyle: {
      color: '#ffffff',
      fontSize: 36,
      fontWeight: '700',
      backgroundColor: 'rgba(6, 95, 70, 0.92)',
      backgroundRadius: 14,
      inAnimation: 'fade',
    },
    correctOptionStyle: {
      color: '#ffffff',
      backgroundColor: '#16a34a',
    },
    timerStyle: {
      type: 'circle',
      duration: 5,
      leftArcColor: '#3b82f6',
      rightArcColor: '#ef4444',
      numberColor: '#b45309',
    },
    timing: {
      questionReadTime: 3.0,
      optionIntervalTime: 0.8,
      timerCountdownTime: 5.0,
      answerRevealTime: 2.5,
    },
    enableTts: true,
    ttsRate: 0.95,
    enableSfx: true,
  },
  {
    id: 'tmpl_minimal_dark',
    name: 'Minimal Clean Charcoal',
    description: 'Sleek, low-distraction design with crisp typography, smooth fades, and white accents.',
    aspectRatio: '9:16',
    backgroundColor: '#09090b',
    questionStyle: {
      color: '#ffffff',
      fontSize: 46,
      fontWeight: '800',
      backgroundColor: 'rgba(24, 24, 27, 0.9)',
      backgroundRadius: 24,
      inAnimation: 'fade',
    },
    optionStyle: {
      color: '#e4e4e7',
      fontSize: 36,
      fontWeight: '600',
      backgroundColor: 'rgba(39, 39, 42, 0.85)',
      backgroundRadius: 16,
      inAnimation: 'slide',
    },
    correctOptionStyle: {
      color: '#ffffff',
      backgroundColor: '#15803d',
    },
    timerStyle: {
      type: 'circle',
      duration: 5,
      leftArcColor: '#6366f1',
      rightArcColor: '#f43f5e',
      numberColor: '#3f3f46',
    },
    timing: {
      questionReadTime: 2.2,
      optionIntervalTime: 0.7,
      timerCountdownTime: 5.0,
      answerRevealTime: 2.0,
    },
    enableTts: true,
    ttsRate: 1.0,
    enableSfx: true,
  },
];

export function extractTemplateFromProject(
  project: VideoProject,
  name: string,
  description: string = 'User saved custom template'
): VideoTemplate {
  // Find first question text clip
  let qStyle: any = {};
  let optStyle: any = {};

  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.gkRole === 'question' && clip.text) {
        qStyle = { ...clip.text };
      }
      if (clip.gkRole === 'optionA' && clip.text) {
        optStyle = { ...clip.text };
      }
    }
  }

  return {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    description,
    aspectRatio: project.aspectRatio === '16:9' ? '16:9' : '9:16',
    backgroundColor: project.backgroundColor,
    questionStyle: qStyle,
    optionStyle: optStyle,
    correctOptionStyle: {
      backgroundColor: '#059669',
      color: '#ffffff',
    },
    timerStyle: {
      type: 'circle',
      duration: 5,
      leftArcColor: '#2563eb',
      rightArcColor: '#dc2626',
      numberColor: '#78350f',
    },
    timing: {
      questionReadTime: 2.5,
      optionIntervalTime: 0.75,
      timerCountdownTime: 5.0,
      answerRevealTime: 2.5,
    },
    enableTts: true,
    ttsRate: 1.0,
    enableSfx: true,
  };
}

export function applyTemplateToProject(
  project: VideoProject,
  template: VideoTemplate
): VideoProject {
  const updated = JSON.parse(JSON.stringify(project)) as VideoProject;
  updated.backgroundColor = template.backgroundColor;

  if (template.aspectRatio && template.aspectRatio !== updated.aspectRatio) {
    updated.aspectRatio = template.aspectRatio;
    if (template.aspectRatio === '16:9') {
      updated.width = 1920;
      updated.height = 1080;
    } else if (template.aspectRatio === '9:16') {
      updated.width = 1080;
      updated.height = 1920;
    }
  }

  for (const track of updated.tracks) {
    for (const clip of track.clips) {
      if (clip.gkRole === 'question' && clip.text && template.questionStyle) {
        clip.text = {
          ...clip.text,
          ...template.questionStyle,
          content: clip.text.content, // Preserve original question content
        };
      } else if (
        clip.gkRole?.startsWith('option') &&
        clip.text &&
        template.optionStyle
      ) {
        clip.text = {
          ...clip.text,
          ...template.optionStyle,
          content: clip.text.content, // Preserve original option text
        };
      }
    }
  }

  updated.updatedAt = Date.now();
  return updated;
}
