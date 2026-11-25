import React from 'react';
import { ArrowRight, Captions, CheckCircle2, Ear, Eye, Hand, Headphones, Mic, Sliders, Volume2 } from 'lucide-react';
import { AccessibilityProfileMode, AppLanguage, NavView } from '../types';

interface AccessibilityModePageProps {
  language?: AppLanguage;
  currentMode: AccessibilityProfileMode;
  onSelectMode: (mode: AccessibilityProfileMode) => void;
  onNavigate: (view: NavView) => void;
  speak: (text: string) => void;
}

export const AccessibilityModePage: React.FC<AccessibilityModePageProps> = ({
  language = 'en',
  currentMode,
  onSelectMode,
  onNavigate,
  speak,
}) => {
  const modes = [
    {
      id: 'visual' as const,
      title: 'Visual Impairment Mode',
      subtitle: 'Audio Lessons · Text-to-Speech · Voice Navigation · High Contrast',
      icon: Eye,
      features: [
        'Activates continuous Audio Learning studio for spoken study chapters',
        'Enables Web Speech Text-to-Speech across lessons, notes, and quizzes',
        'Raises font size (19px+), extra line spacing, and High Contrast Dark mode',
        'Pairs seamlessly with Voice Navigation commands (microphone or keyboard)',
      ],
      launchLabel: 'Open Audio Learning',
      launchView: 'audio-learning' as NavView,
    },
    {
      id: 'hearing' as const,
      title: 'Hearing Impairment Mode',
      subtitle: 'Video Subtitles · Sign Language Videos · Text Lessons · Visual Diagrams',
      icon: Ear,
      features: [
        'Turns on Extra-Large Closed Captions (Subtitles) on all video lessons',
        'Displays the synchronized Sign Language Interpreter window',
        'Opens searchable time-synced Text Transcripts and written study notes',
        'Highlights animated visual diagrams, waveforms, and orbital charts',
      ],
      launchLabel: 'Open Video With Subtitles',
      launchView: 'lesson' as NavView,
    },
    {
      id: 'balanced' as const,
      title: 'Balanced Multi-Sensory Mode',
      subtitle: 'Combined Audio, Visual, Captions & Sign Support',
      icon: Sliders,
      features: [
        'Keeps both Voice Narration and Closed Captions active side by side',
        'Provides Sign Language Interpreter panel and full Text Transcripts',
        'Uses Standard Calm Light contrast and 16px Atkinson Hyperlegible text',
        'Ideal for classrooms, shared study groups, or mixed sensory preferences',
      ],
      launchLabel: 'Browse Learning Materials',
      launchView: 'materials' as NavView,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-balance" style={{ color: 'var(--text-primary)' }}>
            Select Accessibility Mode
          </h1>
          <p className="mt-1 text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Choose the sensory adaptation that fits your learning style best. You can switch modes or customize individual settings anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const modeSpeech =
              language === 'kn'
                ? 'ಪ್ರವೇಶಿಸುವಿಕೆ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಆಡಿಯೋ ಪಾಠಗಳು ಮತ್ತು ಧ್ವನಿ ನ್ಯಾವಿಗೇಷನ್‌ಗಾಗಿ ದೃಷ್ಟಿ ದೋಷ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ದೊಡ್ಡ ಉಪಶೀರ್ಷಿಕೆ ಮತ್ತು ಸಂಕೇತ ಭಾಷೆಗಾಗಿ ಶ್ರವಣ ದೋಷ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಅಥವಾ ಸಮತೋಲಿತ ವಿಧಾನವನ್ನು ಆರಿಸಿ.'
                : language === 'hi'
                ? 'एक्सेसिबिलिटी मोड चुनें। ऑडियो पाठ और वॉइस नेविगेशन के लिए दृष्टिबाधित मोड चुनें। बड़े सबटाइटल और सांकेतिक भाषा के लिए श्रवणबाधित मोड चुनें। या संतुलित मोड चुनें।'
                : 'Select Accessibility Mode. Choose Visual Impairment Mode for audio lessons, text-to-speech, and voice navigation. Choose Hearing Impairment Mode for extra-large video subtitles, sign language interpreter, and visual diagrams. Or choose Balanced Mode.';
            speak(modeSpeech);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
        >
          <Volume2 className="w-4 h-4" aria-hidden="true" />
          Read Mode Options
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {modes.map((m) => {
          const Icon = m.icon;
          const active = currentMode === m.id;
          return (
            <article
              key={m.id}
              className="rounded-xl border-2 p-6 flex flex-col justify-between gap-5"
              style={{
                backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface)',
                borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-6 h-6 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {m.title}
                    </h2>
                  </div>
                  {active && (
                    <span className="text-xs font-bold inline-flex items-center gap-1 shrink-0" style={{ color: 'var(--accent-primary)' }}>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {m.subtitle}
                </p>

                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {m.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectMode(m.id)}
                  aria-pressed={active}
                  className="w-full py-2.5 px-4 rounded-lg border text-sm font-bold cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: active ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  }}
                >
                  {active ? `${m.title} Active` : `Activate ${m.title}`}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectMode(m.id);
                    onNavigate(m.launchView);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {m.launchLabel}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Quick Capability Summary Strip */}
      <div
        className="rounded-xl border p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        {[
          { icon: Headphones, title: 'Audio Lessons', detail: 'Converts written study guides into clear spoken narration' },
          { icon: Mic, title: 'Voice Navigation', detail: 'Navigate between pages and lessons via voice commands' },
          { icon: Captions, title: 'Video Subtitles', detail: 'High-contrast resizable captions synced to every cue' },
          { icon: Hand, title: 'Sign Language', detail: 'Animated ASL interpreter and A–Z fingerspelling studio' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3">
              <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
