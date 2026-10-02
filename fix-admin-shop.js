const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf-8');

if (!code.includes("import { AdminShopManager }")) {
  code = code.replace(
    "import { InternalLoader } from '../ui/InternalLoader';",
    "import { InternalLoader } from '../ui/InternalLoader';\nimport { AdminShopManager } from './AdminShopManager';"
  );
}

const shopStart = code.indexOf("{activeTab === 'loja' && (");
const shopEnd = code.indexOf("{/* 7. AUDIT LOGS & BACKUP TAB */}");

if (shopStart > -1 && shopEnd > -1) {
  const target = code.substring(shopStart, shopEnd);
  const replacement = "{activeTab === 'loja' && <AdminShopManager />}\n\n        ";
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/admin/AdminView.tsx', code);
}
