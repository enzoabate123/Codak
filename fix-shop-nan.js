const fs = require('fs');
let code = fs.readFileSync('src/stores/useShopStore.ts', 'utf-8');

code = code.replace(
  'const totalCost = cart.reduce((acc, item) => acc + item.price, 0);',
  'const totalCost = cart.reduce((acc, item) => acc + (Number(item.price) || 0), 0);'
);

fs.writeFileSync('src/stores/useShopStore.ts', code);
