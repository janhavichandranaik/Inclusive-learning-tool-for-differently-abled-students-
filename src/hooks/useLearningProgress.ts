import { useCallback, useEffect, useState } from 'react';
import { LESSONS } from '../data/curriculum';
import { ProgressState } from '../types';

const PROGRESS_KEY = 'claritylearn_progress_v1';

const DEFAULT_PROGRESS: ProgressState = {
  lessons: {},
  totalMinutesSpent: 0,
  activityLog: [],
};

export function useLearningProgress() {
  const [progress, setProgress] = useState<ProgressState>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback safely
    }
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage errors
    }
  }, [progress]);

  const updateLessonPosition = useCallback((lessonId: string, sec: number) => {
    setProgress((prev) => {
      const existing = prev.lessons[lessonId] ?? {
        completed: false,
        lastPositionSec: 0,
        quizAttempts: 0,
      };
      return {
        ...prev,
        lastVisitedLessonId: lessonId,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            ...existing,
            lastPositionSec: sec,
          },
        },
      };
    });
  }, []);

  const markLessonCompleted = useCallback((lessonId: string) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    setProgress((prev) => {
      const existing = prev.lessons[lessonId] ?? {
        completed: false,
        lastPositionSec: 0,
        quizAttempts: 0,
      };
      const alreadyDone = existing.completed;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        ...prev,
        lastVisitedLessonId: lessonId,
        totalMinutesSpent: alreadyDone ? prev.totalMinutesSpent : prev.totalMinutesSpent + 6,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            ...existing,
            completed: true,
            completedAt: existing.completedAt ?? new Date().toISOString(),
          },
        },
        activityLog: alreadyDone
          ? prev.activityLog
          : [
              {
                id: `${lessonId}-${Date.now()}`,
                label: `Completed Lesson: ${lesson?.title ?? lessonId}`,
                detail: 'Audio-visual module marked complete',
                timestamp: now,
              },
              ...prev.activityLog.slice(0, 14),
            ],
      };
    });
  }, []);

  const recordQuizResult = useCallback((lessonId: string, scorePercent: number, correctCount: number, totalCount: number) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    setProgress((prev) => {
      const existing = prev.lessons[lessonId] ?? {
        completed: false,
        lastPositionSec: 0,
        quizAttempts: 0,
      };
      const best = Math.max(existing.bestQuizScore ?? 0, scorePercent);
      const passed = scorePercent >= 66;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        ...prev,
        lastVisitedLessonId: lessonId,
        totalMinutesSpent: prev.totalMinutesSpent + 3,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            ...existing,
            completed: existing.completed || passed,
            completedAt: existing.completedAt ?? (passed ? new Date().toISOString() : undefined),
            bestQuizScore: best,
            quizAttempts: existing.quizAttempts + 1,
          },
        },
        activityLog: [
          {
            id: `quiz-${lessonId}-${Date.now()}`,
            label: `Quiz Completed: ${lesson?.title ?? lessonId}`,
            detail: `Scored ${correctCount}/${totalCount} (${scorePercent}%)`,
            timestamp: now,
          },
          ...prev.activityLog.slice(0, 14),
        ],
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const completedCount = LESSONS.filter((l) => progress.lessons[l.id]?.completed).length;
  const quizScores = LESSONS.map((l) => progress.lessons[l.id]?.bestQuizScore).filter(
    (s): s is number => typeof s === 'number'
  );
  const averageQuizScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((acc, s) => acc + s, 0) / quizScores.length)
      : 0;
  const overallPercent = Math.round((completedCount / LESSONS.length) * 100);

  return {
    progress,
    completedCount,
    totalLessons: LESSONS.length,
    quizzesCompletedCount: quizScores.length,
    averageQuizScore,
    overallPercent,
    updateLessonPosition,
    markLessonCompleted,
    recordQuizResult,
    resetProgress,
  };
}
