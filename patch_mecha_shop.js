const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /\/\/ PONYTAIL RULE: Mechas can choose their Core, which changes their proficiencies dynamically.\n\s*\/\/ Instead of building a complex Core selection UI just for a shop badge, we just bypass the check for Mechas.\n\s*if \(classId === 'mecha'\) return true;/,
  `// Mecha Dynamic Core Size Logic
  let mechaMockProficiencies: string[] = [];
  if (classId === 'mecha') {
    // We check if the active character has a mechaCoreSize
    const char = useCharacterStore.getState().characters.find(c => c.classId === 'mecha');
    const coreSize = char?.mechaCoreSize || 'Half'; // default
    if (coreSize === 'Half') mechaMockProficiencies = ['Small', 'Simples'];
    else if (coreSize === 'Light') mechaMockProficiencies = ['Medium'];
    else if (coreSize === 'Heavy') mechaMockProficiencies = ['Heavy', 'Big', 'Pesada'];
  }`
);

c = c.replace(
  /if \(\!cls\.weaponProficiencies \|\| cls\.weaponProficiencies\.length === 0 \|\| cls\.weaponProficiencies\.includes\('None'\)\) return false;/,
  `const profs = classId === 'mecha' ? mechaMockProficiencies : cls.weaponProficiencies;
    if (!profs || profs.length === 0 || profs.includes('None')) return false;`
);

c = c.replace(
  /return cls\.weaponProficiencies\.some/,
  "return profs.some"
);

c = c.replace(
  /if \(\!cls\.armorProficiencies \|\| cls\.armorProficiencies\.length === 0 \|\| cls\.armorProficiencies\.includes\('None'\)\) return false;/,
  `if (classId === 'mecha') return true; // Mechas don't use regular armor
    if (!cls.armorProficiencies || cls.armorProficiencies.length === 0 || cls.armorProficiencies.includes('None')) return false;`
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);
