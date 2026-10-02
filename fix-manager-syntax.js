const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminShopManager.tsx', 'utf-8');

code = code.replace(/\\\`w-\\\$\\{w\.id\\}\\\`/g, "\`w-\${w.id}\`");
code = code.replace(/\\\`att-\\\$\\{a\.id\\}\\\`/g, "\`att-\${a.id}\`");
code = code.replace(/\\\`ammo-\\\$\\{a\.type\\}\\\`/g, "\`ammo-\${a.type}\`");
code = code.replace(/Munição \\\$\\{a\.type\\}/g, "Munição ${a.type}");
code = code.replace(/\\\`lore-\\\$\\{lr\.id\\}\\\`/g, "\`lore-\${lr.id}\`");

code = code.replace(/className=\{\\\`hud-btn \\\$\\{shopStore\.isOpen \? 'hud-btn-primary' : 'hud-btn-outline'\\}\\\`\}/g, "className={`hud-btn ${shopStore.isOpen ? 'hud-btn-primary' : 'hud-btn-outline'}`}");

fs.writeFileSync('src/components/admin/AdminShopManager.tsx', code);
