'use client';

import React from 'react';
import { useCharacterStore, getAttributeModifier, formatModifier, calculateTotalAttributes } from '@/stores/useCharacterStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { tacticalAudio } from '@/lib/audio';
import { CoreAttribute } from '@/types/codak-rules';
import { Plus, Minus } from 'lucide-react';

const ORDERED_ATTRIBUTES: CoreAttribute[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'CYB'];

export const AttributesMatrix: React.FC = () => {
  const { characters, activeCharacterId, updateAllocatedAttribute } = useCharacterStore();
  const { dict } = useLocaleStore();
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;

  const totalAttributes = calculateTotalAttributes(char);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        <span>ATRIBUTOS E STATUS</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {ORDERED_ATTRIBUTES.map((attr) => {
          const score = totalAttributes[attr] || 10;
          const modifier = getAttributeModifier(score);
          const isCyb = attr === 'CYB';
          
          const base = char.attributes[attr] || 10;
          const alloc = char.allocatedAttributes?.[attr] || 0;
          const eqArmor = char.equipment?.armor?.bonusAttributes?.[attr] || 0;
          const eqAcc = char.equipment?.accessory?.bonusAttributes?.[attr] || 0;
          const eqTotal = eqArmor + eqAcc;

          return (
            <div
              key={attr}
              className="hud-panel"
              style={{ padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '155px', border: isCyb ? '1px solid var(--color-cyan-primary)' : 'var(--border-subtle)', background: isCyb ? 'rgba(6, 182, 212, 0.05)' : 'var(--surface-card)', boxShadow: isCyb ? '0 0 16px rgba(6, 182, 212, 0.15)' : 'none' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: isCyb ? 'var(--color-cyan-primary)' : 'var(--color-red-primary)', letterSpacing: '0.08em' }}>{attr}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{dict.attributes[attr]}</div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: isCyb ? 'var(--color-cyan-primary)' : '#ffffff', textShadow: isCyb ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none' }}>
                {formatModifier(modifier)}
              </div>

              {/* Detailed Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '-4px' }}>
                <div>Total: {score}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>Base: {base}</div>
                {eqTotal > 0 && <div style={{ color: 'var(--color-green-primary)' }}>Eq: +{eqTotal}</div>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 0, 0, 0.6)', padding: '2px 4px', border: 'var(--border-subtle)', marginTop: '4px' }}>
                <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} onClick={() => { updateAllocatedAttribute(attr, -1); tacticalAudio.playSelect(); }} onMouseEnter={() => tacticalAudio.playHover()}>
                  <Minus size={12} />
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, minWidth: '20px', textAlign: 'center', color: alloc > 0 ? 'var(--color-amber-primary)' : 'var(--text-secondary)' }}>
                  +{alloc}
                </span>
                <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} onClick={() => { updateAllocatedAttribute(attr, 1); tacticalAudio.playSelect(); }} onMouseEnter={() => tacticalAudio.playHover()}>
                  <Plus size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
