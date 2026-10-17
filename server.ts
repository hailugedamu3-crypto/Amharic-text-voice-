import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK with user-agent telemetry as instructed
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey.length > 5),
    time: new Date().toISOString(),
  });
});

// TTS Generation Endpoint
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      geminiVoice = 'Kore',
      style = 'Clear, articulate Amharic speech',
      speedStyle = 'normal pacing',
      mood = 'natural and expressive',
      model = 'gemini-3.8-flash-lite-tts',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'ጽሑፍ አልተገኘም (Text is required)' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'የ Gemini API ቁልፍ አልተገኘም። እባክዎ በ Settings > Secrets ያረጋግጡ። (GEMINI_API_KEY is missing)',
      });
    }

    // Combine voice character prompt instructions for high-fidelity Amharic pronunciation
    const comprehensiveStyle = `Pronounce fluently and naturally in authentic Ethiopian Amharic (አማርኛ). Style: ${style}. Pacing: ${speedStyle}. Mood & Tone: ${mood}. Ensure correct Ethiopic phonetics and warm human cadence.`;

    // Supported prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'
    const allowedVoices = ['Kore', 'Charon', 'Puck', 'Fenrir', 'Zephyr', 'Aoede'];
    const chosenVoice = allowedVoices.includes(geminiVoice) ? geminiVoice : 'Kore';

    const targetModel =
      model === 'gemini-3.8-flash-tts'
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: comprehensiveStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('audio/') || part.inlineData?.data
    );

    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      // In case audio is in part[0] directly
      const firstPartData = candidate?.content?.parts?.[0]?.inlineData?.data;
      if (firstPartData) {
        return res.json({
          success: true,
          audioBase64: firstPartData,
          mimeType: candidate?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav',
          voice: chosenVoice,
        });
      }
      return res.status(500).json({
        error: 'ድምፅ ማመንጨት አልተቻለም። እባክዎ እንደገና ይሞክሩ። (No audio stream received from model)',
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: audioPart?.inlineData?.mimeType || 'audio/wav',
      voice: chosenVoice,
    });
  } catch (error: any) {
    console.error('Error generating Amharic speech:', error);
    return res.status(500).json({
      error: error?.message || 'በድምፅ አመነጫ ወቅት ስህተት ተከስቷል (Failed to generate Amharic audio)',
    });
  }
});

// Amharic AI Script Helper (News, Stories, Quotes, Wisdom, Announcements)
app.post('/api/ai/compose', async (req: Request, res: Response) => {
  try {
    const { category, topic, tone = 'formal' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'የ Gemini API ቁልፍ አልተገኘም። (GEMINI_API_KEY is missing)',
      });
    }

    const prompt = `You are an expert Amharic scriptwriter and linguist.
Write a realistic, engaging, and beautifully phrased Amharic text (between 2 to 4 sentences, roughly 30-70 words) suitable for reading aloud via Text-to-Speech.
Category: ${category || 'ዜና'}
Topic / Context: ${topic || 'አጠቃላይ'}
Tone: ${tone}

Rules:
1. Output ONLY the Amharic text directly. No English translations, no quotes around the output, no introductory explanations.
2. Use authentic Fidel (ግዕዝ ፊደላት) and correct Amharic punctuation (፤ ፣ ።).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const generatedText = response.text?.trim() || '';
    return res.json({ text: generatedText });
  } catch (error: any) {
    console.error('Error composing Amharic text:', error);
    return res.status(500).json({
      error: error?.message || 'ጽሑፍ ማመንጨት አልተቻለም (Failed to compose text)',
    });
  }
});

// Development vs Production serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎙️ Amharic AI Voice Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
