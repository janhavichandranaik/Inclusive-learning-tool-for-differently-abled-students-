import { useCallback, useEffect, useState } from 'react';
import { AccessibilitySettings, CaptionSize, ContrastMode, FontScale } from '../types';

const STORAGE_KEY = 'claritylearn_a11y_v1';

const DEFAULT_SETTINGS: AccessibilitySettings = {
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
    root.setAttribute('data-contrast', settings.contrastMode);
    root.setAttribute('data-reduced-motion', String(settings.reducedMotion));
    root.style.setProperty('--base-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--reader-line-height', settings.extraSpacing ? '1.9' : '1.65');
    root.style.setProperty('--reader-letter-spacing', settings.extraSpacing ? '0.03em' : '0em');
  }, [settings]);

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

  return {
    settings,
    announcement,
    announce,
    setContrastMode,
    setFontSize,
    setCaptionSize,
    cycleFontSize,
    updateSettings,
    resetAccessibility,
  };
}
