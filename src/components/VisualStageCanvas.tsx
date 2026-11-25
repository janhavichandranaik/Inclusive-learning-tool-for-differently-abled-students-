import React, { useEffect, useState } from 'react';
import { VisualSceneId } from '../types';

interface VisualStageCanvasProps {
  scene: VisualSceneId;
  altText: string;
  isPlaying: boolean;
  currentTime: number;
  reducedMotion: boolean;
  subjectImage: string;
}

export const VisualStageCanvas: React.FC<VisualStageCanvasProps> = ({
  scene,
  altText,
  isPlaying,
  currentTime,
  reducedMotion,
}) => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    let frameId = 0;
    const tick = (now: number) => {
      setPulse((now / 1000) % 10);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, reducedMotion]);

  const phase = reducedMotion ? 0.5 : (pulse + currentTime) % 4;
  const waveShift = reducedMotion ? 0 : (pulse + currentTime) * 35;

  const renderSceneContent = () => {
    switch (scene) {
      case 'lang-kannada-vowels':
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <text x="320" y="48" textAnchor="middle" fill="#fde047" fontSize="20" fontWeight="700">
              ಕನ್ನಡ ಸ್ವರಗಳು · Kannada Vowels (Swaragalu)
            </text>
            {[
              ['ಅ', 'a'],
              ['ಆ', 'aa'],
              ['ಇ', 'i'],
              ['ಈ', 'ee'],
              ['ಉ', 'u'],
              ['ಊ', 'oo'],
              ['ಎ', 'e'],
              ['ಏ', 'ae'],
              ['ಒ', 'o'],
              ['ಓ', 'oo'],
            ].map(([ch, rom], i) => {
              const col = i % 5;
              const row = Math.floor(i / 5);
              const x = 80 + col * 104;
              const y = 85 + row * 102;
              return (
                <g key={ch} transform={`translate(${x}, ${y})`}>
                  <rect width="84" height="80" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
                  <text x="42" y="42" textAnchor="middle" fill="#ffffff" fontSize="30" fontWeight="700">
                    {ch}
                  </text>
                  <text x="42" y="67" textAnchor="middle" fill="#bae6fd" fontSize="13" fontWeight="600">
                    {rom}
                  </text>
                </g>
              );
            })}
          </svg>
        );

      case 'lang-kannada-phrases':
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <text x="320" y="46" textAnchor="middle" fill="#fde047" fontSize="20" fontWeight="700">
              Everyday Kannada Study Phrases
            </text>
            {[
              ['ನಮಸ್ಕಾರ (Namaskara)', 'Hello / Greetings'],
              ['ಧನ್ಯವಾದಗಳು (Dhanyavadagalu)', 'Thank You'],
              ['ದಯವಿಟ್ಟು (Dayavittu)', 'Please'],
              ['ನನಗೆ ಅರ್ಥವಾಯಿತು (Nanage arthavayitu)', 'I Understand'],
            ].map(([kn, en], idx) => (
              <g key={kn} transform={`translate(60, ${74 + idx * 62})`}>
                <rect width="520" height="48" rx="8" fill="#1e293b" stroke="#4ade80" strokeWidth="2" />
                <text x="20" y="30" fill="#ffffff" fontSize="16" fontWeight="700">
                  {kn}
                </text>
                <text x="500" y="30" textAnchor="end" fill="#fde047" fontSize="15" fontWeight="600">
                  {en}
                </text>
              </g>
            ))}
          </svg>
        );

      case 'lang-english-grammar':
      case 'lang-english-reading':
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <text x="320" y="46" textAnchor="middle" fill="#fde047" fontSize="20" fontWeight="700">
              {scene === 'lang-english-grammar'
                ? 'English Sentence Structure: Subject + Verb + Object'
                : 'Active Reading & Listening Signposts'}
            </text>
            <g transform="translate(55, 92)">
              <rect width="160" height="86" rx="10" fill="#0369a1" stroke="#e0f2fe" strokeWidth="2.5" />
              <text x="80" y="36" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                SUBJECT (Noun)
              </text>
              <text x="80" y="64" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">
                The student
              </text>
            </g>
            <g transform="translate(240, 92)">
              <rect width="160" height="86" rx="10" fill="#15803d" stroke="#bbf7d0" strokeWidth="2.5" />
              <text x="80" y="36" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                VERB (Action)
              </text>
              <text x="80" y="64" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">
                listens to
              </text>
            </g>
            <g transform="translate(425, 92)">
              <rect width="160" height="86" rx="10" fill="#1e293b" stroke="#facc15" strokeWidth="2.5" />
              <text x="80" y="36" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                OBJECT (Noun)
              </text>
              <text x="80" y="64" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">
                clear audio
              </text>
            </g>
            <rect x="55" y="216" width="530" height="68" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="320" y="246" textAnchor="middle" fill="#e0f2fe" fontSize="15" fontWeight="700">
              Adjectives Describe Nouns: "clear" · "bright" · "accessible"
            </text>
            <text x="320" y="270" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="600">
              Tip: Locate the topic sentence first to grasp the main idea quickly.
            </text>
          </svg>
        );

      case 'lang-hindi-vowels':
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <text x="320" y="48" textAnchor="middle" fill="#fde047" fontSize="20" fontWeight="700">
              हिन्दी स्वर · Hindi Devanagari Vowels (Swar)
            </text>
            {[
              ['अ', 'a'],
              ['आ', 'aa'],
              ['इ', 'i'],
              ['ई', 'ee'],
              ['उ', 'u'],
              ['ऊ', 'oo'],
              ['ए', 'e'],
              ['ऐ', 'ai'],
              ['ओ', 'o'],
              ['औ', 'au'],
            ].map(([ch, rom], i) => {
              const col = i % 5;
              const row = Math.floor(i / 5);
              const x = 80 + col * 104;
              const y = 85 + row * 102;
              return (
                <g key={ch} transform={`translate(${x}, ${y})`}>
                  <rect width="84" height="80" rx="10" fill="#1e293b" stroke="#facc15" strokeWidth="2.5" />
                  <text x="42" y="44" textAnchor="middle" fill="#ffffff" fontSize="30" fontWeight="700">
                    {ch}
                  </text>
                  <text x="42" y="68" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="600">
                    {rom}
                  </text>
                </g>
              );
            })}
          </svg>
        );

      case 'lang-hindi-phrases':
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <text x="320" y="46" textAnchor="middle" fill="#fde047" fontSize="20" fontWeight="700">
              Everyday Hindi Study Phrases
            </text>
            {[
              ['नमस्ते (Namaste)', 'Hello / Greetings'],
              ['धन्यवाद (Dhanyavaad)', 'Thank You'],
              ['कृपया (Kripaya)', 'Please'],
              ['मुझे समझ आया (Mujhe samajh aaya)', 'I Understand'],
            ].map(([hi, en], idx) => (
              <g key={hi} transform={`translate(60, ${74 + idx * 62})`}>
                <rect width="520" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="20" y="30" fill="#ffffff" fontSize="16" fontWeight="700">
                  {hi}
                </text>
                <text x="500" y="30" textAnchor="end" fill="#fde047" fontSize="15" fontWeight="600">
                  {en}
                </text>
              </g>
            ))}
          </svg>
        );

      case 'photosynthesis-light':
      case 'photosynthesis-roots':
      case 'photosynthesis-chloroplast':
      case 'photosynthesis-oxygen': {
        const showRays = scene === 'photosynthesis-light' || scene === 'photosynthesis-chloroplast';
        const showWater = scene === 'photosynthesis-roots' || scene === 'photosynthesis-chloroplast';
        const showOxygen = scene === 'photosynthesis-oxygen';
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0b1726" />
            {/* Sun */}
            <circle cx="90" cy="70" r="36" fill="#facc15" />
            <text x="90" y="126" textAnchor="middle" fill="#fde047" fontSize="14" fontWeight="700">
              SUNLIGHT
            </text>
            {showRays &&
              [0, 1, 2].map((i) => (
                <line
                  key={i}
                  x1={124}
                  y1={76 + i * 12}
                  x2={275}
                  y2={135 + i * 16}
                  stroke="#fde047"
                  strokeWidth="4"
                  strokeDasharray="10 8"
                  strokeDashoffset={-waveShift * 0.5}
                />
              ))}

            {/* Soil & Roots */}
            <rect x="0" y="270" width="640" height="70" fill="#291d16" />
            <path d="M320 270 L320 175" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" />
            <path d="M320 270 L280 315 M320 270 L358 318" stroke="#a16207" strokeWidth="6" strokeLinecap="round" />

            {/* Leaf */}
            <path
              d="M320 175 C270 110, 410 70, 470 140 C430 205, 360 210, 320 175 Z"
              fill="#15803d"
              stroke="#86efac"
              strokeWidth="3"
            />
            <line x1="320" y1="175" x2="442" y2="142" stroke="#bbf7d0" strokeWidth="3" />

            {/* Rising Water Molecules */}
            {showWater &&
              [0, 1, 2].map((i) => {
                const offset = ((phase * 25 + i * 32) % 90);
                return (
                  <g key={i} transform={`translate(320, ${265 - offset})`}>
                    <circle r="7" fill="#38bdf8" />
                    <text x="16" y="4" fill="#bae6fd" fontSize="12" fontWeight="700">
                      H₂O
                    </text>
                  </g>
                );
              })}

            {/* Chloroplast Focus Box */}
            {scene === 'photosynthesis-chloroplast' && (
              <g transform="translate(495, 110)">
                <rect x="-55" y="-42" width="145" height="92" rx="12" fill="#052e16" stroke="#4ade80" strokeWidth="2.5" />
                <text x="18" y="-14" textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="700">
                  CHLOROPLAST
                </text>
                <text x="18" y="10" textAnchor="middle" fill="#ffffff" fontSize="12">
                  CO₂ + H₂O + Light
                </text>
                <text x="18" y="32" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                  → Glucose Sugar
                </text>
              </g>
            )}

            {/* Oxygen Release */}
            {showOxygen &&
              [0, 1, 2].map((i) => {
                const rise = ((phase * 28 + i * 30) % 85);
                return (
                  <g key={i} transform={`translate(${370 + i * 35}, ${130 - rise})`}>
                    <circle r="11" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                      O₂
                    </text>
                  </g>
                );
              })}

            <text x="320" y="318" textAnchor="middle" fill="#fed7aa" fontSize="13" fontWeight="600">
              {scene === 'photosynthesis-light' && 'Step 1: Sunlight reaches chlorophyll in leaves'}
              {scene === 'photosynthesis-roots' && 'Step 2: Roots pull water upward through xylem'}
              {scene === 'photosynthesis-chloroplast' && 'Step 3: Chloroplasts synthesize glucose sugar'}
              {scene === 'photosynthesis-oxygen' && 'Step 4: Stomata release oxygen into the air'}
            </text>
          </svg>
        );
      }

      case 'sound-vibration':
      case 'sound-waves':
      case 'sound-pitch':
      case 'sound-ear': {
        const freq = scene === 'sound-pitch' ? 0.05 : 0.025;
        const amp = scene === 'sound-pitch' ? 58 : 44;
        const pts: string[] = [];
        for (let x = 60; x <= 580; x += 8) {
          const y = 170 + Math.sin(x * freq - waveShift * 0.08) * amp;
          pts.push(`${x},${y.toFixed(1)}`);
        }
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            {/* Coordinate grid */}
            <line x1="50" y1="170" x2="590" y2="170" stroke="#475569" strokeWidth="2" strokeDasharray="6 6" />
            <line x1="60" y1="55" x2="60" y2="285" stroke="#475569" strokeWidth="2" />
            {/* Wave Curve */}
            <polyline fill="none" stroke="#38bdf8" strokeWidth="4.5" points={pts.join(' ')} />
            {scene === 'sound-pitch' && (
              <polyline
                fill="none"
                stroke="#facc15"
                strokeWidth="3"
                strokeDasharray="6 4"
                points={Array.from({ length: 66 }, (_, idx) => {
                  const x = 60 + idx * 8;
                  const y = 170 + Math.sin(x * 0.09 - waveShift * 0.12) * 28;
                  return `${x},${y.toFixed(1)}`;
                }).join(' ')}
              />
            )}
            <text x="320" y="42" textAnchor="middle" fill="#e2e8f0" fontSize="15" fontWeight="700">
              {scene === 'sound-vibration' && 'Mechanical Vibration Creates Air Pressure Waves'}
              {scene === 'sound-waves' && 'Traveling Sound Wave Across Time'}
              {scene === 'sound-pitch' && 'Blue: Tall Amplitude (Louder) · Yellow: High Frequency (Higher Pitch)'}
              {scene === 'sound-ear' && 'Acoustic Energy Converted Into Visual Waveform'}
            </text>
          </svg>
        );
      }

      case 'fraction-whole':
      case 'fraction-halves':
      case 'fraction-quarters':
      case 'fraction-compare': {
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            {/* Whole Bar */}
            <g transform="translate(80, 52)">
              <rect width="480" height="46" rx="6" fill="#0284c7" stroke="#e0f2fe" strokeWidth="2.5" />
              <text x="240" y="29" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="700">
                1 Whole (1/1)
              </text>
            </g>

            {/* Halves */}
            {scene !== 'fraction-whole' && (
              <g transform="translate(80, 120)">
                <rect width="238" height="46" rx="6" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2.5" />
                <text x="119" y="29" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="700">
                  1/2
                </text>
                <rect x="242" width="238" height="46" rx="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
                <text x="361" y="29" textAnchor="middle" fill="#cbd5e1" fontSize="17" fontWeight="700">
                  1/2
                </text>
              </g>
            )}

            {/* Quarters */}
            {(scene === 'fraction-quarters' || scene === 'fraction-compare') && (
              <g transform="translate(80, 188)">
                {[0, 1, 2, 3].map((idx) => {
                  const shaded = scene === 'fraction-quarters' ? idx < 2 : idx < 3;
                  return (
                    <g key={idx} transform={`translate(${idx * 121}, 0)`}>
                      <rect
                        width="117"
                        height="46"
                        rx="6"
                        fill={shaded ? '#facc15' : '#1e293b'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <text
                        x="58"
                        y="29"
                        textAnchor="middle"
                        fill={shaded ? '#000000' : '#cbd5e1'}
                        fontSize="16"
                        fontWeight="800"
                      >
                        1/4
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            <text x="320" y="290" textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="700">
              {scene === 'fraction-whole' && '1 Complete Whole Unit'}
              {scene === 'fraction-halves' && 'Divided Into 2 Equal Halves (1/2 + 1/2 = 1)'}
              {scene === 'fraction-quarters' && 'Notice: 2/4 Aligns Exactly With 1/2'}
              {scene === 'fraction-compare' && '3/4 Shaded = 3 Numerator Parts Out of 4 Equal Parts'}
            </text>
          </svg>
        );
      }

      case 'angle-acute':
      case 'angle-right':
      case 'angle-obtuse':
      case 'angle-circle': {
        const deg =
          scene === 'angle-acute'
            ? 45
            : scene === 'angle-right'
            ? 90
            : scene === 'angle-obtuse'
            ? 130
            : 360;
        const rad = (-deg * Math.PI) / 180;
        const x2 = 320 + Math.cos(rad) * 120;
        const y2 = 220 + Math.sin(rad) * 120;

        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <circle cx="320" cy="220" r="130" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />

            {scene === 'angle-circle' ? (
              <>
                <circle cx="320" cy="170" r="105" fill="none" stroke="#facc15" strokeWidth="5" />
                <line x1="215" y1="170" x2="425" y2="170" stroke="#38bdf8" strokeWidth="2.5" />
                <line x1="320" y1="65" x2="320" y2="275" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="320" y="310" textAnchor="middle" fill="#fde047" fontSize="16" fontWeight="700">
                  Full Circle = 360° (Four 90° Quadrants)
                </text>
              </>
            ) : (
              <>
                <line x1="320" y1="220" x2="460" y2="220" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                <line x1="320" y1="220" x2={x2} y2={y2} stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
                <circle cx="320" cy="220" r="7" fill="#ffffff" />
                {scene === 'angle-right' && (
                  <rect x="320" y="196" width="24" height="24" fill="none" stroke="#4ade80" strokeWidth="3" />
                )}
                <text x="320" y="305" textAnchor="middle" fill="#f8fafc" fontSize="17" fontWeight="700">
                  {scene === 'angle-acute' && 'Acute Angle: 45° (Less than 90°)'}
                  {scene === 'angle-right' && 'Right Angle: 90° (Square Perpendicular Corner)'}
                  {scene === 'angle-obtuse' && 'Obtuse Angle: 130° (Greater than 90°)'}
                </text>
              </>
            )}
          </svg>
        );
      }

      case 'solar-sun':
      case 'solar-inner':
      case 'solar-earth':
      case 'solar-orbit': {
        const angle = reducedMotion ? 0.5 : (pulse + currentTime) * 0.45;
        const earthX = 320 + Math.cos(angle) * 145;
        const earthY = 170 + Math.sin(angle) * 85;
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#070d19" />
            {/* Orbits */}
            <ellipse cx="320" cy="170" rx="75" ry="42" fill="none" stroke="#475569" strokeWidth="1.5" />
            <ellipse cx="320" cy="170" rx="110" ry="62" fill="none" stroke="#475569" strokeWidth="1.5" />
            <ellipse cx="320" cy="170" rx="145" ry="85" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 5" />
            <ellipse cx="320" cy="170" rx="190" ry="112" fill="none" stroke="#475569" strokeWidth="1.5" />

            {/* Sun */}
            <circle cx="320" cy="170" r="28" fill="#fbbf24" />
            <text x="320" y="175" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="800">
              SUN
            </text>

            {/* Mercury & Venus */}
            <circle cx="395" cy="170" r="6" fill="#94a3b8" />
            <circle cx="218" cy="145" r="9" fill="#fcd34d" />

            {/* Earth */}
            <circle cx={earthX} cy={earthY} r="13" fill="#0284c7" stroke="#4ade80" strokeWidth="3" />
            <text x={earthX} y={earthY - 18} textAnchor="middle" fill="#e0f2fe" fontSize="13" fontWeight="700">
              EARTH
            </text>

            {/* Mars */}
            <circle cx="495" cy="130" r="9" fill="#ef4444" />

            <text x="320" y="316" textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="700">
              {scene === 'solar-sun' && 'The Sun’s Gravity Anchors the Solar System'}
              {scene === 'solar-inner' && 'Inner Rocky Planets: Mercury · Venus · Earth · Mars'}
              {scene === 'solar-earth' && 'Earth Orbits in the Liquid-Water Habitable Zone'}
              {scene === 'solar-orbit' && '1 Complete Orbit Around the Sun = 365 Days'}
            </text>
          </svg>
        );
      }

      case 'water-evaporation':
      case 'water-condensation':
      case 'water-precipitation':
      case 'water-collection': {
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0b1726" />
            {/* Sun */}
            <circle cx="105" cy="70" r="30" fill="#facc15" />
            {/* Ocean */}
            <rect x="0" y="250" width="380" height="90" fill="#0369a1" />
            {/* Mountain */}
            <polygon points="360,250 510,120 640,250" fill="#334155" />
            <rect x="360" y="250" width="280" height="90" fill="#1e293b" />

            {/* Cloud */}
            <g transform="translate(360, 70)">
              <circle cx="0" cy="18" r="24" fill="#e2e8f0" />
              <circle cx="32" cy="12" r="28" fill="#f8fafc" />
              <circle cx="64" cy="18" r="22" fill="#e2e8f0" />
            </g>

            {/* Evaporation Arrows */}
            {scene === 'water-evaporation' &&
              [140, 195, 250].map((x, idx) => (
                <path
                  key={idx}
                  d={`M${x} 240 L${x} 145 M${x - 8} 157 L${x} 145 L${x + 8} 157`}
                  stroke="#38bdf8"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              ))}

            {/* Condensation Highlight */}
            {scene === 'water-condensation' && (
              <text x="392" y="135" textAnchor="middle" fill="#fde047" fontSize="14" fontWeight="700">
                COOLING VAPOR → CLOUDS
              </text>
            )}

            {/* Rain */}
            {scene === 'water-precipitation' &&
              [365, 392, 418].map((x, idx) => (
                <line
                  key={idx}
                  x1={x}
                  y1={115 + ((phase * 30 + idx * 14) % 50)}
                  x2={x - 6}
                  y2={135 + ((phase * 30 + idx * 14) % 50)}
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ))}

            {/* River Runoff */}
            {scene === 'water-collection' && (
              <path
                d="M485 180 Q445 215 375 258"
                stroke="#38bdf8"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
              />
            )}

            <text x="320" y="316" textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="700">
              {scene === 'water-evaporation' && '1. Evaporation: Warm Water Vapor Rises'}
              {scene === 'water-condensation' && '2. Condensation: Vapor Cools Into Clouds'}
              {scene === 'water-precipitation' && '3. Precipitation: Rain & Snow Fall to Land'}
              {scene === 'water-collection' && '4. Collection: Rivers Flow Back to Oceans'}
            </text>
          </svg>
        );
      }

      default: {
        return (
          <svg viewBox="0 0 640 340" className="w-full h-full" role="img" aria-label={altText}>
            <rect width="640" height="340" fill="#0f172a" />
            <circle cx="320" cy="145" r="72" fill="#0369a1" opacity="0.35" stroke="#38bdf8" strokeWidth="2.5" />
            <text x="320" y="140" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="700">
              Visual Sign & Expression Cue
            </text>
            <text x="320" y="172" textAnchor="middle" fill="#fde047" fontSize="15" fontWeight="600">
              Follow the Sign Interpreter Panel & Captions Below
            </text>
            <text x="320" y="296" textAnchor="middle" fill="#cbd5e1" fontSize="13">
              {altText}
            </text>
          </svg>
        );
      }
    }
  };

  return (
    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border" style={{ borderColor: 'var(--border-hairline)' }}>
      {renderSceneContent()}
    </div>
  );
};
