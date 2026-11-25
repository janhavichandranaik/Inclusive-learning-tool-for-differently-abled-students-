import React from 'react';
import { FingerspellLetter } from '../data/curriculum';
import { SignPoseId } from '../types';

interface SignAvatarProps {
  pose?: SignPoseId;
  gloss?: string;
  instruction?: string;
  fingerspell?: FingerspellLetter;
  isAnimating?: boolean;
  compact?: boolean;
}

interface PoseConfig {
  leftArm: { x: number; y: number; rot: number; motionX?: number; motionY?: number };
  rightArm: { x: number; y: number; rot: number; motionX?: number; motionY?: number };
  eyebrows: 'neutral' | 'raised' | 'smile';
  motionArrow?: 'up' | 'out' | 'circle' | 'wave' | 'nod' | 'none';
}

const POSE_MAP: Record<SignPoseId, PoseConfig> = {
  welcome: {
    leftArm: { x: 64, y: 122, rot: -15 },
    rightArm: { x: 136, y: 112, rot: 25, motionX: -12 },
    eyebrows: 'smile',
    motionArrow: 'out',
  },
  hello: {
    leftArm: { x: 65, y: 142, rot: -8 },
    rightArm: { x: 132, y: 66, rot: 28, motionX: 14 },
    eyebrows: 'smile',
    motionArrow: 'out',
  },
  thankyou: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 108, y: 88, rot: 12, motionY: 16 },
    eyebrows: 'smile',
    motionArrow: 'out',
  },
  sunlight: {
    leftArm: { x: 66, y: 136, rot: -12 },
    rightArm: { x: 134, y: 58, rot: 22, motionY: 18 },
    eyebrows: 'neutral',
    motionArrow: 'wave',
  },
  water: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 112, y: 84, rot: 10, motionX: 6 },
    eyebrows: 'neutral',
    motionArrow: 'nod',
  },
  leaf: {
    leftArm: { x: 86, y: 120, rot: -30 },
    rightArm: { x: 112, y: 112, rot: 14, motionY: -10 },
    eyebrows: 'neutral',
    motionArrow: 'up',
  },
  oxygen: {
    leftArm: { x: 74, y: 112, rot: -24, motionY: -8 },
    rightArm: { x: 126, y: 112, rot: 24, motionY: -8 },
    eyebrows: 'neutral',
    motionArrow: 'out',
  },
  soundwave: {
    leftArm: { x: 70, y: 116, rot: -20, motionY: 8 },
    rightArm: { x: 130, y: 116, rot: 20, motionY: -8 },
    eyebrows: 'neutral',
    motionArrow: 'wave',
  },
  ear: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 132, y: 74, rot: 12 },
    eyebrows: 'neutral',
    motionArrow: 'wave',
  },
  fraction: {
    leftArm: { x: 82, y: 110, rot: 0 },
    rightArm: { x: 118, y: 128, rot: 0, motionY: -10 },
    eyebrows: 'neutral',
    motionArrow: 'up',
  },
  angle: {
    leftArm: { x: 82, y: 118, rot: -42 },
    rightArm: { x: 118, y: 118, rot: 42 },
    eyebrows: 'neutral',
    motionArrow: 'none',
  },
  circle: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 128, y: 98, rot: 18 },
    eyebrows: 'neutral',
    motionArrow: 'circle',
  },
  orbit: {
    leftArm: { x: 92, y: 120, rot: -10 },
    rightArm: { x: 126, y: 102, rot: 28 },
    eyebrows: 'neutral',
    motionArrow: 'circle',
  },
  earth: {
    leftArm: { x: 86, y: 124, rot: -18 },
    rightArm: { x: 114, y: 114, rot: 18, motionX: 8 },
    eyebrows: 'neutral',
    motionArrow: 'wave',
  },
  cloud: {
    leftArm: { x: 74, y: 94, rot: -20, motionX: -8 },
    rightArm: { x: 126, y: 94, rot: 20, motionX: 8 },
    eyebrows: 'neutral',
    motionArrow: 'wave',
  },
  question: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 130, y: 96, rot: 18, motionY: 8 },
    eyebrows: 'raised',
    motionArrow: 'nod',
  },
  learn: {
    leftArm: { x: 84, y: 126, rot: -20 },
    rightArm: { x: 120, y: 74, rot: 15, motionY: -12 },
    eyebrows: 'neutral',
    motionArrow: 'up',
  },
  happy: {
    leftArm: { x: 78, y: 114, rot: -22, motionY: -10 },
    rightArm: { x: 122, y: 114, rot: 22, motionY: -10 },
    eyebrows: 'smile',
    motionArrow: 'up',
  },
  understand: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 128, y: 66, rot: 10, motionY: -8 },
    eyebrows: 'smile',
    motionArrow: 'up',
  },
  yes: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 128, y: 104, rot: 14, motionY: 10 },
    eyebrows: 'smile',
    motionArrow: 'nod',
  },
  no: {
    leftArm: { x: 66, y: 142, rot: -8 },
    rightArm: { x: 128, y: 102, rot: 8, motionX: -8 },
    eyebrows: 'neutral',
    motionArrow: 'none',
  },
  help: {
    leftArm: { x: 88, y: 126, rot: -10, motionY: -10 },
    rightArm: { x: 108, y: 114, rot: 8, motionY: -10 },
    eyebrows: 'smile',
    motionArrow: 'up',
  },
};

export const SignAvatar: React.FC<SignAvatarProps> = ({
  pose = 'welcome',
  gloss,
  instruction,
  fingerspell,
  isAnimating = true,
  compact = false,
}) => {
  if (fingerspell) {
    const [thumb, index, middle, ring, pinky] = fingerspell.fingers;
    const fingerHeights = [0, 26, 46];
    const fingerWidths = [15, 13, 14, 13, 11];
    const fingerOffsets = [
      { x: 48, y: 102, angle: -34 },
      { x: 74, y: 74, angle: -4 },
      { x: 92, y: 70, angle: 0 },
      { x: 110, y: 74, angle: 4 },
      { x: 127, y: 82, angle: 10 },
    ];
    const fingerValues = [thumb, index, middle, ring, pinky];

    return (
      <div className="flex flex-col items-center w-full">
        <div
          className="w-full rounded-xl flex items-center justify-center p-4 border"
          style={{
            backgroundColor: 'var(--bg-stage)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <svg
            viewBox="0 0 200 180"
            className="w-48 h-44"
            role="img"
            aria-label={`ASL fingerspelling handshape for letter ${fingerspell.letter}: ${fingerspell.cue}`}
          >
            {/* Wrist & Palm */}
            <rect x="78" y="132" width="44" height="36" rx="8" fill="#e2b49a" stroke="#0f172a" strokeWidth="2" />
            <rect x="68" y="82" width="66" height="58" rx="18" fill="#f1c7ae" stroke="#0f172a" strokeWidth="2.2" />

            {/* Articulated 5 fingers */}
            {fingerValues.map((state, idx) => {
              const cfg = fingerOffsets[idx];
              const h = state === 2 ? fingerHeights[2] : state === 1 ? fingerHeights[1] : 16;
              const yPos = state === 0 ? cfg.y + 8 : cfg.y - h + 16;
              return (
                <g key={idx} transform={`rotate(${cfg.angle} ${cfg.x} ${cfg.y})`}>
                  <rect
                    x={cfg.x}
                    y={yPos}
                    width={fingerWidths[idx]}
                    height={h}
                    rx={fingerWidths[idx] / 2}
                    fill={state === 2 ? '#f8d5bf' : '#e4b396'}
                    stroke="#0f172a"
                    strokeWidth="2.2"
                  />
                  {state === 0 && (
                    <circle
                      cx={cfg.x + fingerWidths[idx] / 2}
                      cy={yPos + 8}
                      r="3"
                      fill="#0f172a"
                      opacity="0.35"
                    />
                  )}
                </g>
              );
            })}

            {/* Clear High-Contrast Letter Badge inside SVG */}
            <rect x="148" y="14" width="38" height="38" rx="8" fill="#ffe600" stroke="#000000" strokeWidth="2" />
            <text
              x="167"
              y="40"
              textAnchor="middle"
              fill="#000000"
              fontSize="22"
              fontWeight="800"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {fingerspell.letter}
            </text>
          </svg>
        </div>

        <p className="mt-3 text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
          Letter {fingerspell.letter}: {fingerspell.cue}
        </p>
      </div>
    );
  }

  const cfg = POSE_MAP[pose] ?? POSE_MAP.welcome;

  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative w-full rounded-xl overflow-hidden border flex items-center justify-center ${
          compact ? 'h-48' : 'h-60'
        }`}
        style={{
          backgroundColor: 'var(--bg-stage)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <svg
          viewBox="0 0 200 175"
          className="w-full h-full max-w-[230px]"
          role="img"
          aria-label={`Sign language interpreter demonstrating ${pose}. ${instruction ?? ''}`}
        >
          {/* Subtle studio backdrop circle */}
          <circle cx="100" cy="92" r="76" fill="#1e293b" opacity="0.55" />

          {/* Interpreter Torso */}
          <path
            d="M52 175 C52 132, 68 118, 100 118 C132 118, 148 132, 148 175 Z"
            fill="#0284c7"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />

          {/* Neck & Head */}
          <rect x="91" y="96" width="18" height="24" rx="6" fill="#efc3a8" />
          <ellipse cx="100" cy="70" rx="25" ry="29" fill="#f5cfb7" stroke="#0f172a" strokeWidth="1.8" />

          {/* Hair */}
          <path
            d="M75 64 C75 40, 125 40, 125 64 C122 50, 78 50, 75 64 Z"
            fill="#1e293b"
          />

          {/* Eyebrows reflecting ASL facial grammar */}
          {cfg.eyebrows === 'raised' ? (
            <>
              <path d="M84 58 Q90 52 96 57" stroke="#1e293b" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M104 57 Q110 52 116 58" stroke="#1e293b" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M84 61 Q90 58 96 60" stroke="#1e293b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path d="M104 60 Q110 58 116 61" stroke="#1e293b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Eyes */}
          <circle cx="90" cy="67" r="2.6" fill="#0f172a" />
          <circle cx="110" cy="67" r="2.6" fill="#0f172a" />

          {/* Mouth */}
          {cfg.eyebrows === 'smile' ? (
            <path d="M91 81 Q100 89 109 81" stroke="#7c2d12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M93 82 Q100 84 107 82" stroke="#7c2d12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          )}

          {/* Left Arm & Signing Hand */}
          <g className={isAnimating ? 'transition-transform duration-700' : ''}>
            <line
              x1="66"
              y1="145"
              x2={cfg.leftArm.x}
              y2={cfg.leftArm.y}
              stroke="#0369a1"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <g transform={`translate(${cfg.leftArm.x}, ${cfg.leftArm.y}) rotate(${cfg.leftArm.rot})`}>
              <ellipse cx="0" cy="0" rx="10" ry="12" fill="#f5cfb7" stroke="#0f172a" strokeWidth="1.8" />
              <line x1="-5" y1="-10" x2="-5" y2="-18" stroke="#f5cfb7" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="0" y1="-11" x2="0" y2="-20" stroke="#f5cfb7" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="5" y1="-10" x2="5" y2="-18" stroke="#f5cfb7" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>

          {/* Right Arm & Signing Hand */}
          <g className={isAnimating ? 'transition-transform duration-700' : ''}>
            <line
              x1="134"
              y1="145"
              x2={cfg.rightArm.x}
              y2={cfg.rightArm.y}
              stroke="#0369a1"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <g transform={`translate(${cfg.rightArm.x}, ${cfg.rightArm.y}) rotate(${cfg.rightArm.rot})`}>
              <ellipse cx="0" cy="0" rx="10" ry="12" fill="#f5cfb7" stroke="#0f172a" strokeWidth="1.8" />
              <line x1="-5" y1="-10" x2="-5" y2="-18" stroke="#f5cfb7" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="0" y1="-11" x2="0" y2="-20" stroke="#f5cfb7" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="5" y1="-10" x2="5" y2="-18" stroke="#f5cfb7" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>

          {/* Directional Motion Cue Arrows in High-Contrast Yellow */}
          {cfg.motionArrow === 'out' && (
            <path
              d="M144 92 L168 84 M160 80 L168 84 L162 91"
              stroke="#ffe600"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {cfg.motionArrow === 'up' && (
            <path
              d="M156 112 L156 80 M150 88 L156 80 L162 88"
              stroke="#ffe600"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {cfg.motionArrow === 'wave' && (
            <path
              d="M144 98 Q154 88 164 98 T180 98"
              stroke="#ffe600"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {cfg.motionArrow === 'circle' && (
            <path
              d="M150 96 A14 14 0 1 1 149 102 M144 98 L149 104 L156 101"
              stroke="#ffe600"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {cfg.motionArrow === 'nod' && (
            <path
              d="M156 86 L156 110 M150 103 L156 110 L162 103"
              stroke="#ffe600"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-xs font-semibold rounded bg-black/80 text-white border border-white/20">
          Sign Interpreter
        </span>
      </div>

      {gloss && (
        <div
          className="mt-2.5 p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-surface-alt)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <p className="text-xs font-bold tracking-wide" style={{ color: 'var(--accent-primary)' }}>
            ASL Gloss: {gloss}
          </p>
          {instruction && (
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {instruction}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
