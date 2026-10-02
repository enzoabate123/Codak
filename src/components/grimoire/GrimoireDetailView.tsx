'use client';

import React, { useEffect } from 'react';
import { tacticalAudio } from '@/lib/audio';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { ClassDefinition } from '@/data/classes-catalog';
import { LoreRuleItem } from '@/data/lore-rules-catalog';
import { ClassAbilityDetail } from '@/data/class-abilities-catalog';
import { Weapon, Attachment, Ammunition, WEAPON_IDEAL_RANGES } from '@/types/codak-rules';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GrimoireModalItem, BreadcrumbStep } from '@/types/grimoire';
import LinkedText from '@/components/grimoire/LinkedText';


interface GrimoireDetailViewProps {
  item: GrimoireModalItem;
  categoryLabel: string;
  breadcrumbsTrail?: BreadcrumbStep[];
  onBack: () => void;
  onCloseAll?: () => void;
  onNavigateToEntry?: (entryId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const GrimoireDetailView: React.FC<GrimoireDetailViewProps> = ({
  item,
  categoryLabel,
  breadcrumbsTrail,
  onBack,
  onCloseAll,
  onNavigateToEntry,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const { addInventoryItem } = useCharacterStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCloseAll) onCloseAll();
        else onBack();
        tacticalAudio.playSelect();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
        tacticalAudio.playSelect();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
        tacticalAudio.playSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onPrev, onNext, hasPrev, hasNext]);

  const getItemTitle = () => {
    switch (item.type) {
      case 'class': return item.data.name;
      case 'ability': return item.data.name;
      case 'weapon': return item.data.name;
      case 'attachment': return item.data.name;
      case 'ammo': return `Munição ${item.data.type}`;
      case 'lore_rule': return item.data.title;
      default: return 'Detalhes';
    }
  };

  const getItemSubtitle = () => {
    switch (item.type) {
      case 'class': return item.data.tagline;
      case 'ability': return `${item.data.className} • ${item.data.subclassName || 'Base'}`;
      case 'weapon': return `${item.data.type} • ${item.data.size}`;
      case 'attachment': return `${item.data.category}`;
      case 'ammo': return item.data.specialEffect || 'Balística Convencional';
      case 'lore_rule': return item.data.subtitle;
      default: return '';
    }
  };

  const renderClassContent = (cls: ClassDefinition) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="hud-panel" style={{ padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>
          <LinkedText text={cls.description} onNavigate={onNavigateToEntry} />
        </p>
      </div>
      <div className="hud-panel" style={{ padding: '16px' }}>
        <div style={{ color: 'var(--color-amber-primary)', fontWeight: 'bold' }}>HP Nível 1: {cls.hitPointsLevel1} | HP Adicional: {cls.hitPointsHigher}</div>
        <div style={{ color: '#aaa' }}>Resistências: {cls.savingThrows.join(', ')}</div>
      </div>
    </div>
  );

  const renderAbilityContent = (ab: ClassAbilityDetail) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="hud-panel" style={{ padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>
          <LinkedText text={ab.summary} onNavigate={onNavigateToEntry} />
        </p>
      </div>
      {ab.actionCost && (
        <div className="hud-badge hud-badge-red" style={{ alignSelf: 'flex-start' }}>Custo: {ab.actionCost}</div>
      )}
    </div>
  );

  const renderWeaponContent = (w: Weapon) => {
    const ideal = WEAPON_IDEAL_RANGES[w.type] || { min: 0, max: 0 };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        <button
          onClick={() => { tacticalAudio.playSelect(); addInventoryItem({ name: w.name, quantity: 1, weight: '1', notes: '', type: 'weapon', data: w }); }}
          style={{ position: 'absolute', top: '-40px', right: '0', background: 'var(--color-cyan-primary)', color: '#000', padding: '6px 12px', fontSize: '10px', fontWeight: 800, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          + ADD AO INVENTÁRIO
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="hud-panel" style={{ padding: '16px' }}>
            <div style={{ color: '#aaa', fontSize: '10px' }}>DANO BASE</div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{w.baseDamage}</div>
          </div>
          <div className="hud-panel" style={{ padding: '16px' }}>
            <div style={{ color: '#aaa', fontSize: '10px' }}>ALCANCE IDEAL</div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{ideal.min}m - {ideal.max}m</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAttachmentContent = (att: Attachment) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      <button
        onClick={() => { tacticalAudio.playSelect(); addInventoryItem({ name: att.name, quantity: 1, weight: '0.2', notes: '', type: 'attachment', data: att }); }}
        style={{ position: 'absolute', top: '-40px', right: '0', background: 'var(--color-cyan-primary)', color: '#000', padding: '6px 12px', fontSize: '10px', fontWeight: 800, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
      >
        + ADD AO INVENTÁRIO
      </button>
      <div className="hud-panel" style={{ padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>
          <LinkedText text={att.effect} onNavigate={onNavigateToEntry} />
        </p>
      </div>
    </div>
  );

  const renderAmmoContent = (ammo: Ammunition) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      <button
        onClick={() => { tacticalAudio.playSelect(); addInventoryItem({ name: ammo.type, quantity: 30, weight: '0.5', notes: '', type: 'ammo', data: ammo }); }}
        style={{ position: 'absolute', top: '-40px', right: '0', background: 'var(--color-cyan-primary)', color: '#000', padding: '6px 12px', fontSize: '10px', fontWeight: 800, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
      >
        + ADD AO INVENTÁRIO (x30)
      </button>
      <div className="hud-panel" style={{ padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>
          <LinkedText text={ammo.specialEffect || 'Munição padrão.'} onNavigate={onNavigateToEntry} />
        </p>
      </div>
    </div>
  );

  const renderLoreRuleContent = (lr: LoreRuleItem) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {(lr.category === 'equipamentos' || lr.category === 'materiais') && (
        <button
          onClick={() => { tacticalAudio.playSelect(); addInventoryItem({ name: lr.title, quantity: 1, weight: '1', notes: lr.summary, type: 'item', data: lr }); }}
          style={{ position: 'absolute', top: '-40px', right: '0', background: 'var(--color-cyan-primary)', color: '#000', padding: '6px 12px', fontSize: '10px', fontWeight: 800, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          + ADD AO INVENTÁRIO
        </button>
      )}
      <div className="hud-panel" style={{ padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>
          <LinkedText text={lr.description} onNavigate={onNavigateToEntry} />
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header / Breadcrumbs */}
      <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="hud-btn hud-btn-ghost" onClick={onBack}>VOLTAR</button>
          <span style={{ color: '#666' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{categoryLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasPrev && <button className="hud-btn hud-btn-outline" onClick={onPrev}><ChevronLeft size={14}/></button>}
          {hasNext && <button className="hud-btn hud-btn-outline" onClick={onNext}><ChevronRight size={14}/></button>}
          <button className="hud-btn hud-btn-primary" onClick={onCloseAll || onBack}><X size={14}/></button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', color: '#fff', margin: '0 0 8px 0' }}>{getItemTitle()}</h1>
        <h2 style={{ fontSize: '14px', color: '#aaa', margin: '0 0 24px 0' }}>{getItemSubtitle()}</h2>
        
        {item.type === 'class' && renderClassContent(item.data)}
        {item.type === 'ability' && renderAbilityContent(item.data)}
        {item.type === 'weapon' && renderWeaponContent(item.data)}
        {item.type === 'attachment' && renderAttachmentContent(item.data)}
        {item.type === 'ammo' && renderAmmoContent(item.data)}
        {item.type === 'lore_rule' && renderLoreRuleContent(item.data)}
      </div>
    </div>
  );
};
