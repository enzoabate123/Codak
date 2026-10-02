const fs = require('fs');
let code = fs.readFileSync('src/components/views/CharactersView.tsx', 'utf-8');

// Replace the imports
code = code.replace(
  "import { InventoryAndNotes } from '@/components/character/InventoryAndNotes';",
  "import { InventoryGrid, ArmorAndAccessories, CampaignNotes } from '@/components/character/InventoryAndNotes';"
);

// Replace the render logic
const targetLoadout = "{activePage === 'loadout' && <WeaponsSection onOpenGunsmith={(slot) => setGunsmithSlot(slot)} />}";
const targetInv = "{activePage === 'inventario' && <InventoryAndNotes mode=\"inventory\" />}";
const targetNotes = "{activePage === 'anotacoes' && <InventoryAndNotes mode=\"notes\" />}";

const newLoadout = \`{activePage === 'loadout' && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%', overflow: 'hidden' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
      <WeaponsSection onOpenGunsmith={(slot) => setGunsmithSlot(slot)} />
      <ArmorAndAccessories />
    </div>
    <div style={{ overflowY: 'auto', paddingRight: '8px' }}>
      <InventoryGrid />
    </div>
  </div>
)}\`;

const newNotes = "{activePage === 'anotacoes' && <CampaignNotes />}";

code = code.replace(targetLoadout, newLoadout);
code = code.replace(targetInv, "");
code = code.replace(targetNotes, newNotes);

fs.writeFileSync('src/components/views/CharactersView.tsx', code);
