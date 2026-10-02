const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const targetDragStart = \`  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    tacticalAudio.playHover();
  };\`;

const replaceDragStart = \`  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'inventory', index }));
    tacticalAudio.playHover();
  };\`;

const targetDrop = \`  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      moveInventoryItem(draggedIndex, toIndex);
      tacticalAudio.playSelect();
    }
    setDraggedIndex(null);
    setDragOverIdx(null);
  };\`;

const replaceDrop = \`  const handleDrop = (e: React.DragEvent, toIndex: number) => {
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
  };\`;

code = code.replace(targetDragStart, replaceDragStart);
code = code.replace(targetDrop, replaceDrop);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
