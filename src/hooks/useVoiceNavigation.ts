import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function useVoiceNavigation(onCommand: (phrase: string) => string | void) {
  const SpeechRecCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : undefined;

  const isSupported = Boolean(SpeechRecCtor);

  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors
    }
    setIsListening(false);
  }, []);

  const executeCommandText = useCallback((phrase: string) => {
    const clean = phrase.trim();
    if (!clean) return;
    setLastTranscript(clean);
    const feedback = onCommandRef.current(clean);
    if (typeof feedback === 'string') {
      setStatusMessage(feedback);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecCtor) {
      setStatusMessage('Microphone speech recognition is unavailable in this browser. Type a command below instead.');
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.continuous = false;

      rec.onresult = (event) => {
        const result = event.results[0];
        const transcript = result?.[0]?.transcript ?? '';
        if (transcript) {
          executeCommandText(transcript);
        }
      };

      rec.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone permission denied. Use the quick voice command input instead.');
        } else if (event.error === 'no-speech') {
          setStatusMessage('No speech detected. Tap Listen again and speak a command like "Open audio learning".');
        } else {
          setStatusMessage(`Voice recognition paused (${event.error}).`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      setStatusMessage('Listening... Say a command like "Open Audio Learning" or "Quiz".');
    } catch {
      setIsListening(false);
      setStatusMessage('Unable to start microphone. Use the command bar to navigate by text command.');
    }
  }, [SpeechRecCtor, executeCommandText]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    lastTranscript,
    statusMessage,
    startListening,
    stopListening,
    executeCommandText,
  };
}
