const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

// Replace `price: w.cost` with `price: shopStore.customPrices?.[entryId] ?? w.cost` etc.

code = code.replace(
  "price: w.cost, data: w",
  "price: shopStore.customPrices?.[entryId] ?? w.cost, data: w"
);

code = code.replace(
  "price: a.price, data: a",
  "price: shopStore.customPrices?.[entryId] ?? a.price, data: a"
);

code = code.replace(
  "price: a.pricePerBullet * 30, data: a",
  "price: shopStore.customPrices?.[entryId] ?? (a.pricePerBullet * 30), data: a"
);

code = code.replace(
  "const price = getItemPrice(tType, lr) || 0;\n        items.push({ id: entryId, category: cat, name: lr.title, type: tType, price, data: lr",
  "const basePrice = getItemPrice(tType, lr) || 0;\n        const price = shopStore.customPrices?.[entryId] ?? basePrice;\n        items.push({ id: entryId, category: cat, name: lr.title, type: tType, price, data: lr"
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);
