/**
 * Text fitting and wrapping utilities for 1920x1080 canvas
 */

export interface WrappedLine {
  text: string;
  width: number;
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines.length > 0 ? lines : [text];
}

/**
 * Calculates optimal font size for question text to fit within box
 */
export function calculateQuestionFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  boxWidth: number,
  boxHeight: number,
  baseFontSize: number = 54,
  fontFamily: string = 'Noto Sans Devanagari',
  fontWeight: string = '800',
  autoFit: boolean = true
): { fontSize: number; lines: string[]; lineHeight: number } {
  const paddingX = 48; // Crisp left and right padding inside question box
  const paddingY = 24;
  const availableWidth = boxWidth - paddingX * 2;
  const availableHeight = boxHeight - paddingY * 2;

  if (!autoFit) {
    ctx.font = `${fontWeight} ${baseFontSize}px "${fontFamily}", sans-serif`;
    const lines = wrapText(ctx, text, availableWidth);
    const lineHeight = baseFontSize * 1.34;
    return { fontSize: baseFontSize, lines, lineHeight };
  }

  let fontSize = baseFontSize;
  const minFontSize = 30;

  while (fontSize >= minFontSize) {
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    const lines = wrapText(ctx, text, availableWidth);
    const lineHeight = fontSize * 1.34; // Generous space for Devanagari matras
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= availableHeight && lines.length <= 3) {
      return { fontSize, lines, lineHeight };
    }
    fontSize -= 2;
  }

  ctx.font = `${fontWeight} ${minFontSize}px "${fontFamily}", sans-serif`;
  const lines = wrapText(ctx, text, availableWidth);
  return { fontSize: minFontSize, lines, lineHeight: minFontSize * 1.32 };
}

/**
 * Calculates optimal font size for option text to fit within option box
 */
export function calculateOptionFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  availableWidth: number,
  boxHeight: number,
  baseFontSize: number = 44,
  fontFamily: string = 'Noto Sans Devanagari',
  fontWeight: string = '800',
  autoFit: boolean = true
): { fontSize: number; lines: string[]; lineHeight: number } {
  if (!autoFit) {
    ctx.font = `${fontWeight} ${baseFontSize}px "${fontFamily}", sans-serif`;
    const lines = wrapText(ctx, text, availableWidth);
    const lineHeight = baseFontSize * 1.25;
    return { fontSize: baseFontSize, lines, lineHeight };
  }

  let fontSize = baseFontSize;
  const minFontSize = 26;
  const availableHeight = boxHeight - 8;

  while (fontSize >= minFontSize) {
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    const lines = wrapText(ctx, text, availableWidth);
    const lineHeight = fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= availableHeight && lines.length <= 2) {
      return { fontSize, lines, lineHeight };
    }
    fontSize -= 2;
  }

  ctx.font = `${fontWeight} ${minFontSize}px "${fontFamily}", sans-serif`;
  const lines = wrapText(ctx, text, availableWidth);
  return { fontSize: minFontSize, lines, lineHeight: minFontSize * 1.22 };
}
