const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

// I will refactor InventoryAndNotes.tsx to export ArmorAndAccessories, InventoryGrid, CampaignNotes
const imports = \`'use client';

import React, { useState } from 'react';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { Package, Shield, Watch, ArrowUpCircle } from 'lucide-react';\`;

const newCode = \`\${imports}

export const ArmorAndAccessories: React.FC = () => {
  const { characters, activeCharacterId, unequipItem } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;

  return (
    <div className="hud-panel" style={{ padding: '16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        EQUIPAMENTO ATIVO
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> ARMADURA
          </div>
          {char.equipment?.armor ? (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#fff' }}>{char.equipment.armor.name}</span>
              <button onClick={() => { unequipItem('armor'); tacticalAudio.playSelect(); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-amber-primary)', cursor: 'pointer' }}><ArrowUpCircle size={14} /></button>
            </div>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Vazio</div>
          )}
        </div>
        
        <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Watch size={12} /> ACESSÓRIO
          </div>
          {char.equipment?.accessory ? (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#fff' }}>{char.equipment.accessory.name}</span>
              <button onClick={() => { unequipItem('accessory'); tacticalAudio.playSelect(); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-amber-primary)', cursor: 'pointer' }}><ArrowUpCircle size={14} /></button>
            </div>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Vazio</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const InventoryGrid: React.FC = () => {
  const { characters, activeCharacterId, moveInventoryItem, equipItem } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (!char) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    tacticalAudio.playHover();
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIdx === index) {
      setDragOverIdx(null);
    }
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      moveInventoryItem(draggedIndex, toIndex);
      tacticalAudio.playSelect();
    }
    setDraggedIndex(null);
    setDragOverIdx(null);
  };

  return (
    <div className="hud-panel" style={{ padding: '16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Package size={14} /> MOCHILA (64 SLOTS)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
        {(char.inventory || Array(64).fill(null)).map((item, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEnter(e, idx)}
            onDragLeave={(e) => handleDragLeave(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            style={{
              aspectRatio: '1',
              background: item ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
              border: dragOverIdx === idx ? '1px solid rgba(6, 182, 212, 0.6)' : item ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
              boxShadow: dragOverIdx === idx ? '0 0 8px rgba(6, 182, 212, 0.2)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              position: 'relative'
            }}
          >
            {item && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#fff', wordBreak: 'break-word', padding: '2px' }}>{item.name.substring(0,8)}</div>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>x{item.quantity}</div>
                
                <div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', gap: '2px', zIndex: 10 }}>
                  {item.type === 'weapon' ? (
                    <>
                      <button onClick={() => useCharacterStore.getState().equipWeapon(idx, 'primary')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-red-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: PRIMÁRIA</button>
                      <button onClick={() => useCharacterStore.getState().equipWeapon(idx, 'secondary')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: SECUNDÁR</button>
                      <button onClick={() => useCharacterStore.getState().equipWeapon(idx, 'backup')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--text-secondary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: BACKUP</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => equipItem(idx, 'armor')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: ARMADURA</button>
                      <button onClick={() => equipItem(idx, 'accessory')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-cyan-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: ACESSÓR</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{\`
        .hud-panel div:hover > .inv-equip-overlay { opacity: 1 !important; }
      \`}</style>
    </div>
  );
};

export const CampaignNotes: React.FC = () => {
  const { characters, activeCharacterId, setCampaignNotes } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;

  return (
    <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        ANOTAÇÕES DE CAMPANHA
      </div>
      <textarea
        value={char.campaignNotes || ''}
        onChange={(e) => setCampaignNotes(e.target.value)}
        placeholder="Anotações, missões, lore..."
        style={{
          flex: 1,
          width: '100%',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          padding: '12px',
          resize: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};
\`;

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', newCode);
