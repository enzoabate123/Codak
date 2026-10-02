const fs = require('fs');
let c = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');

c = c.replace(
  /<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '16px' \}\}>\n\s*\{\[/,
  "<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>\n                  {["
);

fs.writeFileSync('src/components/admin/AdminView.tsx', c);
