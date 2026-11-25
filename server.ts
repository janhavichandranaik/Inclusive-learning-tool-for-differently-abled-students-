import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.resolve(DATA_DIR, 'learning_store.json');

if (!STORE_FILE.startsWith(DATA_DIR + path.sep)) {
  throw new Error('Invalid store path configuration');
}

interface StoredStudent {
  studentId: string;
  name: string;
  gradeLevel: string;
  preferredMode: 'visual' | 'hearing' | 'balanced';
  preferredLanguage: 'en' | 'kn' | 'hi';
  signedInAt: string;
}

interface StoredProgress {
  lessons: Record<
    string,
    {
      completed: boolean;
      completedAt?: string;
      lastPositionSec: number;
      bestQuizScore?: number;
      quizAttempts: number;
    }
  >;
  totalMinutesSpent: number;
  lastVisitedLessonId?: string;
  activityLog: {
    id: string;
    label: string;
    detail: string;
    timestamp: string;
  }[];
}

interface StoreShape {
  students: Record<string, StoredStudent>;
  progressByStudent: Record<string, StoredProgress>;
}

function ensureStore(): StoreShape {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial: StoreShape = { students: {}, progressByStudent: {} };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { students: {}, progressByStudent: {} };
  }
}

function saveStore(data: StoreShape): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

// Ephemeral fallback signing key when SESSION_SECRET is unset
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function signSessionToken(studentId: string): string {
  const payload = Buffer.from(JSON.stringify({ sid: studentId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { sid?: string };
    return typeof parsed.sid === 'string' && parsed.sid.trim() ? parsed.sid : null;
  } catch {
    return null;
  }
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const LANGUAGE_NAMES: Record<'en' | 'kn' | 'hi', string> = {
  en: 'English',
  kn: 'Kannada (ಕನ್ನಡ)',
  hi: 'Hindi (हिन्दी)',
};

const translationCache = new Map<string, unknown>();

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
]);

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      languages: ['en', 'kn', 'hi'],
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Student login & server-persisted profile
  app.post('/api/student/login', (req: Request, res: Response) => {
    const { name, studentId, gradeLevel, preferredMode, preferredLanguage } = req.body ?? {};
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof studentId !== 'string' ||
      !studentId.trim()
    ) {
      res.status(400).json({ error: 'Student name and student ID are required.' });
      return;
    }

    const cleanId = studentId.trim().slice(0, 64);
    const cleanName = name.trim().slice(0, 100);
    const mode =
      preferredMode === 'visual' || preferredMode === 'hearing' || preferredMode === 'balanced'
        ? preferredMode
        : 'balanced';
    const lang = preferredLanguage === 'kn' || preferredLanguage === 'hi' ? preferredLanguage : 'en';
    const grade = typeof gradeLevel === 'string' && gradeLevel.trim() ? gradeLevel.trim().slice(0, 80) : 'Middle School (Grades 6–8)';

    const store = ensureStore();
    const profile: StoredStudent = {
      studentId: cleanId,
      name: cleanName,
      gradeLevel: grade,
      preferredMode: mode,
      preferredLanguage: lang,
      signedInAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    store.students[cleanId] = profile;
    if (!store.progressByStudent[cleanId]) {
      store.progressByStudent[cleanId] = {
        lessons: {},
        totalMinutesSpent: 0,
        activityLog: [],
      };
    }
    saveStore(store);

    const token = signSessionToken(cleanId);
    res.json({
      student: profile,
      token,
      progress: store.progressByStudent[cleanId],
    });
  });

  app.get('/api/progress', (req: Request, res: Response) => {
    const sid = verifySessionToken(req.headers.authorization);
    if (!sid) {
      res.status(401).json({ error: 'Valid student session token required.' });
      return;
    }
    const store = ensureStore();
    const progress = store.progressByStudent[sid] ?? {
      lessons: {},
      totalMinutesSpent: 0,
      activityLog: [],
    };
    res.json({ progress });
  });

  app.post('/api/progress', (req: Request, res: Response) => {
    const sid = verifySessionToken(req.headers.authorization);
    if (!sid) {
      res.status(401).json({ error: 'Valid student session token required.' });
      return;
    }
    const { progress } = req.body ?? {};
    if (!progress || typeof progress !== 'object' || typeof progress.lessons !== 'object') {
      res.status(400).json({ error: 'Invalid progress payload.' });
      return;
    }
    const store = ensureStore();
    store.progressByStudent[sid] = {
      lessons: progress.lessons ?? {},
      totalMinutesSpent: Number(progress.totalMinutesSpent) || 0,
      lastVisitedLessonId:
        typeof progress.lastVisitedLessonId === 'string' ? progress.lastVisitedLessonId : undefined,
      activityLog: Array.isArray(progress.activityLog) ? progress.activityLog.slice(0, 20) : [],
    };
    saveStore(store);
    res.json({ ok: true, progress: store.progressByStudent[sid] });
  });

  // Transcribe student microphone recording via Gemini 3.5 Transcribe
  app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
    try {
      const { audioBase64, mimeType, language } = req.body ?? {};
      if (typeof audioBase64 !== 'string' || !audioBase64.trim()) {
        res.status(400).json({ error: 'Audio recording data is required.' });
        return;
      }
      const normalizedMime = typeof mimeType === 'string' ? mimeType.toLowerCase().split(';')[0].trim() : 'audio/webm';
      if (!ALLOWED_AUDIO_MIMES.has(normalizedMime)) {
        res.status(400).json({ error: `Unsupported audio format: ${normalizedMime}` });
        return;
      }
      const langKey: 'en' | 'kn' | 'hi' = language === 'kn' || language === 'hi' ? language : 'en';
      const ai = getGenAIClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: audioBase64,
              },
            },
            {
              text: `Transcribe this student's spoken audio accurately in ${LANGUAGE_NAMES[langKey]} (or the language spoken). Return only the clean transcribed text without extra commentary.`,
            },
          ],
        },
      });

      const transcript = (response.text ?? '').trim();
      res.json({ transcript });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Audio transcription failed.';
      res.status(500).json({ error: msg });
    }
  });

  const ttsCache = new Map<string, string>();

  const SERVER_VOICE_PROFILES: Record<
    'en' | 'kn' | 'hi',
    { defaultVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'; stylePrompt: string }
  > = {
    kn: {
      defaultVoice: 'Kore',
      stylePrompt:
        'Clear, warm native Kannada educator speaking exclusively in natural, easy-to-understand Kannada (ಕನ್ನಡ) with clear syllable articulation and steady pacing.',
    },
    hi: {
      defaultVoice: 'Kore',
      stylePrompt:
        'Clear, warm native Hindi educator speaking exclusively in natural, easy-to-understand Hindi (हिन्दी) with steady pacing.',
    },
    en: {
      defaultVoice: 'Kore',
      stylePrompt:
        'Clear, warm English educator speaking in natural, easy-to-understand English with steady articulation.',
    },
  };

  // Multilingual Gemini Text-to-Speech via Gemini 3.8 Flash Lite TTS
  app.post('/api/ai/tts', async (req: Request, res: Response) => {
    try {
      const { text, language, voiceName } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'Text to speak is required.' });
        return;
      }
      const langKey: 'en' | 'kn' | 'hi' = language === 'kn' || language === 'hi' ? language : 'en';
      const voiceProfile = SERVER_VOICE_PROFILES[langKey];
      const safeVoice =
        voiceName === 'Puck' || voiceName === 'Charon' || voiceName === 'Kore' || voiceName === 'Fenrir' || voiceName === 'Zephyr'
          ? voiceName
          : voiceProfile.defaultVoice;

      const cleanText = text.trim().slice(0, 1800);
      const cacheKey = `${langKey}::${safeVoice}::${cleanText}`;
      const cachedAudio = ttsCache.get(cacheKey);
      if (cachedAudio) {
        res.json({ audioBase64: cachedAudio, mimeType: 'audio/wav' });
        return;
      }

      const stylePrompt = voiceProfile.stylePrompt;

      const ai = getGenAIClient();
      let base64Audio: string | undefined;
      let lastErr: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanText,
                    speechMetadata: {
                      style: stylePrompt,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: safeVoice },
                },
              },
            },
          });
          base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) break;
        } catch (err) {
          lastErr = err;
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      if (!base64Audio) {
        if (lastErr) throw lastErr;
        res.status(502).json({ error: 'Speech synthesis did not return audio data.' });
        return;
      }

      if (ttsCache.size >= 150) {
        const oldestKey = ttsCache.keys().next().value;
        if (oldestKey) ttsCache.delete(oldestKey);
      }
      ttsCache.set(cacheKey, base64Audio);

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Text-to-speech generation failed.';
      res.status(500).json({ error: msg });
    }
  });

  // AI Inclusive Tutor (Ask & Hear in English, Kannada, or Hindi)
  app.post('/api/ai/ask', async (req: Request, res: Response) => {
    try {
      const { question, language, lessonTitle, lessonContext, accessibilityMode, includeAudio } =
        req.body ?? {};

      if (typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: 'Please provide a question.' });
        return;
      }

      const langKey: 'en' | 'kn' | 'hi' = language === 'kn' || language === 'hi' ? language : 'en';
      const langName = LANGUAGE_NAMES[langKey];
      const ai = getGenAIClient();

      const prompt = [
        `Student Question: ${question.trim().slice(0, 1000)}`,
        lessonTitle ? `Current Lesson: ${String(lessonTitle).slice(0, 160)}` : '',
        lessonContext ? `Lesson Context: ${String(lessonContext).slice(0, 1200)}` : '',
        accessibilityMode ? `Student Accessibility Mode: ${String(accessibilityMode)}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: `You are ClarityLearn's inclusive AI tutor for visually impaired and hearing impaired students. Always respond completely in ${langName} (use native script for Kannada or Hindi). Keep explanations clear, warm, structured, and easy to listen to when read aloud (3–5 sentences for the main answer, plus 3 concise key points and a short tactile/visual analogy or sign summary).`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: `Clear, accessible spoken-friendly explanation in ${langName}.`,
              },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Three short bullet takeaways in ${langName}.`,
              },
              sensoryTip: {
                type: Type.STRING,
                description: `A helpful visual diagram analogy or tactile/audio learning tip in ${langName}.`,
              },
            },
            required: ['answer', 'keyPoints', 'sensoryTip'],
          },
        },
      });

      const parsed = JSON.parse((aiResponse.text ?? '{}').trim()) as {
        answer?: string;
        keyPoints?: string[];
        sensoryTip?: string;
      };

      const answerText = parsed.answer ?? 'Here is an explanation for your question.';
      let audioBase64: string | undefined;

      if (includeAudio) {
        try {
          const voiceProfile = SERVER_VOICE_PROFILES[langKey];
          const spoken = `${answerText} ${parsed.sensoryTip ?? ''}`.trim().slice(0, 1400);
          const ttsRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: spoken,
                    speechMetadata: {
                      style: voiceProfile.stylePrompt,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceProfile.defaultVoice },
                },
              },
            },
          });
          audioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        } catch (ttsErr) {
          console.warn('Optional TTS synthesis warning:', ttsErr);
        }
      }

      res.json({
        answer: answerText,
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        sensoryTip: parsed.sensoryTip ?? '',
        language: langKey,
        audioBase64,
        audioMimeType: audioBase64 ? 'audio/wav' : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI Tutor request failed.';
      res.status(500).json({ error: msg });
    }
  });

  // Multilingual Lesson Translator (English -> Kannada / Hindi)
  app.post('/api/ai/translate-lesson', async (req: Request, res: Response) => {
    try {
      const { lessonId, targetLanguage, title, subtitle, sections, cues } = req.body ?? {};
      const langKey: 'en' | 'kn' | 'hi' =
        targetLanguage === 'kn' || targetLanguage === 'hi' ? targetLanguage : 'en';

      if (langKey === 'en') {
        res.json({ title, subtitle, sections, cues, language: 'en' });
        return;
      }

      const cacheKey = `${String(lessonId ?? title)}::${langKey}`;
      if (translationCache.has(cacheKey)) {
        res.json(translationCache.get(cacheKey));
        return;
      }

      const ai = getGenAIClient();
      const langName = LANGUAGE_NAMES[langKey];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: JSON.stringify({ title, subtitle, sections, cues }),
        config: {
          systemInstruction: `Translate this educational lesson into natural, student-friendly ${langName} using proper native script (${langKey === 'kn' ? 'Kannada script' : 'Devanagari Hindi script'}). Preserve scientific accuracy and keep cue IDs identical.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING },
                    keyTakeaway: { type: Type.STRING },
                  },
                  required: ['id', 'heading', 'body', 'keyTakeaway'],
                },
              },
              cues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    caption: { type: Type.STRING },
                  },
                  required: ['id', 'caption'],
                },
              },
            },
            required: ['title', 'subtitle', 'sections', 'cues'],
          },
        },
      });

      const translated = JSON.parse((response.text ?? '{}').trim());
      const payload = { ...translated, language: langKey };
      translationCache.set(cacheKey, payload);
      res.json(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lesson translation failed.';
      res.status(500).json({ error: msg });
    }
  });

  // AI Practice Quiz Generator (in English, Kannada, or Hindi)
  app.post('/api/ai/generate-quiz', async (req: Request, res: Response) => {
    try {
      const { topic, language } = req.body ?? {};
      if (typeof topic !== 'string' || !topic.trim()) {
        res.status(400).json({ error: 'Lesson topic is required.' });
        return;
      }
      const langKey: 'en' | 'kn' | 'hi' = language === 'kn' || language === 'hi' ? language : 'en';
      const langName = LANGUAGE_NAMES[langKey];
      const ai = getGenAIClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate 3 accessible multiple-choice quiz questions about "${topic.trim().slice(0, 120)}" in ${langName}.`,
        config: {
          systemInstruction: `Create 3 clear multiple-choice educational quiz questions in ${langName} (4 options each, 0-based correctIndex, a short hint, and a clear explanation).`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                hint: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['prompt', 'options', 'correctIndex', 'hint', 'explanation'],
            },
          },
        },
      });

      const items = JSON.parse((response.text ?? '[]').trim()) as Array<{
        prompt: string;
        options: string[];
        correctIndex: number;
        hint: string;
        explanation: string;
      }>;

      const questions = items.slice(0, 3).map((q, idx) => ({
        id: `ai-q-${Date.now()}-${idx}`,
        prompt: q.prompt,
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
        correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
        hint: q.hint,
        explanation: q.explanation,
      }));

      res.json({ questions, language: langKey });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Quiz generation failed.';
      res.status(500).json({ error: msg });
    }
  });

  const httpServer = http.createServer(app);

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ClarityLearn full-stack server running on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
