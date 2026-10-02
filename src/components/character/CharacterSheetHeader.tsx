'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { UserCheck, Layers, Trash2 } from 'lucide-react';
import { CLASSES_CATALOG } from '@/data/classes-catalog';

const RACES = [
  { id: 'Humano', name: 'Humano', subraces: [] },
  { id: 'Cyborgue', name: 'Cyborgue', subraces: [] },
  { 
    id: 'Infectado', 
    name: 'Infectado', 
    subraces: [
      { id: 'Infectado 115', name: 'Infectado 115' },
      { id: 'Infectado 142', name: 'Infectado 142' },
    ]
  },
  { 
    id: 'Android', 
    name: 'Android', 
    subraces: [
      { id: 'Android Análogo', name: 'Android Análogo' },
      { id: 'Android Psitrônico', name: 'Android Psitrônico' },
    ]
  },
];

export const CharacterSheetHeader: React.FC = () => {
    const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { characters, activeCharacterId, activePage, setActivePage, updateBio, deleteCharacter } = useCharacterStore();

  useEffect(() => {
    setConfirmDelete(false);
  }, [activeCharacterId]);
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;

  // Determine parent race based on current char.race value
  let parentRaceId = char.race || '';
  let subraceId = '';

  for (const r of RACES) {
    if (r.id === char.race) {
      parentRaceId = r.id;
      break;
    }
    const foundSub = r.subraces.find(sr => sr.id === char.race);
    if (foundSub) {
      parentRaceId = r.id;
      subraceId = foundSub.id;
      break;
    }
  }

  const selectedRaceConfig = RACES.find(r => r.id === parentRaceId);

  const handleRaceChange = (newParentRace: string) => {
    const config = RACES.find(r => r.id === newParentRace);
    if (config && config.subraces.length > 0) {
      // Default to the first subrace when a parent with subraces is chosen
      updateBio({ race: config.subraces[0].id });
    } else {
      updateBio({ race: newParentRace });
    }
  };

  return (
    <div
      className="hud-panel-chamfer"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(20, 14, 18, 0.95) 0%, rgba(13, 13, 17, 0.92) 100%)',
      }}
    >
      
      {/* Top row: Page Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ width: '120px' }}></div> {/* spacer */}
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'status', label: 'Status' },
            { id: 'habilidades', label: 'Habilidades' },
            { id: 'loadout', label: 'Loadout & Inventário' },
            
            { id: 'anotacoes', label: 'Anotações' },
            { id: 'backstory', label: 'Backstory' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`hud-btn ${activePage === tab.id ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '8px' }}
              onClick={() => {
                setActivePage(tab.id as any);
                tacticalAudio.playSelect();
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="hud-btn"
                style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--color-red-primary)', color: '#fff', borderRadius: '4px' }}
                onClick={() => {
                  tacticalAudio.playSelect();
                  deleteCharacter(activeCharacterId!);
                }}
              >
                APAGAR
              </button>
              <button
                type="button"
                className="hud-btn hud-btn-ghost"
                style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px' }}
                onClick={() => {
                  tacticalAudio.playSelect();
                  setConfirmDelete(false);
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="hud-btn hud-btn-ghost"
              style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
              onClick={() => {
                tacticalAudio.playSelect();
                setConfirmDelete(true);
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
              title="Apagar Personagem"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Inputs Matrix (Histórico Removido) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr' + (selectedRaceConfig?.subraces.length ? ' 1fr' : '') + (char.classId === 'mecha' ? ' 1fr' : ''), gap: '12px', alignItems: 'center' }}>
        
        {/* NOME */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Nome / Callsign</label>
          <input
            type="text"
            value={char.name || ''}
            onChange={(e) => updateBio({ name: e.target.value })}
            style={{ background: 'rgba(8, 8, 12, 0.8)', border: 'var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', fontWeight: 700, outline: 'none' }}
          />
        </div>

        {/* CLASSE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber-primary)' }}>Classe (Define Base Stats)</label>
          <select
            value={char.characterClass || ''}
            onChange={(e) => updateBio({ characterClass: e.target.value, classId: e.target.value })}
            style={{ background: 'rgba(8, 8, 12, 0.8)', border: '1px solid var(--color-amber-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-amber-primary)', fontSize: '12px', outline: 'none' }}
          >
            <option value="">Selecione...</option>
            {CLASSES_CATALOG.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        
        {/* MECHA CORE SIZE */}
        {char.classId === 'mecha' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber-primary)' }}>Tamanho do Core</label>
            <select
              value={char.mechaCoreSize || ''}
              onChange={(e) => updateBio({ mechaCoreSize: e.target.value as any })}
              style={{ background: 'rgba(8, 8, 12, 0.8)', border: '1px solid var(--color-amber-border)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
            >
              <option value="">Selecione...</option>
              <option value="Half">Half Core</option>
              <option value="Light">Light Core</option>
              <option value="Heavy">Heavy Core</option>
            </select>
          </div>
        )}

        {/* NÍVEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Nível</label>
          <input
            type="number"
            min="1"
            max="20"
            value={char.level || 1}
            onChange={(e) => updateBio({ level: parseInt(e.target.value) || 1 })}
            style={{ background: 'rgba(8, 8, 12, 0.8)', border: 'var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
          />
        </div>

        {/* RAÇA PAI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Raça</label>
          <select
            value={parentRaceId}
            onChange={(e) => handleRaceChange(e.target.value)}
            style={{ background: 'rgba(8, 8, 12, 0.8)', border: 'var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
          >
            <option value="">Selecione...</option>
            {RACES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* SUB-RAÇA (Aparece condicionalmente) */}
        {selectedRaceConfig && selectedRaceConfig.subraces.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Sub-Raça</label>
            <select
              value={subraceId || char.race}
              onChange={(e) => updateBio({ race: e.target.value })}
              style={{ background: 'rgba(8, 8, 12, 0.8)', border: 'var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
            >
              {selectedRaceConfig.subraces.map(sr => (
                <option key={sr.id} value={sr.id}>{sr.name}</option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* SECONDARY CLASSES */}
      {char.secondaryClasses && char.secondaryClasses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {char.secondaryClasses.map((sc, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-cyan-primary)' }}>Classe Secundária {idx + 1}</label>
                <select
                  value={sc.classId}
                  onChange={(e) => {
                    const newSec = [...char.secondaryClasses!];
                    newSec[idx].classId = e.target.value;
                    updateBio({ secondaryClasses: newSec });
                  }}
                  style={{ background: 'rgba(8, 8, 12, 0.8)', border: '1px solid var(--color-cyan-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-cyan-primary)', fontSize: '12px', outline: 'none' }}
                >
                  <option value="">Selecione...</option>
                  {CLASSES_CATALOG.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Nível</label>
                <input
                  type="number" min="1" max="20"
                  value={sc.level}
                  onChange={(e) => {
                    const newSec = [...char.secondaryClasses!];
                    newSec[idx].level = parseInt(e.target.value) || 1;
                    updateBio({ secondaryClasses: newSec });
                  }}
                  style={{ background: 'rgba(8, 8, 12, 0.8)', border: 'var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newSec = [...char.secondaryClasses!];
                  newSec.splice(idx, 1);
                  updateBio({ secondaryClasses: newSec });
                  tacticalAudio.playSelect();
                }}
                className="hud-btn hud-btn-ghost"
                style={{ padding: '6px 10px', borderRadius: '6px', height: '31px' }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ADD MULTICLASS BTN */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="hud-btn hud-btn-ghost"
          style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px' }}
          onClick={() => {
            const newSec = char.secondaryClasses ? [...char.secondaryClasses] : [];
            newSec.push({ classId: '', level: 1 });
            updateBio({ secondaryClasses: newSec });
            tacticalAudio.playSelect();
          }}
          onMouseEnter={() => tacticalAudio.playHover()}
        >
          + MULTI-CLASS
        </button>
      </div>
    </div>
  );
};
