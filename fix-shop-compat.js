const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

code = code.replace(
  'export function checkClassCompat(classId: string | undefined, itemType: string, itemData: any): boolean {',
  'export function checkItemCompat(char: any | undefined, itemType: string, itemData: any): boolean {'
);

code = code.replace(
  '  if (!classId) return true;\n  // Mecha Dynamic Core Size Logic',
  \`  if (!char) return true;
  const classId = char.classId;
  if (!classId) return true;
  // Mecha Dynamic Core Size Logic\`
);

// Replace the return true at the end of the function with our new logic for attachments and ammos
const oldEnd = \`  if (itemType === 'armor') {
    const profs = classId === 'mecha' ? mechaMockProficiencies : cls.armorProficiencies;
    if (!profs || profs.length === 0 || profs.includes('None')) return false;
    
    return profs.some(p => {
      const pStr = p.toLowerCase();
      if (pStr === 'todas' || pStr === 'all') return true;
      const itemStr = \`\\$\\{itemData.name} \\$\\{itemData.type}\`.toLowerCase();
      return itemStr.includes(pStr) || pStr.includes(itemData.type?.toLowerCase() || 'xxx');
    });
  }

  return true;
}\`;

const newEnd = \`  if (itemType === 'armor') {
    const profs = classId === 'mecha' ? mechaMockProficiencies : cls.armorProficiencies;
    if (!profs || profs.length === 0 || profs.includes('None')) return false;
    
    return profs.some(p => {
      const pStr = p.toLowerCase();
      if (pStr === 'todas' || pStr === 'all') return true;
      const itemStr = \`\\$\\{itemData.name} \\$\\{itemData.type}\`.toLowerCase();
      return itemStr.includes(pStr) || pStr.includes(itemData.type?.toLowerCase() || 'xxx');
    });
  }

  if (itemType === 'attachment') {
    const equippedWeapons = [char.primaryWeapon, char.secondaryWeapon, char.backupWeapon].filter(Boolean);
    if (equippedWeapons.length === 0) return false;
    
    const comp = itemData.compatibility || {};
    if (comp.all) return true;
    
    return equippedWeapons.some(w => {
      if (comp.weaponSizes && comp.weaponSizes.length > 0 && !comp.weaponSizes.includes(w.size)) return false;
      if (comp.weaponTypes && comp.weaponTypes.length > 0 && !comp.weaponTypes.includes(w.type)) return false;
      if (comp.specificWeaponIds && comp.specificWeaponIds.length > 0 && !comp.specificWeaponIds.includes(w.id)) return false;
      return true;
    });
  }

  if (itemType === 'ammunition') {
    const equippedWeapons = [char.primaryWeapon, char.secondaryWeapon, char.backupWeapon].filter(Boolean);
    if (equippedWeapons.length === 0) return false;
    return equippedWeapons.some(w => w.type !== 'Melee' && w.type !== 'Branca');
  }

  return true;
}\`;

code = code.replace(oldEnd, newEnd);

// Fix the call site
code = code.replace(
  'const compat = checkClassCompat(selectedChar?.classId, item.type, item.data);',
  'const compat = checkItemCompat(selectedChar, item.type, item.data);'
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);
