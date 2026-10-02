const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminShopManager.tsx', 'utf-8');

const middleButtons = `
        {/* MIDDLE: MOVE CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <button
            className="hud-btn hud-btn-outline"
            style={{ padding: '8px', minWidth: '40px', display: 'flex', justifyContent: 'center' }}
            title="Mover tudo da aba atual para a loja"
            onClick={() => {
              const newIds = new Set(shopStore.availableItemIds);
              rightItems.forEach(i => newIds.add(i.id));
              shopStore.setShopState(shopStore.shopName, Array.from(newIds), shopStore.isOpen, shopStore.profiles, shopStore.customPrices);
              tacticalAudio.playSelect();
            }}
          >
            {'<<'}
          </button>
          <button
            className="hud-btn hud-btn-outline"
            style={{ padding: '8px', minWidth: '40px', display: 'flex', justifyContent: 'center', borderColor: 'var(--color-amber-primary)', color: 'var(--color-amber-primary)' }}
            title="Remover tudo da loja"
            onClick={() => {
              shopStore.setShopState(shopStore.shopName, [], shopStore.isOpen, shopStore.profiles, {});
              tacticalAudio.playSelect();
            }}
          >
            {'>>'}
          </button>
        </div>

        {/* RIGHT: COMPENDIUM ITEMS */}
`;

code = code.replace("{/* RIGHT: COMPENDIUM ITEMS */}", middleButtons.trim());

// Also style the price input correctly
code = code.replace(
  "style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}",
  "style={{ width: '80px', padding: '4px 8px', fontSize: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-cyan-primary)', color: '#fff' }}"
);

fs.writeFileSync('src/components/admin/AdminShopManager.tsx', code);
