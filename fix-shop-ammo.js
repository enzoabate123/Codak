const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // In AdminShopManager.tsx and ShopView.tsx:
  code = code.replace(
    /ammunitions\.forEach\(a => \{[\s\S]*?\}\);/g,
    `ammunitions.forEach(a => {
      const entryId = \`ammo-\${a.type}-\${a.size}-\${a.capacity || 0}\`;
      const displayName = a.size === 'Bateria' ? \`Bateria \${a.type} (\${a.capacity} carga)\` : \`Munição \${a.type} \${a.size} (x30)\`;
      
      // In AdminShopManager:
      if (filePath.includes('AdminShopManager')) {
        items.push({ id: entryId, name: displayName, type: 'ammo', basePrice: a.pricePerBullet * 30, icon: '📦' });
      }
    });`
  );

  fs.writeFileSync(filePath, code);
}

const f1 = 'src/components/admin/AdminShopManager.tsx';
let c1 = fs.readFileSync(f1, 'utf-8');
c1 = c1.replace(
  /ammunitions\.forEach\(a => \{\s*items\.push\(\{ id: `ammo-\$\{a\.type\}`.*?\}\);\s*\}\);/g,
  `ammunitions.forEach(a => {
      const entryId = \`ammo-\${a.type}-\${a.size}-\${a.capacity || 0}\`;
      const displayName = a.size === 'Bateria' ? \`Bateria \${a.type} (\${a.capacity} carga)\` : \`Munição \${a.type} \${a.size} (x30)\`;
      items.push({ id: entryId, name: displayName, type: 'ammo', basePrice: a.pricePerBullet * 30, icon: '📦', data: a });
    });`
);
// Also fix the ALL items selection where it maps ammo
c1 = c1.replace(
  /\.\.\.ammunitions\.map\(a => 'ammo-'\+a\.type\)/g,
  `...ammunitions.map(a => \`ammo-\${a.type}-\${a.size}-\${a.capacity || 0}\`)`
);
fs.writeFileSync(f1, c1);

const f2 = 'src/components/views/ShopView.tsx';
let c2 = fs.readFileSync(f2, 'utf-8');
c2 = c2.replace(
  /ammunitions\.forEach\(a => \{\s*const entryId = `ammo-\$\{a\.type\}`;[\s\S]*?\}\);/g,
  `ammunitions.forEach(a => {
      const entryId = \`ammo-\${a.type}-\${a.size}-\${a.capacity || 0}\`;
      const displayName = a.size === 'Bateria' ? \`Bateria \${a.type} (\${a.capacity} carga)\` : \`Munição \${a.type} \${a.size} (x30)\`;
      if (availableItemIds.includes(entryId)) {
        items.push({ id: entryId, category: 'munição', name: displayName, type: 'ammo', price: customPrices?.[entryId] ?? (a.pricePerBullet * 30), data: a, raw: { type: 'ammo', data: a } });
      }
    });`
);
fs.writeFileSync(f2, c2);

