import React, { useEffect } from 'react';
import { X, Volume2, RotateCcw } from 'lucide-react';
import { AccessibilitySettings, CaptionSize, ContrastMode, FontScale } from '../types';

interface AccessibilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  voices: SpeechSynthesisVoice[];
  isSpeechSupported: boolean;
  onSetContrast: (mode: ContrastMode) => void;
  onSetFontSize: (size: FontScale) => void;
  onSetCaptionSize: (size: CaptionSize) => void;
  onUpdateSettings: (patch: Partial<AccessibilitySettings>, message?: string) => void;
  onReset: () => void;
  speak: (text: string, opts?: { rate?: number; voiceURI?: string }) => void;
}

export const AccessibilityDrawer: React.FC<AccessibilityDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  voices,
  isSpeechSupported,
  onSetContrast,
  onSetFontSize,
  onSetCaptionSize,
  onUpdateSettings,
  onReset,
  speak,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-drawer-title"
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto p-6 border-l space-y-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <h2 id="a11y-drawer-title" className="text-xl font-bold">
              Accessibility & Sensory Studio
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Tailor contrast, typography, speech narration, captions, and sign panels.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close accessibility controls"
            className="p-2.5 rounded-lg border cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 1. Contrast Mode */}
        <section aria-label="Contrast Theme">
          <h3 className="text-sm font-bold mb-2.5">Display Contrast Mode</h3>
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                { id: 'standard', label: 'Standard Calm Light', desc: 'Balanced low-glare slate & cobalt' },
                { id: 'hc-dark', label: 'High Contrast Dark (AAA)', desc: 'Pure black canvas, white text, yellow focus' },
                { id: 'hc-light', label: 'High Contrast Light (AAA)', desc: 'Pure white canvas, crisp black borders' },
              ] as const
            ).map((opt) => {
              const active = settings.contrastMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSetContrast(opt.id)}
                  aria-pressed={active}
                  className="text-left p-3 rounded-lg border-2 cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                  }}
                >
                  <p className="text-sm font-bold">{opt.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Font Size & Spacing */}
        <section aria-label="Typography Scale">
          <h3 className="text-sm font-bold mb-2.5">Adjustable Font Size</h3>
          <div className="grid grid-cols-4 gap-2">
            {([14, 16, 19, 22] as FontScale[]).map((size) => {
              const active = settings.fontSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSetFontSize(size)}
                  aria-pressed={active}
                  className="py-2.5 px-2 rounded-lg border text-sm font-bold tabular-nums cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: active ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  }}
                >
                  {size}px
                </button>
              );
            })}
          </div>

          <label className="mt-3 flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer" style={{ backgroundColor: 'var(--bg-surface-alt)', borderColor: 'var(--border-hairline)' }}>
            <div>
              <span className="text-sm font-bold block">Extra Line & Letter Spacing</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Increases line height (1.9) and character spacing
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.extraSpacing}
              onChange={(e) =>
                onUpdateSettings(
                  { extraSpacing: e.target.checked },
                  e.target.checked ? 'Extra reading spacing enabled' : 'Standard spacing restored'
                )
              }
              className="w-5 h-5 accent-sky-600"
            />
          </label>
        </section>

        {/* 3. Text-to-Speech Controls */}
        <section aria-label="Text-to-Speech Preferences" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Text-to-Speech Narration</h3>
            <button
              type="button"
              disabled={!isSpeechSupported}
              onClick={() =>
                speak(
                  'ClarityLearn voice narration is active. Every lesson, transcript, and quiz can be read aloud.',
                  { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI }
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              Test Voice
            </button>
          </div>

          {!isSpeechSupported ? (
            <p className="text-xs p-3 rounded-lg border" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)', color: 'var(--warning-text)' }}>
              Browser Speech Synthesis is not available in this environment. Visual captions and transcripts remain active.
            </p>
          ) : (
            <>
              <div>
                <label htmlFor="tts-voice-select" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Narrator Voice
                </label>
                <select
                  id="tts-voice-select"
                  value={settings.ttsVoiceURI}
                  onChange={(e) => onUpdateSettings({ ttsVoiceURI: e.target.value }, 'Narrator voice updated')}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-surface-alt)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">System Default Voice</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <label htmlFor="tts-rate-slider">Speech Rate</label>
                  <span className="tabular-nums">{settings.ttsRate.toFixed(1)}×</span>
                </div>
                <input
                  id="tts-rate-slider"
                  type="range"
                  min={0.7}
                  max={1.8}
                  step={0.1}
                  value={settings.ttsRate}
                  onChange={(e) => onUpdateSettings({ ttsRate: Number(e.target.value) })}
                  className="w-full h-2.5 accent-sky-600 cursor-pointer"
                />
              </div>
            </>
          )}
        </section>

        {/* 4. Captions, Sign Language & Motion */}
        <section aria-label="Captions and Motion" className="space-y-2.5">
          <h3 className="text-sm font-bold">Captions, Sign Language & Motion</h3>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Video Caption Size
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['medium', 'large', 'xlarge'] as CaptionSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onSetCaptionSize(sz)}
                  aria-pressed={settings.captionSize === sz}
                  className="py-2 rounded-lg border text-xs font-bold capitalize cursor-pointer"
                  style={{
                    backgroundColor: settings.captionSize === sz ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                    borderColor: settings.captionSize === sz ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: settings.captionSize === sz ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  }}
                >
                  {sz === 'xlarge' ? 'Extra Large' : sz}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer" style={{ backgroundColor: 'var(--bg-surface-alt)', borderColor: 'var(--border-hairline)' }}>
            <span className="text-sm font-semibold">Show Closed Captions by Default</span>
            <input
              type="checkbox"
              checked={settings.captionsEnabled}
              onChange={(e) =>
                onUpdateSettings({ captionsEnabled: e.target.checked }, `Captions ${e.target.checked ? 'enabled' : 'disabled'}`)
              }
              className="w-5 h-5 accent-sky-600"
            />
          </label>

          <label className="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer" style={{ backgroundColor: 'var(--bg-surface-alt)', borderColor: 'var(--border-hairline)' }}>
            <span className="text-sm font-semibold">Show Sign Language Interpreter</span>
            <input
              type="checkbox"
              checked={settings.signInterpreterEnabled}
              onChange={(e) =>
                onUpdateSettings(
                  { signInterpreterEnabled: e.target.checked },
                  `Sign interpreter ${e.target.checked ? 'enabled' : 'disabled'}`
                )
              }
              className="w-5 h-5 accent-sky-600"
            />
          </label>

          <label className="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer" style={{ backgroundColor: 'var(--bg-surface-alt)', borderColor: 'var(--border-hairline)' }}>
            <span className="text-sm font-semibold">Reduce Visual Motion</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) =>
                onUpdateSettings({ reducedMotion: e.target.checked }, `Reduced motion ${e.target.checked ? 'enabled' : 'disabled'}`)
              }
              className="w-5 h-5 accent-sky-600"
            />
          </label>
        </section>

        {/* Keyboard Navigation Guide */}
        <section
          aria-label="Keyboard Navigation Shortcuts"
          className="p-3.5 rounded-lg border text-xs space-y-1.5"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-secondary)',
          }}
        >
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Keyboard Shortcuts
          </p>
          <p>Alt + 1 : Subjects Library</p>
          <p>Alt + 2 : Sign Language Studio</p>
          <p>Alt + 3 : Quiz Hub</p>
          <p>Alt + 4 : Progress Tracker</p>
          <p>Alt + A : Toggle Accessibility Studio</p>
        </section>

        <button
          type="button"
          onClick={onReset}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-semibold cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset All Preferences
        </button>
      </div>
    </div>
  );
};
