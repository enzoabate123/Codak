const fs = require('fs');

// shop-storage.ts
let storage = fs.readFileSync('src/lib/server/shop-storage.ts', 'utf8');
storage = storage.replace(
  /export interface ShopConfig \{/,
  "export interface ShopProfile { id: string; name: string; availableItemIds: string[]; }\n\nexport interface ShopConfig {"
);
storage = storage.replace(
  /availableItemIds: string\[\];/,
  "availableItemIds: string[];\n  profiles: ShopProfile[];"
);
storage = storage.replace(
  /availableItemIds: \[\],/,
  "availableItemIds: [],\n  profiles: [],"
);
fs.writeFileSync('src/lib/server/shop-storage.ts', storage);

// route.ts
let route = fs.readFileSync('src/app/api/shop/route.ts', 'utf8');
route = route.replace(
  /availableItemIds: body\.availableItemIds \?\? current\.availableItemIds,/,
  "availableItemIds: body.availableItemIds ?? current.availableItemIds,\n      profiles: body.profiles ?? current.profiles,"
);
fs.writeFileSync('src/app/api/shop/route.ts', route);

// useShopStore.ts
let store = fs.readFileSync('src/stores/useShopStore.ts', 'utf8');
store = store.replace(
  /export interface CartItem \{/,
  "export interface ShopProfile { id: string; name: string; availableItemIds: string[]; }\n\nexport interface CartItem {"
);
store = store.replace(
  /cart: CartItem\[\];/,
  "cart: CartItem[];\n  profiles: ShopProfile[];"
);
store = store.replace(
  /setShopState: \(name: string, itemIds: string\[\], open: boolean\) => Promise<void>;/,
  "setShopState: (name: string, itemIds: string[], open: boolean, profiles?: ShopProfile[]) => Promise<void>;"
);
store = store.replace(
  /availableItemIds: \[\],/,
  "availableItemIds: [],\n  profiles: [],"
);
store = store.replace(
  /set\(\{ isOpen: data\.isOpen, shopName: data\.shopName, availableItemIds: data\.availableItemIds \}\);/g,
  "set({ isOpen: data.isOpen, shopName: data.shopName, availableItemIds: data.availableItemIds, profiles: data.profiles || [] });"
);
store = store.replace(
  /body: JSON\.stringify\(\{ shopName: name, availableItemIds: itemIds, isOpen: open \}\),/,
  "body: JSON.stringify({ shopName: name, availableItemIds: itemIds, isOpen: open, profiles: profiles || get().profiles }),"
);
store = store.replace(
  /setShopState: async \(name, itemIds, open\)/,
  "setShopState: async (name, itemIds, open, profiles)"
);
fs.writeFileSync('src/stores/useShopStore.ts', store);

