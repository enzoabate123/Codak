const fs = require('fs');
let c = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');

const startIdx = c.indexOf("{activeTab === 'loja' && (");
const endIdx = c.indexOf("{activeTab === 'configuracoes' && (");

if (startIdx !== -1 && endIdx !== -1) {
  const newBlock = `
        {activeTab === 'loja' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#fff' }}>GERENCIAR LOJA</h2>
              <button
                className="hud-btn hud-btn-primary"
                onClick={() => shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, !shopStore.isOpen)}
              >
                {shopStore.isOpen ? 'FECHAR LOJA' : 'ABRIR LOJA'}
              </button>
            </div>

            <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label className="hud-label">NOME DA LOJA (STATUS ATUAL)</label>
                  <input
                    type="text"
                    className="hud-input"
                    value={shopStore.shopName}
                    onChange={(e) => shopStore.setShopState(e.target.value, shopStore.availableItemIds, shopStore.isOpen)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ flex: 1, minWidth: '350px' }}>
                  <label className="hud-label">PERFIS SALVOS</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="hud-input" 
                      style={{ flex: 1 }}
                      onChange={(e) => {
                        const prof = shopStore.profiles.find(p => p.id === e.target.value);
                        if (prof) shopStore.setShopState(prof.name, prof.availableItemIds, shopStore.isOpen);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Carregar perfil...</option>
                      {shopStore.profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button 
                      className="hud-btn hud-btn-outline"
                      onClick={() => {
                        const name = prompt('Nome do novo perfil:', shopStore.shopName);
                        if (name) {
                          const newProfile = { id: ('crypto' in globalThis && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substr(2, 9)), name, availableItemIds: shopStore.availableItemIds };
                          shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, [...shopStore.profiles, newProfile]);
                        }
                      }}
                    >
                      <Copy size={16} /> SALVAR ATUAL
                    </button>
                    <button 
                      className="hud-btn hud-btn-ghost" style={{ color: 'var(--color-red-primary)' }}
                      onClick={() => {
                        const id = prompt('Cole o ID do perfil para deletar (ou implemente seleção): \\nIsso é só um atalho, apaga o ultimo por padrao se vazio');
                        if (shopStore.profiles.length > 0) {
                          const toDelete = id || shopStore.profiles[shopStore.profiles.length - 1].id;
                          shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, shopStore.profiles.filter(p => p.id !== toDelete));
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label className="hud-label" style={{ margin: 0 }}>ITENS DISPONÍVEIS</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="hud-btn hud-btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => {
                        const allIds = [
                          ...weapons.map(w => 'w-'+w.id),
                          ...attachments.map(a => 'att-'+a.id),
                          ...ammunitions.map(a => 'ammo-'+a.type),
                          ...loreRules.filter(lr => lr.category === 'equipamentos').map(lr => 'lore-'+lr.id)
                        ];
                        shopStore.setShopState(shopStore.shopName, allIds, shopStore.isOpen);
                      }}
                    >SELECIONAR TUDO</button>
                    <button 
                      className="hud-btn hud-btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => shopStore.setShopState(shopStore.shopName, [], shopStore.isOpen)}
                    >LIMPAR TUDO</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { title: 'Armas', items: weapons.map(w => ({ id: 'w-'+w.id, name: w.name })) },
                    { title: 'Attachments', items: attachments.map(a => ({ id: 'att-'+a.id, name: a.name })) },
                    { title: 'Munição', items: ammunitions.map(a => ({ id: 'ammo-'+a.type, name: 'Munição ' + a.type })) },
                    { title: 'Armaduras', items: loreRules.filter(lr => lr.category === 'equipamentos' && lr.subtitle.includes('Armadura')).map(lr => ({ id: 'lore-'+lr.id, name: lr.title })) },
                    { title: 'Cibernéticas', items: loreRules.filter(lr => lr.category === 'equipamentos' && lr.subtitle.includes('Ciber')).map(lr => ({ id: 'lore-'+lr.id, name: lr.title })) },
                    { title: 'Consumíveis', items: loreRules.filter(lr => lr.category === 'equipamentos' && (lr.subtitle.includes('Cura') || lr.subtitle.includes('Consum'))).map(lr => ({ id: 'lore-'+lr.id, name: lr.title })) },
                    { title: 'Equipamentos Gerais', items: loreRules.filter(lr => lr.category === 'equipamentos' && !lr.subtitle.includes('Armadura') && !lr.subtitle.includes('Ciber') && !lr.subtitle.includes('Cura') && !lr.subtitle.includes('Consum')).map(lr => ({ id: 'lore-'+lr.id, name: lr.title })) },
                  ].map(cat => (
                    <div key={cat.title} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-cyan-primary)', fontWeight: 'bold' }}>{cat.title.toUpperCase()} ({cat.items.length})</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="hud-btn hud-btn-ghost" style={{ fontSize: '10px', padding: '2px 6px' }}
                            onClick={() => {
                              const newIds = new Set(shopStore.availableItemIds);
                              cat.items.forEach(i => newIds.add(i.id));
                              shopStore.setShopState(shopStore.shopName, Array.from(newIds), shopStore.isOpen);
                            }}
                          >Sel. Todos</button>
                          <button 
                            className="hud-btn hud-btn-ghost" style={{ fontSize: '10px', padding: '2px 6px' }}
                            onClick={() => {
                              const catIds = new Set(cat.items.map(i => i.id));
                              const newIds = shopStore.availableItemIds.filter(id => !catIds.has(id));
                              shopStore.setShopState(shopStore.shopName, newIds, shopStore.isOpen);
                            }}
                          >Remover Todos</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {cat.items.map(item => (
                          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '4px 8px' }}>
                            <input 
                              type="checkbox" 
                              checked={shopStore.availableItemIds.includes(item.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked 
                                  ? [...shopStore.availableItemIds, item.id]
                                  : shopStore.availableItemIds.filter((id: string) => id !== item.id);
                                shopStore.setShopState(shopStore.shopName, newIds, shopStore.isOpen);
                              }}
                            />
                            {item.name}
                          </label>
                        ))}
                        {cat.items.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nenhum item.</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
`;

  c = c.substring(0, startIdx) + newBlock + "\n        " + c.substring(endIdx);
  fs.writeFileSync('src/components/admin/AdminView.tsx', c);
}
