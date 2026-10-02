const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

code = code.replace(
  "if (item && item.type === 'ammo') return null; // Hide ammo from main grid",
  "if (item && item.type === 'ammo') item = null as any; // Treat as empty slot visually to preserve 64 grid cells and indices"
);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
