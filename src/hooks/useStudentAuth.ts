import { useCallback, useState } from 'react';
import { AccessibilityProfileMode, AppLanguage, ProgressState, StudentProfile } from '../types';

export function useStudentAuth() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  // Session token stays strictly in React memory (never persisted to localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (data: {
      name: string;
      studentId: string;
      gradeLevel: string;
      preferredMode: AccessibilityProfileMode;
      preferredLanguage: AppLanguage;
    }): Promise<{ student: StudentProfile; progress?: ProgressState }> => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/student/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? 'Failed to sign in');
        }
        const payload = (await res.json()) as {
          student: StudentProfile;
          token: string;
          progress?: ProgressState;
        };
        setStudent(payload.student);
        setAuthToken(payload.token);
        return { student: payload.student, progress: payload.progress };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updatePreferredMode = useCallback((preferredMode: AccessibilityProfileMode) => {
    setStudent((prev) => (prev ? { ...prev, preferredMode } : prev));
  }, []);

  const updatePreferredLanguage = useCallback((preferredLanguage: AppLanguage) => {
    setStudent((prev) => (prev ? { ...prev, preferredLanguage } : prev));
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    setAuthToken(null);
  }, []);

  return {
    student,
    authToken,
    isLoading,
    login,
    logout,
    updatePreferredMode,
    updatePreferredLanguage,
  };
}
