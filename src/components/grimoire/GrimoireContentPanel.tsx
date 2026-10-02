'use client';

import React from 'react';
import { tacticalAudio } from '@/lib/audio';
import { GrimoireModalItem } from '@/types/grimoire';
import { ClassDefinition } from '@/data/classes-catalog';
import { ClassAbilityDetail, findAbilityByNameOrId } from '@/data/class-abilities-catalog';
import { Weapon, Attachment, Ammunition, WEAPON_IDEAL_RANGES } from '@/types/codak-rules';
import { LoreRuleItem } from '@/data/lore-rules-catalog';
import { getEntityRegistry } from '@/lib/entity-registry';
import LinkedText from '@/components/grimoire/LinkedText';
import { RelatedItemsBar, extractRelatedItems } from '@/components/grimoire/RelatedItemsBar';
import {
  Users, Zap, Crosshair, Settings, Dna, Swords,
  Bug, Shield, MapPin, BookOpen, LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Category → Icon mapping for the media placeholder zone
// ---------------------------------------------------------------------------
const CATEGORY_MEDIA_ICONS: Record<string, LucideIcon> = {
  'Classes & Subclasses': Users,
  'Habilidades de Classe': Zap,
  'Armas': Crosshair,
  'Attachments & Munições': Settings,
  'Raças': Dna,
  'Regras de Combate': Swords,
  'Infecções & Lore': Bug,
  'Equipamentos': Shield,
  'Regiões & Materiais': MapPin,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface GrimoireContentPanelProps {
  item: GrimoireModalItem | null;
  categoryLabel: string;
  imageUrl?: string;
  onNavigateToEntry?: (entryId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getItemTitle(item: GrimoireModalItem): string {
  switch (item.type) {
    case 'class': return item.data.name;
    case 'ability': return item.data.name;
    case 'weapon': return item.data.name;
    case 'attachment': return item.data.name;
    case 'ammo': return `Munição ${item.data.type}`;
    case 'lore_rule': return item.data.title;
  }
}



function getItemSubtitle(item: GrimoireModalItem): string {
  switch (item.type) {
    case 'class': return item.data.tagline;
    case 'ability': return `${item.data.className} • ${item.data.subclassName || 'Habilidade Base'} (Nível ${item.data.level})`;
    case 'weapon': return `${item.data.type} • Porte: ${item.data.size}`;
    case 'attachment': return `${item.data.category} • Slots: ${item.data.slots}`;
    case 'ammo': return item.data.specialEffect || 'Projéteis balísticos convencionais';
    case 'lore_rule': return item.data.subtitle;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const GrimoireContentPanel: React.FC<GrimoireContentPanelProps> = ({
  item,
  categoryLabel,
  imageUrl,
  onNavigateToEntry,
}) => {
  const relatedItems = React.useMemo(() => (item ? extractRelatedItems(item) : []), [item]);

  // Empty state
  if (!item) {
    return (
      <div className="grimoire-content-panel">
        <div className="grimoire-empty-state">
          <BookOpen size={48} className="grimoire-empty-state-icon" />
          <div className="grimoire-empty-state-text">
            Selecione um registro na lateral
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            SEC-02 // GRIMÓRIO & ARSENAL
          </div>
        </div>
      </div>
    );
  }

  const title = getItemTitle(item);
  const subtitle = getItemSubtitle(item);
  const MediaIcon = CATEGORY_MEDIA_ICONS[categoryLabel] || BookOpen;

  return (
    <div className="grimoire-content-panel">
      {/* Scrollable content area */}
      <div key={title || 'empty'} className="grimoire-content-scroll content-enter">
        {/* Media Zone */}
        <div className="grimoire-media-zone" style={{ position: 'relative', overflow: 'hidden' }}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 }} 
            />
          ) : (
            <>
              <MediaIcon size={56} className="grimoire-media-zone-icon" />
              <div className="grimoire-media-zone-label">
                {categoryLabel.toUpperCase()}
              </div>
            </>
          )}
          {/* Overlay gradient so text/content below blends smoothly if needed */}
          {imageUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--surface-1), transparent 40%)' }} />}
        </div>

        {/* Document Header */}
        <div
          style={{
            borderBottom: 'var(--border-subtle)',
            paddingBottom: '18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="hud-badge hud-badge-red" style={{ fontSize: '10px' }}>
              {categoryLabel.toUpperCase()}
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '22px',
            fontWeight: 900,
            color: '#fff',
            margin: '0 0 4px 0',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {title}
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-amber-primary)' }}>
            {subtitle}
          </div>
        </div>

        {/* Dynamic Detail Body by Type */}
        {item.type === 'class' && <ClassContent cls={item.data} onNavigateToEntry={onNavigateToEntry} />}
        {item.type === 'ability' && <AbilityContent ab={item.data} onNavigateToEntry={onNavigateToEntry} />}
        {item.type === 'weapon' && <WeaponContent w={item.data} onNavigateToEntry={onNavigateToEntry} />}
        {item.type === 'lore_rule' && <LoreRuleContent lr={item.data} onNavigateToEntry={onNavigateToEntry} />}
        {item.type === 'attachment' && <AttachmentContent att={item.data} onNavigateToEntry={onNavigateToEntry} />}
        {item.type === 'ammo' && <AmmoContent ammo={item.data} onNavigateToEntry={onNavigateToEntry} />}
      </div>

      {/* Related Items Bar (fixed at bottom) */}
      <RelatedItemsBar items={relatedItems} onNavigate={(id) => onNavigateToEntry?.(id)} />
    </div>
  );
};

// ======================== SUB-RENDERERS ========================

// ---------------------------------------------------------------------------
// CLASS
// ---------------------------------------------------------------------------
const ClassContent: React.FC<{ cls: ClassDefinition; onNavigateToEntry?: (id: string) => void }> = ({ cls, onNavigateToEntry }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Description */}
      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
        <LinkedText text={cls.description} onNavigate={onNavigateToEntry} />
      </div>

      {/* Core Class Stats */}
      <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)', borderBottom: 'var(--border-subtle)', paddingBottom: '6px' }}>
          Propriedades de Classe
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>DADO DE VIDA:</span> <span style={{ color: '#fff', fontWeight: 700 }}>{cls.hitDice}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>VIDA NÍVEL 1:</span> <span style={{ color: '#fff' }}>{cls.hitPointsLevel1}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>SALVAGUARDAS:</span> <span style={{ color: 'var(--color-amber-primary)', fontWeight: 700 }}>{cls.savingThrows.join(', ')}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>ATRIBUTOS-CHAVE:</span> <span style={{ color: '#fff' }}>{cls.keyStats}</span></div>
        </div>
        <div style={{ fontSize: '11px', borderTop: 'var(--border-subtle)', paddingTop: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '10px' }}>PROFICIÊNCIAS EM ARMAS: </span>
          <span style={{ color: '#fff' }}>{cls.weaponProficiencies.join(', ')}</span>
        </div>
        <div style={{ fontSize: '11px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '10px' }}>PROFICIÊNCIAS EM ARMADURAS: </span>
          <span style={{ color: '#fff' }}>{cls.armorProficiencies.join(', ')}</span>
        </div>
        <div style={{ fontSize: '11px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '10px' }}>PERÍCIAS DA CLASSE: </span>
          <span style={{ color: '#fff' }}>{cls.skillsText}</span>
        </div>
      </div>

      {/* Level Progression Table */}
      <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-amber-primary)', borderBottom: 'var(--border-subtle)', paddingBottom: '6px' }}>
          Tabela de Progressão (Níveis 1 a 20)
        </div>
        <div style={{}}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '4px', width: '35px' }}>LVL</th>
                <th style={{ padding: '4px', width: '45px' }}>BÔNUS</th>
                <th style={{ padding: '4px' }}>RECURSOS / HABILIDADES</th>
              </tr>
            </thead>
            <tbody>
              {cls.progression.map((p) => {
                const parts = p.features.split(/[+&,]/).map((s) => s.trim()).filter(Boolean);
                return (
                  <tr key={p.level} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '5px 4px', fontWeight: 700, color: 'var(--color-red-primary)' }}>{p.level}º</td>
                    <td style={{ padding: '5px 4px', color: 'var(--color-amber-primary)' }}>{p.proficiencyBonus}</td>
                    <td style={{ padding: '5px 4px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {parts.map((part, pidx) => {
                          const matchedAb = findAbilityByNameOrId(part);
                          if (matchedAb) {
                            return (
                              <button
                                key={pidx}
                                type="button"
                                className="hud-badge hud-badge-red"
                                style={{
                                  cursor: 'pointer', fontSize: '9.5px', padding: '2px 6px',
                                  border: '1px solid var(--color-red-primary)',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  transition: 'all 0.15s ease',
                                }}
                                onClick={() => { tacticalAudio.playSelect(); onNavigateToEntry?.(matchedAb.id); }}
                                title={`Abrir dossiê completo de ${matchedAb.name}`}
                              >
                                {part} ↗
                              </button>
                            );
                          }
                          return (
                            <span key={pidx} style={{ color: '#fff', fontSize: '10.5px' }}>
                              <LinkedText text={part} onNavigate={onNavigateToEntry} />
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Features Explained */}
      <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)', borderBottom: 'var(--border-subtle)', paddingBottom: '6px' }}>
          Habilidades de Classe Explicadas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cls.classFeatures.map((feat, i) => {
            const matchedAb = findAbilityByNameOrId(feat.abilityId || feat.name);
            return (
              <div key={i} style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '3px solid var(--color-red-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 700, color: '#fff' }}>
                    {feat.name} <span style={{ color: 'var(--color-amber-primary)', fontSize: '10px' }}>[NÍVEL {feat.level}]</span>
                  </div>
                  {matchedAb && (
                    <button
                      type="button" className="hud-btn hud-btn-ghost"
                      style={{ fontSize: '9.5px', padding: '3px 8px' }}
                      onClick={() => { tacticalAudio.playSelect(); onNavigateToEntry?.(matchedAb.id); }}
                    >
                      DOSSIÊ ↗
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <LinkedText text={feat.desc} onNavigate={onNavigateToEntry} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subclasses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="hud-panel-chamfer" style={{ padding: '14px 16px', background: 'rgba(15, 12, 20, 0.95)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: 'var(--color-amber-primary)' }}>
            Subclasses & Especializações
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Clique em qualquer habilidade para inspecionar regras e dados de rolagem.
          </p>
        </div>
        {cls.subclasses.map((sub, idx) => (
          <div key={idx} className="hud-panel" style={{ padding: '14px 16px', borderLeft: '3px solid var(--color-amber-primary)', background: 'rgba(12, 12, 16, 0.9)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: '#fff' }}>{sub.name}</div>
              <span className="hud-badge hud-badge-amber">SUBCLASSE</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
              <LinkedText text={sub.tagline} onNavigate={onNavigateToEntry} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sub.abilities.map((ab, aidx) => {
                const matchedAb = findAbilityByNameOrId(ab.abilityId || ab.name);
                return (
                  <div
                    key={aidx}
                    style={{
                      padding: '8px 10px', background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      cursor: matchedAb ? 'pointer' : 'default', transition: 'all 0.15s ease',
                    }}
                    onClick={() => { if (matchedAb) { tacticalAudio.playSelect(); onNavigateToEntry?.(matchedAb.id); } }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-red-primary)' }}>★ {ab.name}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.35' }}>
                        <LinkedText text={ab.desc} onNavigate={onNavigateToEntry} />
                      </div>
                    </div>
                    {matchedAb && (
                      <span style={{ color: 'var(--color-amber-primary)', fontFamily: 'var(--font-mono)', fontSize: '9.5px', whiteSpace: 'nowrap' }}>ABRIR ↗</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ABILITY
// ---------------------------------------------------------------------------
const AbilityContent: React.FC<{ ab: ClassAbilityDetail; onNavigateToEntry?: (id: string) => void }> = ({ ab, onNavigateToEntry }) => {
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'Ação': return 'hud-badge-red';
      case 'Ação Bônus': return 'hud-badge-amber';
      case 'Reação': return 'hud-badge-cyan';
      case 'Passiva': return 'hud-badge-neutral';
      default: return 'hud-badge-amber';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Action Classification Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span className={`hud-badge ${getActionBadgeClass(ab.actionCost)}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
          [{ab.actionCost.toUpperCase()}]
        </span>
        <span className="hud-badge hud-badge-neutral" style={{ fontSize: '11px' }}>
          NÍVEL MÍNIMO: {ab.level}
        </span>
        {ab.subclassName ? (
          <span className="hud-badge hud-badge-amber" style={{ fontSize: '11px' }}>
            SUBCLASSE: {ab.subclassName.toUpperCase()}
          </span>
        ) : (
          <span className="hud-badge hud-badge-neutral" style={{ fontSize: '11px' }}>
            HABILIDADE BASE DA CLASSE
          </span>
        )}
        <button
          type="button" className="hud-btn hud-btn-ghost"
          style={{ padding: '4px 10px', fontSize: '10px', marginLeft: 'auto' }}
          onClick={() => { tacticalAudio.playSelect(); onNavigateToEntry?.(`cls-${ab.classId}`); }}
        >
          VER CLASSE: {ab.className.toUpperCase()} →
        </button>
      </div>

      {/* Summary */}
      <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, lineHeight: '1.45' }}>
        <LinkedText text={ab.summary} onNavigate={onNavigateToEntry} />
      </div>

      {/* Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>CUSTO DE AÇÃO</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color: 'var(--color-red-primary)', marginTop: '4px' }}>{ab.actionCost}</div>
        </div>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>RECARGA / USOS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--color-amber-primary)', marginTop: '6px' }}>{ab.usageLimit}</div>
        </div>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>ALCANCE / ÁREA</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '6px' }}>{ab.range}</div>
        </div>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>CLASSE DE ORIGEM</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--color-cyan-primary)', marginTop: '4px' }}>{ab.className}</div>
        </div>
      </div>

      {/* Rules & Tactical */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '18px' }}>
        <div className="hud-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)', borderBottom: 'var(--border-subtle)', paddingBottom: '8px' }}>
            Detalhamento Mecânico
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
            <LinkedText text={ab.description} onNavigate={onNavigateToEntry} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {ab.rules.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '11px', lineHeight: '1.45', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderLeft: '2px solid var(--color-amber-primary)' }}>
                <span style={{ color: 'var(--color-amber-primary)', fontWeight: 700 }}>•</span>
                <span style={{ color: '#fff' }}><LinkedText text={rule} onNavigate={onNavigateToEntry} /></span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="hud-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-amber-primary)', borderBottom: 'var(--border-subtle)', paddingBottom: '8px' }}>
              Protocolo Tático
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <LinkedText text={ab.tacticalTip} onNavigate={onNavigateToEntry} />
            </p>
          </div>

          <div className="hud-panel-chamfer" style={{ padding: '14px', background: 'rgba(12, 12, 16, 0.9)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              TAGS DE BUSCA E MECÂNICA
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(ab.tags || []).map((tag, tidx) => (
                <span key={tidx} className="hud-badge hud-badge-neutral" style={{ fontSize: '10px' }}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WEAPON
// ---------------------------------------------------------------------------
const WeaponContent: React.FC<{ w: Weapon; onNavigateToEntry?: (id: string) => void }> = ({ w, onNavigateToEntry }) => {
  const ideal = WEAPON_IDEAL_RANGES[w.type] || { min: 10, max: 30 };
  const compatibleAttachments = getEntityRegistry().getCompatibleAttachments(w);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>DANO BASE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{w.baseDamage}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-amber-primary)' }}>+{w.sweetSpotBonusDamage || '0'} no Sweet Spot</div>
        </div>
        <div className="hud-panel-chamfer" style={{ padding: '12px', textAlign: 'center', borderLeftColor: 'var(--color-amber-primary)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-amber-primary)' }}>SWEET SPOT (SS)</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 800, color: 'var(--color-amber-primary)', margin: '4px 0' }}>{w.sweetSpot}m</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>Distância Focal Exata</div>
        </div>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>ALCANCE IDEAL</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{ideal.min}m — {ideal.max}m</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-green-primary)' }}>Sem Desvantagem</div>
        </div>
        <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>CUSTO DE RECARGA</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{w.rechargeCost}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>Ação Necessária</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {/* Specs */}
        <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)' }}>
            Especificações Técnicas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>CATEGORIA:</span> <span style={{ color: '#fff' }}>{w.type.toUpperCase()}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>PORTE:</span> <span style={{ color: '#fff' }}>{w.size.toUpperCase()}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>VALOR:</span> <span style={{ color: 'var(--color-amber-primary)' }}>₵ {w.cost.toLocaleString()}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>PENTE:</span> <span style={{ color: '#fff' }}>{w.ammoCapacity} balas</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>CADÊNCIA:</span> <span style={{ color: '#fff' }}>{w.burstRate}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>SLOTS ATT.:</span> <span style={{ color: '#fff' }}>{w.attachmentSlots} slot(s)</span></div>
          </div>
        </div>

        {/* Compatible Attachments */}
        <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-amber-primary)' }}>
            Attachments Compatíveis ({compatibleAttachments.length})
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {compatibleAttachments.length > 0 ? (
              compatibleAttachments.map(attRef => (
                <button
                  key={attRef.id} className="hud-badge hud-badge-neutral"
                  style={{ fontSize: '10px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={() => { tacticalAudio.playSelect(); onNavigateToEntry?.(attRef.id); }}
                >{attRef.name} ↗</button>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nenhum attachment compatível.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LORE / RULE
// ---------------------------------------------------------------------------
const LoreRuleContent: React.FC<{ lr: LoreRuleItem; onNavigateToEntry?: (id: string) => void }> = ({ lr, onNavigateToEntry }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
    <div style={{ fontSize: '12.5px', color: '#fff', lineHeight: '1.45' }}>
      <LinkedText text={lr.summary} onNavigate={onNavigateToEntry} />
    </div>

    {lr.attributes.length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(lr.attributes.length, 4)}, 1fr)`, gap: '10px' }}>
        {lr.attributes.map((att, i) => (
          <div key={i} className="hud-panel" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>{att.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{att.value}</div>
          </div>
        ))}
      </div>
    )}

    <div className="hud-panel" style={{ padding: '20px', whiteSpace: 'pre-line', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
      <LinkedText text={lr.description} onNavigate={onNavigateToEntry} block />
    </div>

    {lr.tableData && (
      <div className="hud-panel" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)', marginBottom: '10px' }}>
          Tabela de Conciliação Mecânica (1d20)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '6px', textAlign: 'left', width: '100px' }}>ROLAGEM</th>
              <th style={{ padding: '6px', textAlign: 'left' }}>CONSEQUÊNCIA / EFEITO TÁTICO</th>
            </tr>
          </thead>
          <tbody>
            {lr.tableData.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '6px', fontWeight: 800, color: 'var(--color-red-primary)' }}>{row.col1}</td>
                <td style={{ padding: '6px', color: '#fff' }}><LinkedText text={row.col2} onNavigate={onNavigateToEntry} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// ATTACHMENT
// ---------------------------------------------------------------------------
const AttachmentContent: React.FC<{ att: Attachment; onNavigateToEntry?: (id: string) => void }> = ({ att, onNavigateToEntry }) => {
  const compatibleWeapons = getEntityRegistry().getCompatibleWeapons(att);

  let compatStr = 'Universal';
  if (!att.compatibility.all) {
    compatStr = Object.values(att.compatibility).flat().filter(Boolean).join(', ') || 'Específico';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="hud-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: 'var(--color-amber-primary)' }}>
          EFEITO TÁTICO: <LinkedText text={att.effect} onNavigate={onNavigateToEntry} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          SLOTS REQUERIDOS: <span style={{ color: '#fff', fontWeight: 700 }}>{att.slots}</span> // COMPATIBILIDADE: <span style={{ color: '#fff', fontWeight: 700 }}>{compatStr}</span> // PREÇO: <span style={{ color: 'var(--color-amber-primary)', fontWeight: 700 }}>₵ {att.price}</span>
        </div>
      </div>

      <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)' }}>
          Armas Compatíveis ({compatibleWeapons.length})
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {compatibleWeapons.length > 0 ? (
            compatibleWeapons.map(wRef => (
              <button
                key={wRef.id} className="hud-badge hud-badge-neutral"
                style={{ fontSize: '10px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => { tacticalAudio.playSelect(); onNavigateToEntry?.(wRef.id); }}
              >{wRef.name} ↗</button>
            ))
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nenhuma arma compatível encontrada.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AMMO
// ---------------------------------------------------------------------------
const AmmoContent: React.FC<{ ammo: Ammunition; onNavigateToEntry?: (id: string) => void }> = ({ ammo, onNavigateToEntry }) => (
  <div className="hud-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: 'var(--color-cyan-primary)' }}>
      DANO ADICIONAL: {ammo.bonusDamage || 'Dano Balístico Normal'}
    </div>
    <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.5' }}>
      <LinkedText text={ammo.specialEffect || 'Projéteis cinéticos convencionais'} onNavigate={onNavigateToEntry} />
    </div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
      PREÇO POR DISPARO: <span style={{ color: 'var(--color-amber-primary)', fontWeight: 700 }}>₵ {ammo.pricePerBullet}</span>
    </div>
  </div>
);
