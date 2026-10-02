const fs = require('fs');
let code = fs.readFileSync('src/components/character/CharacterSheetHeader.tsx', 'utf-8');

code = code.replace(
  "{ id: 'loadout', label: 'Loadout' },",
  "{ id: 'loadout', label: 'Loadout & Inventário' },"
);
code = code.replace(
  "{ id: 'inventario', label: 'Inventário' },",
  ""
);

fs.writeFileSync('src/components/character/CharacterSheetHeader.tsx', code);
