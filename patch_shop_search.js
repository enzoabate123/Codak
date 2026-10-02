const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /const \[activeCategory, setActiveCategory\] = useState<GrimoireCategory>\('armas'\);/,
  "const [activeCategory, setActiveCategory] = useState<GrimoireCategory>('armas');\n  const [searchQuery, setSearchQuery] = useState('');"
);

c = c.replace(
  /const visibleItems = shopStore\.availableItemIds\n\s*\.map\(id => items\.find\(i => i\.id === id\)\)\n\s*\.filter\(\(i\): i is ShopItem => i \!\=\= undefined\)\n\s*\.filter\(i => i\.category === activeCategory\);/,
  `const visibleItems = shopStore.availableItemIds
    .map(id => items.find(i => i.id === id))
    .filter((i): i is ShopItem => i !== undefined)
    .filter(i => i.category === activeCategory)
    .filter(i => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const txt = \`\${i.name} \${i.data.type || ''} \${i.data.size || ''} \${i.data.subtitle || ''} \${i.data.summary || ''}\`.toLowerCase();
      // Handle portuguese translations just in case
      if (q === 'pequena' || q === 'pequenas' || q === 'pequeno') return txt.includes('small');
      if (q === 'media' || q === 'média' || q === 'médias') return txt.includes('medium');
      if (q === 'grande' || q === 'grandes') return txt.includes('heavy') || txt.includes('big');
      if (q === 'enorme' || q === 'enormes') return txt.includes('massive') || txt.includes('big');
      return txt.includes(q);
    });`
);

c = c.replace(
  /\{\/\* Item Grid \*\/\}\n\s*<div className="hud-panel" style=\{\{ flex: 1, padding: '24px', overflowY: 'auto' \}\}>\n\s*<div style=\{\{ display: 'grid'/,
  `{/* Item Grid */}
        <div className="hud-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--color-cyan-primary)' }}>ESTOQUE</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4px 8px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Filtrar por tipo, tamanho, nome..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '12px', width: '200px' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            <div style={{ display: 'grid'`
);

c = c.replace(
  /Nenhum item nesta categoria\.<\/div>\}\n\s*<\/div>\n\s*<\/div>/,
  `Nenhum item nesta categoria.</div>}
            </div>
          </div>
        </div>`
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);
