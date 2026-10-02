const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');
c = c.replace(
  /<ShopItemCard key=\{item\.id\} item=\{item\} compat=\{compat\} addToCart=\{addToCart\} \/>\n            \}\)\}/,
  "<ShopItemCard key={item.id} item={item} compat={compat} addToCart={addToCart} />\n              );\n            })}"
);
fs.writeFileSync('src/components/views/ShopView.tsx', c);
