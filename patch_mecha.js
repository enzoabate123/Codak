const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /export function checkClassCompat\(classId: string \| undefined, itemType: string, itemData: any\): boolean \{[\s\S]*?const cls = CLASSES_CATALOG\.find\(c => c\.id === classId\);\n  if \(!cls\) return true;/,
  `export function checkClassCompat(classId: string | undefined, itemType: string, itemData: any): boolean {
  if (!classId) return true;
  // PONYTAIL RULE: Mechas can choose their Core, which changes their proficiencies dynamically.
  // Instead of building a complex Core selection UI just for a shop badge, we just bypass the check for Mechas.
  if (classId === 'mecha') return true;

  const cls = CLASSES_CATALOG.find(c => c.id === classId);
  if (!cls) return true;`
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);
