const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

code = code.replace(
  "const { isOpen, shopName, availableItemIds, cart, fetchShopState, addToCart, removeFromCart, checkout } = useShopStore();",
  "const { isOpen, shopName, availableItemIds, cart, fetchShopState, addToCart, removeFromCart, checkout, customPrices } = useShopStore();"
);

code = code.replace(/shopStore\.customPrices/g, "customPrices");

code = code.replace(
  "  }, [weapons, attachments, ammunitions, loreRules, availableItemIds]);",
  "  }, [weapons, attachments, ammunitions, loreRules, availableItemIds, customPrices]);"
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);
