const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /<div style=\{\{ position: 'absolute', top: '-10px', right: '-10px', background: 'var\(--color-red-primary\)', color: '#000', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' \}\}>/,
  "<div style={{ background: 'var(--color-red-primary)', color: '#000', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>"
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);
