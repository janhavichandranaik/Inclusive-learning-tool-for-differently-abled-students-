import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Volume2, Hand } from 'lucide-react';
import { ASL_ALPHABET, SIGN_DICTIONARY } from '../data/curriculum';
import { SignDictionaryItem } from '../types';
import { SignAvatar } from './SignAvatar';

interface SignStudioProps {
  speak: (text: string, opts?: { id?: string; rate?: number; voiceURI?: string }) => void;
  ttsRate: number;
  ttsVoiceURI: string;
  reducedMotion: boolean;
  announce: (msg: string) => void;
}

export const SignStudio: React.FC<SignStudioProps> = ({
  speak,
  ttsRate,
  ttsVoiceURI,
  reducedMotion,
  announce,
}) => {
  const [category, setCategory] = useState<'All' | SignDictionaryItem['category']>('All');
  const [selectedSign, setSelectedSign] = useState<SignDictionaryItem>(SIGN_DICTIONARY[0]);
  const [mode, setMode] = useState<'vocabulary' | 'fingerspell'>('vocabulary');

  // Fingerspelling word player state
  const [spellInput, setSpellInput] = useState('LEARN');
  const [spellIndex, setSpellIndex] = useState(0);
  const [isSpelling, setIsSpelling] = useState(false);
  const [spellSpeedMs, setSpellSpeedMs] = useState(1100);

  const filteredSigns = useMemo(() => {
    if (category === 'All') return SIGN_DICTIONARY;
    return SIGN_DICTIONARY.filter((s) => s.category === category);
  }, [category]);

  const cleanLetters = useMemo(() => {
    const letters = spellInput
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .split('');
    return letters.length > 0 ? letters : ['A'];
  }, [spellInput]);

  useEffect(() => {
    setSpellIndex(0);
    setIsSpelling(false);
  }, [spellInput]);

  useEffect(() => {
    if (!isSpelling) return;
    const timer = window.setInterval(() => {
      setSpellIndex((prev) => {
        if (prev + 1 >= cleanLetters.length) {
          setIsSpelling(false);
          announce(`Finished fingerspelling ${cleanLetters.join('')}`);
          return prev;
        }
        return prev + 1;
      });
    }, spellSpeedMs);
    return () => window.clearInterval(timer);
  }, [isSpelling, cleanLetters, spellSpeedMs, announce]);

  const activeLetterObj =
    ASL_ALPHABET.find((l) => l.letter === cleanLetters[spellIndex]) ?? ASL_ALPHABET[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-balance" style={{ color: 'var(--text-primary)' }}>
            Sign Language Learning Studio
          </h2>
          <p className="mt-1 text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Practice essential American Sign Language vocabulary videos and interactive A–Z fingerspelling with audio pairing.
          </p>
        </div>

        {/* Mode Switcher */}
        <div
          className="inline-flex p-1 rounded-lg border self-start"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('vocabulary')}
            className="px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            style={{
              backgroundColor: mode === 'vocabulary' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'vocabulary' ? 'var(--accent-on-primary)' : 'var(--text-primary)',
            }}
          >
            Sign Vocabulary Videos
          </button>
          <button
            type="button"
            onClick={() => setMode('fingerspell')}
            className="px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            style={{
              backgroundColor: mode === 'fingerspell' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'fingerspell' ? 'var(--accent-on-primary)' : 'var(--text-primary)',
            }}
          >
            A–Z Fingerspelling
          </button>
        </div>
      </div>

      {mode === 'vocabulary' ? (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Sign List */}
          <div
            className="lg:col-span-7 rounded-xl border p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(['All', 'Everyday', 'Classroom', 'Science & Math', 'Emotions'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-3.5 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: category === cat ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                    borderColor: category === cat ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: category === cat ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {filteredSigns.map((item) => {
                const active = selectedSign.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedSign(item);
                      announce(`Selected sign for ${item.word}`);
                    }}
                    className="text-left p-4 rounded-xl border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                      borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {item.category} · {item.location}
                    </p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {item.word}
                    </p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.handshape}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Sign Demonstration Stage */}
          <aside
            aria-label="Selected Sign Language Demonstration"
            className="lg:col-span-5 rounded-xl border p-5 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {selectedSign.category} Sign Video
                </p>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedSign.word}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  speak(`${selectedSign.word}. ${selectedSign.exampleSentence}`, {
                    id: `sign-speak-${selectedSign.id}`,
                    rate: ttsRate,
                    voiceURI: ttsVoiceURI,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                Speak Word
              </button>
            </div>

            <SignAvatar
              pose={selectedSign.pose}
              gloss={selectedSign.word.toUpperCase()}
              instruction={selectedSign.movement}
              isAnimating={!reducedMotion}
            />

            <dl className="space-y-2 text-sm pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
              <div>
                <dt className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Handshape
                </dt>
                <dd style={{ color: 'var(--text-secondary)' }}>{selectedSign.handshape}</dd>
              </div>
              <div>
                <dt className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Location
                </dt>
                <dd style={{ color: 'var(--text-secondary)' }}>{selectedSign.location}</dd>
              </div>
              <div>
                <dt className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Practice Sentence
                </dt>
                <dd style={{ color: 'var(--text-secondary)' }}>"{selectedSign.exampleSentence}"</dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Word Fingerspelling Player */}
          <div
            className="lg:col-span-5 rounded-xl border p-5 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div>
              <label htmlFor="fingerspell-word-input" className="block text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Type a Word or Name to Fingerspell
              </label>
              <input
                id="fingerspell-word-input"
                type="text"
                maxLength={16}
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                placeholder="Enter letters (e.g. CLARITY)"
                className="w-full px-3.5 py-2.5 rounded-lg border text-base font-semibold tracking-wider uppercase"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Letter Sequence Stepper */}
            <div className="flex flex-wrap gap-1.5" aria-label="Letter sequence">
              {cleanLetters.map((char, idx) => {
                const current = idx === spellIndex;
                return (
                  <button
                    key={`${char}-${idx}`}
                    type="button"
                    onClick={() => {
                      setIsSpelling(false);
                      setSpellIndex(idx);
                    }}
                    className="w-10 h-10 rounded-lg border font-bold text-base tabular-nums cursor-pointer"
                    style={{
                      backgroundColor: current ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                      borderColor: current ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      color: current ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            <SignAvatar fingerspell={activeLetterObj} isAnimating={!reducedMotion} />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isSpelling) {
                    setIsSpelling(false);
                  } else {
                    if (spellIndex >= cleanLetters.length - 1) setSpellIndex(0);
                    setIsSpelling(true);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }}
              >
                {isSpelling ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                {isSpelling ? 'Pause Sequence' : 'Play Fingerspelling'}
              </button>

              <select
                aria-label="Fingerspelling speed"
                value={spellSpeedMs}
                onChange={(e) => setSpellSpeedMs(Number(e.target.value))}
                className="px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value={1500}>Slow (1.5s / letter)</option>
                <option value={1100}>Normal (1.1s / letter)</option>
                <option value={700}>Fast (0.7s / letter)</option>
              </select>
            </div>
          </div>

          {/* Complete A-Z Reference Grid */}
          <div
            className="lg:col-span-7 rounded-xl border p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Hand className="w-5 h-5" aria-hidden="true" />
                ASL Alphabet Reference (A–Z)
              </h3>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Click any letter to inspect handshape
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
              {ASL_ALPHABET.map((item) => {
                const isSelected = activeLetterObj.letter === item.letter;
                return (
                  <button
                    key={item.letter}
                    type="button"
                    onClick={() => {
                      setIsSpelling(false);
                      setSpellInput(item.letter);
                      setSpellIndex(0);
                      speak(`Letter ${item.letter}. ${item.cue}`, {
                        rate: ttsRate,
                        voiceURI: ttsVoiceURI,
                      });
                    }}
                    className="p-3 rounded-lg border text-center font-bold text-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      color: isSelected ? 'var(--accent-on-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {item.letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
