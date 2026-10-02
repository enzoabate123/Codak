const fs = require('fs');

function patch(file, isEn) {
  let c = fs.readFileSync(file, 'utf8');
  const shopLabel = isEn ? 'Shop' : 'Loja';
  const shopSec = isEn ? 'SEC-05 // COMMERCE & SUPPLY' : 'SEC-05 // COMÉRCIO & SUPRIMENTOS';
  
  c = c.replace(
    /admin_sec: '.*',/,
    `admin_sec: 'SEC-04 // ADMINISTRAÇÃO & COMPÊNDIO',\n    shop: '${shopLabel}',\n    shop_sec: '${shopSec}',`
  );
  fs.writeFileSync(file, c);
}

patch('src/locales/pt.ts', false);
patch('src/locales/en.ts', true);
