const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

code = code.replace(
  "gridTemplateColumns: 'repeat(8, 1fr)'",
  "gridTemplateColumns: 'repeat(8, minmax(0, 1fr))'"
);

code = code.replace(
  "position: 'relative'",
  "position: 'relative',\n              minWidth: 0,\n              minHeight: 0,\n              overflow: 'hidden'"
);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
