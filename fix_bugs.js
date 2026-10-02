const fs = require('fs');

// Fix 1: ShopView.tsx tacticalAudio binding
let shopView = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');
shopView = shopView.replace(/onMouseEnter=\{tacticalAudio\.playHover\}/g, 'onMouseEnter={() => tacticalAudio.playHover()}');
fs.writeFileSync('src/components/views/ShopView.tsx', shopView);

// Fix 2: useShopStore.ts crypto.randomUUID
let shopStore = fs.readFileSync('src/stores/useShopStore.ts', 'utf8');
shopStore = shopStore.replace(/crypto\.randomUUID\(\)/g, "('crypto' in globalThis && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substr(2, 9))");
fs.writeFileSync('src/stores/useShopStore.ts', shopStore);

