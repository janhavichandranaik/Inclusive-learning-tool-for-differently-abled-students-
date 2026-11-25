import React, { useState } from 'react';
import { CheckCircle2, LogOut, UserCheck, Volume2 } from 'lucide-react';
import { AccessibilityProfileMode, AppLanguage, NavView, ProgressState, StudentProfile } from '../types';

interface StudentLoginPageProps {
  student: StudentProfile | null;
  currentMode: AccessibilityProfileMode;
  currentLanguage: AppLanguage;
  onLogin: (data: {
    name: string;
    studentId: string;
    gradeLevel: string;
    preferredMode: AccessibilityProfileMode;
    preferredLanguage: AppLanguage;
  }) => Promise<{ student: StudentProfile; progress?: ProgressState }>;
  onLogout: () => void;
  onApplyMode: (mode: AccessibilityProfileMode) => void;
  onSetLanguage: (lang: AppLanguage) => void;
  onHydrateProgress: (progress: ProgressState) => void;
  onNavigate: (view: NavView) => void;
  speak: (text: string) => void;
  announce: (msg: string, priority?: 'polite' | 'assertive') => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({
  student,
  currentMode,
  currentLanguage,
  onLogin,
  onLogout,
  onApplyMode,
  onSetLanguage,
  onHydrateProgress,
  onNavigate,
  speak,
  announce,
}) => {
  const [name, setName] = useState(student?.name ?? '');
  const [studentId, setStudentId] = useState(student?.studentId ?? '');
  const [gradeLevel, setGradeLevel] = useState(student?.gradeLevel ?? 'Middle School (Grades 6–8)');
  const [preferredMode, setPreferredMode] = useState<AccessibilityProfileMode>(
    student?.preferredMode ?? currentMode
  );
  const [preferredLanguage, setPreferredLanguage] = useState<AppLanguage>(
    student?.preferredLanguage ?? currentLanguage
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const performLogin = async (payload: {
    name: string;
    studentId: string;
    gradeLevel: string;
    preferredMode: AccessibilityProfileMode;
    preferredLanguage: AppLanguage;
  }) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const result = await onLogin(payload);
      if (result.progress) {
        onHydrateProgress(result.progress);
      }
      onApplyMode(payload.preferredMode);
      onSetLanguage(payload.preferredLanguage);
      announce(`Signed in as ${result.student.name}.`);
      onNavigate('mode-select');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in.';
      setErrorMsg(msg);
      announce(msg, 'assertive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) {
      setErrorMsg('Please enter both your Student Name and Student ID to sign in.');
      announce('Sign in error: please enter both your name and student ID.', 'assertive');
      return;
    }
    performLogin({ name, studentId, gradeLevel, preferredMode, preferredLanguage });
  };

  const handleDemoStudent = () => {
    performLogin({
      name: 'Aarav Patel',
      studentId: 'STU-2026-104',
      gradeLevel: 'Middle School (Grades 6–8)',
      preferredMode,
      preferredLanguage,
    });
  };

  if (student) {
    return (
      <section
        aria-labelledby="student-profile-heading"
        className="max-w-2xl mx-auto rounded-xl border p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold inline-flex items-center gap-1.5" style={{ color: 'var(--success-text)' }}>
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              Server-Synced Student Session
            </p>
            <h1 id="student-profile-heading" className="text-2xl sm:text-3xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>
              {student.name}
            </h1>
            <p className="text-sm mt-1 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              ID: {student.studentId} · {student.gradeLevel} · Signed in {student.signedInAt}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onLogout();
              announce('Signed out of student profile');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>

        <div
          className="p-4 rounded-xl border space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Mode:{' '}
            {student.preferredMode === 'visual'
              ? 'Visual Impairment Mode'
              : student.preferredMode === 'hearing'
              ? 'Hearing Impairment Mode'
              : 'Balanced Multi-Sensory Mode'}{' '}
            · Language:{' '}
            {student.preferredLanguage === 'kn'
              ? 'ಕನ್ನಡ (Kannada)'
              : student.preferredLanguage === 'hi'
              ? 'हिन्दी (Hindi)'
              : 'English'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Your profile and progress sync automatically with the backend learning server.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('mode-select')}
            className="px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            Change Accessibility Mode
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai-tutor')}
            className="px-4 py-2.5 rounded-lg border text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            Open AI Voice Tutor
          </button>
          <button
            type="button"
            onClick={() => onNavigate('progress')}
            className="px-4 py-2.5 rounded-lg border text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            View Progress Report
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="student-login-heading"
      className="max-w-2xl mx-auto rounded-xl border p-6 sm:p-8 space-y-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="student-login-heading" className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Student Login
          </h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Sign in to save your preferred language, accessibility mode, and quiz scores on the learning server.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const loginSpeech =
              currentLanguage === 'kn'
                ? 'ವಿದ್ಯಾರ್ಥಿ ಲಾಗಿನ್ ಪುಟ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು, ವಿದ್ಯಾರ್ಥಿ ಗುರುತಿನ ಸಂಖ್ಯೆ, ನಿಮ್ಮ ಆಯ್ಕೆಯ ಭಾಷೆ ಮತ್ತು ಪ್ರವೇಶಿಸುವಿಕೆ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
                : currentLanguage === 'hi'
                ? 'छात्र लॉगिन पृष्ठ। कृपया अपना पूरा नाम, छात्र आईडी, अपनी पसंदीदा भाषा और एक्सेसिबिलिटी मोड चुनें।'
                : 'Student Login page. Enter your full name, student ID, preferred language such as English, Kannada, or Hindi, and choose your accessibility mode.';
            speak(loginSpeech);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
        >
          <Volume2 className="w-4 h-4" aria-hidden="true" />
          Read Form Instructions
        </button>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="student-name" className="block text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Student Full Name
          </label>
          <input
            id="student-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Maya Sharma"
            className="w-full px-4 py-3 rounded-lg border text-base"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="student-id" className="block text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Student ID
            </label>
            <input
              id="student-id"
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., STU-1024"
              className="w-full px-4 py-3 rounded-lg border text-base"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label htmlFor="student-grade" className="block text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Learning Level
            </label>
            <select
              id="student-grade"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-base"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Elementary (Grades 3–5)">Elementary (Grades 3–5)</option>
              <option value="Middle School (Grades 6–8)">Middle School (Grades 6–8)</option>
              <option value="High School (Grades 9–12)">High School (Grades 9–12)</option>
              <option value="Adult & Independent Learner">Adult & Independent Learner</option>
            </select>
          </div>

          <div>
            <label htmlFor="student-lang" className="block text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Preferred Language
            </label>
            <select
              id="student-lang"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as AppLanguage)}
              className="w-full px-4 py-3 rounded-lg border text-base"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        <fieldset className="space-y-2 pt-1">
          <legend className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Preferred Accessibility Mode
          </legend>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {(
              [
                { id: 'visual', label: 'Visual Impairment', desc: 'Audio + TTS + Voice Nav' },
                { id: 'hearing', label: 'Hearing Impairment', desc: 'Subtitles + Sign + Visuals' },
                { id: 'balanced', label: 'Balanced Mode', desc: 'All Tools Enabled' },
              ] as const
            ).map((opt) => {
              const selected = preferredMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreferredMode(opt.id)}
                  aria-pressed={selected}
                  className="text-left p-3.5 rounded-lg border-2 cursor-pointer"
                  style={{
                    backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                    borderColor: selected ? 'var(--accent-primary)' : 'var(--border-hairline)',
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {submitting ? 'Signing In...' : 'Sign In & Continue'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleDemoStudent}
            className="px-4 py-3 rounded-lg border text-sm font-semibold cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            Quick Demo Student Sign-In
          </button>
        </div>
      </form>
    </section>
  );
};
