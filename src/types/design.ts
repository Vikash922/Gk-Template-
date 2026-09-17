export interface CardDesignConfig {
  presetName: 'Reference GK' | 'Bright' | 'Minimal';
  
  // Canvas
  canvasWidth: number;
  canvasHeight: number;
  canvasOuterBg: string; // Black or dark outer background framing the card

  // Outer Border & Card Frame
  outerMargin: number;
  outerBorderWidth: number;
  outerBorderColor: string;
  outerBorderRadius: number;
  innerSpacing: number; // White separation band
  cardBgColor: string; // Inner card fill (white)

  // Question Box
  questionBoxX: number;
  questionBoxY: number;
  questionBoxWidth: number;
  questionBoxHeight: number;
  questionBoxRadius: number;
  questionBoxBorderWidth: number;
  questionBoxBorderColor: string;
  questionBoxBgGradientStart: string; // Lime green
  questionBoxBgGradientEnd: string;   // Yellow
  showQuestionBox?: boolean; // When false, does not draw vector box background/border
  questionBoxPaddingLeft?: number; // Padding from questionBoxX to text start (default 48)
  
  // Uploaded PNG Template fields
  templateImage?: string; // Data URI (PNG / SVG) or URL of uploaded blank PNG template
  useTemplateImage?: boolean; // When true, uses uploaded PNG as exact background without recreating borders/boxes
  templatePreprintedLetters?: boolean; // When true, template already has A., B., C., D. printed
  templateWidth?: number;
  templateHeight?: number;

  // Question Typography
  questionBaseFontSize: number;
  questionAutoFit: boolean;
  questionFontFamily?: string;
  questionFontWeight?: string;
  questionNumberColor: string; // Red
  questionGradientStops: string[]; // [Red, Magenta, Purple, Blue]

  // Options
  optionWidth: number;
  optionHeight: number;
  optionSpacing: number;
  optionStartX: number;
  optionStartY: number;
  optionRadius: number;
  optionBorderWidth: number;
  optionBorderColor: string; // Orange / Red
  optionBgColor: string;     // Yellow
  optionTextColor: string;   // Black
  optionBaseFontSize: number;
  optionAutoFit: boolean;
  optionFontFamily?: string;
  optionFontWeight?: string;

  // Option Custom Box & Letter Visibility
  showOptionBoxes?: boolean; // When true, draws vector option boxes; when false, only draws text
  showOptionLetters?: boolean; // Whether A, B, C, D letter badges are shown (default true)
  optionLetterStyle?: 'prefix' | 'badge_circle' | 'badge_pill'; // 'prefix' (A.), 'badge_circle' (🔴 A), 'badge_pill' ([ A ])
  optionLetterColor?: string; // Color of letter badge/text (e.g. #dc2626 or #ffffff)
  optionLetterBgColor?: string; // Background color for badge_circle or badge_pill
  optionTextPaddingLeft?: number; // Distance from option start to text (default ~36 or 95)
  optionLayout?: 'column' | 'grid2x2'; // 1-column (vertical 4) or 2x2 grid
  optionGridColumnGap?: number; // Horizontal gap between column 1 and column 2 in 2x2 grid
  optionGridRowGap?: number; // Vertical gap between row 1 and row 2 in 2x2 grid

  // Image Area
  imageAreaX: number;
  imageAreaY: number;
  imageAreaWidth: number;
  imageAreaHeight: number;
  imageScale: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageRotation: number;
  imageOpacity: number;

  // Global Logo / Watermark PNG
  watermarkImage?: string; // Data URI or URL of logo/watermark applied across cards
  showWatermark?: boolean; // Toggle watermark on/off
  watermarkX?: number;
  watermarkY?: number;
  watermarkWidth?: number;
  watermarkHeight?: number;
  watermarkOpacity?: number;
}
