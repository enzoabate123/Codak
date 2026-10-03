'use client';

import React from 'react';
import { useCharacterStore, getAttributeModifier, formatModifier, calculateTotalAttributes } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { Heart, Shield, Zap, Footprints, Award } from 'lucide-react';

export const VitalsAndStats: React.FC = () => {
  const { characters, activeCharacterId, updateHp, updateVitals, setTempHp, updateResource } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;

  const { hpCurrent, hpMax, tempHp, speedMeters, proficiencyBonus, resourceName, resourceCurrent, resourceMax } = char;
  
  // Calculate dynamic armor class (Base + Armor eq)
  const baseAc = char.armorClass || 10;
  const eqAc = (char.equipment?.armor?.bonusAttributes as any)?.AC || 0;
  const armorClass = baseAc + eqAc;

  const totalAttributes = calculateTotalAttributes(char);
  const dexMod = getAttributeModifier(totalAttributes.DEX);

  const hpPercentage = Math.round((hpCurrent / hpMax) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: resourceMax ? '1.8fr 1.8fr 1fr 1fr 1fr 1fr' : '1.8fr 1fr 1fr 1fr 1fr', gap: '10px' }}>
      {/* HP Container */}
      <div className="hud-panel-chamfer" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(13, 13, 17, 0.95) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart size={14} color="#ef4444" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-red-primary)' }}>Pontos de Vida</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Temp: {tempHp}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 800, color: '#fff' }}>{hpCurrent}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>/ {hpMax}</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${hpPercentage}%`, background: hpPercentage > 50 ? 'var(--color-green-primary)' : hpPercentage > 25 ? 'var(--color-amber-primary)' : 'var(--color-red-primary)', boxShadow: hpPercentage <= 25 ? '0 0 10px #ef4444' : 'none', transition: 'all var(--transition-normal)' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(239, 68, 68, 0.2)', border: 'var(--border-red)' }} onClick={() => { updateHp(-5); tacticalAudio.playAlert(); }}>-5 HP</button>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(239, 68, 68, 0.2)', border: 'var(--border-red)' }} onClick={() => { updateHp(-1); tacticalAudio.playAlert(); }}>-1 HP</button>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(34, 197, 94, 0.2)', border: 'var(--border-subtle)' }} onClick={() => { updateHp(5); tacticalAudio.playSelect(); }}>+5 HP</button>
        </div>
        <details style={{ marginTop: '8px' }}>
          <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>EDITAR VALORES</summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '8px' }}>
            {([
              ['PV atual', 'hpCurrent', hpCurrent], ['PV máximo', 'hpMax', hpMax],
              ['PV temporário', 'tempHp', tempHp], ['CA base', 'armorClass', baseAc],
              ['Velocidade', 'speedMeters', speedMeters],
            ] as const).map(([label, field, value]) => (
              <label key={field} style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                {label}
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(event) => updateVitals({ [field]: Number(event.target.value) } as any)}
                  className="hud-input"
                  style={{ width: '100%', marginTop: '3px', padding: '4px 6px', fontSize: '11px' }}
                />
              </label>
            ))}
          </div>
        </details>
      </div>

      
      {/* Resource Container */}
      {resourceMax ? (
      <div className="hud-panel-chamfer" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(13, 13, 17, 0.95) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#3b82f6" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-cyan-primary)' }}>{resourceName || 'Energy'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 800, color: '#fff' }}>{resourceCurrent || 0}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>/ {resourceMax}</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((resourceCurrent || 0) / resourceMax) * 100}%`, background: 'var(--color-cyan-primary)', transition: 'all var(--transition-normal)' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--color-cyan-border)' }} onClick={() => { updateResource(-1); tacticalAudio.playAlert(); }}>-1</button>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--color-cyan-border)' }} onClick={() => { updateResource(1); tacticalAudio.playSelect(); }}>+1</button>
        </div>
      </div>
      ) : null}

      {/* Armor Class */}
      <div className="hud-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}><Shield size={14} color="#f59e0b" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700 }}>AC</span></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 800, color: 'var(--color-amber-primary)', margin: '4px 0' }}>{armorClass}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{eqAc > 0 ? `Base: ${baseAc} + Eq: ${eqAc}` : 'Classe de Armadura'}</div>
      </div>

      {/* Initiative */}
      <div className="hud-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}><Zap size={14} color="#ef4444" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700 }}>INICIATIVA</span></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{formatModifier(dexMod)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Reflexo (DEX)</div>
      </div>

      {/* Speed */}
      <div className="hud-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}><Footprints size={14} color="#22c55e" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700 }}>VELOCIDADE</span></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{speedMeters}m</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>6 quadrados</div>
      </div>

      {/* Proficiency */}
      <div className="hud-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}><Award size={14} color="#06b6d4" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700 }}>PROFICIÊNCIA</span></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 800, color: 'var(--color-cyan-primary)', margin: '4px 0' }}>+{proficiencyBonus}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Nível { (char.level || 1) + (char.secondaryClasses?.reduce((acc, cls) => acc + (cls.level || 1), 0) || 0) }</div>
      </div>
    </div>
  );
};
