import JSZip from 'jszip';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { renderCardToCanvas } from '../utils/canvasRenderer';
import { incrementGeneratedCardCount } from './storage';

function formatQuestionFileName(questionNumber: number | string): string {
  const num = parseInt(String(questionNumber), 10);
  const formatted = isNaN(num) ? '01' : num.toString().padStart(2, '0');
  return `GK-Question-${formatted}.png`;
}

export async function exportCardBlob(
  question: GKQuestion,
  config: CardDesignConfig,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderCardToCanvas(canvas, question, config, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate PNG blob'));
      },
      'image/png',
      1.0
    );
  });
}

export async function downloadCardAsPNG(
  question: GKQuestion,
  config: CardDesignConfig,
  resolution: '1920x1080' | '1280x720' = '1920x1080'
): Promise<string> {
  const width = resolution === '1280x720' ? 1280 : 1920;
  const height = resolution === '1280x720' ? 720 : 1080;

  const blob = await exportCardBlob(question, config, width, height);
  const fileName = formatQuestionFileName(question.questionNumber);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
  incrementGeneratedCardCount();
  return fileName;
}

export async function copyCardToClipboard(
  question: GKQuestion,
  config: CardDesignConfig
): Promise<boolean> {
  try {
    const blob = await exportCardBlob(question, config, 1920, 1080);
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Clipboard copy error:', err);
    return false;
  }
}

export async function generateCardsZip(
  questions: GKQuestion[],
  config: CardDesignConfig,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = questions.length;

  for (let i = 0; i < total; i++) {
    const q = questions[i];
    if (onProgress) onProgress(i + 1, total);
    const blob = await exportCardBlob(q, config, 1920, 1080);
    const fileName = formatQuestionFileName(q.questionNumber || i + 1);
    zip.file(fileName, blob);
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'GK-Cards.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
