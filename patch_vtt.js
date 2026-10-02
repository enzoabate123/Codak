const fs = require('fs');
let c = fs.readFileSync('src/types/vtt.ts', 'utf8');
c = c.replace(
  /export type VTTView = 'characters' \| 'grimoire' \| 'map' \| 'admin';/,
  "export type VTTView = 'characters' | 'grimoire' | 'map' | 'shop' | 'admin';"
);
c = c.replace(
  /icon: 'user' \| 'book' \| 'map' \| 'admin';/,
  "icon: 'user' | 'book' | 'map' | 'shop' | 'admin';"
);
fs.writeFileSync('src/types/vtt.ts', c);
