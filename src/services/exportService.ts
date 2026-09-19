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

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const byteString = atob(parts[1]);
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeString = mimeMatch ? mimeMatch[1] : 'image/png';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    console.error('dataUrlToBlob conversion failed:', e);
    return null;
  }
}

export async function exportCardBlob(
  question: GKQuestion,
  config: CardDesignConfig,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  try {
    await renderCardToCanvas(canvas, question, config, width, height);
  } catch (renderErr) {
    console.warn('renderCardToCanvas error (continuing with rendered state):', renderErr);
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            // Fallback: try toDataURL
            try {
              const dataUrl = canvas.toDataURL('image/png');
              const blobFromDataUrl = dataUrlToBlob(dataUrl);
              if (blobFromDataUrl) {
                resolve(blobFromDataUrl);
              } else {
                reject(new Error('Canvas generated an empty image'));
              }
            } catch (fallbackErr) {
              // Tainted canvas fallback
              exportCardBlobSafe(question, config, width, height)
                .then(resolve)
                .catch(reject);
            }
          }
        },
        'image/png'
      );
    } catch (toBlobErr) {
      // If toBlob threw a SecurityError (e.g. tainted canvas)
      console.warn('toBlob threw exception, attempting safe fallback:', toBlobErr);
      exportCardBlobSafe(question, config, width, height)
        .then(resolve)
        .catch(reject);
    }
  });
}

/**
 * Fallback renderer that guarantees a valid Blob even if external images are CORS-blocked or tainted
 */
export async function exportCardBlobSafe(
  question: GKQuestion,
  config: CardDesignConfig,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  // Strip external image to guarantee untainted canvas
  const safeQ: GKQuestion = {
    ...question,
    image: undefined,
    imageMode: 'none',
  };

  try {
    await renderCardToCanvas(canvas, safeQ, config, width, height);
  } catch (e) {
    console.warn('Safe render error:', e);
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              const b = dataUrlToBlob(dataUrl);
              if (b) resolve(b);
              else reject(new Error('Failed to generate safe card blob'));
            } catch (fallbackErr) {
              reject(fallbackErr);
            }
          }
        },
        'image/png'
      );
    } catch (err) {
      reject(err);
    }
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

  setTimeout(() => URL.revokeObjectURL(url), 10000);
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
  if (!questions || questions.length === 0) {
    throw new Error('No questions provided for ZIP export.');
  }

  const zip = new JSZip();
  const total = questions.length;
  let successCount = 0;

  for (let i = 0; i < total; i++) {
    const q = questions[i];
    if (onProgress) onProgress(i + 1, total);

    try {
      const blob = await exportCardBlob(q, config, 1920, 1080);
      const fileName = formatQuestionFileName(q.questionNumber || i + 1);
      zip.file(fileName, blob);
      successCount++;
    } catch (cardErr) {
      console.warn(`Card ${i + 1} export failed, trying safe fallback:`, cardErr);
      try {
        const safeBlob = await exportCardBlobSafe(q, config, 1920, 1080);
        const fileName = formatQuestionFileName(q.questionNumber || i + 1);
        zip.file(fileName, safeBlob);
        successCount++;
      } catch (safeErr) {
        console.error(`Card ${i + 1} completely failed to export:`, safeErr);
      }
    }
  }

  if (successCount === 0) {
    throw new Error('Could not generate any cards. Please check your question text.');
  }

  const zipContent = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(zipContent);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GK-Cards-${total}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
