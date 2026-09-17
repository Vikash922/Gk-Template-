import { GoogleGenAI } from '@google/genai';

function getAI(): GoogleGenAI | null {
  const apiKey = localStorage.getItem('gk_card_maker_gemini_key');
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

export async function generateQuestionsBrowser(topic: string, difficulty: string, count: number, language: string) {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY not configured in Settings');

  const prompt = `Generate ${count} engaging multiple-choice General Knowledge (GK) quiz questions about "${topic}".
Difficulty: ${difficulty}.
Language: ${language} (if Hindi, use clear Devanagari script).
Provide 4 distinct options (optionA, optionB, optionC, optionD) and specify the single correctAnswer ('A', 'B', 'C', or 'D').
Also provide a 1-3 word English image topic (imageTopic) suitable for an educational cutout illustration (e.g., 'tiger', 'human heart', 'banyan tree').
Return JSON format with the following schema:
{
  "questions": [
    {
      "question": "string",
      "optionA": "string",
      "optionB": "string",
      "optionC": "string",
      "optionD": "string",
      "correctAnswer": "A",
      "imageTopic": "string"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from AI');
  return JSON.parse(text);
}

export async function parseQuestionsBrowser(rawText: string) {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY not configured in Settings');

  const prompt = `You are a smart exam & quiz parser. Parse all questions and options from the following raw text.
The text may contain messy formatting, Hindi Devanagari, English, numbered questions, or custom option markers like (A), (B), A., 1., etc.

Return JSON format with the following schema:
{
  "questions": [
    {
      "question": "string",
      "optionA": "string",
      "optionB": "string",
      "optionC": "string",
      "optionD": "string",
      "correctAnswer": "A"
    }
  ]
}

Raw Text to Parse:
"""
${rawText}
"""`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from AI');
  return JSON.parse(text);
}

export async function generateImageBrowser(prompt: string, topic?: string, style: string = '3D Clipart', aspectRatio: string = '1:1') {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY not configured in Settings');

  const targetSubject = prompt || topic || 'General knowledge topic';
  const imagePrompt = `Highly accurate, photorealistic, and educational representation of: ${targetSubject}. Style: ${style}, vibrant colors, crystal clear details, centered subject, completely isolated on solid pure white background (#FFFFFF), zero background scenery, no text, no watermark, highly accurate visual details for educational purposes.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: imagePrompt,
      config: {
        aspectRatio: aspectRatio as any || '1:1',
        numberOfImages: 1,
        outputMimeType: 'image/png'
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return {
        success: true,
        imageUrl: `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`,
        model: 'imagen-3.0-generate-001',
        prompt: imagePrompt,
      };
    }
  } catch (err: any) {
    throw new Error(err.message || 'Image generation failed');
  }
  throw new Error('No image generated');
}

export async function editImageBrowser(imageBase64: string, editPrompt: string) {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY not configured in Settings');

  const promptText = `Generate a completely new image based on this edit request: "${editPrompt}". Keep the subject isolated on a clean solid pure white background, maintain crisp cutout edges, no text, no watermarks, high educational quality.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: promptText,
      config: {
        aspectRatio: '1:1',
        numberOfImages: 1,
        outputMimeType: 'image/png'
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return {
        success: true,
        imageUrl: `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`,
        model: 'imagen-3.0-generate-001',
      };
    }
  } catch (err: any) {
    throw new Error(err.message || 'Image editing failed');
  }
  throw new Error('No image generated');
}

export async function autoGenerateForQuestionBrowser(question: string, options: string[], correctAnswer: string, style: string) {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY not configured in Settings');

  const metaPrompt = `You are a world-class educational graphics director for competitive exam & GK quizzes.
Analyze this quiz question:
Question: "${question}"
Options: ${JSON.stringify(options)}
Correct Answer: "${correctAnswer}"

Identify the core educational subject (e.g., "Mitochondria", "Taj Mahal", "Newton's Cradle").
Determine a creative visual concept that visually hints at the topic WITHOUT revealing the answer in text.

Return JSON:
{
  "subjectTitle": "string",
  "conceptReason": "string",
  "imagePrompt": "string"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: metaPrompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from AI meta-prompt');
  
  const parsed = JSON.parse(text);
  const finalPrompt = `Highly accurate, educational clipart: ${parsed.imagePrompt}. Style: ${style}, perfectly centered, isolated on purely solid white (#FFFFFF) background, zero ground shadows, NO text, NO labels.`;

  const imgResponse = await ai.models.generateImages({
    model: 'imagen-3.0-generate-001',
    prompt: finalPrompt,
    config: {
      aspectRatio: '1:1',
      numberOfImages: 1,
      outputMimeType: 'image/png'
    },
  });

  if (imgResponse.generatedImages?.[0]?.image?.imageBytes) {
    return {
      success: true,
      imageUrl: `data:image/png;base64,${imgResponse.generatedImages[0].image.imageBytes}`,
      subjectTitle: parsed.subjectTitle,
      conceptReason: parsed.conceptReason,
      model: 'imagen-3.0-generate-001',
    };
  }
  throw new Error('No image generated');
}

export async function verifyAnswerBrowser(question: string, options: string[]) {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY not configured in Settings');

  const prompt = `You are an expert quiz verifier.
Question: "${question}"
Options: ${JSON.stringify(options)}

Identify the correct option (A, B, C, or D). If the question is flawed or none of the options are correct, choose the closest or return 'UNKNOWN'.

Return JSON:
{
  "correctOption": "A",
  "explanation": "Short 1 sentence explanation of the fact."
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from AI');
  return JSON.parse(text);
}
