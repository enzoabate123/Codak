const fs = require('fs');
let code = fs.readFileSync('src/components/gunsmith/GunsmithModal.tsx', 'utf-8');

if (!code.includes("WEAPONS_CATALOG")) {
  code = code.replace(
    "import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';",
    "import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';\nimport { WEAPONS_CATALOG } from '@/data/weapons-catalog';"
  );
}

const replacement = `
  const baseWeapon = WEAPONS_CATALOG.find(cw => cw.id === w.id);
  const baseAmmo = baseWeapon ? baseWeapon.loadedAmmoType : w.loadedAmmoType;
  const weaponAmmoCategory = baseAmmo === 'Energy' ? 'Energy' : 'Fire';
  
  if (c.ammoCategories && !c.ammoCategories.includes(weaponAmmoCategory)) return false;
`;

code = code.replace(
  "  // if (c.ammoCategories && !c.ammoCategories.includes(w.ammoCategory)) return false; // not implemented on Weapon",
  replacement.trim()
);

fs.writeFileSync('src/components/gunsmith/GunsmithModal.tsx', code);
