const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

if (!code.includes("import { WEAPONS_CATALOG }")) {
  code = code.replace(
    "import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';",
    "import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';\nimport { WEAPONS_CATALOG } from '@/data/weapons-catalog';"
  );
}

const fireOld = `currentAmmo: Math.max(0, weapon.currentAmmo - (weapon.burstRate ? (parseInt(weapon.burstRate.split('x')[0]) || 1) : 1)),`;
const fireNew = `currentAmmo: Math.max(0, weapon.currentAmmo - (() => {
          // Fetch fresh burst rate from catalog to avoid stale data on old characters
          const catalogWeapon = WEAPONS_CATALOG.find(w => w.id === weapon.id);
          const activeBurstRate = catalogWeapon?.burstRate || weapon.burstRate;
          return activeBurstRate ? (parseInt(activeBurstRate.split('x')[0]) || 1) : 1;
        })()),`;

code = code.replace(fireOld, fireNew);
fs.writeFileSync('src/stores/useCharacterStore.ts', code);
console.log("Replaced:", code.includes("catalogWeapon"));
