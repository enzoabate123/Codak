const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminShopManager.tsx', 'utf-8');

const replacement = `
          <div className="hud-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ESTOQUE DA LOJA ({shopItems.length})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="hud-btn hud-btn-outline"
                style={{ fontSize: '10px', padding: '4px 8px' }}
                title="Voltar todos os itens da loja ao preço base do compêndio"
                onClick={() => {
                  if (confirm('Restaurar o preço original de TODOS os itens da loja?')) {
                    shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, shopStore.profiles, {});
                    tacticalAudio.playSelect();
                  }
                }}
              >
                PREÇO ORIGINAL
              </button>
              <button
                className="hud-btn hud-btn-outline"
                style={{ fontSize: '10px', padding: '4px 8px', borderColor: 'var(--color-amber-primary)', color: 'var(--color-amber-primary)' }}
                title="Deixar tudo de graça (Preço = 0)"
                onClick={() => {
                  if (confirm('Zerar o preço de TODOS os itens da loja?')) {
                    const newPrices = { ...shopStore.customPrices };
                    shopStore.availableItemIds.forEach(id => {
                      newPrices[id] = 0;
                    });
                    shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, shopStore.profiles, newPrices);
                    tacticalAudio.playSelect();
                  }
                }}
              >
                ZERAR TUDO
              </button>

              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />

              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PREÇO (SEL.):</span>
`;

code = code.replace(
  /<div className="hud-panel-header"[^>]*>[\s\S]*?<span[^>]*>PREÇO PERSONALIZADO:<\/span>/,
  replacement.trim()
);

fs.writeFileSync('src/components/admin/AdminShopManager.tsx', code);
