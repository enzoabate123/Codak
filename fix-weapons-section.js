const fs = require('fs');
let code = fs.readFileSync('src/components/character/WeaponsSection.tsx', 'utf-8');

// Replace {weapon.ammoCapacity} with {stats.effectiveAmmoCapacity || weapon.ammoCapacity}
code = code.replace(/weapon\.ammoCapacity/g, "(stats.effectiveAmmoCapacity || weapon.ammoCapacity)");

fs.writeFileSync('src/components/character/WeaponsSection.tsx', code);
