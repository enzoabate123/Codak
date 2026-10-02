const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

// I will just change gridTemplateColumns to 'repeat(8, 1fr)' and increase slots to 64
code = code.replace("gridTemplateColumns: 'repeat(5, 1fr)'", "gridTemplateColumns: 'repeat(8, 1fr)'");
code = code.replace(/30/g, "64"); // MOCHILA (64 SLOTS) and Array(64)

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
