import React, { useState } from 'react';
import { Award, BookCheck, Clock, Download, RotateCcw, Volume2 } from 'lucide-react';
import { LESSONS, SUBJECTS } from '../data/curriculum';
import { ProgressState } from '../types';

interface ProgressTrackerProps {
  progress: ProgressState;
  completedCount: number;
  totalLessons: number;
  quizzesCompletedCount: number;
  averageQuizScore: number;
  overallPercent: number;
  onOpenLesson: (lessonId: string) => void;
  onResetProgress: () => void;
  speak: (text: string, opts?: { rate?: number; voiceURI?: string }) => void;
  ttsRate: number;
  ttsVoiceURI: string;
  announce: (msg: string) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  completedCount,
  totalLessons,
  quizzesCompletedCount,
  averageQuizScore,
  overallPercent,
  onOpenLesson,
  onResetProgress,
  speak,
  ttsRate,
  ttsVoiceURI,
  announce,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExportReport = () => {
    const lines = [
      'ClarityLearn — Student Learning Progress Summary',
      `Generated: ${new Date().toLocaleString()}`,
      `Overall Mastery: ${overallPercent}% (${completedCount}/${totalLessons} lessons completed)`,
      `Average Quiz Score: ${averageQuizScore}% across ${quizzesCompletedCount} completed quizzes`,
      '',
      'Subject & Lesson Breakdown:',
      ...LESSONS.map((lesson) => {
        const rec = progress.lessons[lesson.id];
        const status = rec?.completed ? 'Completed' : 'In Progress / Not Started';
        const score = typeof rec?.bestQuizScore === 'number' ? `${rec.bestQuizScore}%` : 'No quiz attempt';
        return `- ${lesson.title} | Status: ${status} | Best Quiz: ${score}`;
      }),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claritylearn-progress-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    announce('Progress report downloaded');
  };

  const summarySpeech = `Your overall learning progress is ${overallPercent} percent. You have completed ${completedCount} out of ${totalLessons} lessons, and your average quiz accuracy is ${averageQuizScore} percent.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-balance" style={{ color: 'var(--text-primary)' }}>
            Learning Progress Tracker
          </h2>
          <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
            Track completed audio-visual lessons, quiz mastery across subjects, and recent study milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => speak(summarySpeech, { rate: ttsRate, voiceURI: ttsVoiceURI })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            Read Summary
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Export Report
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reset Progress
            </button>
          ) : (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                  announce('All learning progress has been reset');
                }}
                className="px-3.5 py-2.5 rounded-lg border text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--error-bg)',
                  borderColor: 'var(--error-border)',
                  color: 'var(--error-text)',
                }}
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3.5 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Overall Mastery',
            value: `${overallPercent}%`,
            sub: `${completedCount} of ${totalLessons} lessons done`,
            icon: Award,
          },
          {
            label: 'Lessons Completed',
            value: `${completedCount}/${totalLessons}`,
            sub: 'Across 4 inclusive subjects',
            icon: BookCheck,
          },
          {
            label: 'Quiz Accuracy',
            value: quizzesCompletedCount > 0 ? `${averageQuizScore}%` : '—',
            sub: `${quizzesCompletedCount} quizzes completed`,
            icon: Award,
          },
          {
            label: 'Study Time Logged',
            value: `${progress.totalMinutesSpent} min`,
            sub: 'Saved locally on this device',
            icon: Clock,
          },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border p-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {metric.label}
                </p>
                <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold mt-2 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {metric.value}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {metric.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Subject-by-Subject Progress */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section
          aria-label="Subject Progress Breakdown"
          className="rounded-xl border p-5 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Subject Progress
          </h3>

          {SUBJECTS.map((subject) => {
            const subjectLessons = LESSONS.filter((l) => l.subjectId === subject.id);
            const done = subjectLessons.filter((l) => progress.lessons[l.id]?.completed).length;
            const pct = Math.round((done / subjectLessons.length) * 100);

            return (
              <div
                key={subject.id}
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {subject.title}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {done} of {subjectLessons.length} lessons completed
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
                    {pct}%
                  </span>
                </div>

                {/* Accessible progress bar */}
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${subject.title} completion ${pct} percent`}
                  className="w-full h-3 rounded-full overflow-hidden border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: 'var(--accent-primary)',
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {subjectLessons.map((lesson) => {
                    const rec = progress.lessons[lesson.id];
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => onOpenLesson(lesson.id)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                        style={{
                          backgroundColor: rec?.completed ? 'var(--success-bg)' : 'var(--bg-surface)',
                          borderColor: rec?.completed ? 'var(--success-border)' : 'var(--border-hairline)',
                          color: rec?.completed ? 'var(--success-text)' : 'var(--text-primary)',
                        }}
                      >
                        {lesson.title}
                        {typeof rec?.bestQuizScore === 'number' ? ` · ${rec.bestQuizScore}%` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Recent Activity Feed */}
        <section
          aria-label="Recent Study Activity"
          className="rounded-xl border p-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Learning Activity
          </h3>

          {progress.activityLog.length === 0 ? (
            <div
              className="p-6 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                No completed lessons or quizzes recorded yet
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Open any subject lesson, listen or watch with captions and sign language, and complete a quiz to see your milestones here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {progress.activityLog.map((entry) => (
                <li
                  key={entry.id}
                  className="p-3.5 rounded-lg border flex items-start justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {entry.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {entry.detail}
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {entry.timestamp}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
