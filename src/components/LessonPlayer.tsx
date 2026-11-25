import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Captions,
  CheckCircle2,
  Hand,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AccessibilitySettings, Lesson, LessonCue } from '../types';
import { SignAvatar } from './SignAvatar';
import { VisualStageCanvas } from './VisualStageCanvas';

interface LessonPlayerProps {
  lesson: Lesson;
  subjectImage: string;
  settings: AccessibilitySettings;
  isCompleted: boolean;
  initialTime?: number;
  currentTime: number;
  onTimeChange: (sec: number) => void;
  onToggleCaptions: () => void;
  onToggleSign: () => void;
  onToggleTTS: () => void;
  onMarkComplete: () => void;
  speak: (text: string, opts?: { id?: string; rate?: number; voiceURI?: string }) => void;
  stopSpeech: () => void;
  announce: (msg: string) => void;
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  subjectImage,
  settings,
  isCompleted,
  currentTime,
  onTimeChange,
  onToggleCaptions,
  onToggleSign,
  onToggleTTS,
  onMarkComplete,
  speak,
  stopSpeech,
  announce,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const lastSpokenCueIdRef = useRef<string | null>(null);

  const activeCue: LessonCue = useMemo(() => {
    return (
      lesson.cues.find((c) => currentTime >= c.startSec && currentTime < c.endSec) ??
      lesson.cues[lesson.cues.length - 1]
    );
  }, [lesson.cues, currentTime]);

  const activeCueIndex = useMemo(
    () => lesson.cues.findIndex((c) => c.id === activeCue.id),
    [lesson.cues, activeCue.id]
  );

  // Advance playback timeline cleanly
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      onTimeChange(currentTime + 0.5 * playbackSpeed);
    }, 500);
    return () => window.clearInterval(interval);
  }, [isPlaying, playbackSpeed, currentTime, onTimeChange]);

  // Stop cleanly at end and mark lesson completed
  useEffect(() => {
    if (currentTime >= lesson.durationSec) {
      setIsPlaying(false);
      onTimeChange(lesson.durationSec);
      onMarkComplete();
      stopSpeech();
      announce(`Finished ${lesson.title}. Lesson marked complete.`);
    }
  }, [currentTime, lesson.durationSec, lesson.title, onMarkComplete, onTimeChange, stopSpeech, announce]);

  // Trigger synchronized Web Speech narration whenever entering a new cue while playing
  useEffect(() => {
    if (!isPlaying || !settings.ttsEnabled) return;
    if (lastSpokenCueIdRef.current !== activeCue.id) {
      lastSpokenCueIdRef.current = activeCue.id;
      speak(activeCue.caption, {
        id: `cue-${activeCue.id}`,
        rate: Math.min(1.8, Math.max(0.7, settings.ttsRate * playbackSpeed)),
        voiceURI: settings.ttsVoiceURI,
      });
    }
  }, [
    isPlaying,
    activeCue.id,
    activeCue.caption,
    settings.ttsEnabled,
    settings.ttsRate,
    settings.ttsVoiceURI,
    playbackSpeed,
    speak,
  ]);

  // Stop speech when paused or lesson changes
  useEffect(() => {
    if (!isPlaying) {
      lastSpokenCueIdRef.current = null;
    }
  }, [isPlaying]);

  useEffect(() => {
    setIsPlaying(false);
    lastSpokenCueIdRef.current = null;
    stopSpeech();
  }, [lesson.id, stopSpeech]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeech();
      announce('Lesson playback paused');
    } else {
      if (currentTime >= lesson.durationSec) {
        onTimeChange(0);
      }
      lastSpokenCueIdRef.current = null;
      setIsPlaying(true);
      announce('Lesson playback started');
    }
  };

  const handleSeek = (newSec: number) => {
    const clamped = Math.max(0, Math.min(lesson.durationSec, newSec));
    lastSpokenCueIdRef.current = null;
    onTimeChange(clamped);
    if (!isPlaying) {
      stopSpeech();
    }
  };

  const handlePrevCue = () => {
    const prevIdx = Math.max(0, activeCueIndex - 1);
    handleSeek(lesson.cues[prevIdx].startSec);
    announce(`Jumped to segment ${prevIdx + 1}`);
  };

  const handleNextCue = () => {
    const nextIdx = Math.min(lesson.cues.length - 1, activeCueIndex + 1);
    handleSeek(lesson.cues[nextIdx].startSec);
    announce(`Jumped to segment ${nextIdx + 1}`);
  };

  const captionSizeClass =
    settings.captionSize === 'xlarge'
      ? 'text-lg sm:text-xl'
      : settings.captionSize === 'large'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  return (
    <section
      aria-label="Interactive Audio-Visual Lesson Player"
      className="rounded-xl border p-4 sm:p-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      {/* Split Stage: Visual Lesson Canvas + Sign Language Interpreter */}
      <div
        className={`grid gap-5 ${
          settings.signInterpreterEnabled ? 'lg:grid-cols-12 items-start' : 'grid-cols-1'
        }`}
      >
        <div className={settings.signInterpreterEnabled ? 'lg:col-span-8' : 'col-span-1'}>
          <div className="relative rounded-xl overflow-hidden">
            <VisualStageCanvas
              scene={activeCue.visualScene}
              altText={activeCue.visualAltText}
              isPlaying={isPlaying}
              currentTime={currentTime}
              reducedMotion={settings.reducedMotion}
              subjectImage={subjectImage}
            />

            {/* Synchronized Closed Captions Overlay */}
            {settings.captionsEnabled && (
              <div
                aria-live="polite"
                className="mt-3 lg:mt-0 lg:absolute lg:bottom-3 lg:left-3 lg:right-3 rounded-lg px-4 py-3 bg-black/90 text-white border border-white/25"
              >
                <p className={`font-semibold leading-snug ${captionSizeClass}`}>
                  <span className="text-yellow-300 mr-2 font-bold">[{activeCue.speaker}]</span>
                  {activeCue.caption}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sign Language Interpreter Panel */}
        {settings.signInterpreterEnabled && (
          <aside
            aria-label="Sign Language Interpreter Window"
            className="lg:col-span-4 rounded-xl border p-3.5"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <SignAvatar
              pose={activeCue.signPose}
              gloss={activeCue.signGloss}
              instruction={activeCue.signInstruction}
              isAnimating={!settings.reducedMotion}
              compact
            />
          </aside>
        )}
      </div>

      {/* Accessible Timeline Scrubber */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-mono-tabular mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>
            Segment {activeCueIndex + 1} of {lesson.cues.length}
          </span>
          <span>
            {formatTime(currentTime)} / {formatTime(lesson.durationSec)}
          </span>
        </div>

        <label htmlFor="lesson-seek-slider" className="sr-only">
          Lesson playback position
        </label>
        <input
          id="lesson-seek-slider"
          type="range"
          min={0}
          max={lesson.durationSec}
          step={0.5}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(lesson.durationSec)}`}
          className="w-full h-3 rounded-lg cursor-pointer accent-sky-600"
        />
      </div>

      {/* Player Controls Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            {isPlaying ? 'Pause' : currentTime >= lesson.durationSec ? 'Replay' : 'Play Lesson'}
          </button>

          <button
            type="button"
            onClick={handlePrevCue}
            aria-label="Previous segment"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <SkipBack className="w-4 h-4" aria-hidden="true" />
            Prev Cue
          </button>

          <button
            type="button"
            onClick={handleNextCue}
            aria-label="Next segment"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            Next Cue
            <SkipForward className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              handleSeek(0);
              announce('Lesson reset to beginning');
            }}
            aria-label="Restart lesson from beginning"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Restart
          </button>
        </div>

        {/* Sensory Toggles & Speed */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="playback-speed" className="sr-only">
            Playback speed
          </label>
          <select
            id="playback-speed"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            aria-label="Playback speed"
            className="px-3 py-2.5 rounded-lg border text-sm font-medium tabular-nums cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <option value={0.75}>0.75× Slow</option>
            <option value={1}>1.0× Normal</option>
            <option value={1.25}>1.25× Fast</option>
            <option value={1.5}>1.5× Rapid</option>
          </select>

          <button
            type="button"
            onClick={onToggleCaptions}
            aria-pressed={settings.captionsEnabled}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: settings.captionsEnabled ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
              borderColor: settings.captionsEnabled ? 'var(--accent-primary)' : 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <Captions className="w-4 h-4" aria-hidden="true" />
            Captions {settings.captionsEnabled ? 'On' : 'Off'}
          </button>

          <button
            type="button"
            onClick={onToggleSign}
            aria-pressed={settings.signInterpreterEnabled}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: settings.signInterpreterEnabled ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
              borderColor: settings.signInterpreterEnabled ? 'var(--accent-primary)' : 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <Hand className="w-4 h-4" aria-hidden="true" />
            Sign {settings.signInterpreterEnabled ? 'On' : 'Off'}
          </button>

          <button
            type="button"
            onClick={onToggleTTS}
            aria-pressed={settings.ttsEnabled}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: settings.ttsEnabled ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
              borderColor: settings.ttsEnabled ? 'var(--accent-primary)' : 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            {settings.ttsEnabled ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
            Voice {settings.ttsEnabled ? 'On' : 'Off'}
          </button>

          <button
            type="button"
            onClick={onMarkComplete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: isCompleted ? 'var(--success-bg)' : 'var(--bg-surface-alt)',
              borderColor: isCompleted ? 'var(--success-border)' : 'var(--border-hairline)',
              color: isCompleted ? 'var(--success-text)' : 'var(--text-primary)',
            }}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </section>
  );
};
