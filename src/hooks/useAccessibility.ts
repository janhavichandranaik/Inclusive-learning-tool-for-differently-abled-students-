import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityProfileMode,
  AccessibilitySettings,
  AppLanguage,
  CaptionSize,
  ContrastMode,
  FontScale,
} from '../types';

const STORAGE_KEY = 'claritylearn_a11y_v1';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  language: 'en',
  profileMode: 'balanced',
  contrastMode: 'standard',
  fontSize: 16,
  extraSpacing: false,
  captionsEnabled: true,
  captionSize: 'large',
  signInterpreterEnabled: true,
  ttsEnabled: true,
  ttsRate: 1.0,
  ttsVoiceURI: '',
  reducedMotion: false,
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to default settings if storage is unavailable
    }
    return DEFAULT_SETTINGS;
  });

  const [announcement, setAnnouncement] = useState<{
    text: string;
    priority: 'polite' | 'assertive';
    key: number;
  }>({ text: '', priority: 'polite', key: 0 });

  const announce = useCallback((text: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ text, priority, key: Date.now() });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }

    const root = document.documentElement;
    root.lang = settings.language;
    root.setAttribute('data-contrast', settings.contrastMode);
    root.setAttribute('data-reduced-motion', String(settings.reducedMotion));
    root.style.setProperty('--base-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--reader-line-height', settings.extraSpacing ? '1.9' : '1.65');
    root.style.setProperty('--reader-letter-spacing', settings.extraSpacing ? '0.03em' : '0em');
  }, [settings]);

  const setLanguage = useCallback(
    (language: AppLanguage) => {
      setSettings((prev) => ({ ...prev, language }));
      const label =
        language === 'kn' ? 'Language switched to Kannada' : language === 'hi' ? 'Language switched to Hindi' : 'Language switched to English';
      announce(label);
    },
    [announce]
  );

  const setContrastMode = useCallback(
    (contrastMode: ContrastMode) => {
      setSettings((prev) => ({ ...prev, contrastMode }));
      const label =
        contrastMode === 'hc-dark'
          ? 'High contrast dark mode enabled'
          : contrastMode === 'hc-light'
          ? 'High contrast light mode enabled'
          : 'Standard contrast mode enabled';
      announce(label);
    },
    [announce]
  );

  const setFontSize = useCallback(
    (fontSize: FontScale) => {
      setSettings((prev) => ({ ...prev, fontSize }));
      announce(`Font size set to ${fontSize} pixels`);
    },
    [announce]
  );

  const updateSettings = useCallback(
    (patch: Partial<AccessibilitySettings>, message?: string) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      if (message) announce(message);
    },
    [announce]
  );

  const resetAccessibility = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    announce('Accessibility preferences reset to default');
  }, [announce]);

  const cycleFontSize = useCallback(
    (direction: 'up' | 'down') => {
      const scales: FontScale[] = [14, 16, 19, 22];
      const idx = scales.indexOf(settings.fontSize);
      const nextIdx =
        direction === 'up'
          ? Math.min(scales.length - 1, idx + 1)
          : Math.max(0, idx - 1);
      setFontSize(scales[nextIdx]);
    },
    [settings.fontSize, setFontSize]
  );

  const setCaptionSize = useCallback(
    (captionSize: CaptionSize) => {
      setSettings((prev) => ({ ...prev, captionSize }));
      announce(`Caption size changed to ${captionSize}`);
    },
    [announce]
  );

  const applyProfileMode = useCallback(
    (profileMode: AccessibilityProfileMode) => {
      setSettings((prev) => {
        if (profileMode === 'visual') {
          return {
            ...prev,
            profileMode: 'visual',
            ttsEnabled: true,
            fontSize: prev.fontSize < 19 ? 19 : prev.fontSize,
            extraSpacing: true,
            contrastMode: prev.contrastMode === 'standard' ? 'hc-dark' : prev.contrastMode,
          };
        }
        if (profileMode === 'hearing') {
          return {
            ...prev,
            profileMode: 'hearing',
            captionsEnabled: true,
            captionSize: 'xlarge',
            signInterpreterEnabled: true,
          };
        }
        return {
          ...prev,
          profileMode: 'balanced',
          captionsEnabled: true,
          signInterpreterEnabled: true,
          ttsEnabled: true,
          contrastMode: 'standard',
          fontSize: 16,
          extraSpacing: false,
        };
      });

      const msg =
        profileMode === 'visual'
          ? 'Visual Impairment Mode activated: Audio lessons, text-to-speech, large typography, and high contrast enabled.'
          : profileMode === 'hearing'
          ? 'Hearing Impairment Mode activated: Extra-large video subtitles, sign language interpreter, and visual diagrams enabled.'
          : 'Balanced Multi-Sensory Mode activated: Audio, captions, and sign language tools enabled together.';
      announce(msg, 'assertive');
    },
    [announce]
  );

  return {
    settings,
    announcement,
    announce,
    setLanguage,
    setContrastMode,
    setFontSize,
    setCaptionSize,
    applyProfileMode,
    cycleFontSize,
    updateSettings,
    resetAccessibility,
  };
}
