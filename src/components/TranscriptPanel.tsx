import React, { useMemo, useState } from 'react';
import { Download, Search, Volume2, Square } from 'lucide-react';
import { Lesson } from '../types';

interface TranscriptPanelProps {
  lesson: Lesson;
  currentTime: number;
  onSeekTo: (sec: number) => void;
  speak: (text: string, opts?: { id?: string; rate?: number; voiceURI?: string }) => void;
  stopSpeech: () => void;
  activeSpeechId: string | null;
  ttsRate: number;
  ttsVoiceURI: string;
}

function formatCueTime(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = Math.floor(sec % 60);
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  lesson,
  currentTime,
  onSeekTo,
  speak,
  stopSpeech,
  activeSpeechId,
  ttsRate,
  ttsVoiceURI,
}) => {
  const [query, setQuery] = useState('');

  const filteredCues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lesson.cues;
    return lesson.cues.filter(
      (c) =>
        c.caption.toLowerCase().includes(q) ||
        c.signGloss.toLowerCase().includes(q) ||
        c.speaker.toLowerCase().includes(q)
    );
  }, [lesson.cues, query]);

  const handleDownloadTranscript = () => {
    const lines = [
      `ClarityLearn — Lesson Transcript`,
      `Title: ${lesson.title}`,
      `Level: ${lesson.level}`,
      `----------------------------------------`,
      '',
      ...lesson.cues.map(
        (c) =>
          `[${formatCueTime(c.startSec)}] ${c.speaker}: ${c.caption}\nSign Gloss: ${c.signGloss}\n`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.id}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fullText = lesson.cues.map((c) => c.caption).join(' ');
  const isReadingAll = activeSpeechId === `full-transcript-${lesson.id}`;

  return (
    <section
      aria-label="Synchronized Text Transcript"
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Interactive Text Transcript
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Click any timestamped line to jump the lesson player, or read lines aloud.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isReadingAll) {
                stopSpeech();
              } else {
                speak(fullText, {
                  id: `full-transcript-${lesson.id}`,
                  rate: ttsRate,
                  voiceURI: ttsVoiceURI,
                });
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: isReadingAll ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: isReadingAll ? 'var(--accent-on-primary)' : 'var(--text-primary)',
            }}
          >
            {isReadingAll ? (
              <Square className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            )}
            {isReadingAll ? 'Stop Reading' : 'Read Transcript'}
          </button>

          <button
            type="button"
            onClick={handleDownloadTranscript}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download .TXT
          </button>
        </div>
      </div>

      {/* Search Transcript */}
      <div className="relative mb-4">
        <Search
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
        <label htmlFor="transcript-search" className="sr-only">
          Search transcript text
        </label>
        <input
          id="transcript-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript keywords or sign gloss..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Cue List */}
      <div className="space-y-2.5">
        {filteredCues.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-secondary)' }}>
            No transcript lines matched "{query}".
          </p>
        ) : (
          filteredCues.map((cue) => {
            const isActive = currentTime >= cue.startSec && currentTime < cue.endSec;
            const isSpeakingThis = activeSpeechId === `transcript-cue-${cue.id}`;

            return (
              <div
                key={cue.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-3.5 rounded-lg border transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                  borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-hairline)',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSeekTo(cue.startSec)}
                  className="text-left flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-mono-tabular mb-1" style={{ color: 'var(--accent-primary)' }}>
                    <span className="font-bold">{formatCueTime(cue.startSec)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{cue.speaker}</span>
                    {isActive && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold">Current Segment</span>
                      </>
                    )}
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {cue.caption}
                  </p>
                  <p className="mt-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Sign Gloss: {cue.signGloss}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isSpeakingThis) {
                      stopSpeech();
                    } else {
                      speak(cue.caption, {
                        id: `transcript-cue-${cue.id}`,
                        rate: ttsRate,
                        voiceURI: ttsVoiceURI,
                      });
                    }
                  }}
                  aria-label={isSpeakingThis ? 'Stop reading segment' : `Read segment at ${formatCueTime(cue.startSec)} aloud`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 self-start cursor-pointer"
                  style={{
                    backgroundColor: isSpeakingThis ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    borderColor: 'var(--border-hairline)',
                    color: isSpeakingThis ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  }}
                >
                  {isSpeakingThis ? (
                    <Square className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {isSpeakingThis ? 'Stop' : 'Speak'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
