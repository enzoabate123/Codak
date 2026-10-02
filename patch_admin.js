const fs = require('fs');
let c = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');

// Add to AdminTab type
c = c.replace(
  /type AdminTab = 'armas' \| 'attachments' \| 'habilidades' \| 'classes' \| 'lore' \| 'operadores' \| 'backup' \| 'configuracoes';/,
  "type AdminTab = 'armas' | 'attachments' | 'habilidades' | 'classes' | 'lore' | 'operadores' | 'backup' | 'configuracoes' | 'loja';"
);

// Add to tabs array
c = c.replace(
  /\{ id: 'configuracoes', label: 'Configurações', icon: Settings \},/,
  "{ id: 'configuracoes', label: 'Configurações', icon: Settings },\n    { id: 'loja', label: 'Loja', icon: Settings }," // use Settings icon for now, or ShoppingCart? Lucide imports might need update.
);

// We need to import ShoppingCart
c = c.replace(
  /Settings,/,
  "Settings,\n  ShoppingCart,"
);

c = c.replace(
  /icon: Settings \},/g,
  function(match, p1, offset, string) {
     if(string.includes("Loja", offset-30)) return "icon: ShoppingCart },";
     return match; // this is messy. Let's just do it directly.
  }
);
// Actually:
c = c.replace(
  /\{ id: 'loja', label: 'Loja', icon: Settings \},/,
  "{ id: 'loja', label: 'Loja (Shop)', icon: ShoppingCart },"
);


// Import useShopStore
c = c.replace(
  /import \{ useAudioStore \} from '@\/stores\/useAudioStore';/,
  "import { useAudioStore } from '@/stores/useAudioStore';\nimport { useShopStore } from '@/stores/useShopStore';"
);

// In AdminView, add: const shopStore = useShopStore(); and useEffect fetch
c = c.replace(
  /const \{ dict \} = useLocaleStore\(\);/,
  "const { dict } = useLocaleStore();\n  const shopStore = useShopStore();\n  React.useEffect(() => { shopStore.fetchShopState(); }, []);"
);

// Add render block
const renderBlock = `
        {activeTab === 'loja' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#fff' }}>GERENCIAR LOJA</h2>
              </div>
              <button
                className="hud-btn hud-btn-primary"
                onClick={() => {
                  shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, !shopStore.isOpen);
                }}
              >
                {shopStore.isOpen ? 'FECHAR LOJA' : 'ABRIR LOJA'}
              </button>
            </div>

            <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="hud-label">NOME DA LOJA</label>
                <input
                  type="text"
                  className="hud-input"
                  value={shopStore.shopName}
                  onChange={(e) => shopStore.setShopState(e.target.value, shopStore.availableItemIds, shopStore.isOpen)}
                  style={{ maxWidth: '400px' }}
                />
              </div>

              <div>
                <label className="hud-label" style={{ marginBottom: '8px', display: 'block' }}>ITENS DISPONÍVEIS</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {[...weapons.map(w => ({ id: 'w-'+w.id, name: w.name })),
                    ...attachments.map(a => ({ id: 'att-'+a.id, name: a.name })),
                    ...ammunitions.map(a => ({ id: 'ammo-'+a.type, name: 'Munição ' + a.type })),
                    ...loreRules.filter(lr => lr.category === 'equipamentos').map(lr => ({ id: 'lore-'+lr.id, name: lr.title }))
                   ].map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '4px 8px' }}>
                      <input 
                        type="checkbox" 
                        checked={shopStore.availableItemIds.includes(item.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...shopStore.availableItemIds, item.id]
                            : shopStore.availableItemIds.filter(id => id !== item.id);
                          shopStore.setShopState(shopStore.shopName, newIds, shopStore.isOpen);
                        }}
                      />
                      {item.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
`;

c = c.replace(
  /\{activeTab === 'configuracoes' && \(/,
  renderBlock + "\n        {activeTab === 'configuracoes' && ("
);

fs.writeFileSync('src/components/admin/AdminView.tsx', c);
