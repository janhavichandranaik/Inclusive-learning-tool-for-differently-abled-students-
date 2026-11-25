import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Contrast,
  SlidersHorizontal,
  Square,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AccessibilityDrawer } from './components/AccessibilityDrawer';
import { LessonPlayer } from './components/LessonPlayer';
import { ProgressTracker } from './components/ProgressTracker';
import { QuizEngine } from './components/QuizEngine';
import { SignStudio } from './components/SignStudio';
import { TranscriptPanel } from './components/TranscriptPanel';
import { LESSONS, SUBJECTS } from './data/curriculum';
import { useAccessibility } from './hooks/useAccessibility';
import { useLearningProgress } from './hooks/useLearningProgress';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { NavView, SubjectId } from './types';

export default function App() {
  const {
    settings,
    announcement,
    announce,
    setContrastMode,
    setFontSize,
    setCaptionSize,
    cycleFontSize,
    updateSettings,
    resetAccessibility,
  } = useAccessibility();

  const speech = useSpeechSynthesis();
  const progressApi = useLearningProgress();

  const [activeView, setActiveView] = useState<NavView>('subjects');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | SubjectId>('all');
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [lessonTab, setLessonTab] = useState<'transcript' | 'notes' | 'quiz'>('transcript');
  const [lessonTimeSec, setLessonTimeSec] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quizHubLessonId, setQuizHubLessonId] = useState<string>(LESSONS[0].id);

  const activeLesson = useMemo(
    () => LESSONS.find((l) => l.id === activeLessonId) ?? LESSONS[0],
    [activeLessonId]
  );

  const activeSubject = useMemo(
    () => SUBJECTS.find((s) => s.id === activeLesson.subjectId) ?? SUBJECTS[0],
    [activeLesson.subjectId]
  );

  const filteredSubjects = useMemo(() => {
    if (selectedSubjectFilter === 'all') return SUBJECTS;
    return SUBJECTS.filter((s) => s.id === selectedSubjectFilter);
  }, [selectedSubjectFilter]);

  const openLesson = (lessonId: string, initialTab: 'transcript' | 'notes' | 'quiz' = 'transcript') => {
    speech.stop();
    setActiveLessonId(lessonId);
    setLessonTab(initialTab);
    setLessonTimeSec(0);
    setActiveView('lesson');
    const target = LESSONS.find((l) => l.id === lessonId);
    if (target) {
      announce(`Opened lesson: ${target.title}`);
    }
    window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
  };

  // Global accessible keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '1') {
        e.preventDefault();
        setActiveView('subjects');
        announce('Switched to Subjects Library');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveView('sign-studio');
        announce('Switched to Sign Language Studio');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveView('quiz-hub');
        announce('Switched to Quiz Hub');
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveView('progress');
        announce('Switched to Progress Tracker');
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [announce]);

  const cycleContrast = () => {
    const order = ['standard', 'hc-dark', 'hc-light'] as const;
    const idx = order.indexOf(settings.contrastMode);
    setContrastMode(order[(idx + 1) % order.length]);
  };

  const contrastLabel =
    settings.contrastMode === 'hc-dark'
      ? 'High Contrast Dark'
      : settings.contrastMode === 'hc-light'
      ? 'High Contrast Light'
      : 'Standard Light';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Screen-Reader Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Accessible Live Region Announcer */}
      <div
        key={announcement.key}
        role="status"
        aria-live={announcement.priority}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement.text}
      </div>

      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header
        className="border-b"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => {
              speech.stop();
              setActiveView('subjects');
            }}
            className="text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 cursor-pointer text-left"
            style={{ color: 'var(--text-primary)' }}
          >
            ClarityLearn
          </button>

          {/* Zone 2: 4 Single-line Navigation Links */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {(
              [
                { id: 'subjects', label: 'Subjects' },
                { id: 'sign-studio', label: 'Sign Studio' },
                { id: 'quiz-hub', label: 'Quiz Hub' },
                { id: 'progress', label: 'Progress' },
              ] as const
            ).map((item) => {
              const isCurrent =
                activeView === item.id || (activeView === 'lesson' && item.id === 'subjects');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    speech.stop();
                    setActiveView(item.id);
                    announce(`Navigated to ${item.label}`);
                  }}
                  aria-current={isCurrent ? 'page' : undefined}
                  className="py-1 whitespace-nowrap shrink-0 cursor-pointer border-b-2 transition-colors"
                  style={{
                    color: isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderColor: isCurrent ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              Accessibility
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden flex items-center justify-around border-t px-2 py-2 text-xs font-semibold"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          {(
            [
              { id: 'subjects', label: 'Subjects' },
              { id: 'sign-studio', label: 'Sign Studio' },
              { id: 'quiz-hub', label: 'Quiz Hub' },
              { id: 'progress', label: 'Progress' },
            ] as const
          ).map((item) => {
            const isCurrent =
              activeView === item.id || (activeView === 'lesson' && item.id === 'subjects');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  speech.stop();
                  setActiveView(item.id);
                }}
                aria-current={isCurrent ? 'page' : undefined}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0"
                style={{
                  color: isCurrent ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  backgroundColor: isCurrent ? 'var(--accent-primary)' : 'transparent',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Quick Sensory Toolbar (Below Header, Above Workspace) */}
      <section
        aria-label="Quick Sensory Controls"
        className="border-b"
        style={{
          backgroundColor: 'var(--bg-surface-alt)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={cycleContrast}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
              Contrast: {contrastLabel}
            </button>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => cycleFontSize('down')}
                aria-label="Decrease font size"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                A-
              </button>
              <span className="px-2 text-xs font-mono-tabular font-bold" style={{ color: 'var(--text-secondary)' }}>
                {settings.fontSize}px
              </span>
              <button
                type="button"
                onClick={() => cycleFontSize('up')}
                aria-label="Increase font size"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                A+
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (speech.isSpeaking) {
                  speech.stop();
                } else {
                  const summary =
                    activeView === 'lesson'
                      ? `${activeLesson.title}. ${activeLesson.subtitle}`
                      : `ClarityLearn inclusive learning library. You have completed ${progressApi.completedCount} of ${progressApi.totalLessons} lessons across Science, Mathematics, Sign Language, and Earth Systems.`;
                  speech.speak(summary, {
                    id: 'quick-page-summary',
                    rate: settings.ttsRate,
                    voiceURI: settings.ttsVoiceURI,
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: speech.isSpeaking ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: speech.isSpeaking ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              {speech.isSpeaking ? (
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {speech.isSpeaking ? 'Stop Audio' : 'Read Page Summary'}
            </button>

            <span className="text-xs font-medium tabular-nums hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
              Progress: {progressApi.overallPercent}% ({progressApi.completedCount}/{progressApi.totalLessons} lessons)
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 focus:outline-none">
        {activeView === 'subjects' && (
          <div className="space-y-8">
            {/* Hero Introduction */}
            <section
              aria-labelledby="hero-heading"
              className="rounded-xl border p-6 sm:p-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="max-w-3xl">
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                  Multi-Sensory Education · Visual & Hearing Accessible
                </p>
                <h1
                  id="hero-heading"
                  className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-balance"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Learn Every Subject With Voice, Captions, Sign Language & Clear Transcripts
                </h1>
                <p className="mt-3 text-base sm:text-lg max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                  Every lesson pairs synchronized audio narration and high-contrast visual diagrams with live captions, an ASL interpreter panel, searchable transcripts, and interactive knowledge checks.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openLesson(progressApi.progress.lastVisitedLessonId ?? LESSONS[0].id)}
                    className="px-5 py-3 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)',
                    }}
                  >
                    {progressApi.progress.lastVisitedLessonId ? 'Resume Last Lesson' : 'Start First Lesson'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('sign-studio')}
                    className="px-5 py-3 rounded-lg border text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface-alt)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Explore Sign Language Studio
                  </button>
                </div>
              </div>
            </section>

            {/* Subject Filter Controls */}
            <section aria-labelledby="subjects-heading" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 id="subjects-heading" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Subject-Wise Learning Library
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Select a subject module to open audio-visual lessons, transcripts, and quizzes.
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="Filter subjects"
                  className="inline-flex flex-wrap gap-1 p-1 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  {(
                    [
                      { id: 'all', label: 'All Subjects' },
                      { id: 'science', label: 'Science' },
                      { id: 'math', label: 'Mathematics' },
                      { id: 'sign', label: 'Sign Language' },
                      { id: 'astronomy', label: 'Earth & Space' },
                    ] as const
                  ).map((tab) => {
                    const active = selectedSubjectFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedSubjectFilter(tab.id)}
                        className="px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                          color: active ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredSubjects.map((subject) => {
                  const subjectLessons = LESSONS.filter((l) => l.subjectId === subject.id);
                  const doneCount = subjectLessons.filter(
                    (l) => progressApi.progress.lessons[l.id]?.completed
                  ).length;

                  return (
                    <article
                      key={subject.id}
                      className="rounded-xl border overflow-hidden flex flex-col"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-hairline)',
                      }}
                    >
                      <div
                        className="aspect-[16/9] w-full overflow-hidden border-b relative"
                        style={{
                          backgroundColor: 'var(--bg-stage)',
                          borderColor: 'var(--border-hairline)',
                        }}
                      >
                        <img
                          src={subject.imagePath}
                          alt={subject.imageAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {subject.subtitle} · {doneCount}/{subjectLessons.length} Completed
                          </p>
                          <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                            {subject.title}
                          </h3>
                          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {subject.description}
                          </p>
                        </div>

                        {/* Lessons inside this subject */}
                        <div className="space-y-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                          {subjectLessons.map((lesson) => {
                            const rec = progressApi.progress.lessons[lesson.id];
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                                style={{
                                  backgroundColor: 'var(--bg-surface-alt)',
                                  borderColor: 'var(--border-hairline)',
                                }}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                    {lesson.numberLabel} · {lesson.level}
                                    {rec?.completed ? ' · Completed' : ''}
                                    {typeof rec?.bestQuizScore === 'number'
                                      ? ` · Quiz ${rec.bestQuizScore}%`
                                      : ''}
                                  </p>
                                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {lesson.title}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openLesson(lesson.id)}
                                  className="px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'var(--accent-on-primary)',
                                  }}
                                >
                                  {rec?.completed ? 'Review' : 'Open Lesson'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeView === 'lesson' && (
          <div className="space-y-6">
            {/* Breadcrumb & Lesson Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  speech.stop();
                  setActiveView('subjects');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Subjects
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {LESSONS.filter((l) => l.subjectId === activeLesson.subjectId).map((sibling) => (
                  <button
                    key={sibling.id}
                    type="button"
                    onClick={() => openLesson(sibling.id)}
                    className="px-3.5 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      backgroundColor:
                        sibling.id === activeLesson.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      borderColor:
                        sibling.id === activeLesson.id ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      color:
                        sibling.id === activeLesson.id ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {sibling.numberLabel}: {sibling.title}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {activeSubject.title} · {activeLesson.numberLabel} · {activeLesson.level}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 text-balance" style={{ color: 'var(--text-primary)' }}>
                {activeLesson.title}
              </h1>
              <p className="mt-1.5 text-base max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                {activeLesson.subtitle}
              </p>
            </div>

            {/* Synchronized Player (Visuals + Captions + Sign Language + Voice) */}
            <LessonPlayer
              lesson={activeLesson}
              subjectImage={activeSubject.imagePath}
              settings={settings}
              isCompleted={Boolean(progressApi.progress.lessons[activeLesson.id]?.completed)}
              currentTime={lessonTimeSec}
              onTimeChange={(sec) => {
                setLessonTimeSec(sec);
                progressApi.updateLessonPosition(activeLesson.id, sec);
              }}
              onToggleCaptions={() =>
                updateSettings(
                  { captionsEnabled: !settings.captionsEnabled },
                  `Closed captions ${!settings.captionsEnabled ? 'enabled' : 'disabled'}`
                )
              }
              onToggleSign={() =>
                updateSettings(
                  { signInterpreterEnabled: !settings.signInterpreterEnabled },
                  `Sign language interpreter ${!settings.signInterpreterEnabled ? 'shown' : 'hidden'}`
                )
              }
              onToggleTTS={() => {
                const next = !settings.ttsEnabled;
                if (!next) speech.stop();
                updateSettings({ ttsEnabled: next }, `Voice narration ${next ? 'enabled' : 'muted'}`);
              }}
              onMarkComplete={() => {
                progressApi.markLessonCompleted(activeLesson.id);
                announce(`Marked ${activeLesson.title} as complete`);
              }}
              speak={speech.speak}
              stopSpeech={speech.stop}
              announce={announce}
            />

            {/* Lesson Secondary Workspace Tabs */}
            <div
              role="tablist"
              aria-label="Lesson Study Tools"
              className="inline-flex flex-wrap gap-1 p-1 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              {(
                [
                  { id: 'transcript', label: 'Text Transcript' },
                  { id: 'notes', label: 'Accessible Reading Notes' },
                  { id: 'quiz', label: 'Interactive Quiz' },
                ] as const
              ).map((tab) => {
                const active = lessonTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setLessonTab(tab.id)}
                    className="px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                      color: active ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {lessonTab === 'transcript' && (
              <TranscriptPanel
                lesson={activeLesson}
                currentTime={lessonTimeSec}
                onSeekTo={(sec) => setLessonTimeSec(sec)}
                speak={speech.speak}
                stopSpeech={speech.stop}
                activeSpeechId={speech.activeId}
                ttsRate={settings.ttsRate}
                ttsVoiceURI={settings.ttsVoiceURI}
              />
            )}

            {lessonTab === 'notes' && (
              <section
                aria-label="Accessible Reading Notes"
                className="rounded-xl border p-5 sm:p-6 space-y-5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Learning Objectives & Structured Reading Notes
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {activeLesson.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  {activeLesson.readingSections.map((sec) => {
                    const speakingThis = speech.activeId === `note-${sec.id}`;
                    return (
                      <article
                        key={sec.id}
                        className="p-4 sm:p-5 rounded-xl border space-y-2.5"
                        style={{
                          backgroundColor: 'var(--bg-surface-alt)',
                          borderColor: 'var(--border-hairline)',
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            {sec.heading}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              if (speakingThis) {
                                speech.stop();
                              } else {
                                speech.speak(`${sec.heading}. ${sec.body}. Key takeaway: ${sec.keyTakeaway}`, {
                                  id: `note-${sec.id}`,
                                  rate: settings.ttsRate,
                                  voiceURI: settings.ttsVoiceURI,
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                            style={{
                              backgroundColor: speakingThis ? 'var(--accent-primary)' : 'var(--bg-surface)',
                              borderColor: 'var(--border-hairline)',
                              color: speakingThis ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                            }}
                          >
                            {speakingThis ? <Square className="w-3.5 h-3.5" aria-hidden="true" /> : <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />}
                            {speakingThis ? 'Stop' : 'Read Aloud'}
                          </button>
                        </div>
                        <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          {sec.body}
                        </p>
                        <p className="text-sm font-bold pt-1" style={{ color: 'var(--accent-primary)' }}>
                          Key Takeaway: {sec.keyTakeaway}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {lessonTab === 'quiz' && (
              <QuizEngine
                lessonId={activeLesson.id}
                lessonTitle={activeLesson.title}
                questions={activeLesson.quiz}
                bestScore={progressApi.progress.lessons[activeLesson.id]?.bestQuizScore}
                speak={speech.speak}
                stopSpeech={speech.stop}
                ttsRate={settings.ttsRate}
                ttsVoiceURI={settings.ttsVoiceURI}
                announce={announce}
                onQuizComplete={progressApi.recordQuizResult}
              />
            )}
          </div>
        )}

        {activeView === 'sign-studio' && (
          <SignStudio
            speak={speech.speak}
            ttsRate={settings.ttsRate}
            ttsVoiceURI={settings.ttsVoiceURI}
            reducedMotion={settings.reducedMotion}
            announce={announce}
          />
        )}

        {activeView === 'quiz-hub' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-balance" style={{ color: 'var(--text-primary)' }}>
                Interactive Knowledge Check Hub
              </h2>
              <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
                Select any subject lesson below to test your knowledge with audio-assisted questions and instant explanations.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <aside
                aria-label="Choose a Quiz Topic"
                className="lg:col-span-4 rounded-xl border p-4 space-y-2"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                {LESSONS.map((lesson) => {
                  const selected = lesson.id === quizHubLessonId;
                  const best = progressApi.progress.lessons[lesson.id]?.bestQuizScore;
                  const subj = SUBJECTS.find((s) => s.id === lesson.subjectId);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        speech.stop();
                        setQuizHubLessonId(lesson.id);
                      }}
                      className="w-full text-left p-3.5 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                        borderColor: selected ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      }}
                    >
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {subj?.title} · {typeof best === 'number' ? `Best ${best}%` : 'Not attempted'}
                      </p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {lesson.title}
                      </p>
                    </button>
                  );
                })}
              </aside>

              <div className="lg:col-span-8">
                {(() => {
                  const qLesson = LESSONS.find((l) => l.id === quizHubLessonId) ?? LESSONS[0];
                  return (
                    <QuizEngine
                      lessonId={qLesson.id}
                      lessonTitle={qLesson.title}
                      questions={qLesson.quiz}
                      bestScore={progressApi.progress.lessons[qLesson.id]?.bestQuizScore}
                      speak={speech.speak}
                      stopSpeech={speech.stop}
                      ttsRate={settings.ttsRate}
                      ttsVoiceURI={settings.ttsVoiceURI}
                      announce={announce}
                      onQuizComplete={progressApi.recordQuizResult}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeView === 'progress' && (
          <ProgressTracker
            progress={progressApi.progress}
            completedCount={progressApi.completedCount}
            totalLessons={progressApi.totalLessons}
            quizzesCompletedCount={progressApi.quizzesCompletedCount}
            averageQuizScore={progressApi.averageQuizScore}
            overallPercent={progressApi.overallPercent}
            onOpenLesson={(id) => openLesson(id)}
            onResetProgress={progressApi.resetProgress}
            speak={speech.speak}
            ttsRate={settings.ttsRate}
            ttsVoiceURI={settings.ttsVoiceURI}
            announce={announce}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer
        className="border-t mt-12"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="inline-flex items-center gap-2 font-semibold">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            ClarityLearn · Inclusive Multi-Sensory Curriculum
          </span>
          <span>
            Supports Screen Readers · Web Speech TTS · Closed Captions · ASL Sign Panels · High Contrast AAA
          </span>
        </div>
      </footer>

      <AccessibilityDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        voices={speech.voices}
        isSpeechSupported={speech.isSupported}
        onSetContrast={setContrastMode}
        onSetFontSize={setFontSize}
        onSetCaptionSize={setCaptionSize}
        onUpdateSettings={updateSettings}
        onReset={resetAccessibility}
        speak={speech.speak}
      />
    </div>
  );
}
