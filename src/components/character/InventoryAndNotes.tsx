'use client';

import React, { useState } from 'react';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { Package, Shield, Watch, ArrowUpCircle } from 'lucide-react';

export const ArmorAndAccessories: React.FC = () => {
  const { characters, activeCharacterId, unequipItem, equipItem } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  if (!char) return null;

  const handleDragStart = (e: React.DragEvent, slot: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'equipped', slot }));
    tacticalAudio.playHover();
  };

  const handleDrop = (e: React.DragEvent, targetSlot: 'armor' | 'accessory') => {
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.source === 'inventory') {
          equipItem(data.index, targetSlot);
          tacticalAudio.playSelect();
        }
      }
    } catch(err) {}
  };

  return (
    <div className="hud-panel" style={{ padding: '16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        EQUIPAMENTO ATIVO
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragOverSlot('armor'); }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => handleDrop(e, 'armor')}
          style={{ padding: '12px', border: dragOverSlot === 'armor' ? '1px solid var(--color-amber-primary)' : '1px solid rgba(255,255,255,0.1)', background: dragOverSlot === 'armor' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> ARMADURA
          </div>
          {char.equipment?.armor ? (
            <div 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'armor')}
              style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
            >
              <span style={{ fontSize: '12px', color: '#fff' }}>{char.equipment.armor.name}</span>
              <button onClick={() => { unequipItem('armor'); tacticalAudio.playSelect(); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-amber-primary)', cursor: 'pointer' }}><ArrowUpCircle size={14} /></button>
            </div>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Vazio (Arraste aqui)</div>
          )}
        </div>
        
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragOverSlot('accessory'); }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => handleDrop(e, 'accessory')}
          style={{ padding: '12px', border: dragOverSlot === 'accessory' ? '1px solid var(--color-cyan-primary)' : '1px solid rgba(255,255,255,0.1)', background: dragOverSlot === 'accessory' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Watch size={12} /> ACESSÓRIO
          </div>
          {char.equipment?.accessory ? (
            <div 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'accessory')}
              style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
            >
              <span style={{ fontSize: '12px', color: '#fff' }}>{char.equipment.accessory.name}</span>
              <button onClick={() => { unequipItem('accessory'); tacticalAudio.playSelect(); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-amber-primary)', cursor: 'pointer' }}><ArrowUpCircle size={14} /></button>
            </div>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Vazio (Arraste aqui)</div>
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!char) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'inventory', index }));
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
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.source === 'inventory') {
          if (data.index !== toIndex) {
            moveInventoryItem(data.index, toIndex);
            tacticalAudio.playSelect();
          }
        } else if (data.source === 'equipped') {
          if (data.slot === 'primary' || data.slot === 'secondary' || data.slot === 'backup') {
            useCharacterStore.getState().unequipWeapon(data.slot, toIndex);
          } else {
            useCharacterStore.getState().unequipItem(data.slot as any, toIndex);
          }
          tacticalAudio.playSelect();
        }
      }
    } catch (err) {
      if (draggedIndex !== null && draggedIndex !== toIndex) {
        moveInventoryItem(draggedIndex, toIndex);
        tacticalAudio.playSelect();
      }
    }
    setDraggedIndex(null);
    setDragOverIdx(null);
  };

  return (
    <div className="hud-panel" style={{ padding: '16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Package size={14} /> MOCHILA (64 SLOTS)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: '6px' }}>
        {(char.inventory || Array(64).fill(null)).map((item, idx) => {
          let visuallyEmpty = false;
          if (item && item.type === 'ammo') {
            visuallyEmpty = true;
          }
          return (
            <div
              key={idx}
              draggable={!visuallyEmpty}
              onDragStart={(e) => { if (!visuallyEmpty) handleDragStart(e, idx); }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => handleDragEnter(e, idx)}
              onDragLeave={(e) => handleDragLeave(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => {
                if (item && !visuallyEmpty) {
                  setSelectedIndex(selectedIndex === idx ? null : idx);
                  tacticalAudio.playSelect();
                }
              }}
              style={{
                aspectRatio: '1',
                background: (item && !visuallyEmpty) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                border: dragOverIdx === idx ? '1px solid rgba(6, 182, 212, 0.6)' : (item && !visuallyEmpty) ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: dragOverIdx === idx ? '0 0 8px rgba(6, 182, 212, 0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (item && !visuallyEmpty) ? 'pointer' : 'default',
                position: 'relative',
                minWidth: 0,
                minHeight: 0,
                overflow: 'hidden'
              }}
            >
              {(item && !visuallyEmpty) && (
                <div style={{ textAlign: 'center', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>
                    {item.type === 'weapon' ? '🔫' : 
                     item.type === 'armor' ? '🛡️' : 
                     item.type === 'accessory' ? '🧲' : 
                     item.type === 'ammo' ? '📦' : 
                     item.type === 'attachment' ? '🔧' : '🧰'}
                  </span>
                  <div style={{ fontSize: '9px', color: '#fff', padding: '0 4px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }} title={item.name}>{item.name}</div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>x{item.quantity}</div>
                  
                  <div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === idx ? 1 : 0, pointerEvents: selectedIndex === idx ? 'auto' : 'none', transition: 'opacity 0.2s', gap: '4px', zIndex: 10 }}>
                    {item.type === 'weapon' ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); useCharacterStore.getState().equipWeapon(idx, 'primary'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-red-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>PRIMÁRIA</button>
                        <button onClick={(e) => { e.stopPropagation(); useCharacterStore.getState().equipWeapon(idx, 'secondary'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>SECUNDÁRIA</button>
                        <button onClick={(e) => { e.stopPropagation(); useCharacterStore.getState().equipWeapon(idx, 'backup'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--text-secondary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>BACKUP</button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); equipItem(idx, 'armor'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>ARMADURA</button>
                        <button onClick={(e) => { e.stopPropagation(); equipItem(idx, 'accessory'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-cyan-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>ACESSÓRIO</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* AMMO STASH */}
      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📦 MUNIÇÕES & BATERIAS
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {char.inventory.map((item, idx) => {
            if (!item || item.type !== 'ammo') return null;
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '14px' }}>{item.name.includes('Bateria') ? '🔋' : '📦'}</span>
                <div>
                  <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Qtd: {item.quantity}</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Deletar essa munição?')) {
                      useCharacterStore.getState().removeInventoryItem(item.id);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-amber-primary)',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    fontSize: '12px'
                  }}
                  title="Descartar"
                >
                  ✕
                </button>
              </div>
            );
          })}
          {char.inventory.filter(i => i?.type === 'ammo').length === 0 && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nenhuma munição carregada.</span>
          )}
        </div>
      </div>
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
