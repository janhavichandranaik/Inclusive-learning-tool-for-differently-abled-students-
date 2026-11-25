import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Headphones,
  Languages,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from 'lucide-react';
import { LESSONS, SUBJECTS } from '../data/curriculum';
import { getLocalizedLesson, getLocalizedSubject } from '../data/multilingualMaterials';
import { TRANSLATIONS } from '../i18n/translations';
import { AccessibilitySettings, AppLanguage, Lesson } from '../types';

interface AudioLearningPageProps {
  initialLessonId?: string;
  settings: AccessibilitySettings;
  completedLessons: Record<string, { completed: boolean }>;
  translatedLessons: Record<string, Lesson>;
  isTranslating: boolean;
  onTranslateLesson: (lesson: Lesson, lang: AppLanguage) => void;
  onMarkComplete: (lessonId: string) => void;
  onUpdateRate: (rate: number) => void;
  speak: (
    text: string,
    opts?: { id?: string; rate?: number; voiceURI?: string; language?: AppLanguage; onEnd?: () => void }
  ) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
  activeSpeechId: string | null;
  announce: (msg: string) => void;
  onOpenQuiz: (lessonId: string) => void;
}

export const AudioLearningPage: React.FC<AudioLearningPageProps> = ({
  initialLessonId,
  settings,
  completedLessons,
  translatedLessons,
  isTranslating,
  onTranslateLesson,
  onMarkComplete,
  onUpdateRate,
  speak,
  stopSpeech,
  isSpeaking,
  activeSpeechId,
  announce,
  onOpenQuiz,
}) => {
  const t = TRANSLATIONS[settings.language];
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId ?? LESSONS[0].id);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  useEffect(() => {
    if (initialLessonId) {
      setSelectedLessonId(initialLessonId);
      setActiveTrackIndex(0);
    }
  }, [initialLessonId]);

  const baseLesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedLessonId) ?? LESSONS[0],
    [selectedLessonId]
  );

  const selectedLesson = useMemo(() => {
    const cacheKey = `${baseLesson.id}::${settings.language}`;
    if (settings.language !== 'en' && translatedLessons[cacheKey]) {
      return translatedLessons[cacheKey];
    }
    return getLocalizedLesson(baseLesson, settings.language);
  }, [baseLesson, settings.language, translatedLessons]);

  const subject = useMemo(() => {
    const raw = SUBJECTS.find((s) => s.id === selectedLesson.subjectId) ?? SUBJECTS[0];
    return getLocalizedSubject(raw, settings.language);
  }, [selectedLesson.subjectId, settings.language]);

  // Build ordered spoken audio tracks from the lesson's written study materials
  const audioTracks = useMemo(() => {
    interface AudioTrack {
      id: string;
      title: string;
      spokenText: string;
      displaySummary: string;
      takeaway?: string;
    }

    const introTitle =
      settings.language === 'kn'
        ? 'ಪಾಠದ ಪರಿಚಯ ಮತ್ತು ಉದ್ದೇಶಗಳು'
        : settings.language === 'hi'
        ? 'पाठ का परिचय और उद्देश्य'
        : 'Lesson Introduction & Objectives';

    const recapTitle =
      settings.language === 'kn'
        ? 'ಪಾಠದ ಸಂಪೂರ್ಣ ಧ್ವನಿ ಸಾರಾಂಶ'
        : settings.language === 'hi'
        ? 'पाठ का संपूर्ण ऑडियो सारांश'
        : 'Guided Visual Diagram Audio Description';

    const introTrack: AudioTrack = {
      id: `${selectedLesson.id}-intro`,
      title: introTitle,
      spokenText: `${selectedLesson.title}. ${selectedLesson.subtitle}. ${selectedLesson.objectives.join(
        '. '
      )}`,
      displaySummary: selectedLesson.objectives.join(' · '),
    };
    const sectionTracks: AudioTrack[] = selectedLesson.readingSections.map((sec) => ({
      id: sec.id,
      title: sec.heading,
      spokenText: `${sec.heading}. ${sec.body}. ${sec.keyTakeaway}`,
      displaySummary: sec.body,
      takeaway: sec.keyTakeaway,
    }));
    const cueSummaryTrack: AudioTrack = {
      id: `${selectedLesson.id}-recap`,
      title: recapTitle,
      spokenText: selectedLesson.cues
        .map((c, idx) =>
          settings.language === 'en' ? `${idx + 1}: ${c.caption} ${c.visualAltText}` : `${idx + 1}: ${c.caption}`
        )
        .join(' '),
      displaySummary: selectedLesson.cues.map((c) => c.caption).join(' · '),
    };
    return [introTrack, ...sectionTracks, cueSummaryTrack];
  }, [selectedLesson, settings.language]);

  const currentTrack = audioTracks[activeTrackIndex] ?? audioTracks[0];
  const currentTrackSpeechId = `audio-studio-${currentTrack.id}`;
  const isPlayingCurrent = isSpeaking && activeSpeechId === currentTrackSpeechId;

  const playTrackAt = (index: number) => {
    const clamped = Math.max(0, Math.min(audioTracks.length - 1, index));
    setActiveTrackIndex(clamped);
    const track = audioTracks[clamped];
    if (!track) return;

    speak(track.spokenText, {
      id: `audio-studio-${track.id}`,
      rate: settings.ttsRate,
      voiceURI: settings.ttsVoiceURI,
      language: settings.language,
      onEnd: () => {
        if (autoAdvance && clamped + 1 < audioTracks.length) {
          playTrackAt(clamped + 1);
        } else if (clamped === audioTracks.length - 1) {
          onMarkComplete(selectedLesson.id);
          announce(`Completed audio lesson: ${selectedLesson.title}`);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-balance" style={{ color: 'var(--text-primary)' }}>
            {t.audioStudioTitle}
          </h1>
          <p className="mt-1 text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Converts written study chapters, objectives, and diagram descriptions into continuous spoken audio lessons in {t.nativeLabel}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {settings.language !== 'en' && (
            <button
              type="button"
              disabled={isTranslating}
              onClick={() => onTranslateLesson(baseLesson, settings.language)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <Languages className="w-4 h-4" aria-hidden="true" />
              {isTranslating ? t.translatingLabel : `${t.translateLessonBtn} (${t.nativeLabel})`}
            </button>
          )}
          <label htmlFor="audio-rate-select" className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            Narration Speed:
          </label>
          <select
            id="audio-rate-select"
            value={settings.ttsRate}
            onChange={(e) => onUpdateRate(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border text-sm font-semibold tabular-nums cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <option value={0.8}>0.8× Slower</option>
            <option value={1.0}>1.0× Standard</option>
            <option value={1.2}>1.2× Brisk</option>
            <option value={1.5}>1.5× Fast</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Lesson Selector */}
        <aside
          aria-label="Audio Lesson Catalog"
          className="lg:col-span-4 rounded-xl border p-4 space-y-2.5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h2 className="text-sm font-bold px-1" style={{ color: 'var(--text-primary)' }}>
            Choose an Audio Lesson
          </h2>
          {LESSONS.map((rawLesson) => {
            const lesson = getLocalizedLesson(rawLesson, settings.language);
            const active = lesson.id === selectedLesson.id;
            const done = Boolean(completedLessons[lesson.id]?.completed);
            const rawSubj = SUBJECTS.find((s) => s.id === lesson.subjectId);
            const subj = rawSubj ? getLocalizedSubject(rawSubj, settings.language) : undefined;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  stopSpeech();
                  setSelectedLessonId(lesson.id);
                  setActiveTrackIndex(0);
                  announce(`Selected audio lesson ${lesson.title}`);
                }}
                className="w-full text-left p-3.5 rounded-lg border cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {subj?.title} · {done ? 'Completed' : lesson.level}
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {lesson.title}
                </p>
              </button>
            );
          })}
        </aside>

        {/* Right: Audio Player & Chapter Sequence */}
        <div className="lg:col-span-8 space-y-5">
          <section
            aria-label="Active Audio Lesson Deck"
            className="rounded-xl border p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold inline-flex items-center gap-1.5" style={{ color: 'var(--accent-primary)' }}>
                  <Headphones className="w-4 h-4" aria-hidden="true" />
                  {subject.title} · Chapter {activeTrackIndex + 1} of {audioTracks.length}
                </p>
                <h2 className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedLesson.title}
                </h2>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Now Selected: {currentTrack.title}
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
                Auto-advance chapters
              </label>
            </div>

            {/* Active Chapter Text Preview */}
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {currentTrack.displaySummary}
              </p>
              {currentTrack.takeaway && (
                <p className="text-sm font-bold pt-1" style={{ color: 'var(--accent-primary)' }}>
                  Key Takeaway: {currentTrack.takeaway}
                </p>
              )}
            </div>

            {/* Audio Transport Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlayingCurrent) {
                      stopSpeech();
                      announce('Audio lesson paused');
                    } else {
                      playTrackAt(activeTrackIndex);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                  }}
                >
                  {isPlayingCurrent ? (
                    <Pause className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isPlayingCurrent ? 'Pause Audio' : 'Listen From Here'}
                </button>

                <button
                  type="button"
                  onClick={() => playTrackAt(Math.max(0, activeTrackIndex - 1))}
                  disabled={activeTrackIndex === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg border text-sm font-semibold disabled:opacity-45 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <SkipBack className="w-4 h-4" aria-hidden="true" />
                  Prev Chapter
                </button>

                <button
                  type="button"
                  onClick={() => playTrackAt(Math.min(audioTracks.length - 1, activeTrackIndex + 1))}
                  disabled={activeTrackIndex === audioTracks.length - 1}
                  className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg border text-sm font-semibold disabled:opacity-45 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Next Chapter
                  <SkipForward className="w-4 h-4" aria-hidden="true" />
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={() => stopSpeech()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg border text-sm font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Square className="w-4 h-4" aria-hidden="true" />
                    Stop
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onMarkComplete(selectedLesson.id);
                    announce(`Marked ${selectedLesson.title} as complete`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: completedLessons[selectedLesson.id]?.completed
                      ? 'var(--success-bg)'
                      : 'var(--bg-surface-alt)',
                    borderColor: completedLessons[selectedLesson.id]?.completed
                      ? 'var(--success-border)'
                      : 'var(--border-hairline)',
                    color: completedLessons[selectedLesson.id]?.completed
                      ? 'var(--success-text)'
                      : 'var(--text-primary)',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  {completedLessons[selectedLesson.id]?.completed ? 'Completed' : 'Mark Complete'}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQuiz(selectedLesson.id)}
                  className="px-4 py-2.5 rounded-lg border text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Take Audio Quiz
                </button>
              </div>
            </div>
          </section>

          {/* Chapter Playlist */}
          <section
            aria-label="Audio Chapters Playlist"
            className="rounded-xl border p-5 space-y-2.5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Written Study Material Converted to Audio Chapters
            </h3>

            {audioTracks.map((track, idx) => {
              const selected = idx === activeTrackIndex;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => playTrackAt(idx)}
                  className="w-full text-left p-3.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer"
                  style={{
                    backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                    borderColor: selected ? 'var(--accent-primary)' : 'var(--border-hairline)',
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
                      Chapter {idx + 1}
                    </p>
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {track.title}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    {selected && isPlayingCurrent ? 'Speaking' : 'Play'}
                  </span>
                </button>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};
