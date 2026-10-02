import React, { useState, useMemo } from 'react';
import { useCompendiumStore } from '@/stores/useCompendiumStore';
import { useShopStore, getItemPrice } from '@/stores/useShopStore';
import { tacticalAudio } from '@/lib/audio';
import { Package, Search, Plus, Trash2, Copy } from 'lucide-react';

export const AdminShopManager: React.FC = () => {
  const compendium = useCompendiumStore();
  const shopStore = useShopStore();
  
  const [rightTab, setRightTab] = useState<'all' | 'weapons' | 'armor' | 'accessories' | 'ammo' | 'lore'>('all');
  const [selectedShopItem, setSelectedShopItem] = useState<string | null>(null);
  
  // Custom price input state to allow fast typing before saving to store
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  // Generate catalog items
  const catalogItems = useMemo(() => {
    const items: any[] = [];
    
    compendium.weapons.forEach(w => {
      items.push({ id: `w-${w.id}`, name: w.name, type: 'weapons', basePrice: w.cost, icon: '🔫' });
    });
    compendium.attachments.forEach(a => {
      items.push({ id: `att-${a.id}`, name: a.name, type: 'accessories', basePrice: a.price, icon: '🔧' });
    });
    compendium.ammunitions.forEach(a => {
      const entryId = `ammo-${a.type}-${a.size}-${a.capacity || 0}`;
      const displayName = a.size === 'Bateria' ? `Bateria ${a.type} (${a.capacity} carga)` : `Munição ${a.type} ${a.size} (x30)`;
      items.push({ id: entryId, name: displayName, type: 'ammo', basePrice: a.pricePerBullet * 30, icon: '📦', data: a });
    });
    compendium.loreRules.forEach(lr => {
      if (lr.category === 'equipamentos') {
        let type = 'lore';
        if (lr.subtitle.includes('Armaduras')) type = 'armor';
        else if (lr.subtitle.includes('Acessórios')) type = 'accessories';
        
        const price = getItemPrice('item', lr) || 0;
        items.push({ id: `lore-${lr.id}`, name: lr.title, type, basePrice: price, icon: type === 'armor' ? '🛡️' : '📦' });
      }
    });
    
    return items;
  }, [compendium]);

  // Filter right side
  const rightItems = useMemo(() => {
    if (rightTab === 'all') return catalogItems;
    return catalogItems.filter(i => i.type === rightTab);
  }, [catalogItems, rightTab]);

  // Shop items
  const shopItems = useMemo(() => {
    return shopStore.availableItemIds.map(id => {
      const catalogItem = catalogItems.find(c => c.id === id);
      return {
        id,
        name: catalogItem?.name || 'Item Desconhecido',
        basePrice: catalogItem?.basePrice || 0,
        currentPrice: shopStore.customPrices[id] ?? catalogItem?.basePrice ?? 0,
        icon: catalogItem?.icon || '📦'
      };
    });
  }, [shopStore.availableItemIds, shopStore.customPrices, catalogItems]);

  const handleDragStart = (e: React.DragEvent, source: 'catalog' | 'shop', id: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source, id }));
    tacticalAudio.playHover();
  };

  const handleDropToShop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.source === 'catalog' && !shopStore.availableItemIds.includes(data.id)) {
      tacticalAudio.playSelect();
      shopStore.setShopState(shopStore.shopName, [...shopStore.availableItemIds, data.id], shopStore.isOpen, shopStore.profiles, shopStore.customPrices);
    }
  };

  const handleDropToCatalog = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.source === 'shop') {
      tacticalAudio.playSelect();
      const newIds = shopStore.availableItemIds.filter(id => id !== data.id);
      
      // Cleanup price when removing
      const newPrices = { ...shopStore.customPrices };
      delete newPrices[data.id];
      if (selectedShopItem === data.id) setSelectedShopItem(null);
      
      shopStore.setShopState(shopStore.shopName, newIds, shopStore.isOpen, shopStore.profiles, newPrices);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPriceInput(e.target.value);
    
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && selectedShopItem) {
      const newPrices = { ...shopStore.customPrices, [selectedShopItem]: val };
      shopStore.setShopState(shopStore.shopName, shopStore.availableItemIds, shopStore.isOpen, shopStore.profiles, newPrices);
    }
  };

  const selectItemForPrice = (id: string, price: number) => {
    setSelectedShopItem(id);
    setCustomPriceInput(price.toString());
    tacticalAudio.playHover();
  };

  const TABS = [
    { id: 'all', label: 'TODOS' },
    { id: 'weapons', label: 'ARMAS' },
    { id: 'armor', label: 'ARMADURAS' },
    { id: 'accessories', label: 'ACESSÓRIOS' },
    { id: 'ammo', label: 'MUNIÇÃO' },
    { id: 'lore', label: 'OUTROS' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '12px', flex: 1 }}>
      
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
              className={`hud-btn ${shopStore.isOpen ? 'hud-btn-primary' : 'hud-btn-outline'}`}
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

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: '400px' }}>
        
        {/* LEFT: SHOP INVENTORY */}
        <div 
          className="hud-panel" 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToShop}
        >
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
              <input 
                type="number" 
                className="hud-input" 
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-cyan-primary)', color: '#fff' }}
                disabled={!selectedShopItem}
                value={customPriceInput}
                onChange={handlePriceChange}
                placeholder="$$$"
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px', alignContent: 'start' }}>
            {shopItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, 'shop', item.id)}
                onClick={() => selectItemForPrice(item.id, item.currentPrice)}
                style={{
                  aspectRatio: '1',
                  background: selectedShopItem === item.id ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedShopItem === item.id ? '1px solid var(--color-cyan-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
                title={item.name}
              >
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <div style={{ 
                  position: 'absolute', bottom: '4px', right: '4px', 
                  fontSize: '9px', fontFamily: 'var(--font-mono)', 
                  color: item.currentPrice !== item.basePrice ? 'var(--color-amber-primary)' : 'var(--color-cyan-primary)',
                  background: 'rgba(0,0,0,0.8)', padding: '1px 3px', borderRadius: '2px', fontWeight: 'bold'
                }}>
                  ${item.currentPrice}
                </div>
              </div>
            ))}
            
            {shopItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '40px' }}>
                Arraste itens do compêndio para cá.
              </div>
            )}
          </div>
        </div>

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
        <div 
          className="hud-panel" 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToCatalog}
        >
          <div className="hud-panel-header" style={{ padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id)}
                  style={{
                    flex: 1,
                    background: rightTab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    borderBottom: rightTab === t.id ? '2px solid var(--color-cyan-primary)' : '2px solid transparent',
                    color: rightTab === t.id ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    padding: '12px 4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px', alignContent: 'start' }}>
            {rightItems.map(item => {
              const inShop = shopStore.availableItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  draggable={!inShop}
                  onDragStart={(e) => handleDragStart(e, 'catalog', item.id)}
                  style={{
                    aspectRatio: '1',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inShop ? 'not-allowed' : 'grab',
                    opacity: inShop ? 0.3 : 1,
                    position: 'relative',
                  }}
                  title={item.name}
                >
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
