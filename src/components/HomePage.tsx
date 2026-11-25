import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Captions,
  CheckCircle2,
  Ear,
  Eye,
  Hand,
  Headphones,
  LogIn,
  Mic,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { LESSONS, SUBJECTS } from '../data/curriculum';
import { TRANSLATIONS } from '../i18n/translations';
import { AccessibilityProfileMode, AppLanguage, NavView, StudentProfile } from '../types';

interface HomePageProps {
  student: StudentProfile | null;
  language: AppLanguage;
  activeProfileMode: AccessibilityProfileMode;
  completedCount: number;
  totalLessons: number;
  overallPercent: number;
  onNavigate: (view: NavView) => void;
  onSelectModeAndGo: (mode: AccessibilityProfileMode, targetView: NavView) => void;
  speak: (text: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  student,
  language,
  activeProfileMode,
  completedCount,
  overallPercent,
  onNavigate,
  onSelectModeAndGo,
  speak,
}) => {
  const t = TRANSLATIONS[language];

  const modeDisplay =
    activeProfileMode === 'visual'
      ? t.visualModeTitle
      : activeProfileMode === 'hearing'
      ? t.hearingModeTitle
      : t.balancedModeTitle;

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section
        aria-labelledby="home-hero-title"
        className="rounded-xl border p-6 sm:p-10"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
              {t.nativeLabel} · {modeDisplay}
            </p>
            <h1
              id="home-hero-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-base sm:text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {student ? `${student.name} — ` : ''}
              {t.heroSubtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('mode-select')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }}
              >
                {t.selectModeBtn}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ai-tutor')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                {t.navAiTutor}
              </button>

              <button
                type="button"
                onClick={() => speak(`${t.heroTitle}. ${t.heroSubtitle}`)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                {t.listenIntroBtn}
              </button>
            </div>
          </div>

          {/* Right: Direct Mode Launch Panel */}
          <div className="lg:col-span-5 grid gap-3">
            <button
              type="button"
              onClick={() => onSelectModeAndGo('visual', 'audio-learning')}
              className="text-left p-5 rounded-xl border-2 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: activeProfileMode === 'visual' ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  <Eye className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                  {t.visualModeTitle}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t.visualModeDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectModeAndGo('hearing', 'lesson')}
              className="text-left p-5 rounded-xl border-2 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: activeProfileMode === 'hearing' ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  <Ear className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                  {t.hearingModeTitle}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t.hearingModeDesc}
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Working Process Section */}
      <section aria-labelledby="workflow-heading" className="space-y-4">
        <div>
          <h2 id="workflow-heading" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t.workflowHeading}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01. Student Profile',
              title: t.studentLogin,
              desc: 'Sign in with your student ID and language (English, Kannada, Hindi) to sync progress.',
              actionLabel: student ? 'View Profile' : t.studentLogin,
              view: 'login' as NavView,
              icon: LogIn,
            },
            {
              step: '02. Choose Mode',
              title: t.modeSelectTitle,
              desc: 'Pick Visual Impairment, Hearing Impairment, or Balanced mode.',
              actionLabel: t.selectModeBtn,
              view: 'mode-select' as NavView,
              icon: Eye,
            },
            {
              step: '03. Ask & Learn',
              title: t.navAiTutor,
              desc: 'Use the microphone to ask doubts and hear spoken explanations in Kannada, Hindi, or English.',
              actionLabel: t.navAiTutor,
              view: 'ai-tutor' as NavView,
              icon: Mic,
            },
            {
              step: '04. Assess Mastery',
              title: t.quizHubTitle,
              desc: 'Complete accessible quizzes with spoken questions and track mastery.',
              actionLabel: `Quizzes · ${overallPercent}%`,
              view: 'quiz-hub' as NavView,
              icon: TrendingUp,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-xl border p-5 flex flex-col justify-between gap-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {item.step}
                    </span>
                    <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate(item.view)}
                  className="w-full py-2.5 px-3 rounded-lg border text-xs font-bold text-center cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Pages & Features Grid */}
      <section aria-labelledby="destinations-heading" className="space-y-4">
        <div>
          <h2 id="destinations-heading" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t.destinationsHeading}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {SUBJECTS.length} subjects · {LESSONS.length} multi-sensory lessons · {completedCount} completed
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: t.askMicHeading,
              desc: t.askMicSub,
              view: 'ai-tutor' as NavView,
              icon: Mic,
            },
            {
              title: t.audioStudioTitle,
              desc: 'Converts written study materials into continuous spoken audio lessons in English, Kannada, or Hindi.',
              view: 'audio-learning' as NavView,
              icon: Headphones,
            },
            {
              title: 'Video Lessons With Subtitles',
              desc: 'Animated visual diagrams paired with large closed captions, AI lesson translation, and transcripts.',
              view: 'lesson' as NavView,
              icon: Captions,
            },
            {
              title: 'Sign Language Studio',
              desc: 'Sign language vocabulary demonstrations and A–Z fingerspelling sequence player.',
              view: 'sign-studio' as NavView,
              icon: Hand,
            },
            {
              title: t.materialsTitle,
              desc: 'Browse all Science, Mathematics, Sign Language, and Earth & Space chapters with diagrams.',
              view: 'materials' as NavView,
              icon: BookOpen,
            },
            {
              title: t.quizHubTitle,
              desc: 'Interactive multiple-choice assessments plus AI practice question generation.',
              view: 'quiz-hub' as NavView,
              icon: CheckCircle2,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => onNavigate(card.view)}
                className="text-left rounded-xl border p-5 transition-colors cursor-pointer flex flex-col justify-between gap-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-sm mt-2 leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {card.desc}
                  </p>
                </div>
                <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                  Open Section <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
