import { CardDesignConfig } from '../types/design';

export interface CardLayoutMetrics {
  outerBorderRect: { x: number; y: number; width: number; height: number; radius: number };
  innerCardRect: { x: number; y: number; width: number; height: number; radius: number };
  questionBoxRect: { x: number; y: number; width: number; height: number; radius: number };
  optionBoxes: Array<{
    letter: string;
    key: 'optionA' | 'optionB' | 'optionC' | 'optionD';
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  }>;
  imageBounds: { x: number; y: number; width: number; height: number };
}

export function calculateCardLayout(config: CardDesignConfig): CardLayoutMetrics {
  const {
    canvasWidth,
    canvasHeight,
    outerMargin,
    outerBorderRadius,
    innerSpacing,
    questionBoxX,
    questionBoxY,
    questionBoxWidth,
    questionBoxHeight,
    questionBoxRadius,
    optionStartX,
    optionStartY,
    optionWidth,
    optionHeight,
    optionSpacing,
    optionRadius,
    imageAreaX,
    imageAreaY,
    imageAreaWidth,
    imageAreaHeight,
  } = config;

  const marginX = outerMargin;
  const marginY = Math.max(20, Math.round((outerMargin * 1080) / 1920));

  const outerBorderRect = {
    x: marginX,
    y: marginY,
    width: canvasWidth - marginX * 2,
    height: canvasHeight - marginY * 2,
    radius: outerBorderRadius,
  };

  const innerCardRect = {
    x: outerBorderRect.x + innerSpacing,
    y: outerBorderRect.y + innerSpacing,
    width: outerBorderRect.width - innerSpacing * 2,
    height: outerBorderRect.height - innerSpacing * 2,
    radius: Math.max(4, outerBorderRadius - innerSpacing),
  };

  const questionBoxRect = {
    x: questionBoxX,
    y: questionBoxY,
    width: questionBoxWidth,
    height: questionBoxHeight,
    radius: questionBoxRadius,
  };

  const optionsKeys: Array<{ letter: string; key: 'optionA' | 'optionB' | 'optionC' | 'optionD' }> = [
    { letter: 'A.', key: 'optionA' },
    { letter: 'B.', key: 'optionB' },
    { letter: 'C.', key: 'optionC' },
    { letter: 'D.', key: 'optionD' },
  ];

  const isGrid2x2 = config.optionLayout === 'grid2x2';
  const colGap = config.optionGridColumnGap ?? 40;
  const rowGap = config.optionGridRowGap ?? optionSpacing;

  const optionBoxes = optionsKeys.map((item, index) => {
    let x = optionStartX;
    let y = optionStartY;

    if (isGrid2x2) {
      // 2x2 Grid:
      // index 0 (A): col 0, row 0
      // index 1 (B): col 1, row 0
      // index 2 (C): col 0, row 1
      // index 3 (D): col 1, row 1
      const col = index % 2;
      const row = Math.floor(index / 2);
      x = optionStartX + col * (optionWidth + colGap);
      y = optionStartY + row * (optionHeight + rowGap);
    } else {
      // Vertical Column:
      y = optionStartY + index * (optionHeight + optionSpacing);
    }

    return {
      letter: item.letter,
      key: item.key,
      x,
      y,
      width: optionWidth,
      height: optionHeight,
      radius: optionRadius,
    };
  });

  const imageBounds = {
    x: imageAreaX,
    y: imageAreaY,
    width: imageAreaWidth,
    height: imageAreaHeight,
  };

  return {
    outerBorderRect,
    innerCardRect,
    questionBoxRect,
    optionBoxes,
    imageBounds,
  };
}
