import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Contrast,
  Languages,
  Mic,
  MicOff,
  SlidersHorizontal,
  Sparkles,
  Square,
  User,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AccessibilityDrawer } from './components/AccessibilityDrawer';
import { AccessibilityModePage } from './components/AccessibilityModePage';
import { AITutorStudio } from './components/AITutorStudio';
import { AudioLearningPage } from './components/AudioLearningPage';
import { HomePage } from './components/HomePage';
import { LessonPlayer } from './components/LessonPlayer';
import { ProgressTracker } from './components/ProgressTracker';
import { QuizEngine } from './components/QuizEngine';
import { SignStudio } from './components/SignStudio';
import { StudentLoginPage } from './components/StudentLoginPage';
import { TranscriptPanel } from './components/TranscriptPanel';
import { LESSONS, SUBJECTS } from './data/curriculum';
import {
  getLocalizedLesson,
  getLocalizedSubject,
  hasBuiltInLessonTranslation,
} from './data/multilingualMaterials';
import { useAccessibility } from './hooks/useAccessibility';
import { useLearningProgress } from './hooks/useLearningProgress';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useStudentAuth } from './hooks/useStudentAuth';
import { useVoiceNavigation } from './hooks/useVoiceNavigation';
import { TRANSLATIONS } from './i18n/translations';
import { AccessibilityProfileMode, AppLanguage, Lesson, NavView, QuizQuestion, SubjectId } from './types';

export default function App() {
  const {
    settings,
    announcement,
    announce,
    setLanguage,
    setContrastMode,
    setFontSize,
    setCaptionSize,
    applyProfileMode,
    cycleFontSize,
    updateSettings,
    resetAccessibility,
  } = useAccessibility();

  const t = TRANSLATIONS[settings.language];
  const speech = useSpeechSynthesis();
  const auth = useStudentAuth();
  const progressApi = useLearningProgress(auth.authToken);

  const [activeView, setActiveView] = useState<NavView>('home');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | SubjectId>('all');
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [lessonTab, setLessonTab] = useState<'transcript' | 'notes' | 'quiz'>('transcript');
  const [lessonTimeSec, setLessonTimeSec] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quizHubLessonId, setQuizHubLessonId] = useState<string>(LESSONS[0].id);
  const [voiceCmdInput, setVoiceCmdInput] = useState('');

  // Server-translated lesson cache (lessonId::lang -> Lesson)
  const [translatedLessons, setTranslatedLessons] = useState<Record<string, Lesson>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  // AI-generated extra quiz questions per lesson
  const [aiQuizzes, setAiQuizzes] = useState<Record<string, QuizQuestion[]>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenError, setQuizGenError] = useState('');

  const baseLesson = useMemo(
    () => LESSONS.find((l) => l.id === activeLessonId) ?? LESSONS[0],
    [activeLessonId]
  );

  const activeLesson = useMemo(() => {
    const cacheKey = `${baseLesson.id}::${settings.language}`;
    if (settings.language !== 'en' && translatedLessons[cacheKey]) {
      return translatedLessons[cacheKey];
    }
    return getLocalizedLesson(baseLesson, settings.language);
  }, [baseLesson, settings.language, translatedLessons]);

  const activeSubject = useMemo(() => {
    const raw = SUBJECTS.find((s) => s.id === activeLesson.subjectId) ?? SUBJECTS[0];
    return getLocalizedSubject(raw, settings.language);
  }, [activeLesson.subjectId, settings.language]);

  const filteredSubjects = useMemo(() => {
    if (selectedSubjectFilter === 'all') return SUBJECTS;
    return SUBJECTS.filter((s) => s.id === selectedSubjectFilter);
  }, [selectedSubjectFilter]);

  const handleTranslateLesson = useCallback(
    async (lesson: Lesson, targetLang: AppLanguage) => {
      if (targetLang === 'en') return;
      const cacheKey = `${lesson.id}::${targetLang}`;
      if (translatedLessons[cacheKey]) return;

      setIsTranslating(true);
      setTranslateError('');
      try {
        const res = await fetch('/api/ai/translate-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            targetLanguage: targetLang,
            title: lesson.title,
            subtitle: lesson.subtitle,
            sections: lesson.readingSections,
            cues: lesson.cues.map((c) => ({ id: c.id, caption: c.caption })),
          }),
        });
        const data = (await res.json()) as {
          title?: string;
          subtitle?: string;
          sections?: Lesson['readingSections'];
          cues?: { id: string; caption: string }[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to translate lesson.');
        }

        const translatedLesson: Lesson = {
          ...lesson,
          title: data.title ?? lesson.title,
          subtitle: data.subtitle ?? lesson.subtitle,
          readingSections: data.sections ?? lesson.readingSections,
          cues: lesson.cues.map((orig) => {
            const matched = data.cues?.find((c) => c.id === orig.id);
            return matched ? { ...orig, caption: matched.caption } : orig;
          }),
        };
        setTranslatedLessons((prev) => ({ ...prev, [cacheKey]: translatedLesson }));
        announce(`Lesson translated to ${TRANSLATIONS[targetLang].nativeLabel}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Translation failed.';
        setTranslateError(msg);
      } finally {
        setIsTranslating(false);
      }
    },
    [translatedLessons, announce]
  );

  // Auto-translate via AI only if the lesson lacks built-in native Kannada/Hindi content
  useEffect(() => {
    if (
      settings.language !== 'en' &&
      !hasBuiltInLessonTranslation(baseLesson.id, settings.language) &&
      (activeView === 'lesson' || activeView === 'audio-learning')
    ) {
      handleTranslateLesson(baseLesson, settings.language);
    }
  }, [settings.language, activeView, baseLesson, handleTranslateLesson]);

  const handleGenerateAiQuiz = async (lesson: Lesson) => {
    setIsGeneratingQuiz(true);
    setQuizGenError('');
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: lesson.title,
          language: settings.language,
        }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok || !data.questions?.length) {
        throw new Error(data.error ?? 'Could not generate AI practice questions.');
      }
      setAiQuizzes((prev) => ({ ...prev, [lesson.id]: data.questions! }));
      announce(`Generated ${data.questions.length} AI quiz questions in ${TRANSLATIONS[settings.language].nativeLabel}`);
    } catch (err) {
      setQuizGenError(err instanceof Error ? err.message : 'AI quiz generation failed.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const navigateTo = useCallback(
    (view: NavView, spokenLabel?: string) => {
      speech.stop();
      setActiveView(view);
      if (spokenLabel) {
        announce(spokenLabel);
      }
      window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
    },
    [speech, announce, settings.reducedMotion]
  );

  const openLesson = useCallback(
    (lessonId: string, initialTab: 'transcript' | 'notes' | 'quiz' = 'transcript') => {
      speech.stop();
      setActiveLessonId(lessonId);
      setLessonTab(initialTab);
      setLessonTimeSec(0);
      setActiveView('lesson');
      const target = LESSONS.find((l) => l.id === lessonId);
      if (target) {
        announce(`Opened video lesson with subtitles: ${target.title}`);
      }
      window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
    },
    [speech, announce, settings.reducedMotion]
  );

  const handleSelectModeAndGo = useCallback(
    (mode: AccessibilityProfileMode, targetView: NavView) => {
      applyProfileMode(mode);
      auth.updatePreferredMode(mode);
      navigateTo(targetView);
    },
    [applyProfileMode, auth, navigateTo]
  );

  const readCurrentPageSummary = useCallback(() => {
    const lang = settings.language;
    const summaryMap: Record<NavView, string> =
      lang === 'kn'
        ? {
            home: `${t.heroTitle}. ${t.heroSubtitle}`,
            login: `ವಿದ್ಯಾರ್ಥಿ ಲಾಗಿನ್ ಪುಟ. ನಿಮ್ಮ ಹೆಸರು, ವಿದ್ಯಾರ್ಥಿ ಗುರುತಿನ ಸಂಖ್ಯೆ ಮತ್ತು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಪ್ರವೇಶಿಸಿ.`,
            'mode-select': `${t.modeSelectTitle}. ${t.visualModeTitle} ಅಥವಾ ${t.hearingModeTitle} ಆಯ್ಕೆ ಮಾಡಿ.`,
            materials: `${t.materialsTitle}. ${SUBJECTS.length} ವಿಷಯಗಳು ಮತ್ತು ${LESSONS.length} ಪಾಠಗಳು ಲಭ್ಯವಿವೆ.`,
            'audio-learning': `${t.audioStudioTitle}. ಮಾತನಾಡುವ ಅಧ್ಯಾಯಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ.`,
            lesson: `${activeLesson.title}. ${activeLesson.subtitle}`,
            'sign-studio': `ಸಂಜ್ಞೆ ಭಾಷಾ ಸ್ಟುಡಿಯೋ. ಪದಗಳು ಮತ್ತು ಅಕ್ಷರಗಳ ಸಂಜ್ಞೆ ಅಭ್ಯಾಸ.`,
            'ai-tutor': `${t.askMicHeading}. ${t.askMicSub}`,
            'quiz-hub': `${t.quizHubTitle}.`,
            progress: `${t.progressTitle}. ಒಟ್ಟು ${progressApi.totalLessons} ಪಾಠಗಳಲ್ಲಿ ${progressApi.completedCount} ಪಾಠಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ.`,
          }
        : lang === 'hi'
        ? {
            home: `${t.heroTitle}. ${t.heroSubtitle}`,
            login: `छात्र लॉगिन पृष्ठ। अपना नाम, छात्र आईडी और भाषा चुनकर साइन इन करें।`,
            'mode-select': `${t.modeSelectTitle}. ${t.visualModeTitle} या ${t.hearingModeTitle} चुनें।`,
            materials: `${t.materialsTitle}. ${SUBJECTS.length} विषय और ${LESSONS.length} पाठ उपलब्ध हैं।`,
            'audio-learning': `${t.audioStudioTitle}. बोले गए अध्यायों को हिन्दी में सुनें।`,
            lesson: `${activeLesson.title}. ${activeLesson.subtitle}`,
            'sign-studio': `सांकेतिक भाषा स्टूडियो। शब्दों और अक्षरों के संकेत का अभ्यास करें।`,
            'ai-tutor': `${t.askMicHeading}. ${t.askMicSub}`,
            'quiz-hub': `${t.quizHubTitle}.`,
            progress: `${t.progressTitle}. कुल ${progressApi.totalLessons} पाठों में से ${progressApi.completedCount} पाठ पूरे हुए हैं।`,
          }
        : {
            home: `${t.heroTitle}. ${t.heroSubtitle}`,
            login: `Student Login page. Sign in with your name, student ID, and language.`,
            'mode-select': `${t.modeSelectTitle}. ${t.visualModeTitle} or ${t.hearingModeTitle}.`,
            materials: `${t.materialsTitle}. ${SUBJECTS.length} subjects with ${LESSONS.length} lessons.`,
            'audio-learning': `${t.audioStudioTitle}. Listen to spoken chapters.`,
            lesson: `${activeLesson.title}. ${activeLesson.subtitle}`,
            'sign-studio': `Sign Language Studio. ASL vocabulary and A to Z fingerspelling.`,
            'ai-tutor': `${t.askMicHeading}. ${t.askMicSub}`,
            'quiz-hub': `${t.quizHubTitle}.`,
            progress: `${t.progressTitle}. ${progressApi.completedCount} of ${progressApi.totalLessons} lessons completed.`,
          };
    speech.speak(summaryMap[activeView], {
      id: 'quick-page-summary',
      rate: settings.ttsRate,
      voiceURI: settings.ttsVoiceURI,
      language: settings.language,
    });
  }, [
    activeView,
    activeLesson.title,
    activeLesson.subtitle,
    progressApi.completedCount,
    progressApi.totalLessons,
    speech,
    settings.ttsRate,
    settings.ttsVoiceURI,
    settings.language,
    t,
  ]);

  // Voice Command Handler
  const handleVoiceCommand = useCallback(
    (rawPhrase: string): string => {
      const cmd = rawPhrase.toLowerCase();

      if (cmd.includes('stop') || cmd.includes('quiet') || cmd.includes('mute')) {
        speech.stop();
        announce('Audio stopped');
        return 'Executed: Stopped speech audio';
      }
      if (cmd.includes('kannada') || cmd.includes('ಕನ್ನಡ')) {
        setLanguage('kn');
        auth.updatePreferredLanguage('kn');
        return 'Executed: Switched language to ಕನ್ನಡ (Kannada)';
      }
      if (cmd.includes('hindi') || cmd.includes('हिन्दी')) {
        setLanguage('hi');
        auth.updatePreferredLanguage('hi');
        return 'Executed: Switched language to हिन्दी (Hindi)';
      }
      if (cmd.includes('english')) {
        setLanguage('en');
        auth.updatePreferredLanguage('en');
        return 'Executed: Switched language to English';
      }
      if (cmd.includes('tutor') || cmd.includes('ask') || cmd.includes('ai')) {
        navigateTo('ai-tutor', 'Opened AI Voice Tutor');
        return 'Executed: Opened Ask & Hear AI Tutor';
      }
      if (cmd.includes('visual')) {
        applyProfileMode('visual');
        auth.updatePreferredMode('visual');
        navigateTo('audio-learning');
        return 'Executed: Activated Visual Impairment Mode → Audio Learning';
      }
      if (cmd.includes('hearing')) {
        applyProfileMode('hearing');
        auth.updatePreferredMode('hearing');
        navigateTo('lesson');
        return 'Executed: Activated Hearing Impairment Mode → Video With Subtitles';
      }
      if (cmd.includes('home')) {
        navigateTo('home', 'Navigated to Home page');
        return 'Executed: Opened Home page';
      }
      if (cmd.includes('login') || cmd.includes('sign in') || cmd.includes('profile')) {
        navigateTo('login', 'Navigated to Student Login');
        return 'Executed: Opened Student Login';
      }
      if (cmd.includes('mode')) {
        navigateTo('mode-select', 'Navigated to Select Accessibility Mode');
        return 'Executed: Opened Select Accessibility Mode';
      }
      if (cmd.includes('audio') || cmd.includes('listen')) {
        navigateTo('audio-learning', 'Navigated to Audio Learning Studio');
        return 'Executed: Opened Audio Learning';
      }
      if (cmd.includes('video') || cmd.includes('subtitle') || cmd.includes('caption')) {
        navigateTo('lesson', 'Navigated to Video Lesson With Subtitles');
        return 'Executed: Opened Video With Subtitles';
      }
      if (cmd.includes('material') || cmd.includes('subject') || cmd.includes('lesson')) {
        navigateTo('materials', 'Navigated to Learning Materials');
        return 'Executed: Opened Learning Materials';
      }
      if (cmd.includes('sign') || cmd.includes('fingerspell')) {
        navigateTo('sign-studio', 'Navigated to Sign Language Studio');
        return 'Executed: Opened Sign Language Studio';
      }
      if (cmd.includes('quiz') || cmd.includes('assessment') || cmd.includes('test')) {
        navigateTo('quiz-hub', 'Navigated to Quiz and Assessment Hub');
        return 'Executed: Opened Quiz Hub';
      }
      if (cmd.includes('progress') || cmd.includes('score') || cmd.includes('tracker')) {
        navigateTo('progress', 'Navigated to Progress Tracker');
        return 'Executed: Opened Progress Tracker';
      }
      if (cmd.includes('contrast') || cmd.includes('dark')) {
        const order = ['standard', 'hc-dark', 'hc-light'] as const;
        const next = order[(order.indexOf(settings.contrastMode) + 1) % order.length];
        setContrastMode(next);
        return `Executed: Switched contrast to ${next}`;
      }
      if (cmd.includes('bigger') || cmd.includes('larger') || cmd.includes('increase')) {
        cycleFontSize('up');
        return 'Executed: Increased font size';
      }
      if (cmd.includes('smaller') || cmd.includes('decrease')) {
        cycleFontSize('down');
        return 'Executed: Decreased font size';
      }
      if (cmd.includes('read') || cmd.includes('speak') || cmd.includes('summary')) {
        readCurrentPageSummary();
        return 'Executed: Reading current page summary';
      }
      if (cmd.includes('help') || cmd.includes('command')) {
        const helpSpeech =
          settings.language === 'kn'
            ? 'ಲಭ್ಯವಿರುವ ಧ್ವನಿ ಆಜ್ಞೆಗಳು: ಹೋಮ್, ಪಠ್ಯ ಸಾಮಗ್ರಿ, ಆಡಿಯೋ, ಉಪಶೀರ್ಷಿಕೆಗಳು, ಎಐ ಬೋಧಕ, ರಸಪ್ರಶ್ನೆ, ಕನ್ನಡ, ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್, ದೃಷ್ಟಿ ವಿಧಾನ, ಶ್ರವಣ ವಿಧಾನ, ಪುಟ ಓದಿ.'
            : settings.language === 'hi'
            ? 'उपलब्ध आवाज़ निर्देश: होम, अध्ययन सामग्री, ऑडियो, उपशीर्षक, एआई ट्यूटर, क्विज़, कन्नड़, हिन्दी, अंग्रेज़ी, दृष्टि मोड, श्रवण मोड, पृष्ठ पढ़ें।'
            : 'Commands: Home, Materials, Audio, Subtitles, AI Tutor, Quiz, Kannada, Hindi, English, Visual Mode, Hearing Mode, High Contrast, Read Page.';
        speech.speak(helpSpeech, { rate: settings.ttsRate, language: settings.language });
        return 'Listed available voice commands aloud';
      }

      announce(`Command not recognized: ${rawPhrase}`);
      return `Unrecognized command "${rawPhrase}". Try "AI Tutor", "Kannada", "Hindi", "Audio", or "Quiz".`;
    },
    [
      speech,
      announce,
      setLanguage,
      auth,
      applyProfileMode,
      navigateTo,
      settings.contrastMode,
      settings.ttsRate,
      settings.language,
      setContrastMode,
      cycleFontSize,
      readCurrentPageSummary,
    ]
  );

  const voiceNav = useVoiceNavigation(handleVoiceCommand);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '1') {
        e.preventDefault();
        navigateTo('home');
      } else if (e.key === '2') {
        e.preventDefault();
        navigateTo('materials');
      } else if (e.key === '3') {
        e.preventDefault();
        navigateTo('audio-learning');
      } else if (e.key === '4') {
        e.preventDefault();
        navigateTo('ai-tutor');
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigateTo]);

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

  const navLinks: { id: NavView; label: string }[] = [
    { id: 'home', label: t.navHome },
    { id: 'materials', label: t.navMaterials },
    { id: 'audio-learning', label: t.navAudio },
    { id: 'lesson', label: t.navSubtitles },
    { id: 'ai-tutor', label: t.navAiTutor },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

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
          <button
            type="button"
            onClick={() => navigateTo('home', 'Navigated to Home')}
            className="text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 cursor-pointer text-left"
            style={{ color: 'var(--text-primary)' }}
          >
            ClarityLearn
          </button>

          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {navLinks.map((item) => {
              const isCurrent = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id, `Navigated to ${item.label}`)}
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

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('login', 'Navigated to Student Login')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
              }}
            >
              <User className="w-4 h-4" aria-hidden="true" />
              {auth.student ? auth.student.name.split(' ')[0] : t.studentLogin}
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden flex items-center justify-around border-t px-2 py-2 text-xs font-semibold overflow-x-auto"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          {navLinks.map((item) => {
            const isCurrent = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
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

      {/* Secondary Sensory, Language & Voice Navigation Bar */}
      <section
        aria-label="Language, Sensory Controls and Voice Navigation"
        className="border-b"
        style={{
          backgroundColor: 'var(--bg-surface-alt)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Multilingual Selector: English | ಕನ್ನಡ | हिन्दी */}
            <div
              role="group"
              aria-label="App Language"
              className="inline-flex items-center rounded-lg border p-0.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <Languages className="w-3.5 h-3.5 mx-1.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              {(
                [
                  { id: 'en', label: 'EN' },
                  { id: 'kn', label: 'ಕನ್ನಡ' },
                  { id: 'hi', label: 'हिन्दी' },
                ] as const
              ).map((langOpt) => {
                const active = settings.language === langOpt.id;
                return (
                  <button
                    key={langOpt.id}
                    type="button"
                    onClick={() => {
                      setLanguage(langOpt.id);
                      auth.updatePreferredLanguage(langOpt.id);
                    }}
                    aria-pressed={active}
                    className="px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer"
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

            <button
              type="button"
              onClick={() => navigateTo('mode-select')}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: activeView === 'mode-select' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: activeView === 'mode-select' ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              Mode: {settings.profileMode === 'visual' ? 'Visual' : settings.profileMode === 'hearing' ? 'Hearing' : 'Balanced'}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('quiz-hub')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: activeView === 'quiz-hub' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: activeView === 'quiz-hub' ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              Quizzes
            </button>

            <button
              type="button"
              onClick={() => navigateTo('sign-studio')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: activeView === 'sign-studio' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: activeView === 'sign-studio' ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              Sign Studio
            </button>

            <button
              type="button"
              onClick={() => navigateTo('progress')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
              style={{
                backgroundColor: activeView === 'progress' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: activeView === 'progress' ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              Progress ({progressApi.overallPercent}%)
            </button>

            <button
              type="button"
              onClick={cycleContrast}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
              {contrastLabel}
            </button>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => cycleFontSize('down')}
                aria-label="Decrease font size"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                A-
              </button>
              <button
                type="button"
                onClick={() => cycleFontSize('up')}
                aria-label="Increase font size"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
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
                if (voiceNav.isListening) {
                  voiceNav.stopListening();
                } else {
                  voiceNav.startListening();
                }
              }}
              aria-pressed={voiceNav.isListening}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: voiceNav.isListening ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: voiceNav.isListening ? 'var(--accent-primary)' : 'var(--border-hairline)',
                color: voiceNav.isListening ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              {voiceNav.isListening ? <MicOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Mic className="w-3.5 h-3.5" aria-hidden="true" />}
              {voiceNav.isListening ? t.stopListening : t.voiceNav}
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!voiceCmdInput.trim()) return;
                voiceNav.executeCommandText(voiceCmdInput);
                setVoiceCmdInput('');
              }}
              className="hidden sm:flex items-center gap-1"
            >
              <label htmlFor="voice-command-input" className="sr-only">
                Type a voice navigation command
              </label>
              <input
                id="voice-command-input"
                type="text"
                value={voiceCmdInput}
                onChange={(e) => setVoiceCmdInput(e.target.value)}
                placeholder='Say or type: "AI Tutor", "Kannada"...'
                className="w-48 px-2.5 py-1.5 rounded-lg border text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              />
            </form>

            <button
              type="button"
              onClick={() => {
                if (speech.isSpeaking) {
                  speech.stop();
                } else {
                  readCurrentPageSummary();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: speech.isSpeaking ? 'var(--accent-primary)' : 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: speech.isSpeaking ? 'var(--accent-on-primary)' : 'var(--text-primary)',
              }}
            >
              {speech.isSpeaking ? <Square className="w-3.5 h-3.5" aria-hidden="true" /> : <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />}
              {speech.isSpeaking ? t.stopAudio : t.readPage}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open full accessibility settings"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              Settings
            </button>
          </div>
        </div>

        {(voiceNav.statusMessage || voiceNav.lastTranscript) && (
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 pb-2 text-xs font-medium flex flex-wrap items-center gap-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            {voiceNav.lastTranscript && (
              <span>
                Last Voice Command: <strong style={{ color: 'var(--text-primary)' }}>"{voiceNav.lastTranscript}"</strong>
              </span>
            )}
            {voiceNav.statusMessage && <span>{voiceNav.statusMessage}</span>}
          </div>
        )}
      </section>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 focus:outline-none">
        {activeView === 'home' && (
          <HomePage
            student={auth.student}
            language={settings.language}
            activeProfileMode={settings.profileMode}
            completedCount={progressApi.completedCount}
            totalLessons={progressApi.totalLessons}
            overallPercent={progressApi.overallPercent}
            onNavigate={(view) => navigateTo(view)}
            onSelectModeAndGo={handleSelectModeAndGo}
            speak={(text) =>
              speech.speak(text, {
                id: 'home-intro',
                rate: settings.ttsRate,
                voiceURI: settings.ttsVoiceURI,
                language: settings.language,
              })
            }
          />
        )}

        {activeView === 'login' && (
          <StudentLoginPage
            student={auth.student}
            currentMode={settings.profileMode}
            currentLanguage={settings.language}
            onLogin={auth.login}
            onLogout={auth.logout}
            onApplyMode={applyProfileMode}
            onSetLanguage={setLanguage}
            onHydrateProgress={progressApi.hydrateFromServer}
            onNavigate={(view) => navigateTo(view)}
            speak={(text) =>
              speech.speak(text, {
                id: 'login-help',
                rate: settings.ttsRate,
                voiceURI: settings.ttsVoiceURI,
                language: settings.language,
              })
            }
            announce={announce}
          />
        )}

        {activeView === 'mode-select' && (
          <AccessibilityModePage
            currentMode={settings.profileMode}
            language={settings.language}
            onSelectMode={(mode) => {
              applyProfileMode(mode);
              auth.updatePreferredMode(mode);
            }}
            onNavigate={(view) => navigateTo(view)}
            speak={(text) =>
              speech.speak(text, {
                id: 'mode-options',
                rate: settings.ttsRate,
                voiceURI: settings.ttsVoiceURI,
                language: settings.language,
              })
            }
          />
        )}

        {activeView === 'ai-tutor' && (
          <AITutorStudio
            settings={settings}
            onChangeLanguage={(lang) => {
              setLanguage(lang);
              auth.updatePreferredLanguage(lang);
            }}
            speak={speech.speak}
            playBase64Audio={speech.playBase64Audio}
            stopSpeech={speech.stop}
            isSpeaking={speech.isSpeaking}
            announce={announce}
          />
        )}

        {activeView === 'audio-learning' && (
          <AudioLearningPage
            initialLessonId={activeLessonId}
            settings={settings}
            completedLessons={progressApi.progress.lessons}
            translatedLessons={translatedLessons}
            isTranslating={isTranslating}
            onTranslateLesson={handleTranslateLesson}
            onMarkComplete={progressApi.markLessonCompleted}
            onUpdateRate={(rate) => updateSettings({ ttsRate: rate })}
            speak={speech.speak}
            stopSpeech={speech.stop}
            isSpeaking={speech.isSpeaking}
            activeSpeechId={speech.activeId}
            announce={announce}
            onOpenQuiz={(lessonId) => {
              setQuizHubLessonId(lessonId);
              navigateTo('quiz-hub', 'Opened quiz for selected audio lesson');
            }}
          />
        )}

        {activeView === 'materials' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-balance" style={{ color: 'var(--text-primary)' }}>
                  {t.materialsTitle}
                </h1>
                <p className="mt-1 text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                  Explore subject-wise lessons with visual diagrams, audio chapters, and video lessons with closed captions in English, Kannada, or Hindi.
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
                    { id: 'languages', label: 'Languages (KN · EN · HI)' },
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

            <div className="grid md:grid-cols-2 gap-6">
              {filteredSubjects.map((rawSubject) => {
                const subject = getLocalizedSubject(rawSubject, settings.language);
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
                        <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {subject.title}
                        </h2>
                        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {subject.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                        {subjectLessons.map((rawLesson) => {
                          const lesson = getLocalizedLesson(rawLesson, settings.language);
                          const rec = progressApi.progress.lessons[lesson.id];
                          return (
                            <div
                              key={lesson.id}
                              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border"
                              style={{
                                backgroundColor: 'var(--bg-surface-alt)',
                                borderColor: 'var(--border-hairline)',
                              }}
                            >
                              <div className="min-w-0 flex-1">
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

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openLesson(lesson.id)}
                                  className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'var(--accent-on-primary)',
                                  }}
                                >
                                  Video + Subtitles
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveLessonId(lesson.id);
                                    navigateTo('audio-learning', `Opened audio lesson ${lesson.title}`);
                                  }}
                                  className="px-3 py-2 rounded-lg border text-xs font-bold whitespace-nowrap cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor: 'var(--border-hairline)',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  Audio
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'lesson' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigateTo('materials', 'Returned to Learning Materials')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Materials
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {LESSONS.map((rawItem) => {
                  const item = getLocalizedLesson(rawItem, settings.language);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openLesson(item.id)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      style={{
                        backgroundColor:
                          item.id === baseLesson.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        borderColor:
                          item.id === baseLesson.id ? 'var(--accent-primary)' : 'var(--border-hairline)',
                        color:
                          item.id === baseLesson.id ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-xl border p-5 sm:p-6 flex flex-wrap items-start justify-between gap-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                  {activeSubject.title} · {activeLesson.numberLabel} · {t.nativeLabel}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 text-balance" style={{ color: 'var(--text-primary)' }}>
                  {activeLesson.title}
                </h1>
                <p className="mt-1.5 text-base max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                  {activeLesson.subtitle}
                </p>
                {translateError && (
                  <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--error-text)' }}>
                    {translateError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {settings.language !== 'en' && (
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => handleTranslateLesson(baseLesson, settings.language)}
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

                <button
                  type="button"
                  onClick={() => navigateTo('ai-tutor')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Mic className="w-4 h-4" aria-hidden="true" />
                  Ask AI About This Lesson
                </button>
              </div>
            </div>

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
                  `Video subtitles ${!settings.captionsEnabled ? 'enabled' : 'disabled'}`
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
              speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
              stopSpeech={speech.stop}
              announce={announce}
            />

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
                  { id: 'notes', label: 'Visual Diagram & Reading Notes' },
                  { id: 'quiz', label: 'Lesson Quiz' },
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
                speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
                stopSpeech={speech.stop}
                activeSpeechId={speech.activeId}
                ttsRate={settings.ttsRate}
                ttsVoiceURI={settings.ttsVoiceURI}
              />
            )}

            {lessonTab === 'notes' && (
              <section
                aria-label="Visual Diagrams and Reading Notes"
                className="rounded-xl border p-5 sm:p-6 space-y-6"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="grid lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-hairline)' }}>
                    <img
                      src={activeSubject.imagePath}
                      alt={activeSubject.imageAlt}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="lg:col-span-7 space-y-3">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Visual Diagram Description & Objectives
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {activeSubject.imageAlt}
                    </p>
                    <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {activeLesson.objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                                speech.speak(`${sec.heading}. ${sec.body}. ${sec.keyTakeaway}`, {
                                  id: `note-${sec.id}`,
                                  rate: settings.ttsRate,
                                  voiceURI: settings.ttsVoiceURI,
                                  language: settings.language,
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
                language={settings.language}
                questions={aiQuizzes[activeLesson.id] ?? activeLesson.quiz}
                bestScore={progressApi.progress.lessons[activeLesson.id]?.bestQuizScore}
                speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
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
            speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
            ttsRate={settings.ttsRate}
            ttsVoiceURI={settings.ttsVoiceURI}
            reducedMotion={settings.reducedMotion}
            announce={announce}
          />
        )}

        {activeView === 'quiz-hub' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-balance" style={{ color: 'var(--text-primary)' }}>
                  {t.quizHubTitle}
                </h1>
                <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
                  Assess your understanding with audio-supported questions or generate fresh AI practice questions in {t.nativeLabel}.
                </p>
              </div>

              <button
                type="button"
                disabled={isGeneratingQuiz}
                onClick={() => {
                  const target = LESSONS.find((l) => l.id === quizHubLessonId) ?? LESSONS[0];
                  handleGenerateAiQuiz(target);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }}
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {isGeneratingQuiz ? 'Generating...' : `${t.generateAiQuizBtn} (${t.nativeLabel})`}
              </button>
            </div>

            {quizGenError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg border text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--error-bg)',
                  borderColor: 'var(--error-border)',
                  color: 'var(--error-text)',
                }}
              >
                {quizGenError}
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <aside
                aria-label="Choose a Quiz Topic"
                className="lg:col-span-4 rounded-xl border p-4 space-y-2"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                {LESSONS.map((rawLesson) => {
                  const lesson = getLocalizedLesson(rawLesson, settings.language);
                  const selected = lesson.id === quizHubLessonId;
                  const best = progressApi.progress.lessons[lesson.id]?.bestQuizScore;
                  const rawSubj = SUBJECTS.find((s) => s.id === lesson.subjectId);
                  const subj = rawSubj ? getLocalizedSubject(rawSubj, settings.language) : undefined;
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
                        {aiQuizzes[lesson.id] ? ' · AI Questions Ready' : ''}
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
                  const rawQLesson = LESSONS.find((l) => l.id === quizHubLessonId) ?? LESSONS[0];
                  const qLesson = getLocalizedLesson(rawQLesson, settings.language);
                  const activeQuestions = aiQuizzes[qLesson.id] ?? qLesson.quiz;
                  return (
                    <QuizEngine
                      lessonId={qLesson.id}
                      lessonTitle={qLesson.title}
                      language={settings.language}
                      questions={activeQuestions}
                      bestScore={progressApi.progress.lessons[qLesson.id]?.bestQuizScore}
                      speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
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
            student={auth.student}
            profileMode={settings.profileMode}
            language={settings.language}
            progress={progressApi.progress}
            completedCount={progressApi.completedCount}
            totalLessons={progressApi.totalLessons}
            quizzesCompletedCount={progressApi.quizzesCompletedCount}
            averageQuizScore={progressApi.averageQuizScore}
            overallPercent={progressApi.overallPercent}
            onOpenLesson={(id) => openLesson(id)}
            onResetProgress={progressApi.resetProgress}
            speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
            ttsRate={settings.ttsRate}
            ttsVoiceURI={settings.ttsVoiceURI}
            announce={announce}
          />
        )}
      </main>

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
            ClarityLearn · Inclusive Learning Content Tool
          </span>
          <span>
            English · ಕನ್ನಡ (Kannada) · हिन्दी (Hindi) · Microphone Ask & Hear · Video Subtitles · Sign Studio
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
        speak={(text, opts) => speech.speak(text, { ...opts, language: settings.language })}
      />
    </div>
  );
}
