import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLanguage } from '../types';

export type GeminiNeuralVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface NeuralVoiceProfile {
  language: AppLanguage;
  bcp47: string;
  langPrefix: string;
  neuralVoiceName: GeminiNeuralVoiceName;
  styleHint: string;
  osVoiceHints: readonly string[];
  alwaysUseNeural: boolean;
}

export const LANGUAGE_VOICE_PROFILES: Record<AppLanguage, NeuralVoiceProfile> = {
  kn: {
    language: 'kn',
    bcp47: 'kn-IN',
    langPrefix: 'kn',
    neuralVoiceName: 'Kore',
    styleHint:
      'Clear, warm native Kannada educator speaking exclusively in natural Kannada (ಕನ್ನಡ) with clear syllable articulation.',
    osVoiceHints: ['kn-in', 'kannada', 'ಕನ್ನಡ', 'kn'],
    alwaysUseNeural: true,
  },
  hi: {
    language: 'hi',
    bcp47: 'hi-IN',
    langPrefix: 'hi',
    neuralVoiceName: 'Kore',
    styleHint:
      'Clear, warm native Hindi educator speaking exclusively in natural Hindi (हिन्दी) with steady pacing.',
    osVoiceHints: ['hi-in', 'hindi', 'हिन्दी', 'hi'],
    alwaysUseNeural: true,
  },
  en: {
    language: 'en',
    bcp47: 'en-US',
    langPrefix: 'en',
    neuralVoiceName: 'Kore',
    styleHint:
      'Clear, warm English educator speaking in natural, easy-to-understand English with steady articulation.',
    osVoiceHints: ['en-us', 'en-in', 'en-gb', 'english', 'en'],
    alwaysUseNeural: false,
  },
};

export interface SpeakOptions {
  id?: string;
  rate?: number;
  voiceURI?: string;
  language?: AppLanguage;
  preferServerAudio?: boolean;
  onEnd?: () => void;
}

const KANNADA_SCRIPT_REGEX = /[\u0C80-\u0CFF]/;
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/;

export function resolveVoiceProfile(language?: AppLanguage, text?: string): NeuralVoiceProfile {
  if (language === 'kn') return LANGUAGE_VOICE_PROFILES.kn;
  if (language === 'hi') return LANGUAGE_VOICE_PROFILES.hi;
  if (text && KANNADA_SCRIPT_REGEX.test(text)) return LANGUAGE_VOICE_PROFILES.kn;
  if (text && DEVANAGARI_SCRIPT_REGEX.test(text)) return LANGUAGE_VOICE_PROFILES.hi;
  return LANGUAGE_VOICE_PROFILES[language ?? 'en'];
}

function findMatchingOsVoice(
  voices: SpeechSynthesisVoice[],
  profile: NeuralVoiceProfile
): SpeechSynthesisVoice | undefined {
  const exactBcp47 = voices.find(
    (v) => v.lang.toLowerCase() === profile.bcp47.toLowerCase()
  );
  if (exactBcp47) return exactBcp47;

  const prefixMatch = voices.find((v) =>
    v.lang.toLowerCase().startsWith(profile.langPrefix)
  );
  if (prefixMatch) return prefixMatch;

  return voices.find((v) => {
    const langLower = v.lang.toLowerCase();
    const nameLower = v.name.toLowerCase();
    return profile.osVoiceHints.some(
      (hint) => langLower.includes(hint) || nameLower.includes(hint)
    );
  });
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
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);
  const speakSeqRef = useRef(0);
  const clientAudioCacheRef = useRef<Map<string, { audioBase64: string; mimeType: string }>>(new Map());

  const revokeAudioUrl = useCallback(() => {
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        const sorted = [...available].sort((a, b) => {
          const priority = (lang: string) => {
            const l = lang.toLowerCase();
            if (l.startsWith('en')) return 0;
            if (l.startsWith('kn')) return 1;
            if (l.startsWith('hi')) return 2;
            return 3;
          };
          const diff = priority(a.lang) - priority(b.lang);
          if (diff !== 0) return diff;
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
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      revokeAudioUrl();
    };
  }, [isSupported, revokeAudioUrl]);

  const stop = useCallback(() => {
    speakSeqRef.current += 1;
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.onended = null;
      audioPlayerRef.current.onerror = null;
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    revokeAudioUrl();
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setActiveId(null);
  }, [isSupported, revokeAudioUrl]);

  const ensureAudioElement = useCallback(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    return audioPlayerRef.current;
  }, []);

  const playBase64Audio = useCallback(
    (
      base64Audio: string,
      mimeType = 'audio/wav',
      id = 'audio',
      onEnd?: () => void,
      rate = 1
    ) => {
      stop();
      const seq = speakSeqRef.current;
      const binaryStr = atob(base64Audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      audioObjectUrlRef.current = blobUrl;

      const audio = ensureAudioElement();
      audio.src = blobUrl;
      audio.playbackRate = Math.min(2, Math.max(0.6, rate));
      setIsSpeaking(true);
      setActiveId(id);

      audio.onended = () => {
        if (seq !== speakSeqRef.current) return;
        revokeAudioUrl();
        setIsSpeaking(false);
        setActiveId(null);
        onEnd?.();
      };
      audio.onerror = () => {
        if (seq !== speakSeqRef.current) return;
        revokeAudioUrl();
        setIsSpeaking(false);
        setActiveId(null);
      };
      audio.play().catch(() => {
        if (seq !== speakSeqRef.current) return;
        revokeAudioUrl();
        setIsSpeaking(false);
        setActiveId(null);
      });
    },
    [stop, ensureAudioElement, revokeAudioUrl]
  );

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      const cleanText = text.trim();
      if (!cleanText) return;
      stop();

      const seq = speakSeqRef.current;
      const profile = resolveVoiceProfile(options.language, cleanText);
      const rate = options.rate ?? 1;
      const matchingLangVoice = findMatchingOsVoice(voices, profile);

      // Always route Kannada, Hindi, or Indic-script speech through the language-mapped Gemini Neural TTS voice profile
      const shouldUseServerTTS =
        profile.alwaysUseNeural ||
        Boolean(options.preferServerAudio) ||
        !isSupported;

      if (shouldUseServerTTS) {
        // Pre-allocate Audio element inside user click gesture before async network fetch
        ensureAudioElement();

        const trimmed = cleanText.slice(0, 1800);
        const cacheKey = `${profile.language}::${profile.neuralVoiceName}::${trimmed}`;
        const cached = clientAudioCacheRef.current.get(cacheKey);
        if (cached) {
          playBase64Audio(
            cached.audioBase64,
            cached.mimeType,
            options.id ?? 'global',
            options.onEnd,
            rate
          );
          return;
        }

        try {
          setIsSpeaking(true);
          setActiveId(options.id ?? 'global');
          const res = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: trimmed,
              language: profile.language,
              voiceName: profile.neuralVoiceName,
            }),
          });
          if (seq !== speakSeqRef.current) return;

          if (res.ok) {
            const data = (await res.json()) as { audioBase64?: string; mimeType?: string };
            if (seq !== speakSeqRef.current) return;

            if (data.audioBase64) {
              const entry = {
                audioBase64: data.audioBase64,
                mimeType: data.mimeType ?? 'audio/wav',
              };
              if (clientAudioCacheRef.current.size >= 80) {
                const oldest = clientAudioCacheRef.current.keys().next().value;
                if (oldest) clientAudioCacheRef.current.delete(oldest);
              }
              clientAudioCacheRef.current.set(cacheKey, entry);

              playBase64Audio(
                entry.audioBase64,
                entry.mimeType,
                options.id ?? 'global',
                options.onEnd,
                rate
              );
              return;
            }
          }
        } catch {
          if (seq !== speakSeqRef.current) return;
          // Fall through to native voice only if a matching-language voice exists
        }
      }

      if (seq !== speakSeqRef.current) return;

      // Never fall back to an English voice for Kannada/Hindi text if no matching OS voice is installed
      if (!isSupported || (profile.language !== 'en' && !matchingLangVoice)) {
        setIsSpeaking(false);
        setActiveId(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.lang = profile.bcp47;

      if (options.voiceURI && profile.language === 'en') {
        const matched = voices.find((v) => v.voiceURI === options.voiceURI);
        if (matched && matched.lang.toLowerCase().startsWith(profile.langPrefix)) {
          utterance.voice = matched;
        } else if (matchingLangVoice) {
          utterance.voice = matchingLangVoice;
        }
      } else if (matchingLangVoice) {
        utterance.voice = matchingLangVoice;
      }

      utterance.onstart = () => {
        if (seq !== speakSeqRef.current) return;
        setIsSpeaking(true);
        setActiveId(options.id ?? 'global');
      };

      utterance.onend = () => {
        if (seq !== speakSeqRef.current) return;
        setIsSpeaking(false);
        setActiveId(null);
        currentUtteranceRef.current = null;
        options.onEnd?.();
      };

      utterance.onerror = () => {
        if (seq !== speakSeqRef.current) return;
        setIsSpeaking(false);
        setActiveId(null);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices, stop, ensureAudioElement, playBase64Audio]
  );

  const getVoiceProfile = useCallback(
    (language?: AppLanguage): NeuralVoiceProfile => resolveVoiceProfile(language),
    []
  );

  return {
    isSupported,
    voices,
    isSpeaking,
    activeId,
    speak,
    playBase64Audio,
    stop,
    getVoiceProfile,
  };
}
