const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

const oldReload = `      const updatedWeapon = {
        ...weapon,
        currentAmmo: weapon.ammoCapacity,
      };`;
const newReload = `      const stats = computeWeaponStats(weapon, char);
      const updatedWeapon = {
        ...weapon,
        currentAmmo: stats.effectiveAmmoCapacity || weapon.ammoCapacity,
      };`;

code = code.replace(oldReload, newReload);
fs.writeFileSync('src/stores/useCharacterStore.ts', code);
