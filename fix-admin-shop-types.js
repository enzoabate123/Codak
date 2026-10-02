const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminShopManager.tsx', 'utf-8');

code = code.replace(
  "const items: { id: string, name: string, type: 'weapons' | 'attachments' | 'ammo' | 'lore', basePrice: number, icon: string, currentPrice?: number }[] = [];",
  "const items: { id: string, name: string, type: 'weapons' | 'attachments' | 'ammo' | 'lore', basePrice: number, icon: string, currentPrice?: number, data?: any }[] = [];"
);

fs.writeFileSync('src/components/admin/AdminShopManager.tsx', code);
