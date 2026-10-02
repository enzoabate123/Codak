const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /const visibleItems = allShopItems\.filter\(i => \{\n\s*\/\/ Treat ammo category identically to weapons for now\? Actually ammo has no GrimoireCategory natively, let's map it\.\n\s*\/\/ wait, ammo is not in categoryTabs! Let's add it or map it to 'armas' \/ 'equipamentos_gerais'\.\n\s*return i\.category === activeCategory;\n\s*\}\);/,
  `const visibleItems = allShopItems.filter(i => {
    if (i.category !== activeCategory) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const txt = \`\${i.name} \${i.data.type || ''} \${i.data.size || ''} \${i.data.subtitle || ''} \${i.data.summary || ''}\`.toLowerCase();
    
    if (q === 'pequena' || q === 'pequenas' || q === 'pequeno') return txt.includes('small');
    if (q === 'media' || q === 'média' || q === 'médias' || q === 'medio' || q === 'médio') return txt.includes('medium');
    if (q === 'grande' || q === 'grandes') return txt.includes('heavy') || txt.includes('big');
    if (q === 'enorme' || q === 'enormes') return txt.includes('massive') || txt.includes('big');
    
    return txt.includes(q);
  });`
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);
