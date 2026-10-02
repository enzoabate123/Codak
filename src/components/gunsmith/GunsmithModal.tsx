'use client';

import React, { useState } from 'react';
import { useCharacterStore, computeWeaponStats } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';
import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';
import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { AttachmentCategory, AmmunitionType, Attachment, Weapon } from '@/types/codak-rules';
import { Wrench, X, Check, Plus, Trash2, Crosshair, Shield, Zap, Sparkles } from 'lucide-react';

interface GunsmithModalProps {
  slot: 'primary' | 'secondary' | 'backup';
  onClose: () => void;
}

const CATEGORIES: AttachmentCategory[] = ['Barrels', 'Optics', 'Stock', 'Grips', 'Mags', 'Modifiers'];


const isAttachmentCompatible = (att: Attachment, w: Weapon) => {
  const c = att.compatibility;
  if (!c) return false;
  if (c.all) return true;
  if (c.weaponSizes && !c.weaponSizes.includes(w.size)) return false;
  if (c.weaponTypes && !c.weaponTypes.includes(w.type)) return false;
const baseWeapon = WEAPONS_CATALOG.find(cw => cw.id === w.id);
  const baseAmmo = baseWeapon ? baseWeapon.loadedAmmoType : w.loadedAmmoType;
  const weaponAmmoCategory = baseAmmo === 'Energy' ? 'Energy' : 'Fire';
  
  if (c.ammoCategories && !c.ammoCategories.includes(weaponAmmoCategory)) return false;
  // if (c.firingModes && !c.firingModes.includes(w.firingMode)) return false; // not implemented on Weapon
  if (c.specificWeaponIds && !c.specificWeaponIds.includes(w.id)) return false;
  return true;
};

export const GunsmithModal: React.FC<GunsmithModalProps> = ({ slot, onClose }) => {
  const { characters, activeCharacterId, attachToWeapon, detachFromWeapon, setWeaponAmmoType } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  const { primaryWeapon, secondaryWeapon, backupWeapon } = char || {};
  if (!char) return null;
  const weapon = slot === 'primary' ? primaryWeapon : slot === 'secondary' ? secondaryWeapon : backupWeapon;
  if (!weapon) return null;
  const stats = computeWeaponStats(weapon, char);

  let hasMoreAttachments = false;
  const unlocked = char.unlockedSubclassAbilities || [];
  const gunnerSubclasses = ['certain-shot', 'point-blank', 'fine-control', 'dual-wield', 'bigger-burst'];
  
  if (char.classId === 'gunner') {
    gunnerSubclasses.forEach(subId => {
      const uniqueId = `gunner_${subId}_More Attachments`;
      const isUnlocked = unlocked.includes(uniqueId) || unlocked.includes('More Attachments');
      if (isUnlocked) {
        let match = false;
        if (subId === 'certain-shot' && weapon.type === 'Sniper') match = true;
        if (subId === 'point-blank' && weapon.type === 'Shotgun') match = true;
        if (subId === 'fine-control' && weapon.type === 'Submachine') match = true;
        if (subId === 'dual-wield' && weapon.type === 'Pistol') match = true;
        if (subId === 'bigger-burst' && weapon.type === 'LMG') match = true;
        if (match) hasMoreAttachments = true;
      }
    });
  }

  const maxSlots = (weapon.attachmentSlots || 0) + (hasMoreAttachments ? 1 : 0);
  
  const currentSlots = (weapon.equippedAttachments || []).reduce((sum, attId) => {
    const att = ATTACHMENTS_CATALOG.find(a => a.id === attId);
    return sum + (att?.slots || 0);
  }, 0);

  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory | 'Ammunition'>('Optics');

  // Filter attachments for current selected category
  // Filter attachments for current selected category from INVENTORY
  const categoryAttachments = char.inventory
    .map((item, idx) => ({ item, invId: item?.id, idx }))
    .filter((entry) => entry.item && entry.item.type === 'attachment' && entry.item.data?.category === selectedCategory && isAttachmentCompatible(entry.item.data, weapon));
    
  // Filter ammos from INVENTORY
  const inventoryAmmos = char.inventory
    .map((item, idx) => ({ item, invId: item?.id, idx }))
    .filter((entry) => entry.item && entry.item.type === 'ammo');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 8, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 48px',
      }}
    >
      {/* Gunsmith Modal Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: 'var(--border-subtle)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wrench size={22} color="#f59e0b" />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, letterSpacing: '0.06em', color: '#fff' }}>
              GUNSMITH ARSENAL // {weapon.name.toUpperCase()} [{slot.toUpperCase()}]
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              TYPE: {weapon.type.toUpperCase()} // SLOTS DE MODIFICAÇÃO: {currentSlots} / {maxSlots} {hasMoreAttachments ? "(+1 Gunner)" : ""}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            tacticalAudio.playSelect();
          }}
          className="hud-btn hud-btn-ghost"
          style={{ padding: '8px 12px' }}
        >
          <X size={16} />
          <span>FECHAR MODAL</span>
        </button>
      </div>

      {/* Main Workbench Body: Left Schematic & Slots / Right Catalog */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1.3fr', gap: '28px', overflow: 'hidden' }}>
        {/* Left: Weapon Schematic & 6 Visual Attachment Anchors */}
        <div
          className="hud-panel-chamfer"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'radial-gradient(circle at center, rgba(20, 15, 24, 0.6) 0%, rgba(10, 10, 14, 0.95) 100%)',
          }}
        >
          {/* Vector Schematic Graphic */}
          <div
            style={{
              position: 'relative',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed rgba(239, 68, 68, 0.2)',
              background: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Tech Crosshairs & Blueprint lines */}
            <div style={{ position: 'absolute', top: 12, left: 16, fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-red-primary)' }}>
              SCHEMATIC // {weapon.id.toUpperCase()}-MIL-SPEC
            </div>
            <div style={{ position: 'absolute', bottom: 12, right: 16, fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber-primary)' }}>
              SS: {stats.effectiveSweetSpot}m // ACC: +{stats.effectiveAccuracy}
            </div>

            {/* Stylized Tactical SVG Firearm Silhouette */}
            <svg width="460" height="150" viewBox="0 0 460 150" fill="none">
              <path
                d="M 50 80 L 120 80 L 140 45 L 260 45 L 280 65 L 410 65 L 420 85 L 320 85 L 300 120 L 265 120 L 275 85 L 180 85 L 150 125 L 110 125 L 125 85 Z"
                fill="rgba(239, 68, 68, 0.08)"
                stroke="var(--color-red-primary)"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              {/* Barrel anchor line */}
              <circle cx="415" cy="75" r="4" fill="#ef4444" />
              <line x1="415" y1="75" x2="435" y2="40" stroke="#ef4444" strokeWidth="1" />

              {/* Optics anchor line */}
              <circle cx="200" cy="45" r="4" fill="#f59e0b" />
              <line x1="200" y1="45" x2="200" y2="20" stroke="#f59e0b" strokeWidth="1" />

              {/* Stock anchor line */}
              <circle cx="70" cy="80" r="4" fill="#ef4444" />
              <line x1="70" y1="80" x2="50" y2="40" stroke="#ef4444" strokeWidth="1" />

              {/* Grip anchor line */}
              <circle cx="130" cy="115" r="4" fill="#f59e0b" />
              <line x1="130" y1="115" x2="100" y2="135" stroke="#f59e0b" strokeWidth="1" />

              {/* Mag anchor line */}
              <circle cx="280" cy="115" r="4" fill="#06b6d4" />
              <line x1="280" y1="115" x2="310" y2="135" stroke="#06b6d4" strokeWidth="1" />
            </svg>
          </div>

          {/* 6 Physical Anchor Slots Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
            {CATEGORIES.map((cat) => {
              const installedId = (weapon.equippedAttachments || []).find((id) => {
                const a = ATTACHMENTS_CATALOG.find((item) => item.id === id);
                return a?.category === cat;
              });
              const installedAtt = installedId ? ATTACHMENTS_CATALOG.find((a) => a.id === installedId) : null;

              return (
                <div
                  key={cat}
                  className="hud-panel"
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '80px',
                    borderLeft: installedAtt ? '2px solid var(--color-amber-primary)' : 'var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      [ {cat.toUpperCase()} ]
                    </span>
                    {installedAtt && (
                      <button
                        type="button"
                        onClick={() => {
                          detachFromWeapon(slot, installedAtt.id);
                          tacticalAudio.playAlert();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                        title="Desequipar"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div style={{ margin: '4px 0' }}>
                    {installedAtt ? (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                          {installedAtt.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-amber-primary)' }}>
                          {installedAtt.effect}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          tacticalAudio.playSelect();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={12} />
                        <span>EQUIPAR {cat.toUpperCase()}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ammunition Slot Selector */}
          <div
            className="hud-panel"
            style={{
              padding: '10px 14px',
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '2px solid var(--color-cyan-primary)',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-cyan-primary)' }}>
                [ LOADED AMMUNITION // MUNIÇÃO ESPECIAL ]
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {weapon.loadedAmmoType || 'Normal'}
              </div>
            </div>

            <button
              type="button"
              className="hud-btn hud-btn-ghost"
              style={{ padding: '4px 10px', fontSize: '10px' }}
              onClick={() => setSelectedCategory('Ammunition')}
            >
              TROCAR MUNIÇÃO &rarr;
            </button>
          </div>
        </div>

        {/* Right: Attachment & Ammo Catalog Drawer */}
        <div className="hud-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`hud-btn ${selectedCategory === cat ? 'hud-btn-amber' : 'hud-btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '10px' }}
                onClick={() => {
                  setSelectedCategory(cat);
                  tacticalAudio.playSelect();
                }}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              className={`hud-btn ${selectedCategory === 'Ammunition' ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '10px' }}
              onClick={() => {
                setSelectedCategory('Ammunition');
                tacticalAudio.playSelect();
              }}
            >
              Munição
            </button>
          </div>

          {/* List of Attachments or Ammo */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '6px' }}>
            {selectedCategory === 'Ammunition' ? (
              [{type: 'Normal', name: 'Munição Convencional', effect: 'Nenhum efeito especial.'} as any, ...inventoryAmmos.map(e => e.item?.data)].filter((v,i,a)=>a.findIndex(t=>(t.type === v.type))===i).map((ammo) => {
                // Find invId for equip
                const invEntry = inventoryAmmos.find(e => e.item?.data?.type === ammo.type);
                const invIdToEquip = ammo.type === 'Normal' ? 'Normal' : (invEntry?.invId || '');

                const isLoaded = weapon.loadedAmmoType === ammo.type;
                return (
                  <div
                    key={ammo.type}
                    className="hud-panel"
                    style={{
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isLoaded ? 'rgba(6, 182, 212, 0.1)' : 'var(--surface-card)',
                      border: isLoaded ? '1px solid var(--color-cyan-primary)' : 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {ammo.type} Ammo {ammo.bonusDamage && <span style={{ color: 'var(--color-amber-primary)' }}>({ammo.bonusDamage})</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ammo.specialEffect || 'Projéteis balísticos padrão'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`hud-btn ${isLoaded ? 'hud-btn-ghost' : 'hud-btn-primary'}`}
                      style={{ padding: '4px 12px', fontSize: '10px' }}
                      disabled={isLoaded}
                      onClick={() => {
                        setWeaponAmmoType(slot, invIdToEquip);
                        tacticalAudio.playSelect();
                      }}
                    >
                      {isLoaded ? <Check size={12} color="#06b6d4" /> : 'CARREGAR'}
                    </button>
                  </div>
                );
              })
            ) : (
              categoryAttachments.map((entry) => {
                const att = entry.item?.data;
                const invId = entry.invId || '';

                const isEquipped = (weapon.equippedAttachments || []).includes(att.id);
                return (
                  <div
                    key={att.id}
                    className="hud-panel"
                    style={{
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isEquipped ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface-card)',
                      border: isEquipped ? '1px solid var(--color-amber-primary)' : 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {att.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-amber-primary)' }}>
                        {att.effect}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        SLOTS: {att.slots} // COMPATIBILIDADE: {Object.values(att.compatibility).flat().filter(Boolean).join(', ') || 'Universal'}
                      </div>
                    </div>

                    {isEquipped ? (
                      <button
                        type="button"
                        className="hud-btn hud-btn-ghost"
                        style={{ padding: '4px 12px', fontSize: '10px', color: '#ef4444' }}
                        onClick={() => {
                          detachFromWeapon(slot, att.id);
                          tacticalAudio.playAlert();
                        }}
                      >
                        REMOVER
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="hud-btn hud-btn-amber"
                        style={{ padding: '4px 12px', fontSize: '10px', opacity: (currentSlots + att.slots > maxSlots) ? 0.4 : 1 }}
                        disabled={currentSlots + att.slots > maxSlots}
                        onClick={() => {
                          attachToWeapon(slot, invId);
                          tacticalAudio.playSelect();
                        }}
                      >
                        {currentSlots + att.slots > maxSlots ? 'SLOTS INSUFICIENTES' : 'EQUIPAR'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar: Before vs After Comparison */}
      <div
        className="hud-panel-chamfer"
        style={{
          marginTop: '20px',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(12, 12, 16, 0.98)',
        }}
      >
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
              DAMAGE COMPUTED
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: '#fff' }}>
              {stats.effectiveDamage}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-amber-primary)' }}>
              SWEET SPOT (SS)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--color-amber-primary)' }}>
              {stats.effectiveSweetSpot}m [{weapon.sweetSpotBonusDamage}]
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
              ACCURACY / INITIATIVE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              +{stats.effectiveAccuracy} Acc / +{stats.effectiveInitiative} Init
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-green-primary)' }}>
              RELOAD ACTION
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--color-green-primary)' }}>
              {stats.effectiveRechargeCost}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="hud-btn hud-btn-primary"
          style={{ padding: '8px 24px', fontSize: '12px' }}
          onClick={() => {
            onClose();
            tacticalAudio.playSelect();
          }}
        >
          CONFIRMAR AJUSTES DE ARMARIA &rarr;
        </button>
      </div>
    </div>
  );
};
