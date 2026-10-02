const fs = require('fs');
let code = fs.readFileSync('src/components/character/WeaponsSection.tsx', 'utf-8');

code = code.replace(
  "const maxDots = Math.min((stats.effectiveAmmoCapacity || weapon.ammoCapacity), 30);\n    const stats = computeWeaponStats(weapon, char);",
  "const stats = computeWeaponStats(weapon, char);\n    const maxDots = Math.min((stats.effectiveAmmoCapacity || weapon.ammoCapacity), 30);"
);

fs.writeFileSync('src/components/character/WeaponsSection.tsx', code);
