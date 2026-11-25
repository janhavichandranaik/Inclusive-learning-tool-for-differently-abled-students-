import React, { useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Send, Square, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { LESSONS } from '../data/curriculum';
import { getLocalizedLesson } from '../data/multilingualMaterials';
import { TRANSLATIONS } from '../i18n/translations';
import { AccessibilitySettings, AppLanguage } from '../types';

interface TutorTurn {
  id: string;
  question: string;
  answer: string;
  keyPoints: string[];
  sensoryTip: string;
  language: AppLanguage;
  audioBase64?: string;
  audioMimeType?: string;
}

interface AITutorStudioProps {
  settings: AccessibilitySettings;
  onChangeLanguage: (lang: AppLanguage) => void;
  speak: (
    text: string,
    opts?: { id?: string; rate?: number; voiceURI?: string; language?: AppLanguage; preferServerAudio?: boolean }
  ) => void;
  playBase64Audio: (base64: string, mime?: string, id?: string) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
  announce: (msg: string, priority?: 'polite' | 'assertive') => void;
}

const STARTER_QUESTIONS: Record<AppLanguage, string[]> = {
  en: [
    'Teach me 5 useful everyday phrases in Kannada and Hindi with pronunciation.',
    'Explain English Subject + Verb + Object sentence order with simple examples.',
    'Explain photosynthesis simply as if I am listening by audio.',
  ],
  kn: [
    'ಕನ್ನಡ ಸ್ವರಗಳು ಮತ್ತು ದೈನಂದಿನ ಶುಭಾಶಯಗಳನ್ನು ಉಚ್ಚಾರಣೆಯೊಂದಿಗೆ ಕಲಿಸಿ.',
    'ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ (Photosynthesis) ಹೇಗೆ ನಡೆಯುತ್ತದೆ ಎಂದು ಸರಳವಾಗಿ ವಿವರಿಸಿ.',
    'ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ Noun, Verb ಮತ್ತು Adjective ವ್ಯತ್ಯಾಸವನ್ನು ಕನ್ನಡದಲ್ಲಿ ತಿಳಿಸಿ.',
  ],
  hi: [
    'हिन्दी स्वर, मात्राएँ और रोज़मर्रा के विनम्र वाक्य उदाहरण सहित सिखाइए।',
    'प्रकाश संश्लेषण (Photosynthesis) को आसान भाषा में समझाइए।',
    'अंग्रेज़ी वाक्य संरचना Subject + Verb + Object को हिन्दी में समझाइए।',
  ],
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      } else {
        reject(new Error('Failed to encode audio blob'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read audio recording'));
    reader.readAsDataURL(blob);
  });
}

export const AITutorStudio: React.FC<AITutorStudioProps> = ({
  settings,
  onChangeLanguage,
  speak,
  playBase64Audio,
  stopSpeech,
  isSpeaking,
  announce,
}) => {
  const t = TRANSLATIONS[settings.language];
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [questionInput, setQuestionInput] = useState('');
  const [autoHearAnswer, setAutoHearAnswer] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [turns, setTurns] = useState<TutorTurn[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const selectedLesson = useMemo(() => {
    const found = LESSONS.find((l) => l.id === selectedLessonId);
    return found ? getLocalizedLesson(found, settings.language) : undefined;
  }, [selectedLessonId, settings.language]);

  const askAIQuestion = async (questionText: string) => {
    const clean = questionText.trim();
    if (!clean || isProcessing) return;

    setErrorMsg('');
    setIsProcessing(true);
    setStatusNote('Generating accessible response...');

    try {
      const contextSummary = selectedLesson
        ? `${selectedLesson.subtitle} Objectives: ${selectedLesson.objectives.join(' ')}`
        : '';

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clean,
          language: settings.language,
          lessonTitle: selectedLesson?.title,
          lessonContext: contextSummary,
          accessibilityMode: settings.profileMode,
          includeAudio: autoHearAnswer,
        }),
      });

      const data = (await res.json()) as {
        answer?: string;
        keyPoints?: string[];
        sensoryTip?: string;
        language?: AppLanguage;
        audioBase64?: string;
        audioMimeType?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not get an answer from the AI Tutor.');
      }

      const turn: TutorTurn = {
        id: `turn-${Date.now()}`,
        question: clean,
        answer: data.answer ?? '',
        keyPoints: data.keyPoints ?? [],
        sensoryTip: data.sensoryTip ?? '',
        language: data.language ?? settings.language,
        audioBase64: data.audioBase64,
        audioMimeType: data.audioMimeType,
      };

      setTurns((prev) => [turn, ...prev]);
      setQuestionInput('');
      setStatusNote('');
      announce(`AI Tutor answered: ${turn.answer}`, 'polite');

      if (autoHearAnswer) {
        if (turn.audioBase64) {
          playBase64Audio(turn.audioBase64, turn.audioMimeType ?? 'audio/wav', turn.id);
        } else {
          speak(`${turn.answer} ${turn.sensoryTip}`, {
            id: turn.id,
            language: turn.language,
            rate: settings.ttsRate,
            preferServerAudio: true,
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to contact AI Tutor.';
      setErrorMsg(msg);
      setStatusNote('');
      announce(`Error: ${msg}`, 'assertive');
    } finally {
      setIsProcessing(false);
    }
  };

  const startMicRecording = async () => {
    setErrorMsg('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Microphone recording is unavailable in this browser. Type your question below instead.');
      return;
    }

    try {
      stopSpeech();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRecording(false);
        setRecordingSec(0);

        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        if (blob.size < 400) {
          setErrorMsg('Recording was too short. Hold and speak your question clearly.');
          return;
        }

        setIsProcessing(true);
        setStatusNote('Transcribing your spoken question...');
        try {
          const base64 = await blobToBase64(blob);
          const transRes = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: mime,
              language: settings.language,
            }),
          });
          const transData = (await transRes.json()) as { transcript?: string; error?: string };
          if (!transRes.ok) {
            throw new Error(transData.error ?? 'Could not transcribe voice recording.');
          }
          const spokenQuestion = (transData.transcript ?? '').trim();
          if (!spokenQuestion) {
            setErrorMsg('No words were detected in the recording. Please try speaking again.');
            setIsProcessing(false);
            setStatusNote('');
            return;
          }
          setQuestionInput(spokenQuestion);
          setIsProcessing(false);
          await askAIQuestion(spokenQuestion);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Voice transcription failed.';
          setErrorMsg(msg);
          setIsProcessing(false);
          setStatusNote('');
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSec(0);
      announce('Microphone listening. Speak your question now.');
      timerRef.current = window.setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    } catch {
      setErrorMsg('Microphone permission was denied. Please allow microphone access or type your question below.');
      announce('Microphone permission denied', 'assertive');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-balance" style={{ color: 'var(--text-primary)' }}>
            {t.askMicHeading}
          </h1>
          <p className="mt-1 text-base max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            {t.askMicSub}
          </p>
        </div>

        {/* Multilingual Selector */}
        <div
          role="group"
          aria-label="Tutor Response Language"
          className="inline-flex p-1 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          {(
            [
              { id: 'en', label: 'English' },
              { id: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
              { id: 'hi', label: 'हिन्दी (Hindi)' },
            ] as const
          ).map((langOpt) => {
            const active = settings.language === langOpt.id;
            return (
              <button
                key={langOpt.id}
                type="button"
                onClick={() => onChangeLanguage(langOpt.id)}
                aria-pressed={active}
                className="px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                  color: active ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                }}
              >
                {langOpt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Microphone Ask & Hear Control Deck */}
      <section
        aria-label="Ask Question by Microphone or Text"
        className="rounded-xl border p-6 space-y-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="grid md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6">
            <label htmlFor="ai-lesson-topic" className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Lesson Context (Optional)
            </label>
            <select
              id="ai-lesson-topic"
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border text-sm font-semibold"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              {LESSONS.map((l) => {
                const loc = getLocalizedLesson(l, settings.language);
                return (
                  <option key={l.id} value={l.id}>
                    {loc.title}
                  </option>
                );
              })}
              <option value="general">General Study Question</option>
            </select>
          </div>

          <div className="md:col-span-6 flex flex-wrap items-center md:justify-end gap-3 pt-2 md:pt-5">
            <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={autoHearAnswer}
                onChange={(e) => setAutoHearAnswer(e.target.checked)}
                className="w-4 h-4 accent-sky-600"
              />
              Auto-speak answer aloud
            </label>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeech}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                {t.stopAudio}
              </button>
            )}
          </div>
        </div>

        {/* Big Accessible Microphone Button + Text Input */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <button
            type="button"
            disabled={isProcessing}
            onClick={isRecording ? stopMicRecording : startMicRecording}
            aria-pressed={isRecording}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: isRecording ? 'var(--error-bg)' : 'var(--accent-primary)',
              color: isRecording ? 'var(--error-text)' : 'var(--accent-on-primary)',
              border: isRecording ? '2px solid var(--error-border)' : '2px solid transparent',
            }}
          >
            {isRecording ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
            {isRecording ? `${t.stopMicSend} (${recordingSec}s)` : t.startMicAsk}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              askAIQuestion(questionInput);
            }}
            className="flex-1 flex gap-2"
          >
            <label htmlFor="ai-question-input" className="sr-only">
              {t.typeQuestionPlaceholder}
            </label>
            <input
              id="ai-question-input"
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder={t.typeQuestionPlaceholder}
              className="flex-1 px-4 py-3 rounded-xl border text-base"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={isProcessing || !questionInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {t.askAiButton}
            </button>
          </form>
        </div>

        {statusNote && (
          <p role="status" className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
            {statusNote}
          </p>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border text-sm font-semibold"
            style={{
              backgroundColor: 'var(--error-bg)',
              borderColor: 'var(--error-border)',
              color: 'var(--error-text)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Quick Starter Prompts in Selected Language */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            Try Asking ({TRANSLATIONS[settings.language].nativeLabel}):
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_QUESTIONS[settings.language].map((q) => (
              <button
                key={q}
                type="button"
                disabled={isProcessing}
                onClick={() => askAIQuestion(q)}
                className="text-left px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tutor Answers */}
      <section aria-label="AI Tutor Explanations" className="space-y-4">
        {turns.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center space-y-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <Sparkles className="w-6 h-6 mx-auto" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Ask Your First Question by Voice or Text
            </p>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Your AI Tutor listens through your microphone, answers in {TRANSLATIONS[settings.language].nativeLabel}, and plays back natural spoken audio.
            </p>
          </div>
        ) : (
          turns.map((turn) => (
            <article
              key={turn.id}
              className="rounded-xl border p-6 space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Question · {TRANSLATIONS[turn.language].nativeLabel}
                  </p>
                  <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    "{turn.question}"
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (turn.audioBase64) {
                      playBase64Audio(turn.audioBase64, turn.audioMimeType ?? 'audio/wav', turn.id);
                    } else {
                      speak(`${turn.answer} ${turn.sensoryTip}`, {
                        id: turn.id,
                        language: turn.language,
                        rate: settings.ttsRate,
                        preferServerAudio: true,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                  }}
                >
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                  {t.hearAnswer}
                </button>
              </div>

              <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {turn.answer}
              </p>

              {turn.keyPoints.length > 0 && (
                <div
                  className="p-4 rounded-lg border space-y-1.5"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <p className="text-xs font-bold inline-flex items-center gap-1.5" style={{ color: 'var(--accent-primary)' }}>
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    Key Points
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: 'var(--text-primary)' }}>
                    {turn.keyPoints.map((kp, idx) => (
                      <li key={idx}>{kp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {turn.sensoryTip && (
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                  Sensory Learning Analogy: {turn.sensoryTip}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
};
