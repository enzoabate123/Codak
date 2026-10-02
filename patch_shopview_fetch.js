const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /const \{ characters \} = useCharacterStore\(\);/,
  "const { characters, fetchCharacters } = useCharacterStore();"
);

c = c.replace(
  /fetchShopState\(\);/,
  "fetchShopState();\n    fetchCharacters();"
);

c = c.replace(
  /\[fetchShopState\]/,
  "[fetchShopState, fetchCharacters]"
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);
