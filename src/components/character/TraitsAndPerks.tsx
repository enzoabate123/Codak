'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { Sparkles, Zap, Lock, Unlock, ArrowRightCircle, Info, X, BookOpen, Plus } from 'lucide-react';
import { CLASSES_CATALOG } from '@/data/classes-catalog';
import { CLASS_ABILITIES_CATALOG } from '@/data/class-abilities-catalog';
import { LORE_RULES_CATALOG } from '@/data/lore-rules-catalog';

export const TraitsAndPerks: React.FC = () => {
  const { characters, activeCharacterId, unlockSubclassAbility, addManualFeat, removeManualFeat } = useCharacterStore();
  const [selectedAbility, setSelectedAbility] = React.useState<any>(null);
  const [selectedFeatId, setSelectedFeatId] = React.useState('');
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;

  const raceAbilities = React.useMemo(() => {
    if (!char.race) return [];
    return LORE_RULES_CATALOG.filter(r => {
      if (!r.tags?.includes('Habilidade Racial')) return false;
      if (r.subtitle.includes(char.race)) return true;
      if (char.race.startsWith('Android') && r.subtitle === 'Habilidade Racial: Android') return true;
      if (char.race.startsWith('Infectado') && r.subtitle === 'Habilidade Racial: Infectado') return true;
      return false;
    });
  }, [char.race]);

  const allClasses: { def: any, level: number, isPrimary: boolean }[] = [];
  if (char.classId) {
    const mainDef = CLASSES_CATALOG.find(c => c.id === char.classId);
    if (mainDef) allClasses.push({ def: mainDef, level: char.level || 1, isPrimary: true });
  }
  if (char.secondaryClasses) {
    char.secondaryClasses.forEach(sc => {
      const scDef = CLASSES_CATALOG.find(c => c.id === sc.classId);
      if (scDef) allClasses.push({ def: scDef, level: sc.level || 1, isPrimary: false });
    });
  }

  // Feats persisted as titles so existing characters remain compatible.
  const manualTraits = char.featuresAndTraits || [];
  const featCatalog = React.useMemo(
    () => LORE_RULES_CATALOG
      .filter(rule => rule.category === 'feats' && rule.id !== 'feat-geral')
      .sort((a, b) => a.title.localeCompare(b.title)),
    []
  );
  const selectedFeat = featCatalog.find(feat => feat.id === selectedFeatId);
  const selectedFeatAlreadyAdded = !!selectedFeat && manualTraits.includes(selectedFeat.title);

  // Subclass logic - Pooled points based on total level
  const totalLevel = (char.level || 1) + (char.secondaryClasses?.reduce((acc, c) => acc + (c.level || 1), 0) || 0);
  const totalSubclassPoints = Math.floor(totalLevel / 3);
  const unlockedAbilities = char.unlockedSubclassAbilities || [];
  const availablePoints = totalSubclassPoints - unlockedAbilities.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* BASE CLASS FEATURES PANEL */}
      <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-amber-primary)', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Habilidades de Classe</span>
          <span>Nível Total {totalLevel}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {allClasses.length === 0 && manualTraits.length === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nenhuma classe selecionada.</div>
          )}

          {allClasses.map((cls, cIdx) => {
            const activeFeatures = cls.def.classFeatures.filter((f: any) => Number(f.level) <= cls.level);
            return (
              <div key={`cls-feat-${cIdx}`}>
                <div style={{ fontSize: '11px', color: 'var(--color-amber-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {cls.def.name} (Nível {cls.level})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeFeatures.length === 0 && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sem habilidades destravadas neste nível.</div>
                  )}
                  {activeFeatures.map((feat: any, idx: number) => (
                    <div key={`feat-${idx}`} style={{ padding: '8px', background: 'rgba(0, 0, 0, 0.3)', borderLeft: '2px solid var(--color-amber-primary)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {feat.name} <span style={{ fontSize: '9px', color: 'var(--color-amber-primary)' }}>[Nv {feat.level}]</span>
                        <button
                          onClick={() => {
                            tacticalAudio.playSelect();
                            const fullAb = CLASS_ABILITIES_CATALOG.find(a => a.id === feat.abilityId);
                            setSelectedAbility({
                              title: feat.name,
                              cost: fullAb?.actionCost || 'Passiva',
                              range: fullAb?.range || 'Pessoal',
                              usage: fullAb?.usageLimit || 'Sem limite',
                              desc: fullAb?.description || feat.desc,
                              rules: fullAb?.rules || []
                            });
                          }}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '2px', border: 'none', background: 'transparent' }}
                          title="Ver detalhes da habilidade"
                        >
                          <Info size={12} color="var(--color-amber-primary)" />
                        </button>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{feat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RACE ABILITIES PANEL */}
      {raceAbilities.length > 0 && (
        <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(15, 10, 14, 0.6)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-amber-primary)', fontWeight: 700 }}>
              Habilidades Raciais ({char.race})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {raceAbilities.map((rAb, idx) => (
              <div key={`race-ab-${idx}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '2px solid var(--color-amber-primary)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-amber-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} />
                    {rAb.title}
                    <button
                      onClick={() => {
                        tacticalAudio.playSelect();
                        setSelectedAbility({
                          title: rAb.title,
                          cost: 'Racial',
                          range: 'Pessoal',
                          usage: 'Passiva / Especial',
                          desc: rAb.description,
                          rules: rAb.attributes?.map(attr => `${attr.label}: ${attr.value}`) || []
                        });
                      }}
                      className="hud-btn hud-btn-ghost"
                      style={{ padding: '2px', border: 'none', background: 'transparent' }}
                      title="Ver detalhes da habilidade"
                    >
                      <Info size={12} color="var(--color-amber-primary)" />
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{rAb.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBCLASSES PANEL */}
      {allClasses.some(c => c.def.subclasses && c.def.subclasses.length > 0) && (
        <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(15, 10, 14, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-cyan-primary)', fontWeight: 700 }}>
              Árvore de Subclasses
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: availablePoints > 0 ? 'var(--color-green-primary)' : 'var(--text-muted)' }}>
              Pontos Disponíveis: {availablePoints}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
            {allClasses.map((cls, cIdx) => {
              if (!cls.def.subclasses || cls.def.subclasses.length === 0) return null;
              return (
                <div key={`sub-cls-${cIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-cyan-primary)', opacity: 0.8, textTransform: 'uppercase' }}>Subclasses de {cls.def.name}</div>
                  {cls.def.subclasses.map((sub: any, sIdx: number) => (
                    <div key={`sub-${sIdx}`} style={{ border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px', background: 'rgba(0,0,0,0.4)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{sub.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>{sub.tagline}</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sub.abilities.map((ability: any, aIdx: number) => {
                          const uniqueId = `${cls.def.id}_${sub.id}_${ability.name}`;
                          const isUnlocked = unlockedAbilities.includes(uniqueId) || unlockedAbilities.includes(ability.name);
                          const previousAbility = aIdx > 0 ? sub.abilities[aIdx - 1] : null;
                          const isPreviousUnlocked = previousAbility ? (unlockedAbilities.includes(`${cls.def.id}_${sub.id}_${previousAbility.name}`) || unlockedAbilities.includes(previousAbility.name)) : true;
                          const canUnlock = !isUnlocked && availablePoints > 0 && isPreviousUnlocked;

                          return (
                            <div key={`ab-${aIdx}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px', background: isUnlocked ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.02)', borderLeft: isUnlocked ? '2px solid var(--color-cyan-primary)' : '2px solid transparent' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: isUnlocked ? 'var(--color-cyan-primary)' : '#ccc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {isUnlocked ? <Unlock size={12} /> : <Lock size={12} color={isPreviousUnlocked ? "var(--color-cyan-primary)" : "var(--text-muted)"} opacity={isPreviousUnlocked ? 0.5 : 1} />}
                                  {ability.name}
                                  <button
                                    onClick={() => {
                                      tacticalAudio.playSelect();
                                      const fullAb = CLASS_ABILITIES_CATALOG.find(a => a.id === ability.abilityId);
                                      setSelectedAbility({
                                        title: ability.name,
                                        cost: fullAb?.actionCost || 'Passiva',
                                        range: fullAb?.range || 'Pessoal',
                                        usage: fullAb?.usageLimit || 'Sem limite',
                                        desc: fullAb?.description || ability.desc,
                                        rules: fullAb?.rules || []
                                      });
                                    }}
                                    className="hud-btn hud-btn-ghost"
                                    style={{ padding: '2px', border: 'none', background: 'transparent' }}
                                    title="Ver detalhes da habilidade"
                                  >
                                    <Info size={12} color="var(--color-cyan-primary)" />
                                  </button>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{ability.desc}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {(!isUnlocked) && (
                                  <button
                                    onClick={() => { if(canUnlock) { unlockSubclassAbility(uniqueId); tacticalAudio.playSelect(); } }}
                                    onMouseEnter={() => tacticalAudio.playHover()}
                                    disabled={!canUnlock}
                                    style={{
                                      background: canUnlock ? 'var(--color-cyan-primary)' : 'transparent',
                                      color: canUnlock ? '#000' : 'var(--text-muted)',
                                      border: canUnlock ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                      padding: '4px 8px',
                                      fontSize: '9px',
                                      fontWeight: 800,
                                      cursor: canUnlock ? 'pointer' : 'not-allowed',
                                      clipPath: 'var(--clip-chamfer-badge)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    {(!isUnlocked && !isPreviousUnlocked) ? 'REQUER ANTERIOR' : 'INVESTIR'}
                                  </button>
                                )}
                                {isUnlocked && (
                                  <div style={{ fontSize: '9px', color: 'var(--color-cyan-primary)', fontWeight: 700, padding: '4px 0' }}>ATIVO</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Perks Interactive Tracker (10 Slots) */}
      <div className="hud-panel-chamfer" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 10, 14, 0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--color-red-primary)' }}>Vantagens (Perks):</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>10 slots</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {(char.perks || Array(10).fill(false)).map((active, idx) => (
            <div
              key={idx}
              onClick={() => {
                useCharacterStore.getState().togglePerk(idx);
                tacticalAudio.playSelect();
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '4px 6px',
                background: active ? 'var(--color-red-dim)' : 'transparent',
                border: active ? '1px solid var(--color-red-border)' : '1px solid rgba(255,255,255,0.06)',
                clipPath: 'var(--clip-chamfer-badge)',
                transition: 'all var(--transition-fast)',
              }}
              title={`Perk Slot ${idx + 1}`}
            >
              <Sparkles size={14} color={active ? '#ef4444' : '#52525b'} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: active ? '#fff' : 'var(--text-dim)' }}>{active ? 'ON' : 'OFF'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feat selector — intentionally last in the abilities page */}
      <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09), rgba(0, 0, 0, 0.35))', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="var(--color-amber-primary)" />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: 'var(--color-amber-primary)', letterSpacing: '0.08em' }}>FEATS DO OPERADOR</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Selecione um talento existente no compêndio.</div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber-primary)', padding: '3px 6px', background: 'rgba(245, 158, 11, 0.12)' }}>{manualTraits.length} ATIVOS</span>
        </div>

        {manualTraits.length === 0 ? (
          <div style={{ padding: '14px', border: '1px dashed rgba(255,255,255,0.13)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '11px' }}>Nenhum feat selecionado para este operador.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
            {manualTraits.map((featName, idx) => {
              const feat = featCatalog.find(item => item.title === featName);
              return (
                <div key={`manual-${idx}`} style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderLeft: '3px solid var(--color-amber-primary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{featName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '3px' }}>{feat?.summary || 'Feat legado adicionado antes do seletor do compêndio.'}</div>
                  </div>
                  {feat && <button type="button" className="hud-btn hud-btn-ghost" onClick={() => { tacticalAudio.playSelect(); setSelectedAbility({ title: feat.title, cost: feat.attributes.find(attribute => attribute.label === 'TIPO')?.value || 'Feat', range: '—', usage: feat.attributes.find(attribute => attribute.label === 'USO')?.value || 'Passivo', desc: feat.description, rules: feat.attributes.map(attribute => `${attribute.label}: ${attribute.value}`) }); }} style={{ padding: '2px', border: 'none', background: 'transparent' }} title="Ver detalhes"><Info size={13} color="var(--color-amber-primary)" /></button>}
                  <button type="button" className="hud-btn hud-btn-ghost" onClick={() => removeManualFeat(idx)} style={{ padding: '2px 5px', fontSize: '10px', color: 'var(--color-red-primary)' }} title="Remover feat">×</button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '8px', alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
            TALENTO DISPONÍVEL ({featCatalog.length})
            <select value={selectedFeatId} onChange={event => setSelectedFeatId(event.target.value)} className="hud-input" style={{ width: '100%', minWidth: 0 }}>
              <option value="">Selecione um feat do sistema…</option>
              {featCatalog.map(feat => <option key={feat.id} value={feat.id} disabled={manualTraits.includes(feat.title)}>{feat.title}{manualTraits.includes(feat.title) ? ' — já adicionado' : ''}</option>)}
            </select>
          </label>
          <button type="button" className="hud-btn hud-btn-amber" disabled={!selectedFeat || selectedFeatAlreadyAdded} onClick={() => { if (!selectedFeat) return; addManualFeat(selectedFeat.title); setSelectedFeatId(''); tacticalAudio.playSelect(); }} style={{ minHeight: '34px', padding: '6px 10px', opacity: !selectedFeat || selectedFeatAlreadyAdded ? 0.45 : 1 }}><Plus size={14} /> ADICIONAR</button>
        </div>

        {selectedFeat && (
          <div style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.28)', border: '1px solid rgba(245, 158, 11, 0.16)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{selectedFeat.title}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>{selectedFeat.summary}</div>
            {selectedFeatAlreadyAdded && <div style={{ fontSize: '9px', color: 'var(--color-amber-primary)', marginTop: '6px' }}>Este feat já pertence ao operador.</div>}
          </div>
        )}
      </div>

      {/* ABILITY MODAL */}
      {selectedAbility && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAbility(null)}>
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              width: '400px', 
              maxWidth: '90vw', 
              background: '#0d0d12', 
              border: '1px solid var(--color-cyan-primary)', 
              borderRadius: '8px', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.1)' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="var(--color-cyan-primary)" />
                {selectedAbility.title}
              </span>
              <button onClick={() => setSelectedAbility(null)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Custo de Ação</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{selectedAbility.cost}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Alcance</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{selectedAbility.range}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Uso</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{selectedAbility.usage}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-cyan-primary)', marginBottom: '6px', fontWeight: 700 }}>Efeito / Descrição:</div>
                <div style={{ fontSize: '12px', color: '#ddd', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedAbility.desc}
                </div>
              </div>

              {selectedAbility.rules && selectedAbility.rules.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-amber-primary)', marginBottom: '6px', fontWeight: 700 }}>Atributos / Regras Adicionais:</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#bbb', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedAbility.rules.map((rule: string, i: number) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
