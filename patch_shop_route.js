const fs = require('fs');
let c = fs.readFileSync('src/app/api/shop/route.ts', 'utf8');
c = c.replace(/@\/lib\/server\/auth-storage/, '@/lib/server/auth-config');
fs.writeFileSync('src/app/api/shop/route.ts', c);
