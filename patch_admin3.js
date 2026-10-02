const fs = require('fs');
let c = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');

if (!c.includes('import { useShopStore }')) {
  c = c.replace(
    /import \{ useCompendiumStore \} from '@\/stores\/useCompendiumStore';/,
    "import { useCompendiumStore } from '@/stores/useCompendiumStore';\nimport { useShopStore } from '@/stores/useShopStore';"
  );
}

c = c.replace(
  /filter\(id => id !== item\.id\)/,
  "filter((id: string) => id !== item.id)"
);

fs.writeFileSync('src/components/admin/AdminView.tsx', c);
