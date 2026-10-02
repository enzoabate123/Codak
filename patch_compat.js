const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

const newFunc = `export function checkClassCompat(classId: string | undefined, itemType: string, itemData: any): boolean {
  if (!classId) return true;
  const cls = CLASSES_CATALOG.find(c => c.id === classId);
  if (!cls) return true;

  if (itemType === 'weapon') {
    if (!cls.weaponProficiencies || cls.weaponProficiencies.length === 0 || cls.weaponProficiencies.includes('None')) return false;
    
    return cls.weaponProficiencies.some(p => {
      const pStr = p.toLowerCase();
      if (pStr === 'todas' || pStr === 'all') return true;
      const itemStr = \`\${itemData.name} \${itemData.type} \${itemData.size} \${itemData.category}\`.toLowerCase();
      
      if (pStr.includes('pistol')) return itemStr.includes('pistol');
      if (pStr.includes('rifle')) return itemStr.includes('rifle');
      if (pStr.includes('melee') || pStr.includes('corpo a corpo')) return itemStr.includes('melee');
      if (pStr.includes('submachine')) return itemStr.includes('submachine') || itemStr.includes('smg');
      if (pStr.includes('sniper')) return itemStr.includes('sniper');
      if (pStr.includes('shotgun')) return itemStr.includes('shotgun');
      if (pStr.includes('heavy') || pStr.includes('pesada')) return itemStr.includes('heavy') || itemStr.includes('big');
      if (pStr.includes('simples') || pStr.includes('simple')) return itemStr.includes('small') || itemStr.includes('melee'); // heuristic
      
      return itemStr.includes(pStr) || pStr.includes(itemData.type?.toLowerCase() || 'xxx');
    });
  }
  if (itemType === 'armor') {
    if (!cls.armorProficiencies || cls.armorProficiencies.length === 0 || cls.armorProficiencies.includes('None')) return false;

    return cls.armorProficiencies.some(p => {
      const pStr = p.toLowerCase();
      if (pStr === 'todas' || pStr === 'all') return true;
      const itemStr = \`\${itemData.title} \${itemData.subtitle} \${itemData.description} \${itemData.summary}\`.toLowerCase();
      
      if (pStr.includes('leve') || pStr.includes('light')) return itemStr.includes('leve') || itemStr.includes('light');
      if (pStr.includes('média') || pStr.includes('media') || pStr.includes('medium')) return itemStr.includes('média') || itemStr.includes('media') || itemStr.includes('medium');
      if (pStr.includes('pesada') || pStr.includes('heavy')) return itemStr.includes('pesada') || itemStr.includes('heavy');
      
      return itemStr.includes(pStr);
    });
  }
  return true;
}`;

c = c.replace(/export function checkClassCompat[\s\S]*?return true;\n\}/, newFunc);
fs.writeFileSync('src/components/views/ShopView.tsx', c);
