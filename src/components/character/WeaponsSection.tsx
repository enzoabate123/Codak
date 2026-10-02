'use client';

import React, { useState } from 'react';
import { useCharacterStore, computeWeaponStats } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { Weapon } from '@/types/codak-rules';
import { Crosshair, Wrench, RotateCcw, Target, Zap } from 'lucide-react';

interface WeaponsSectionProps {
  onOpenGunsmith: (slot: 'primary' | 'secondary' | 'backup') => void;
}

export const WeaponsSection: React.FC<WeaponsSectionProps> = ({ onOpenGunsmith }) => {
  const { characters, activeCharacterId, fireWeapon, reloadWeapon, equipWeapon, unequipWeapon } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  if (!char) return null;

  const handleDragStart = (e: React.DragEvent, slot: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'equipped', slot }));
    tacticalAudio.playHover();
  };

  const handleDrop = (e: React.DragEvent, targetSlot: 'primary' | 'secondary' | 'backup') => {
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.source === 'inventory') {
          equipWeapon(data.index, targetSlot);
          tacticalAudio.playSelect();
        }
      }
    } catch(err) {}
  };

  const { primaryWeapon, secondaryWeapon, backupWeapon } = char;
  const renderWeaponCard = (weapon: Weapon | null, slot: 'primary' | 'secondary' | 'backup', title: string) => {
    if (!weapon) {
      return (
        <div 
          className="hud-panel-chamfer" 
          onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => handleDrop(e, slot)}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', background: dragOverSlot === slot ? 'rgba(239, 68, 68, 0.1)' : 'linear-gradient(135deg, rgba(16, 12, 18, 0.4) 0%, rgba(10, 10, 14, 0.4) 100%)', border: dragOverSlot === slot ? '1px dashed var(--color-red-primary)' : '1px dashed rgba(255, 255, 255, 0.1)', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={16} color="var(--text-muted)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{title}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Slot Vazio. Arraste uma arma aqui.</span>
          </div>
        </div>
      );
    }
    
    // Original rendering but add unequip
    const stats = computeWeaponStats(weapon, char);
    const maxDots = Math.min((stats.effectiveAmmoCapacity || weapon.ammoCapacity), 30);

    return (
      <div
        className="hud-panel-chamfer"
        draggable
        onDragStart={(e) => handleDragStart(e, slot)}
        onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }}
        onDragLeave={() => setDragOverSlot(null)}
        onDrop={(e) => handleDrop(e, slot)}
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          cursor: 'grab',
          border: dragOverSlot === slot ? '1px solid var(--color-red-primary)' : '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.2s',
          background: 'linear-gradient(135deg, rgba(16, 12, 18, 0.95) 0%, rgba(10, 10, 14, 0.92) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={16} color="#ef4444" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              {title}:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {weapon.name} {weapon.isMerged ? <span style={{ color: 'var(--color-cyan-primary)', fontSize: '10px' }}>(MERGED)</span> : ''}
            </span>
            <span className="hud-badge hud-badge-neutral">{weapon.type}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {char.classId === 'mecha' && char.level >= 7 && (
              <button
                type="button"
                className={`hud-btn ${weapon.isMerged ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
                style={{ padding: '6px 12px', fontSize: '10px' }}
                onClick={() => {
                  useCharacterStore.getState().toggleWeaponMerge(slot);
                  tacticalAudio.playSelect();
                }}
              >
                {weapon.isMerged ? 'DESFAZER MERGE' : 'MERGE'}
              </button>
            )}
            <button
              type="button"
              className="hud-btn hud-btn-amber"
              style={{ padding: '6px 12px', fontSize: '10px' }}
              onClick={() => {
                onOpenGunsmith(slot);
                tacticalAudio.playSelect();
              }}
            >
              GUNSMITH
            </button>
            <button
              type="button"
              className="hud-btn hud-btn-ghost"
              style={{ padding: '6px 12px', fontSize: '10px', color: '#ef4444' }}
              onClick={() => {
                useCharacterStore.getState().unequipWeapon(slot);
                tacticalAudio.playSelect();
              }}
            >
              DESEQUIPAR
            </button>
          </div>
        </div>

        {/* Dynamic Stats Row */}
        <div style={{ display: 'flex', gap: '16px', background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--color-red-primary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DANO (EFETIVO)</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#fff' }}>
              {stats.effectiveDamage}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ACERTO</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#fff' }}>
              {stats.effectiveAccuracy >= 0 ? '+' : ''}{stats.effectiveAccuracy} {stats.isProficient ? <span style={{fontSize: '9px', color: 'var(--color-green-primary)'}}>+PROF</span> : <span style={{fontSize: '9px', color: 'var(--color-red-primary)'}}>(DESVANTAGEM)</span>}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SWEET SPOT</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#fff' }}>
              {stats.effectiveSweetSpot}+
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>INIT</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#fff' }}>
              {stats.effectiveInitiative >= 0 ? '+' : ''}{stats.effectiveInitiative}
            </span>
          </div>
        </div>

        {/* Range & Special Properties */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="hud-badge hud-badge-neutral" style={{ fontSize: '9px' }}>
            RECARGA: {stats.effectiveRechargeCost}
          </span>
          {stats.activeEffects.length === 0 ? (
            <span className="hud-badge hud-badge-neutral" style={{ fontSize: '9px', opacity: 0.5 }}>SEM EFEITOS ADICIONAIS</span>
          ) : (
            stats.activeEffects.map((eff, i) => (
              <span key={i} className="hud-badge hud-badge-red" style={{ fontSize: '9px' }}>
                {eff}
              </span>
            ))
          )}
        </div>

        {/* Interactive Ammo / Burst Tracker */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              Carregador ({weapon.currentAmmo}/{(stats.effectiveAmmoCapacity || weapon.ammoCapacity)}):
            </span>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
              {Array.from({ length: maxDots }).map((_, idx) => {
                const isLoaded = idx < weapon.currentAmmo;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      fireWeapon(slot);
                    }}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isLoaded ? 'var(--color-red-primary)' : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isLoaded ? '0 0 6px rgba(239, 68, 68, 0.6)' : 'none',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    title={isLoaded ? 'Loaded (Click to spend)' : 'Empty'}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="hud-btn hud-btn-primary"
              style={{ padding: '4px 10px', fontSize: '10px' }}
              disabled={weapon.currentAmmo <= 0}
              onClick={() => {
                fireWeapon(slot);
              }}
            >
              FIRE
            </button>
            <button
              type="button"
              className="hud-btn hud-btn-ghost"
              style={{ padding: '4px 10px', fontSize: '10px' }}
              disabled={weapon.currentAmmo === (stats.effectiveAmmoCapacity || weapon.ammoCapacity)}
              onClick={() => {
                reloadWeapon(slot);
              }}
            >
              RELOAD
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}
      >
        Armamento de Combate
      </div>

      {renderWeaponCard(primaryWeapon, 'primary', 'Arma Primária')}
      {renderWeaponCard(secondaryWeapon, 'secondary', 'Arma Secundária')}
      {renderWeaponCard(backupWeapon, 'backup', 'Arma Backup')}
    </div>
  );
};
