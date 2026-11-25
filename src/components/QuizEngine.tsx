import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Volume2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { AppLanguage, QuizQuestion } from '../types';

interface QuizEngineProps {
  language?: AppLanguage;
  lessonId: string;
  lessonTitle: string;
  questions: QuizQuestion[];
  bestScore?: number;
  speak: (text: string, opts?: { id?: string; rate?: number; voiceURI?: string }) => void;
  stopSpeech: () => void;
  ttsRate: number;
  ttsVoiceURI: string;
  announce: (msg: string, priority?: 'polite' | 'assertive') => void;
  onQuizComplete: (lessonId: string, scorePercent: number, correctCount: number, totalCount: number) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  language = 'en',
  lessonId,
  lessonTitle,
  questions,
  bestScore,
  speak,
  stopSpeech,
  ttsRate,
  ttsVoiceURI,
  announce,
  onQuizComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // Reset quiz when lesson changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setShowHint(false);
    setCorrectCount(0);
    setFinished(false);
  }, [lessonId]);

  const currentQuestion = questions[currentIndex];

  const handleReadQuestionAloud = () => {
    if (!currentQuestion) return;
    const optionLabel = language === 'kn' ? 'ಆಯ್ಕೆ' : language === 'hi' ? 'विकल्प' : 'Option';
    const optionsSpeech = currentQuestion.options
      .map((opt, idx) => `${optionLabel} ${idx + 1}: ${opt}`)
      .join('. ');

    const headerSpeech =
      language === 'kn'
        ? `ಪ್ರಶ್ನೆ ${currentIndex + 1}, ಒಟ್ಟು ${questions.length} ಪ್ರಶ್ನೆಗಳು.`
        : language === 'hi'
        ? `प्रश्न ${currentIndex + 1}, कुल ${questions.length} प्रश्न।`
        : `Question ${currentIndex + 1} of ${questions.length}.`;

    speak(`${headerSpeech} ${currentQuestion.prompt}. ${optionsSpeech}`, {
      id: `quiz-q-${currentQuestion.id}`,
      rate: ttsRate,
      voiceURI: ttsVoiceURI,
    });
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || submitted) return;
    setSubmitted(true);
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      announce(`Correct! ${currentQuestion.explanation}`, 'assertive');
    } else {
      announce(
        `Incorrect. The correct answer is ${currentQuestion.options[currentQuestion.correctIndex]}. ${currentQuestion.explanation}`,
        'assertive'
      );
    }
  };

  const handleNext = () => {
    stopSpeech();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setShowHint(false);
      announce(`Moved to question ${currentIndex + 2} of ${questions.length}`);
    } else {
      const finalPercent = Math.round((correctCount / questions.length) * 100);
      setFinished(true);
      onQuizComplete(lessonId, finalPercent, correctCount, questions.length);
      announce(`Quiz finished. You scored ${correctCount} out of ${questions.length}, ${finalPercent} percent.`);
    }
  };

  const handleRetry = () => {
    stopSpeech();
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setShowHint(false);
    setCorrectCount(0);
    setFinished(false);
    announce('Quiz restarted');
  };

  if (finished) {
    const percent = Math.round((correctCount / questions.length) * 100);
    const passed = percent >= 66;
    return (
      <section
        aria-label="Quiz Results"
        className="rounded-xl border p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Quiz Summary · {lessonTitle}
            </p>
            <h3 className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>
              Score: {correctCount} / {questions.length} ({percent}%)
            </h3>
            <p
              className="mt-2 inline-flex items-center gap-2 text-sm font-bold"
              style={{ color: passed ? 'var(--success-text)' : 'var(--warning-text)' }}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {passed
                ? 'Mastery Achieved — Lesson Recorded Complete'
                : 'Keep Practicing — Review the Lesson Notes and Retry'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const resultSpeech =
                  language === 'kn'
                    ? `${lessonTitle} ರಸಪ್ರಶ್ನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ನೀವು ${questions.length} ರಲ್ಲಿ ${correctCount} ಅಂಕಗಳನ್ನು ಪಡೆದಿದ್ದೀರಿ, ಶೇಕಡಾ ${percent}.`
                    : language === 'hi'
                    ? `${lessonTitle} क्विज़ पूरा हुआ। आपने ${questions.length} में से ${correctCount} सही उत्तर दिए, यानी ${percent} प्रतिशत।`
                    : `Quiz complete for ${lessonTitle}. You scored ${correctCount} out of ${questions.length}, which is ${percent} percent.`;
                speak(resultSpeech, { rate: ttsRate, voiceURI: ttsVoiceURI });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Read Result
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
              }}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Retake Quiz
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Interactive Lesson Quiz"
      className="rounded-xl border p-5 sm:p-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            Question {currentIndex + 1} of {questions.length}
            {typeof bestScore === 'number' ? ` · Best Score: ${bestScore}%` : ''}
          </p>
          <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {currentQuestion.prompt}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReadQuestionAloud}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            Read Question
          </button>

          <button
            type="button"
            onClick={() => {
              setShowHint((h) => !h);
              if (!showHint) announce(`Hint: ${currentQuestion.hint}`);
            }}
            aria-expanded={showHint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        </div>
      </div>

      {showHint && (
        <div
          className="mb-4 p-3.5 rounded-lg border text-sm"
          style={{
            backgroundColor: 'var(--warning-bg)',
            borderColor: 'var(--warning-border)',
            color: 'var(--warning-text)',
          }}
        >
          <strong>Hint:</strong> {currentQuestion.hint}
        </div>
      )}

      {/* Accessible Radiogroup of Answer Options */}
      <div role="radiogroup" aria-label="Answer choices" className="space-y-2.5">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrectChoice = idx === currentQuestion.correctIndex;

          let bg = 'var(--bg-surface-alt)';
          let border = 'var(--border-hairline)';
          let textColor = 'var(--text-primary)';

          if (submitted) {
            if (isCorrectChoice) {
              bg = 'var(--success-bg)';
              border = 'var(--success-border)';
              textColor = 'var(--success-text)';
            } else if (isSelected && !isCorrectChoice) {
              bg = 'var(--error-bg)';
              border = 'var(--error-border)';
              textColor = 'var(--error-text)';
            }
          } else if (isSelected) {
            bg = 'var(--accent-soft)';
            border = 'var(--accent-primary)';
          }

          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={submitted}
              onClick={() => setSelectedOption(idx)}
              className="w-full text-left p-4 rounded-lg border-2 flex items-center justify-between gap-3 transition-colors cursor-pointer disabled:cursor-default"
              style={{
                backgroundColor: bg,
                borderColor: border,
                color: textColor,
              }}
            >
              <span className="flex items-center gap-3 text-base font-medium">
                <span
                  className="w-7 h-7 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 tabular-nums"
                  style={{
                    borderColor: border,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  }}
                >
                  {idx + 1}
                </span>
                <span>{option}</span>
              </span>

              {submitted && isCorrectChoice && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  Correct
                </span>
              )}
              {submitted && isSelected && !isCorrectChoice && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold shrink-0">
                  <XCircle className="w-5 h-5" aria-hidden="true" />
                  Incorrect
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback & Explanation */}
      {submitted && (
        <div
          role="status"
          className="mt-4 p-4 rounded-lg border text-sm"
          style={{
            backgroundColor:
              selectedOption === currentQuestion.correctIndex
                ? 'var(--success-bg)'
                : 'var(--error-bg)',
            borderColor:
              selectedOption === currentQuestion.correctIndex
                ? 'var(--success-border)'
                : 'var(--error-border)',
            color:
              selectedOption === currentQuestion.correctIndex
                ? 'var(--success-text)'
                : 'var(--error-text)',
          }}
        >
          <p className="font-bold">
            {selectedOption === currentQuestion.correctIndex ? 'Correct Answer' : 'Review Explanation'}
          </p>
          <p className="mt-1">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-end gap-3">
        {!submitted ? (
          <button
            type="button"
            disabled={selectedOption === null}
            onClick={handleSubmitAnswer}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-45 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            Check Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
};
