const fs = require('fs');
let c = fs.readFileSync('src/components/layout/TacticalAppShell.tsx', 'utf8');

c = c.replace(
  /import \{ AdminView \} from '\.\.\/admin\/AdminView';/,
  "import { AdminView } from '../admin/AdminView';\nimport { ShopView } from '../views/ShopView';"
);

c = c.replace(
  /\{activeView === 'admin' && user\?\.role === 'admin' && <AdminView \/>\}/,
  "{activeView === 'shop' && <ShopView />}\n        {activeView === 'admin' && user?.role === 'admin' && <AdminView />}"
);

fs.writeFileSync('src/components/layout/TacticalAppShell.tsx', c);
