const fs = require('fs');
let c = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');

c = c.replace(
  /const \{ backgroundImage, setBackgroundImage \} = useConfigStore\(\);/,
  "const { backgroundImage, setBackgroundImage } = useConfigStore();\n  const shopStore = useShopStore();\n  React.useEffect(() => { shopStore.fetchShopState(); }, []);"
);
fs.writeFileSync('src/components/admin/AdminView.tsx', c);
