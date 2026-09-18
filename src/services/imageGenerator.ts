import { findCuratedAssetByQuery } from '../constants/curatedImages';
import { removeImageBackground } from '../utils/image';
import { generateImageBrowser, editImageBrowser, autoGenerateForQuestionBrowser } from './aiService';

export interface ImageGenerationOptions {
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  topic?: string;
  style?: 'Direct Answer' | 'Related / Indirect' | 'Educational' | 'Realistic' | 'Cartoon' | 'Minimal' | 'Transparent PNG';
  removeBackground?: boolean;
}

/**
 * Automatically extracts the primary subject topic from an English or Hindi question
 */
export function extractTopicFromQuestion(questionText: string): string {
  if (!questionText) return 'general knowledge';

  const clean = questionText.toLowerCase();

  if (clean.includes('jeans') || clean.includes('denim') || clean.includes('pants')) return 'blue jeans';
  if (clean.includes('bone') || clean.includes('bones') || clean.includes('skeleton') || clean.includes('skeletal')) return 'human skeleton';
  if (clean.includes('tiger') || clean.includes('feline') || clean.includes('राष्ट्रीय पशु')) return 'royal bengal tiger';
  if (clean.includes('water') || clean.includes('kidney') || clean.includes('पानी')) return 'pure crystal water';
  if (clean.includes('seed') || clean.includes('apple') || clean.includes('fruit') || clean.includes('cyanide')) return 'apple with seeds';
  if (clean.includes('camel') || clean.includes('desert') || clean.includes('ऊंट') || clean.includes('रेगिस्तान')) return 'desert camel';
  if (clean.includes('planet') || clean.includes('solar system') || clean.includes('sun') || clean.includes('ग्रह') || clean.includes('मंगल') || clean.includes('सौरमंडल')) return 'celestial planet';
  if (clean.includes('lotus') || clean.includes('flower') || clean.includes('कमल') || clean.includes('राष्ट्रीय फूल')) return 'sacred lotus flower';
  if (clean.includes('rocket') || clean.includes('isro') || clean.includes('nasa') || clean.includes('चंद्रयान') || clean.includes('अंतरिक्ष')) return 'isro space launch rocket';
  if (clean.includes('taj mahal') || clean.includes('ताजमहल') || clean.includes('red fort') || clean.includes('लाल किला') || clean.includes('india gate')) return 'india historical monument';
  if (clean.includes('संविधान') || clean.includes('constitution') || clean.includes('अंबेडकर')) return 'constitution scroll with golden pen';
  if (clean.includes('गांधी') || clean.includes('gandhi') || clean.includes('चरखा')) return 'traditional spinning wheel charkha';

  // General noun extraction fallback
  const stripped = questionText
    .replace(/[?!.,:;()"]/g, '')
    .replace(/\b(which|what|where|how|many|is|are|the|of|in|to|a|an|from|by|for|with|about|into|through|during|before|after|above|below|to|from|up|down|in|out|on|off|over|under|कौन|सा|है|क्या|कहाँ|कब|किस|कितने|वाले|होते|होता|की|के|को|में|से|पर)\b/gi, '')
    .trim();

  return stripped.slice(0, 35) || 'educational subject';
}

/**
 * Automatically creates a unique, subtly connected image tailored directly to the question,
 * adhering to "thoda different jisse pata na lage with background removed".
 */
export async function autoGenerateImageForQuestion(options: {
  question: string;
  options?: string[];
  correctAnswer?: string;
  style?: string;
  autoRemoveBg?: boolean;
}): Promise<{
  imageUrl: string;
  subjectTitle: string;
  conceptReason: string;
  isAi: boolean;
}> {
  const { question, options: opts = [], correctAnswer = '', style = '3D Clipart', autoRemoveBg = true } = options;

  try {
    const data = await autoGenerateForQuestionBrowser(question, opts, correctAnswer, style);
    if (data.imageUrl) {
      let finalUrl = data.imageUrl;
      if (autoRemoveBg && !finalUrl.startsWith('data:image/svg')) {
        finalUrl = await removeImageBackground(finalUrl, 30);
      }
      return {
        imageUrl: finalUrl,
        subjectTitle: data.subjectTitle || 'Educational Subject',
        conceptReason: data.conceptReason || 'Creative representation of question concept',
        isAi: true,
      };
    }
  } catch (err) {
    console.warn('Browser auto-generation failed, attempting fallback:', err);
  }

  // Graceful fallback to extractTopic + generateRelatedImage
  const topic = extractTopicFromQuestion(question);
  const fallbackResult = await generateRelatedImage({
    questionText: question,
    topic,
    style: '3D Clipart' as any,
  });

  let finalFallbackUrl = fallbackResult.imageUrl;
  if (autoRemoveBg && !finalFallbackUrl.startsWith('data:image/svg')) {
    finalFallbackUrl = await removeImageBackground(finalFallbackUrl, 30);
  }

  return {
    imageUrl: finalFallbackUrl,
    subjectTitle: topic,
    conceptReason: 'Direct fallback subject extraction',
    isAi: fallbackResult.isAi,
  };
}

export async function editImageWithAI(
  currentImageDataUrl: string,
  editPrompt: string,
  autoRemoveBg = true
): Promise<{ imageUrl: string; isAi: boolean }> {
  try {
    const data = await editImageBrowser(currentImageDataUrl, editPrompt);
    if (data.imageUrl) {
      let finalUrl = data.imageUrl;
      if (autoRemoveBg && !finalUrl.startsWith('data:image/svg')) {
        finalUrl = await removeImageBackground(finalUrl, 30);
      }
      return { imageUrl: finalUrl, isAi: true };
    }
  } catch (err) {
    console.error('AI image editing failed:', err);
  }
  throw new Error('Image editing failed. Please try a different prompt.');
}

/**
 * Generates an educational 3D or realistic image based on the parsed topic
 */
export async function generateRelatedImage(
  options: ImageGenerationOptions
): Promise<{ imageUrl: string; isAi: boolean; usedCurated?: boolean }> {
  const { questionText, topic, style = '3D Clipart', removeBackground = true } = options;

  const targetTopic = topic || extractTopicFromQuestion(questionText);

  // 1. Try Curated Assets First
  const curatedMatch = findCuratedAssetByQuery(targetTopic);
  if (curatedMatch) {
    return { imageUrl: curatedMatch.svgDataUri, isAi: false, usedCurated: true };
  }

  // 2. Try Gemini Text-to-Image
  try {
    const data = await generateImageBrowser(targetTopic, targetTopic, style, '1:1');
    if (data.imageUrl) {
      let finalUrl = data.imageUrl;
      if (removeBackground && !finalUrl.startsWith('data:image/svg')) {
        try {
          finalUrl = await removeImageBackground(finalUrl, 30);
        } catch (e) {
          console.warn('Background removal failed, using raw AI image', e);
        }
      }
      return { imageUrl: finalUrl, isAi: true };
    }
  } catch (err) {
    console.error('AI Image Generation Failed:', err);
  }

  // 3. Absolute Fallback: Transparent placeholder
  return {
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    isAi: false,
  };
}

/**
 * Generates an image using a user text prompt with optional background removal
 */
export async function generateImageWithPrompt(
  prompt: string,
  style = '3D Clipart',
  autoRemoveBg = true,
  aspectRatio = '1:1'
): Promise<{ imageUrl: string; isAi: boolean }> {
  try {
    const data = await generateImageBrowser(prompt, prompt, style, aspectRatio);
    if (data.imageUrl) {
      let finalUrl = data.imageUrl;
      if (autoRemoveBg && !finalUrl.startsWith('data:image/svg')) {
        finalUrl = await removeImageBackground(finalUrl, 30);
      }
      return { imageUrl: finalUrl, isAi: true };
    }
  } catch (err) {
    console.warn('Text prompt image generation error:', err);
  }

  // Curated asset fallback
  const matched = findCuratedAssetByQuery(prompt);
  return { imageUrl: matched.svgDataUri, isAi: false };
}

/**
 * Clean image background wrapper for client-side button
 */
export async function cleanImageBackground(dataUrl: string, tolerance = 32): Promise<string> {
  return removeImageBackground(dataUrl, tolerance);
}

/**
 * Builds the exact prompt for educational cutout graphics
 */
export function buildAIImagePrompt(topic: string, style: string = 'Related / Indirect'): string {
  return `Isolated 3D educational cutout clipart of ${topic}. Style: ${style}. Vibrant colors, clean sharp edges, isolated on pure white background (#FFFFFF), background removed, no ground plane, no background scenery, no frame, no borders, no text, no watermark.`;
}

/**
 * Generates a custom visual or clipart from any user prompt via Gemini AI
 */
export async function generateCustomAIImage(
  prompt: string,
  style: string = '3D Clipart'
): Promise<{ imageUrl: string; isAi: boolean; note?: string }> {
  return generateImageWithPrompt(prompt, style, true);
}
