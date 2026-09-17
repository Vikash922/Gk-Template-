import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

import fs from 'fs';

// Save Gemini API Key endpoint
app.post('/api/config/gemini', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key is required' });
  
  process.env.GEMINI_API_KEY = apiKey;
  aiClient = null; // reset client
  
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${apiKey}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${apiKey}\n`;
    }
  } else {
    envContent = `GEMINI_API_KEY=${apiKey}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  res.json({ success: true });
});

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Endpoint: Generate GK Questions with Gemini
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const { topic = 'India', difficulty = 'Medium', count = 3, language = 'Hindi' } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured. Using high-quality curated question bank.',
        fallback: true,
      });
    }

    const prompt = `You are an expert Hindi & Indian GK content creator.
Generate ${count} engaging General Knowledge questions on the topic "${topic}".
Difficulty: ${difficulty}. Language: ${language} (Hindi should be in clear, authentic Devanagari script).

Each question MUST include:
- question: Clear, complete question text in ${language}
- optionA: Option A text
- optionB: Option B text
- optionC: Option C text
- optionD: Option D text
- correctAnswer: The correct option letter ("A", "B", "C", or "D")
- imageTopic: A single, specific English noun/search term representing the subject for image placement (e.g., "bengal tiger", "taj mahal", "human brain", "solar system", "blue jeans", "isro rocket", "mount everest")

Respond ONLY with a JSON array containing the question objects:
[
  {
    "question": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "...",
    "correctAnswer": "A",
    "imageTopic": "..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    const questions = JSON.parse(text);

    return res.json({ success: true, questions });
  } catch (err: any) {
    console.error('Error generating questions via Gemini:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate questions',
      fallback: true,
    });
  }
});

// 2. Endpoint: Parse Batch Raw Questions with Gemini
app.post('/api/gemini/parse-batch', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured. Falling back to local parser.',
        fallback: true,
      });
    }

    const prompt = `You are a smart exam & quiz parser. Parse all questions and options from the following raw text.
The text may contain messy formatting, Hindi Devanagari, English, numbered questions, or custom option markers like (A), (B), A., 1., etc.

For EVERY question found:
1. Extract clean question text without the question number prefix.
2. Extract question number as an integer.
3. Clean optionA, optionB, optionC, optionD text (strip any leading "A.", "B.", "(A)", etc.).
4. Identify or predict the correctAnswer ("A", "B", "C", or "D").
5. Determine a precise English "imageTopic" (1-3 words, e.g. "red fort", "bengal tiger", "water molecule", "moon rover") suitable for finding or generating an educational side image.

RAW TEXT:
"""
${rawText}
"""

Respond ONLY with a JSON array:
[
  {
    "questionNumber": 1,
    "question": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "...",
    "correctAnswer": "A",
    "imageTopic": "..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ success: true, questions: parsed });
  } catch (err: any) {
    console.error('Batch parsing error via Gemini:', err);
    return res.status(500).json({
      error: err.message || 'Failed to parse batch text',
      fallback: true,
    });
  }
});

// 3. Endpoint: Generate AI Image or Clipart Asset with Gemini (Text Prompt)
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, topic, style = '3D Clipart', aspectRatio = '1:1' } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured', fallback: true });
    }

    const targetSubject = prompt || topic || 'General knowledge topic';
    const imagePrompt = `Highly accurate, photorealistic, and educational representation of: ${targetSubject}. Style: ${style}, vibrant colors, crystal clear details, centered subject, completely isolated on solid pure white background (#FFFFFF), zero background scenery, no text, no watermark, highly accurate visual details for educational purposes.`;

    // Attempt generation with imagen-3.0-generate-001
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: imagePrompt,
        config: {
          aspectRatio: (aspectRatio as any) || '1:1',
          numberOfImages: 1,
          outputMimeType: 'image/png'
        },
      });

      if (response.generatedImages?.[0]?.image?.imageBytes) {
        return res.json({
          success: true,
          imageUrl: `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`,
          model: 'imagen-3.0-generate-001',
          prompt: imagePrompt,
        });
      }
    } catch (imgErr: any) {
      console.warn('imagen-3.0-generate-001 fallback to SVG vector generator:', imgErr?.message);
    }

    // Fallback: Generate SVG vector graphic via gemini-3.8-flash
    const svgPrompt = `Create a clean, beautiful educational SVG vector illustration representing: "${targetSubject}".
Requirements:
- Output valid <svg> code ONLY starting with <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"> and ending with </svg>.
- Transparent background (NO rectangular background fill, completely transparent canvas).
- Vibrant modern colors, isolated clipart subject.
- NO text, NO labels inside the SVG.`;

    const svgResp = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: svgPrompt,
    });

    const match = (svgResp.text || '').match(/<svg[\s\S]*?<\/svg>/i);
    if (match) {
      const cleanSvg = match[0];
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
      return res.json({ success: true, imageUrl: dataUri, model: 'gemini-3.8-flash-svg' });
    }

    return res.status(500).json({ error: 'No image could be generated', fallback: true });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: err.message || 'Image generation failed', fallback: true });
  }
});

// 4. Endpoint: Edit Existing Image with Gemini (Prompt-based image editing)
app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { imageBase64, editPrompt } = req.body;
    if (!imageBase64 || !editPrompt) {
      return res.status(400).json({ error: 'imageBase64 and editPrompt are required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured', fallback: true });
    }

    // Strip prefix if present
    let rawBase64 = imageBase64;
    let mimeType = 'image/png';
    const prefixMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (prefixMatch) {
      mimeType = prefixMatch[1];
      rawBase64 = prefixMatch[2];
    }

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
        return res.json({
          success: true,
          imageUrl: `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`,
          model: 'imagen-3.0-generate-001',
        });
      }
    } catch (editErr: any) {
      console.warn('Image edit with imagen-3.0-generate-001 failed:', editErr?.message);
      return res.status(500).json({ error: editErr.message || 'Image editing failed' });
    }

    return res.status(500).json({ error: 'No edited image returned' });
  } catch (err: any) {
    console.error('Image edit error:', err);
    return res.status(500).json({ error: err.message || 'Image editing failed' });
  }
});

// 5. Endpoint: Auto-Generate Image tailored to Question ("thoda different jisse pata na lage with background removed")
app.post('/api/gemini/auto-generate-for-question', async (req, res) => {
  try {
    const { question, options = [], correctAnswer = '', style = '3D Clipart' } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured', fallback: true });
    }

    // Step 1: Use gemini-3.8-flash to think of a creative, subtle educational concept
    // "thoda different jisse pata na lage" -> indirect, intriguing, artistic representation
    const metaPrompt = `You are a world-class educational graphics director for competitive exam & GK quizzes.
Analyze this quiz question:
Question: "${question}"
Options: ${JSON.stringify(options)}
Correct Answer: "${correctAnswer}"

User directive: "Jo question ho uske related khud hi image bana de thoda different jisse pata na lage with background removed"
Rules for the visual concept:
1. "thoda different jisse pata na lage": Do NOT create a dead-giveaway, obvious, or clichéd direct answer icon (e.g. if the question is "Which country is called Land of Rising Sun?", do not just draw a giant generic Japan flag; instead, create a stunning stylized Japanese Torii gate in sunrise mist or a stylized origami crane with cherry blossoms).
2. The subject must be subtly, conceptually, or culturally connected to the core knowledge domain of the question.
3. It must be an isolated 3D or vector cutout subject with NO background (pure white background, zero ground plane, zero scenery).
4. No text, no letters, no numbers, no watermarks.

Respond ONLY with valid JSON:
{
  "subjectTitle": "Short English title of subject (e.g. 'Stylized Origami Red-Crowned Crane')",
  "conceptReason": "One short sentence explaining the subtle connection",
  "imagePrompt": "Detailed prompt for generating an isolated 3D cutout clipart on pure white background (#FFFFFF)"
}`;

    let subjectTitle = 'Educational Cutout';
    let conceptReason = 'Related to the question concept';
    let targetPrompt = `Isolated 3D educational cutout clipart related to ${question}, style: ${style}, vibrant colors, smooth ambient lighting, clean edges, isolated on solid white background (#FFFFFF), no background scenery, no text, no watermarks.`;

    try {
      const metaResp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: metaPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const metaParsed = JSON.parse(metaResp.text || '{}');
      if (metaParsed.imagePrompt) {
        targetPrompt = `${metaParsed.imagePrompt}, isolated on pure solid white background, background removed, no text, no frame`;
        subjectTitle = metaParsed.subjectTitle || subjectTitle;
        conceptReason = metaParsed.conceptReason || conceptReason;
      }
    } catch (metaErr: any) {
      console.warn('Meta concept generation fallback:', metaErr?.message);
    }

    // Step 2: Generate the image using gemini-3.1-flash-image
    try {
      const imgResp = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: targetPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: '1K',
          },
        },
      });

      for (const part of imgResp.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.json({
            success: true,
            imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            model: 'gemini-3.1-flash-image',
            subjectTitle,
            conceptReason,
            promptUsed: targetPrompt,
          });
        }
      }
    } catch (imgErr: any) {
      console.warn('Auto-generate gemini-3.1-flash-image failed, falling back to SVG:', imgErr?.message);
    }

    // Step 3: High-quality SVG fallback via gemini-3.8-flash
    const svgPrompt = `Create a clean, beautiful educational SVG vector illustration representing: "${subjectTitle}".
Context: Subtle educational symbol related to "${question}".
Requirements:
- Output valid <svg> code ONLY starting with <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"> and ending with </svg>.
- Transparent background (absolutely NO background rectangle, completely transparent).
- Vibrant colors, isolated subject centered in 500x500.
- NO text, NO labels.`;

    const svgResp = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: svgPrompt,
    });

    const match = (svgResp.text || '').match(/<svg[\s\S]*?<\/svg>/i);
    if (match) {
      const cleanSvg = match[0];
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
      return res.json({
        success: true,
        imageUrl: dataUri,
        model: 'gemini-3.8-flash-svg',
        subjectTitle,
        conceptReason,
      });
    }

    return res.status(500).json({ error: 'Image generation could not be completed' });
  } catch (err: any) {
    console.error('Auto generate for question error:', err);
    return res.status(500).json({ error: err.message || 'Auto image generation failed' });
  }
});

// 6. Endpoint: Generate or Suggest Side Subject SVG/Illustration
app.post('/api/gemini/generate-illustration', async (req, res) => {
  try {
    const { topic, questionText } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured', fallback: true });
    }

    const prompt = `Create a clean, beautiful educational SVG vector illustration representing: "${topic}".
Context: Hindi GK Quiz card about "${questionText || topic}".
Requirements:
- Output valid <svg> code ONLY starting with <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"> and ending with </svg>.
- Transparent background (do NOT draw a full rectangular background fill).
- Beautiful vibrant colors matching educational clipart style.
- NO text, NO labels, NO watermarks, NO letters inside the SVG.
- Isolated subject centered nicely within 500x500.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let svgText = response.text || '';
    const match = svgText.match(/<svg[\s\S]*?<\/svg>/i);
    if (match) {
      const cleanSvg = match[0];
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
      return res.json({ success: true, svgDataUri: dataUri });
    }

    return res.status(500).json({ error: 'No valid SVG returned', fallback: true });
  } catch (err: any) {
    console.error('Illustration generation error:', err);
    return res.status(500).json({ error: err.message, fallback: true });
  }
});

// Setup Vite middleware in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GK Card Maker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
