import { CardDesignConfig } from '../types/design';
import { DEFAULT_TEMPLATE_DATA_URI } from './defaultTemplate';

export const REFERENCE_DESIGN: CardDesignConfig = {
  presetName: 'Reference GK',
  canvasWidth: 1920,
  canvasHeight: 1080,
  canvasOuterBg: '#ffffff', // Pure white background matching reference images

  // Template Mode Configuration (Enabled only when user uploads custom PNG template)
  templateImage: '',
  useTemplateImage: false,
  templatePreprintedLetters: false,

  // Green outer card border (fallback/metrics)
  outerMargin: 42,
  outerBorderWidth: 14,
  outerBorderColor: '#15803d', // Authentic vivid green border
  outerBorderRadius: 44,
  innerSpacing: 0,
  cardBgColor: '#ffffff',      // Pure white main card body

  // Top Question Box
  questionBoxX: 72,
  questionBoxY: 60,
  questionBoxWidth: 1776,
  questionBoxHeight: 236,
  questionBoxRadius: 28,
  questionBoxBorderWidth: 4,
  questionBoxBorderColor: '#000000',
  questionBoxBgGradientStart: '#c6ec02', // Vibrant lime-yellow
  questionBoxBgGradientEnd: '#faee0a',   // Bright sunny yellow
  showQuestionBox: true,
  questionBoxPaddingLeft: 48,

  // Question Typography
  questionBaseFontSize: 54,
  questionAutoFit: true,
  questionFontFamily: 'Noto Sans Devanagari',
  questionFontWeight: '800',
  questionNumberColor: '#dc2626', // Bold red for question number
  questionGradientStops: ['#e11d48', '#c026d3', '#6366f1', '#1d4ed8'], // Red -> Magenta -> Violet -> Blue

  // Left Options
  optionWidth: 710,
  optionHeight: 128,
  optionSpacing: 22,
  optionStartX: 72,
  optionStartY: 332,
  optionRadius: 24,
  optionBorderWidth: 4,
  optionBorderColor: '#e11d48', // Vibrant red border matching reference
  optionBgColor: '#fff000',     // Bright sunny yellow fill
  optionTextColor: '#000000',   // Deep black crisp text
  optionBaseFontSize: 44,
  optionAutoFit: true,
  optionFontFamily: 'Noto Sans Devanagari',
  optionFontWeight: '800',
  showOptionBoxes: true,
  showOptionLetters: true,
  optionLetterStyle: 'prefix',
  optionLetterColor: '#dc2626',
  optionLetterBgColor: '#e11d48',
  optionTextPaddingLeft: 36,
  optionLayout: 'column',
  optionGridColumnGap: 40,
  optionGridRowGap: 24,

  // Right Image Area
  imageAreaX: 815,
  imageAreaY: 320,
  imageAreaWidth: 1005,
  imageAreaHeight: 690,
  imageScale: 1,
  imageOffsetX: 0,
  imageOffsetY: 0,
  imageRotation: 0,
  imageOpacity: 1,
};

export const BRIGHT_DESIGN: CardDesignConfig = {
  ...REFERENCE_DESIGN,
  presetName: 'Bright',
  canvasOuterBg: '#ffffff',
  outerBorderColor: '#16a34a',
  questionBoxBgGradientStart: '#a3e635',
  questionBoxBgGradientEnd: '#facc15',
  optionBorderColor: '#dc2626',
  optionBgColor: '#fef08a',
};

export const MINIMAL_DESIGN: CardDesignConfig = {
  ...REFERENCE_DESIGN,
  presetName: 'Minimal',
  canvasOuterBg: '#ffffff',
  outerBorderWidth: 10,
  outerBorderColor: '#166534',
  questionBoxBgGradientStart: '#d9f99d',
  questionBoxBgGradientEnd: '#fef08a',
  questionBoxBorderWidth: 3,
  optionBorderWidth: 3,
  optionBorderColor: '#b91c1c',
  optionBgColor: '#fef9c3',
};

