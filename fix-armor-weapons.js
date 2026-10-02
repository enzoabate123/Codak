const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const targetArmor = \`export const ArmorAndAccessories: React.FC = () => {
  const { characters, activeCharacterId, unequipItem } = useCharacterStore();
  const char = characters.find(c => c.id === activeCharacterId);
  if (!char) return null;\`;

const replaceArmor = \`export const ArmorAndAccessories: React.FC = () => {
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
  };\`;

code = code.replace(targetArmor, replaceArmor);

code = code.replace(
  \`<div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>\`,
  \`<div
          onDragOver={(e) => { e.preventDefault(); setDragOverSlot('armor'); }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => handleDrop(e, 'armor')}
          style={{ padding: '12px', border: dragOverSlot === 'armor' ? '1px solid var(--color-amber-primary)' : '1px solid rgba(255,255,255,0.1)', background: dragOverSlot === 'armor' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
        >\`
);

code = code.replace(
  \`{char.equipment?.armor ? (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\`,
  \`{char.equipment?.armor ? (
            <div 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'armor')}
              style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
            >\`
);

code = code.replace(
  \`<div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>\`,
  \`<div
          onDragOver={(e) => { e.preventDefault(); setDragOverSlot('accessory'); }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => handleDrop(e, 'accessory')}
          style={{ padding: '12px', border: dragOverSlot === 'accessory' ? '1px solid var(--color-cyan-primary)' : '1px solid rgba(255,255,255,0.1)', background: dragOverSlot === 'accessory' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
        >\`
);

code = code.replace(
  \`{char.equipment?.accessory ? (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\`,
  \`{char.equipment?.accessory ? (
            <div 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'accessory')}
              style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
            >\`
);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
