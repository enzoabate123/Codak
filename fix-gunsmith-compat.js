const fs = require('fs');
let code = fs.readFileSync('src/components/gunsmith/GunsmithModal.tsx', 'utf-8');

code = code.replace(
  "  if (c.ammoCategories && !c.ammoCategories.includes(w.ammoCategory)) return false;",
  "  // if (c.ammoCategories && !c.ammoCategories.includes(w.ammoCategory)) return false; // not implemented on Weapon"
);

code = code.replace(
  "  if (c.firingModes && !c.firingModes.includes(w.firingMode)) return false;",
  "  // if (c.firingModes && !c.firingModes.includes(w.firingMode)) return false; // not implemented on Weapon"
);

fs.writeFileSync('src/components/gunsmith/GunsmithModal.tsx', code);
