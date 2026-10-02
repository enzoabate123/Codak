const fs = require('fs');
let code = fs.readFileSync('src/stores/useShopStore.ts', 'utf-8');

code = code.replace(
  /if \(state\.cart\.length >= 10\) \{[\s\S]*?return state;\n\s*\}/g,
  ""
);

fs.writeFileSync('src/stores/useShopStore.ts', code);
console.log("Removed cart limit");
