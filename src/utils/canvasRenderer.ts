import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { calculateCardLayout } from './layout';
import { calculateQuestionFontSize, calculateOptionFontSize } from './textFit';
import { drawImageContain, loadImage } from './image';
import { findCuratedAssetByQuery } from '../constants/curatedImages';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function isLegacyGhostSvg(uri?: string): boolean {
  if (!uri) return false;
  return (
    uri.includes('%3Ctext%20x%3D%22104%22') ||
    uri.includes('<text x="104"') ||
    uri.includes('Option A Box with pre-printed') ||
    uri.includes('qBoxGrad')
  );
}

function drawVectorCardFrame(
  ctx: CanvasRenderingContext2D,
  config: CardDesignConfig,
  outerBorderRect: { x: number; y: number; width: number; height: number; radius: number }
) {
  // 1. Draw outer canvas background (Pure clean white)
  ctx.fillStyle = config.canvasOuterBg || '#ffffff';
  ctx.fillRect(0, 0, 1920, 1080);

  // 2. Draw Main Card Body (White fill + Thick Outer Green Border)
  roundRectPath(
    ctx,
    outerBorderRect.x,
    outerBorderRect.y,
    outerBorderRect.width,
    outerBorderRect.height,
    outerBorderRect.radius
  );
  ctx.fillStyle = config.cardBgColor || '#ffffff';
  ctx.fill();
  ctx.lineWidth = config.outerBorderWidth;
  ctx.strokeStyle = config.outerBorderColor;
  ctx.stroke();
}

/**
 * Renders the question card into an HTMLCanvasElement at 1920x1080 resolution
 */
export async function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  question: GKQuestion,
  config: CardDesignConfig,
  targetWidth: number = 1920,
  targetHeight: number = 1080,
  highlightCorrectAnswer: boolean = false
): Promise<void> {
  // Ensure custom font is ready before measuring and drawing
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed if font loading promise fails
    }
  }

  // Merge per-card custom design override if present
  const mergedConfig: CardDesignConfig = question.customDesign
    ? { ...config, ...question.customDesign }
    : config;

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Scale context if exporting at different resolution (e.g., 1280x720)
  const scale = targetWidth / 1920;
  ctx.save();
  ctx.scale(scale, scale);

  const layout = calculateCardLayout(mergedConfig);
  const { outerBorderRect, questionBoxRect, optionBoxes, imageBounds } = layout;

  // Filter out any legacy SVG templates that had hardcoded static boxes
  const hasValidTemplate = Boolean(
    mergedConfig.useTemplateImage &&
    mergedConfig.templateImage &&
    !isLegacyGhostSvg(mergedConfig.templateImage)
  );

  if (hasValidTemplate && mergedConfig.templateImage) {
    try {
      // 1. Draw the exact uploaded template
      const templateImg = await loadImage(mergedConfig.templateImage);
      ctx.drawImage(templateImg, 0, 0, 1920, 1080);
    } catch (err) {
      console.warn('Failed to load PNG template, falling back to clean vector layout:', err);
      drawVectorCardFrame(ctx, mergedConfig, outerBorderRect);
    }
  } else {
    // Clean dynamic vector card frame (white canvas + green rounded card frame)
    drawVectorCardFrame(ctx, mergedConfig, outerBorderRect);
  }

  // 3. Draw Dynamic Top Question Box (single source of truth for both vector & custom templates)
  const shouldDrawQBox = mergedConfig.showQuestionBox !== false;

  if (shouldDrawQBox) {
    const qGrad = ctx.createLinearGradient(
      questionBoxRect.x,
      questionBoxRect.y,
      questionBoxRect.x + questionBoxRect.width,
      questionBoxRect.y
    );
    qGrad.addColorStop(0, mergedConfig.questionBoxBgGradientStart || '#c6ec02');
    qGrad.addColorStop(1, mergedConfig.questionBoxBgGradientEnd || '#faee0a');

    roundRectPath(
      ctx,
      questionBoxRect.x,
      questionBoxRect.y,
      questionBoxRect.width,
      questionBoxRect.height,
      questionBoxRect.radius
    );
    ctx.fillStyle = qGrad;
    ctx.fill();
    if (mergedConfig.questionBoxBorderWidth > 0) {
      ctx.lineWidth = mergedConfig.questionBoxBorderWidth;
      ctx.strokeStyle = mergedConfig.questionBoxBorderColor || '#000000';
      ctx.stroke();
    }
  }

  // 4. Draw Question Text (Red Question Number + Horizontal Iridescent Gradient Text)
  const qNumStr = question.questionNumber ? `${question.questionNumber}. ` : '';
  const fullQText = `${qNumStr}${question.question || 'Type your GK question here...'}`;

  const qFontFamily = mergedConfig.questionFontFamily || 'Noto Sans Devanagari';
  const qFontWeight = mergedConfig.questionFontWeight || '800';

  const { fontSize: qFontSize, lines: qLines, lineHeight: qLineHeight } = calculateQuestionFontSize(
    ctx,
    fullQText,
    questionBoxRect.width - (mergedConfig.questionBoxPaddingLeft || 48) * 1.5,
    questionBoxRect.height,
    mergedConfig.questionBaseFontSize,
    qFontFamily,
    qFontWeight,
    mergedConfig.questionAutoFit ?? true
  );
  ctx.font = `${qFontWeight} ${qFontSize}px "${qFontFamily}", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const totalTextHeight = qLines.length * qLineHeight;
  const startY = questionBoxRect.y + (questionBoxRect.height - totalTextHeight) / 2 + qLineHeight / 2;
  const paddingLeft = questionBoxRect.x + (mergedConfig.questionBoxPaddingLeft || 48);

  // Authentic 4-color gradient stops: Red -> Magenta -> Violet -> Blue
  const stops = mergedConfig.questionGradientStops && mergedConfig.questionGradientStops.length >= 2
    ? mergedConfig.questionGradientStops
    : ['#e11d48', '#c026d3', '#6366f1', '#1d4ed8'];

  qLines.forEach((line, index) => {
    const y = startY + index * qLineHeight;

    if (index === 0 && qNumStr && line.startsWith(qNumStr)) {
      // Draw red question number
      ctx.fillStyle = mergedConfig.questionNumberColor || '#dc2626';
      ctx.fillText(qNumStr, paddingLeft, y);

      const numWidth = ctx.measureText(qNumStr).width;
      const restOfLine = line.slice(qNumStr.length);
      const restWidth = ctx.measureText(restOfLine).width;

      // Create horizontal gradient tailored to actual text line width
      const gradStartX = paddingLeft + numWidth;
      const gradEndX = gradStartX + Math.max(restWidth, 400);
      const lineGrad = ctx.createLinearGradient(gradStartX, 0, gradEndX, 0);
      stops.forEach((stop, i) => {
        lineGrad.addColorStop(i / (stops.length - 1), stop);
      });

      ctx.fillStyle = lineGrad;
      ctx.fillText(restOfLine, gradStartX, y);
    } else {
      // Subsequent line(s): create line-specific gradient
      const lineWidth = ctx.measureText(line).width;
      const lineGrad = ctx.createLinearGradient(
        paddingLeft,
        0,
        paddingLeft + Math.max(lineWidth, 400),
        0
      );
      stops.forEach((stop, i) => {
        lineGrad.addColorStop(i / (stops.length - 1), stop);
      });

      ctx.fillStyle = lineGrad;
      ctx.fillText(line, paddingLeft, y);
    }
  });

  // 5. Draw Option Boxes & Text (A, B, C, D)
  for (const opt of optionBoxes) {
    const rawText = (question[opt.key] || '').trim();

    // Box drawing check:
    // By default, draw option box unless explicitly unchecked by user (showOptionBoxes === false)
    const shouldDrawBox = mergedConfig.showOptionBoxes !== false;

    const isCorrect = highlightCorrectAnswer && question.correctAnswer && opt.key.endsWith(question.correctAnswer);

    if (shouldDrawBox) {
      roundRectPath(ctx, opt.x, opt.y, opt.width, opt.height, opt.radius);
      ctx.fillStyle = isCorrect ? '#22c55e' : (mergedConfig.optionBgColor || '#fff000');
      ctx.fill();
      if (mergedConfig.optionBorderWidth > 0) {
        ctx.lineWidth = mergedConfig.optionBorderWidth;
        ctx.strokeStyle = mergedConfig.optionBorderColor || '#e11d48';
        ctx.stroke();
      }
    }

    // Determine whether A, B, C, D letter badge/prefix is displayed
    // Default to true unless templatePreprintedLetters is true AND showOptionLetters is explicitly false
    const showLetter = mergedConfig.showOptionLetters !== undefined
      ? mergedConfig.showOptionLetters
      : (!mergedConfig.templatePreprintedLetters);

    // Clean duplicate leading prefix from rawText so it doesn't duplicate
    const letterChar = opt.letter.charAt(0);
    const cleanRegex = new RegExp(`^(?:[${letterChar}][\\.\\):\\-\\s]|\\([${letterChar}]\\)\\s*)+`, 'i');
    const cleanedText = rawText.replace(cleanRegex, '').trim() || (rawText || '—');

    const optFontFamily = mergedConfig.optionFontFamily || 'Noto Sans Devanagari';
    const optFontWeight = mergedConfig.optionFontWeight || '800';

    let textStartX = opt.x + (mergedConfig.optionTextPaddingLeft || 36);
    let availableTextWidth = opt.width - (mergedConfig.optionTextPaddingLeft || 36) - 24;

    if (showLetter) {
      const badgeStyle = mergedConfig.optionLetterStyle || 'prefix';

      if (badgeStyle === 'badge_circle') {
        // Draw circular badge e.g. 🔴 A
        const circleR = Math.min(28, Math.max(18, Math.round(opt.height * 0.24)));
        const circleX = opt.x + (mergedConfig.optionTextPaddingLeft || 36) + circleR;
        const circleY = opt.y + opt.height / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
        ctx.fillStyle = isCorrect ? '#ffffff' : (mergedConfig.optionLetterBgColor || '#dc2626');
        ctx.fill();

        ctx.font = `900 ${Math.round(circleR * 1.2)}px sans-serif`;
        ctx.fillStyle = isCorrect ? '#22c55e' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letterChar, circleX, circleY + 1);
        ctx.restore();

        textStartX = circleX + circleR + 18;
        availableTextWidth = opt.x + opt.width - textStartX - 16;
      } else if (badgeStyle === 'badge_pill') {
        // Draw rounded pill badge e.g. [ A ]
        const pillW = Math.min(68, Math.max(48, Math.round(opt.height * 0.5)));
        const pillH = Math.min(50, Math.max(36, Math.round(opt.height * 0.42)));
        const pillX = opt.x + (mergedConfig.optionTextPaddingLeft || 36);
        const pillY = opt.y + (opt.height - pillH) / 2;

        ctx.save();
        roundRectPath(ctx, pillX, pillY, pillW, pillH, 10);
        ctx.fillStyle = isCorrect ? '#ffffff' : (mergedConfig.optionLetterBgColor || '#dc2626');
        ctx.fill();

        ctx.font = `900 ${Math.round(pillH * 0.58)}px sans-serif`;
        ctx.fillStyle = isCorrect ? '#22c55e' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letterChar, pillX + pillW / 2, pillY + pillH / 2 + 1);
        ctx.restore();

        textStartX = pillX + pillW + 18;
        availableTextWidth = opt.x + opt.width - textStartX - 16;
      } else {
        // Crisp Text Prefix 'A.'
        const prefixStr = `${letterChar}. `;
        ctx.font = `${optFontWeight} ${mergedConfig.optionBaseFontSize}px "${optFontFamily}", sans-serif`;
        ctx.fillStyle = isCorrect ? '#ffffff' : (mergedConfig.optionLetterColor || '#dc2626');
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        const pY = opt.y + opt.height / 2;
        ctx.fillText(prefixStr, textStartX, pY);
        const prefixW = ctx.measureText(prefixStr).width;

        textStartX += prefixW;
        availableTextWidth -= prefixW;
      }
    }

    // Option text auto-fitting
    const { fontSize: optFontSize, lines: optLines, lineHeight: optLineHeight } = calculateOptionFontSize(
      ctx,
      cleanedText,
      Math.max(40, availableTextWidth),
      opt.height,
      mergedConfig.optionBaseFontSize,
      optFontFamily,
      optFontWeight,
      mergedConfig.optionAutoFit ?? true
    );

    ctx.font = `${optFontWeight} ${optFontSize}px "${optFontFamily}", sans-serif`;
    ctx.fillStyle = isCorrect ? '#ffffff' : (mergedConfig.optionTextColor || '#000000');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const optTextTotalH = optLines.length * optLineHeight;
    const optStartY = opt.y + (opt.height - optTextTotalH) / 2 + optLineHeight / 2;

    optLines.forEach((line, idx) => {
      ctx.fillText(line, textStartX, optStartY + idx * optLineHeight);
    });
  }

  // 6. Draw Right Side Subject Image
  let imageSrc = question.image;
  if (!imageSrc && question.imageMode !== 'none') {
    // Pick from curated clipart assets based on topic/question keywords
    const asset = findCuratedAssetByQuery(`${question.imageTopic || ''} ${question.question}`);
    imageSrc = asset.svgDataUri;
  }

  if (imageSrc && question.imageMode !== 'none') {
    try {
      const img = await loadImage(imageSrc);
      drawImageContain(
        ctx,
        img,
        imageBounds.x,
        imageBounds.y,
        imageBounds.width,
        imageBounds.height,
        mergedConfig.imageScale,
        mergedConfig.imageOffsetX,
        mergedConfig.imageOffsetY,
        mergedConfig.imageRotation,
        mergedConfig.imageOpacity
      );
    } catch {
      // Graceful fallback: render subtle educational placeholder frame if image fails
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      roundRectPath(ctx, imageBounds.x + 40, imageBounds.y + 40, imageBounds.width - 80, imageBounds.height - 80, 20);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 7. Draw Global Watermark / Logo PNG if configured
  if (mergedConfig.watermarkImage && (mergedConfig.showWatermark !== false)) {
    try {
      const wmImg = await loadImage(mergedConfig.watermarkImage);
      ctx.save();
      ctx.globalAlpha = mergedConfig.watermarkOpacity ?? 0.95;
      const wmX = mergedConfig.watermarkX ?? 1720;
      const wmY = mergedConfig.watermarkY ?? 35;
      const wmW = mergedConfig.watermarkWidth ?? 140;
      const wmH = mergedConfig.watermarkHeight ?? 80;
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.restore();
    } catch (wmErr) {
      console.warn('Failed to draw watermark PNG:', wmErr);
    }
  }

  ctx.restore();
}
