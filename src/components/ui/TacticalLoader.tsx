'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

const OUTER_FILL_ORDER = [18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1];
const INNER_FILL_ORDER = [6,5,4,3,2,1];
const CYCLE_MS = 1200;
const OUTER_STEP = CYCLE_MS / 18;
const INNER_STEP = CYCLE_MS / 6;

const Arrow = ({ type, id, isDown, phase, isLit }: {
  type: 'outer' | 'inner';
  id: number;
  isDown: boolean;
  phase: string;
  isLit: boolean;
}) => {
  const size = 12;
  const time = 1.2;
  const animDelay = type === 'outer' ? -(time / 18) * id : -(time / 6) * id;

  let color = 'var(--color-red-primary)';
  if (phase === 'green' || phase === 'fading') color = 'var(--color-green-primary)';

  const isFrozen = isLit || phase === 'green' || phase === 'fading';

  return (
    <div
      style={{
        width: 0,
        height: 0,
        margin: `0 -${size / 2}px`,
        borderLeft: `${size}px solid transparent`,
        borderRight: `${size}px solid transparent`,
        borderBottom: `${size * 1.8}px solid ${color}`,
        animation: isFrozen ? 'none' : `tactical-loader-blink ${time}s infinite`,
        animationDelay: isFrozen ? undefined : `${animDelay}s`,
        opacity: isFrozen ? 1 : undefined,
        filter: `drop-shadow(0 0 ${size * 1.5}px ${color})`,
        transform: isDown ? 'rotate(180deg)' : 'none',
        transition: isFrozen ? 'border-bottom-color 0.3s ease, filter 0.3s ease' : 'none',
      }}
    />
  );
};

interface TacticalLoaderProps {
  isFinished: boolean;
  onComplete: () => void;
}

export const TacticalLoader: React.FC<TacticalLoaderProps> = ({ isFinished, onComplete }) => {
  const [phase, setPhase] = useState<'loading' | 'filling' | 'green' | 'fading'>('loading');
  const [litArrows, setLitArrows] = useState<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountTime = useRef(0);

  useEffect(() => {
    mountTime.current = performance.now();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const startFillSequence = useCallback(() => {
    setPhase('filling');

    OUTER_FILL_ORDER.forEach((id, i) => {
      const t = setTimeout(() => {
        setLitArrows(prev => new Set(prev).add(`outer-${id}`));
      }, OUTER_STEP * i);
      timers.current.push(t);
    });

    INNER_FILL_ORDER.forEach((id, i) => {
      const t = setTimeout(() => {
        setLitArrows(prev => new Set(prev).add(`inner-${id}`));
      }, INNER_STEP * i);
      timers.current.push(t);
    });

    const fillDone = OUTER_STEP * (OUTER_FILL_ORDER.length - 1) + 150;
    const tGreen = setTimeout(() => {
      setPhase('green');
      const tFade = setTimeout(() => {
        setPhase('fading');
        const tDone = setTimeout(() => onComplete(), 800);
        timers.current.push(tDone);
      }, 500);
      timers.current.push(tFade);
    }, fillDone);
    timers.current.push(tGreen);
  }, [onComplete]);

  useEffect(() => {
    if (isFinished && phase === 'loading') {
      const elapsed = performance.now() - mountTime.current;
      const posInCycle = elapsed % CYCLE_MS;
      const TARGET_PEAK = 360;
      let waitMs = TARGET_PEAK - posInCycle;
      if (waitMs <= 0) waitMs += CYCLE_MS;
      if (waitMs < 100) waitMs += CYCLE_MS;

      const t = setTimeout(startFillSequence, waitMs);
      timers.current.push(t);
    }
  }, [isFinished, phase, startFillSequence]);

  const isLit = (type: string, id: number) => litArrows.has(`${type}-${id}`);
  const isFading = phase === 'fading';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(16, 12, 20, 0.98) 0%, rgba(5, 5, 8, 1) 100%)',
        pointerEvents: 'none',
      }}
    >
      <style>
        {`
          @keyframes tactical-loader-blink {
            0% { opacity: 0.1; }
            30% { opacity: 1; }
            100% { opacity: 0.1; }
          }
          @keyframes tactical-hex-dissolve {
            0% { opacity: 1; transform: rotate(90deg) scale(1.4) translateX(0); }
            100% { opacity: 0; transform: rotate(90deg) scale(1.4) translateX(-40px); }
          }
          @keyframes tactical-text-wipe {
            0% { top: 100%; opacity: 1; }
            80% { top: 15%; opacity: 1; }
            100% { top: 0%; opacity: 0; }
          }
        `}
      </style>

      {/* Hexagon — dissolves upward when fading */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: 'rotate(90deg) scale(1.4)',
          ...(isFading ? {
            animation: 'tactical-hex-dissolve 0.7s ease-in forwards',
          } : {}),
        }}
      >
        <div style={{ display: 'flex' }}>
          <Arrow type="outer" id={18} isDown={false} phase={phase} isLit={isLit('outer',18)} />
          <Arrow type="outer" id={17} isDown={true}  phase={phase} isLit={isLit('outer',17)} />
          <Arrow type="outer" id={16} isDown={false} phase={phase} isLit={isLit('outer',16)} />
          <Arrow type="outer" id={15} isDown={true}  phase={phase} isLit={isLit('outer',15)} />
          <Arrow type="outer" id={14} isDown={false} phase={phase} isLit={isLit('outer',14)} />
        </div>
        <div style={{ display: 'flex' }}>
          <Arrow type="outer" id={1}  isDown={false} phase={phase} isLit={isLit('outer',1)} />
          <Arrow type="outer" id={2}  isDown={true}  phase={phase} isLit={isLit('outer',2)} />
          <Arrow type="inner" id={6}  isDown={false} phase={phase} isLit={isLit('inner',6)} />
          <Arrow type="inner" id={5}  isDown={true}  phase={phase} isLit={isLit('inner',5)} />
          <Arrow type="inner" id={4}  isDown={false} phase={phase} isLit={isLit('inner',4)} />
          <Arrow type="outer" id={13} isDown={true}  phase={phase} isLit={isLit('outer',13)} />
          <Arrow type="outer" id={12} isDown={false} phase={phase} isLit={isLit('outer',12)} />
        </div>
        <div style={{ display: 'flex' }}>
          <Arrow type="outer" id={3}  isDown={true}  phase={phase} isLit={isLit('outer',3)} />
          <Arrow type="outer" id={4}  isDown={false} phase={phase} isLit={isLit('outer',4)} />
          <Arrow type="inner" id={1}  isDown={true}  phase={phase} isLit={isLit('inner',1)} />
          <Arrow type="inner" id={2}  isDown={false} phase={phase} isLit={isLit('inner',2)} />
          <Arrow type="inner" id={3}  isDown={true}  phase={phase} isLit={isLit('inner',3)} />
          <Arrow type="outer" id={11} isDown={false} phase={phase} isLit={isLit('outer',11)} />
          <Arrow type="outer" id={10} isDown={true}  phase={phase} isLit={isLit('outer',10)} />
        </div>
        <div style={{ display: 'flex' }}>
          <Arrow type="outer" id={5}  isDown={true}  phase={phase} isLit={isLit('outer',5)} />
          <Arrow type="outer" id={6}  isDown={false} phase={phase} isLit={isLit('outer',6)} />
          <Arrow type="outer" id={7}  isDown={true}  phase={phase} isLit={isLit('outer',7)} />
          <Arrow type="outer" id={8}  isDown={false} phase={phase} isLit={isLit('outer',8)} />
          <Arrow type="outer" id={9}  isDown={true}  phase={phase} isLit={isLit('outer',9)} />
        </div>
      </div>

      {/* Text with scan-line wipe — no overlay, uses clip-path to avoid bg mismatch */}
      <div style={{ marginTop: '60px', position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: (phase === 'green' || phase === 'fading') ? 'var(--color-green-primary)' : 'var(--color-red-primary)',
          letterSpacing: '0.2em',
          animation: phase === 'loading' ? 'tactical-loader-blink 1.5s infinite' : 'none',
          opacity: phase === 'loading' ? undefined : 1,
          fontWeight: 700,
          transition: 'color 0.3s ease',
          clipPath: isFading ? 'inset(0 0 100% 0)' : 'inset(0 0 0 0)',
          ...(isFading ? { transition: 'clip-path 0.4s ease-out, color 0.3s ease' } : {}),
        }}>
          {(phase === 'loading' || phase === 'filling') ? 'INICIALIZANDO SISTEMAS...' : 'ACESSO LIBERADO'}
        </div>

        {/* Thin green scan-line that sweeps upward — standalone, no box */}
        {isFading && (
          <div style={{
            position: 'absolute',
            left: '-10%',
            right: '-10%',
            height: '1px',
            background: 'var(--color-green-primary)',
            boxShadow: '0 0 12px var(--color-green-primary), 0 0 4px var(--color-green-primary)',
            animation: 'tactical-text-wipe 0.4s ease-out forwards',
          }} />
        )}
      </div>
    </div>
  );
};
