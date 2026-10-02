'use client';

import React from 'react';
import { useCharacterStore, computeSkillBonus, formatModifier, calculateTotalAttributes } from '@/stores/useCharacterStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { tacticalAudio } from '@/lib/audio';
import { CODAK_SKILLS, SkillDefinition } from '@/types/codak-rules';
import { CheckSquare, Square, Star } from 'lucide-react';

export const SkillsList: React.FC = () => {
  const { characters, activeCharacterId, toggleSkillProficiency } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  const { skillProficiencies = {}, proficiencyBonus = 2 } = char || {};
  const totalAttributes = char ? calculateTotalAttributes(char) : {};
  const { dict } = useLocaleStore();
  if (!char) return null;
  const half = Math.ceil(CODAK_SKILLS.length / 2);
  const col1 = CODAK_SKILLS.slice(0, half);
  const col2 = CODAK_SKILLS.slice(half);

  const renderSkillRow = (skillDef: SkillDefinition) => {
    const profLevel = skillProficiencies[skillDef.id] || 0;
    const bonus = computeSkillBonus(skillDef.id, totalAttributes as any, profLevel as any, proficiencyBonus);
    const isCyb = skillDef.attribute === 'CYB';
    const isComposite = skillDef.attribute === 'COMPOSITE_DRIVE';

    let attrTag = `[${skillDef.attribute}]`;
    if (isComposite) attrTag = `[DEX·WIS / 2]`;

    return (
      <div
        key={skillDef.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: profLevel === 2 ? 'rgba(234, 179, 8, 0.15)' : profLevel === 1 ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          transition: 'background var(--transition-fast)',
          cursor: 'pointer',
        }}
        onClick={() => {
          toggleSkillProficiency(skillDef.id);
          tacticalAudio.playSelect();
        }}
        onMouseEnter={() => tacticalAudio.playHover()}
      >
        {/* Checkbox + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              color: profLevel === 2 ? 'var(--color-amber-primary)' : profLevel === 1 ? 'var(--color-red-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {profLevel === 2 ? <Star size={14} fill="currentColor" /> : profLevel === 1 ? <CheckSquare size={14} /> : <Square size={14} />}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: profLevel > 0 ? 700 : 500,
              color: profLevel > 0 ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {dict.skills[skillDef.id as keyof typeof dict.skills] || skillDef.id}
          </span>
        </div>

        {/* Attribute Tag + Total Calculated Bonus */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: isCyb ? 'var(--color-cyan-primary)' : isComposite ? 'var(--color-amber-primary)' : 'var(--text-muted)',
            }}
          >
            {attrTag}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: profLevel === 2 ? 'var(--color-amber-primary)' : profLevel === 1 ? 'var(--color-red-primary)' : 'var(--text-secondary)',
              minWidth: '24px',
              textAlign: 'right',
            }}
          >
            {formatModifier(bonus)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          borderBottom: 'var(--border-subtle)',
          paddingBottom: '8px',
        }}
      >
        <span style={{ color: 'var(--color-red-primary)', fontWeight: 700 }}>
          Perícias (23)
        </span>
        <span>Bônus: +{proficiencyBonus}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>{col1.map(renderSkillRow)}</div>
        <div>{col2.map(renderSkillRow)}</div>
      </div>
    </div>
  );
};
