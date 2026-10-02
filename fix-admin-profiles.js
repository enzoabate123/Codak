const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminShopManager.tsx', 'utf-8');

const newHeader = `
      {/* HEADER & PROFILES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#fff' }}>GERENCIAR LOJA</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="hud-input"
              value={shopStore.shopName}
              onChange={(e) => shopStore.setShopState(e.target.value, shopStore.availableItemIds, shopStore.isOpen, shopStore.profiles, shopStore.customPrices)}
              placeholder="Nome da Loja"
              style={{ width: '200px' }}
            />
            <button
              className={\`hud-btn \${shopStore.isOpen ? 'hud-btn-primary' : 'hud-btn-outline'}\`}
              onClick={() => shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, !shopStore.isOpen, shopStore.profiles, shopStore.customPrices)}
            >
              {shopStore.isOpen ? 'FECHAR LOJA' : 'ABRIR LOJA'}
            </button>
          </div>
        </div>
        
        {/* PROFILES BAR */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PERFIS DE LOJA:</span>
          <select 
            className="hud-input" 
            style={{ flex: 1 }}
            onChange={(e) => {
              const prof = shopStore.profiles.find(p => p.id === e.target.value);
              if (prof) shopStore.setShopState(prof.name, prof.availableItemIds, shopStore.isOpen, shopStore.profiles, prof.customPrices || {});
            }}
            value=""
          >
            <option value="" disabled>Carregar perfil salvo...</option>
            {shopStore.profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button 
            className="hud-btn hud-btn-outline"
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            onClick={() => {
              const newProf = {
                id: 'prof-' + Date.now(),
                name: shopStore.shopName,
                availableItemIds: [...shopStore.availableItemIds],
                customPrices: { ...shopStore.customPrices }
              };
              shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, [...shopStore.profiles, newProf], shopStore.customPrices);
              tacticalAudio.playSelect();
            }}
          >
            <Copy size={14} /> Salvar Atual como Novo
          </button>
          <button 
            className="hud-btn hud-btn-outline"
            style={{ borderColor: 'var(--color-amber-primary)', color: 'var(--color-amber-primary)' }}
            title="Deletar perfil atual"
            onClick={() => {
              const id = shopStore.profiles.find(p => p.name === shopStore.shopName)?.id;
              if (shopStore.profiles.length > 0) {
                const toDelete = id || shopStore.profiles[shopStore.profiles.length - 1].id;
                shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, shopStore.profiles.filter(p => p.id !== toDelete), shopStore.customPrices);
                tacticalAudio.playSelect();
              }
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
`;

// Replace the old header block
const headerStart = code.indexOf("{/* HEADER */}");
const headerEnd = code.indexOf("<div style={{ display: 'flex', gap: '24px'");

if (headerStart > -1 && headerEnd > -1) {
  const target = code.substring(headerStart, headerEnd);
  code = code.replace(target, newHeader + "\n      ");
} else {
  console.log("Could not find header markers");
}

// Make sure Copy is imported from lucide-react
if (!code.includes("Copy,")) {
  code = code.replace("Search, Plus, Trash2", "Search, Plus, Trash2, Copy");
}

fs.writeFileSync('src/components/admin/AdminShopManager.tsx', code);
