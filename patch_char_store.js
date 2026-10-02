const fs = require('fs');
let c = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf8');

if (!c.includes('mechaCoreSize')) {
  c = c.replace(
    /activePage: 'status' \| 'habilidades' \| 'loadout' \| 'inventario' \| 'anotacoes' \| 'backstory';/,
    "activePage: 'status' | 'habilidades' | 'loadout' | 'inventario' | 'anotacoes' | 'backstory';\n\n  mechaCoreSize?: 'Half' | 'Light' | 'Heavy';\n  resourceName?: string;\n  resourceCurrent?: number;\n  resourceMax?: number;"
  );
}

fs.writeFileSync('src/stores/useCharacterStore.ts', c);
