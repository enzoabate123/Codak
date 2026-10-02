const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf-8');

code = code.replace(
  "{activeTab === 'loja' && <AdminShopManager />}",
  "{activeTab === 'loja' && (\n          <div style={{ flex: 1, padding: '20px', color: '#fff', overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>\n            <AdminShopManager />\n          </div>\n        )}"
);

fs.writeFileSync('src/components/admin/AdminView.tsx', code);
