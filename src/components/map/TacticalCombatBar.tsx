'use client';

import React from 'react';
import { useMapStore } from '@/stores/useMapStore';
import { tacticalAudio } from '@/lib/audio';
import { Crosshair, RotateCcw, Target, Shield, Zap, AlertTriangle, Sparkles } from 'lucide-react';

export const TacticalCombatBar: React.FC = () => {
  const {
    tokens,
    selectedTokenId,
    targetedTokenId,
    roundNumber,
    hasAction,
    hasBonusAction,
    hasMovementAction,
    hasReaction,
    movementRemainingMeters,
    spendAction,
    resetTurn,
    getTargetingEvaluation,
  } = useMapStore();
  const shooter = tokens.find((t) => t.id === selectedTokenId);
  const target = tokens.find((t) => t.id === targetedTokenId);
  const targeting = getTargetingEvaluation();

  const handleFire = () => {
    if (!hasAction) return;
    spendAction('ACTION');
    tacticalAudio.playAlert();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8, 8, 12, 0.96)',
        border: 'var(--border-subtle)',
        clipPath: 'var(--clip-chamfer-md)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        zIndex: 40,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(239, 68, 68, 0.15)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Operator & Target Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
            OPERADOR ATIVO [R{roundNumber}]
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: '#fff' }}>
            {shooter ? shooter.name.toUpperCase() : '[ SELECIONE TOKEN ]'}
          </div>
        </div>

        {target && (
          <>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-amber-primary)' }}>
                ALVO TRAVADO
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                {target.name} [{target.hpCurrent}/{target.hpMax} HP]
              </div>
            </div>
          </>
        )}
      </div>

      {/* Target Distance & Sweet Spot Evaluator */}
      {targeting && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
                DISTÂNCIA
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                {targeting.distanceMeters}m
              </div>
            </div>

            {/* Smart Sweet Spot & Disadvantage Badges */}
            {targeting.isSweetSpot && (
              <div className="hud-badge hud-badge-amber" style={{ animation: 'beaconPulse 1.5s infinite', fontSize: '10px' }}>
                <Sparkles size={12} />
                <span>SWEET SPOT! [{targeting.sweetSpotBonusDamage}]</span>
              </div>
            )}

            {targeting.isIdealRange && !targeting.isSweetSpot && (
              <div className="hud-badge hud-badge-green" style={{ fontSize: '10px' }}>
                <span>ALCANCE IDEAL</span>
              </div>
            )}

            {targeting.isDisadvantage && (
              <div className="hud-badge hud-badge-red" style={{ fontSize: '10px' }}>
                <AlertTriangle size={12} />
                <span>DESVANTAGEM</span>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

      {/* 4 Action Slots (A, BA, MA, R) */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => spendAction('ACTION')}
          className={`hud-badge ${hasAction ? 'hud-badge-red' : 'hud-badge-neutral'}`}
          style={{ padding: '6px 10px', cursor: 'pointer' }}
          title="Clique para gastar/desmarcar Action"
        >
          [A] ACTION: {hasAction ? 'PRONTA' : 'GASTA'}
        </button>

        <button
          type="button"
          onClick={() => spendAction('BONUS_ACTION')}
          className={`hud-badge ${hasBonusAction ? 'hud-badge-amber' : 'hud-badge-neutral'}`}
          style={{ padding: '6px 10px', cursor: 'pointer' }}
          title="Clique para gastar Bonus Action"
        >
          [BA] BONUS: {hasBonusAction ? 'PRONTA' : 'GASTA'}
        </button>

        <button
          type="button"
          onClick={() => spendAction('MOVEMENT_ACTION')}
          className={`hud-badge ${hasMovementAction ? 'hud-badge-green' : 'hud-badge-neutral'}`}
          style={{ padding: '6px 10px', cursor: 'pointer' }}
          title="Metros restantes de movimento no turno"
        >
          [MA] MOVE: {movementRemainingMeters}m
        </button>

        <button
          type="button"
          onClick={() => spendAction('REACTION')}
          className={`hud-badge ${hasReaction ? 'hud-badge-neutral' : 'hud-badge-neutral'}`}
          style={{ padding: '6px 10px', cursor: 'pointer', opacity: hasReaction ? 1 : 0.4 }}
          title="Reação disponível"
        >
          [R] REAÇÃO
        </button>
      </div>

      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

      {/* Fire & End Turn Controls */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="hud-btn hud-btn-primary"
          style={{ padding: '6px 16px', fontSize: '11px' }}
          disabled={!hasAction}
          onClick={handleFire}
        >
          <Crosshair size={14} />
          <span>DISPARAR (1A)</span>
        </button>

        <button
          type="button"
          className="hud-btn hud-btn-ghost"
          style={{ padding: '6px 12px', fontSize: '10px' }}
          onClick={() => {
            resetTurn();
            tacticalAudio.playSelect();
          }}
          title="Finalizar turno e restaurar ações (A, BA, MA)"
        >
          <RotateCcw size={12} />
          <span>FIM DO TURNO</span>
        </button>
      </div>
    </div>
  );
};
