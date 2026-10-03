'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { CharacterSheetHeader } from '@/components/character/CharacterSheetHeader';
import { AttributesMatrix } from '@/components/character/AttributesMatrix';
import { SkillsList } from '@/components/character/SkillsList';
import { VitalsAndStats } from '@/components/character/VitalsAndStats';
import { WeaponsSection } from '@/components/character/WeaponsSection';
import { TraitsAndPerks } from '@/components/character/TraitsAndPerks';
import { InventoryGrid, ArmorAndAccessories, CampaignNotes } from '@/components/character/InventoryAndNotes';
import { ManualInventoryControls } from '@/components/character/ManualInventoryControls';
import { GunsmithModal } from '@/components/gunsmith/GunsmithModal';
import { User, Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { tacticalAudio } from '@/lib/audio';

export const CharactersView: React.FC = () => {
  const { characters, activeCharacterId, selectCharacter, createCharacter, activePage, fetchCharacters, updateBio } = useCharacterStore();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchCharacters();
    setMounted(true);
  }, []);

  const [gunsmithSlot, setGunsmithSlot] = useState<'primary' | 'secondary' | 'backup' | null>(null);
  const activeChar = characters.find(c => c.id === activeCharacterId);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* SIDEBAR TOGGLE WHEN CLOSED (Absolute so it doesn't break layout during animation) */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          zIndex: 10,
          opacity: isSidebarOpen ? 0 : 1,
          pointerEvents: isSidebarOpen ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
        }}
      >
        <button
          type="button"
          className="hud-btn hud-btn-ghost"
          style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-panel)' }}
          onClick={() => { tacticalAudio.playWheelToggle(true); setIsSidebarOpen(true); }}
          onMouseEnter={() => tacticalAudio.playHover()}
          title="Mostrar painel"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      {/* MASTER (Sidebar) */}
      <div className={`grimoire-sidebar ${isSidebarOpen ? '' : 'grimoire-sidebar--closed'}`}>
        <div className="grimoire-sidebar-content-wrapper">
          <div style={{ padding: '16px', borderBottom: 'var(--border-subtle)', flexShrink: 0, display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="hud-btn hud-btn-amber"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => { tacticalAudio.playSelect(); createCharacter(); }}
              onMouseEnter={() => tacticalAudio.playHover()}
            >
              <Plus size={14} /> NOVO
            </button>
            <button
              type="button"
              className="hud-btn hud-btn-ghost"
              style={{ width: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onClick={() => { tacticalAudio.playWheelToggle(false); setIsSidebarOpen(false); }}
              onMouseEnter={() => tacticalAudio.playHover()}
              title="Esconder painel"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          
          <div className="grimoire-item-list">
            {characters.map((char, idx) => {
              const isActive = char.id === activeCharacterId;
              return (
                <div
                  key={char.id}
                  className={`grimoire-sidebar-item sidebar-cascade-item ${isActive ? 'grimoire-sidebar-item--active' : ''}`}
                  style={{ '--item-idx': idx } as React.CSSProperties}
                  onClick={() => { tacticalAudio.playSelect(); selectCharacter(char.id); }}
                  onMouseEnter={() => tacticalAudio.playHover()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} />
                    <span>{char.callsign || char.name}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    LVL {char.level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAIL (Content Panel) */}
      <div className="grimoire-content-panel">
        {!activeChar ? (
          <div className="grimoire-empty-state">
            <User size={48} className="grimoire-empty-state-icon" />
            <div className="grimoire-empty-state-text">SELECIONE UM OPERADOR</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px', padding: '16px 32px 24px 32px', overflowY: 'auto' }}>
            <CharacterSheetHeader />

            <div key={activePage} className="view-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activePage === 'status' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                  <VitalsAndStats />
                  <AttributesMatrix />
                  <SkillsList />
                </div>
              )}
              {activePage === 'habilidades' && <TraitsAndPerks />}
              {activePage === 'loadout' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
                    <WeaponsSection onOpenGunsmith={(slot) => setGunsmithSlot(slot)} />
                    <ArmorAndAccessories />
                  </div>
                  <div style={{ overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InventoryGrid />
                    <ManualInventoryControls />
                  </div>
                </div>
              )}
              {activePage === 'anotacoes' && <CampaignNotes />}
              {activePage === 'backstory' && (
                <div className="hud-panel">
                  <div className="hud-panel-header">HISTÓRICO & BIOGRAFIA</div>
                  <textarea
                    value={activeChar.bio || ''}
                    onChange={(e) => updateBio({ bio: e.target.value })}
                    placeholder="Registro militar, origens, anotações de combate..."
                    className="hud-input"
                    style={{ minHeight: '300px', width: '100%', resize: 'vertical' }}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {gunsmithSlot && activeChar && (
        <GunsmithModal 
          slot={gunsmithSlot} 
          onClose={() => { tacticalAudio.playSelect(); setGunsmithSlot(null); }} 
        />
      )}
    </div>
  );
};
