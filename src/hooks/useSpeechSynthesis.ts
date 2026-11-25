import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeakOptions {
  id?: string;
  rate?: number;
  voiceURI?: string;
  onEnd?: () => void;
}

export function useSpeechSynthesis() {
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        // Prioritize English voices first while retaining all system voices
        const sorted = [...available].sort((a, b) => {
          const aEn = a.lang.toLowerCase().startsWith('en') ? 0 : 1;
          const bEn = b.lang.toLowerCase().startsWith('en') ? 0 : 1;
          if (aEn !== bEn) return aEn - bEn;
          return a.name.localeCompare(b.name);
        });
        setVoices(sorted);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setActiveId(null);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!isSupported || !text.trim()) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1;
      utterance.pitch = 1;

      if (options.voiceURI) {
        const matched = voices.find((v) => v.voiceURI === options.voiceURI);
        if (matched) utterance.voice = matched;
      } else {
        const defaultEnglish = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (defaultEnglish) utterance.voice = defaultEnglish;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setActiveId(options.id ?? 'global');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveId(null);
        currentUtteranceRef.current = null;
        options.onEnd?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveId(null);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices]
  );

  return {
    isSupported,
    voices,
    isSpeaking,
    activeId,
    speak,
    stop,
  };
}
