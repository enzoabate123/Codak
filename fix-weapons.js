const fs = require('fs');
let code = fs.readFileSync('src/components/character/WeaponsSection.tsx', 'utf-8');

code = code.replace("import React from 'react';", "import React, { useState } from 'react';");

const targetState = \`export const WeaponsSection: React.FC<WeaponsSectionProps> = ({ onOpenGunsmith }) => {
  const { characters, activeCharacterId, fireWeapon, reloadWeapon } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;
  const { primaryWeapon, secondaryWeapon, backupWeapon } = char;
  const renderWeaponCard = (weapon: Weapon | null, slot: 'primary' | 'secondary' | 'backup', title: string) => {\`;

const replaceState = \`export const WeaponsSection: React.FC<WeaponsSectionProps> = ({ onOpenGunsmith }) => {
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
  const renderWeaponCard = (weapon: Weapon | null, slot: 'primary' | 'secondary' | 'backup', title: string) => {\`;

code = code.replace(targetState, replaceState);

const targetEmpty = \`<div className="hud-panel-chamfer" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, rgba(16, 12, 18, 0.4) 0%, rgba(10, 10, 14, 0.4) 100%)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>\`;
const replaceEmpty = \`<div 
          className="hud-panel-chamfer" 
          onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => handleDrop(e, slot)}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', background: dragOverSlot === slot ? 'rgba(239, 68, 68, 0.1)' : 'linear-gradient(135deg, rgba(16, 12, 18, 0.4) 0%, rgba(10, 10, 14, 0.4) 100%)', border: dragOverSlot === slot ? '1px dashed var(--color-red-primary)' : '1px dashed rgba(255, 255, 255, 0.1)', transition: 'all 0.2s' }}>\`;

code = code.replace(targetEmpty, replaceEmpty);

const targetFull = \`    return (
      <div
        className="hud-panel-chamfer"
        style={{
          padding: '20px 24px',
          display: 'flex',\`;
const replaceFull = \`    return (
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
          cursor: 'grab',
          border: dragOverSlot === slot ? '1px solid var(--color-red-primary)' : '1px solid rgba(255,255,255,0.1)',\`;

code = code.replace(targetFull, replaceFull);

fs.writeFileSync('src/components/character/WeaponsSection.tsx', code);
