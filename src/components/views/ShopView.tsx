'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useShopStore, getItemPrice } from '@/stores/useShopStore';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { useCompendiumStore } from '@/stores/useCompendiumStore';
import { tacticalAudio } from '@/lib/audio';
import { CLASSES_CATALOG } from '@/data/classes-catalog';
import { GrimoireSidebar, CATEGORY_ICONS, GrimoireCategory } from '@/components/grimoire/GrimoireSidebar';
import { ShoppingCart, Lock, Trash2, CheckCircle2, AlertTriangle, RefreshCcw, Search } from 'lucide-react';
import { GrimoireModalItem } from '@/types/grimoire';



const ShopItemCard = ({ item, compat, addToCart }: { item: any, compat: boolean, addToCart: (item: any) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extrair info rapida
  let quickInfo = '';
  if (item.type === 'weapon') quickInfo = `Dano: ${item.data.baseDamage} | Mun: ${item.data.ammoCapacity}`;
  else if (item.type === 'attachment') quickInfo = item.data.effect?.substring(0, 40) + (item.data.effect?.length > 40 ? '...' : '');
  else if (item.data.summary) quickInfo = item.data.summary.replace(/Preço: \d+ \| /, '').substring(0, 45) + '...';
  else quickInfo = item.category.toUpperCase();

  return (
    <div 
      style={{ position: 'relative', zIndex: isHovered ? 10 : 1 }}
      onMouseEnter={() => { tacticalAudio.playHover(); setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        style={{ 
          background: 'transparent',
          padding: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          cursor: 'pointer', 
          transition: 'all 0.2s',
          minHeight: '110px',
          border: isHovered ? '1px solid var(--color-amber-primary)' : '1px solid rgba(255,255,255,0.05)',
          borderBottom: isHovered ? 'none' : '1px solid rgba(255,255,255,0.05)',
          boxShadow: isHovered ? '0 -4px 15px rgba(245, 158, 11, 0.15)' : 'none',
        }}
        onClick={() => addToCart({ catalogId: item.data.id || item.data.type, name: item.name, price: item.price, type: item.type, data: item.data })}
      >
        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{item.name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-amber-primary)' }}>₵ {item.price.toLocaleString()}</div>
        
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {quickInfo}
        </div>

        {!compat && (
          <div style={{ background: 'var(--color-red-primary)', color: '#000', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', marginTop: 'auto' }}>
            <AlertTriangle size={10} /> INCOMPATÍVEL
          </div>
        )}
      </div>

      {/* Expanded Hover Details */}
      {isHovered && (
        <div className="hover-card-enter" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.95)',
          border: '1px solid var(--color-amber-primary)',
          borderTop: 'none',
          padding: '12px',
          paddingTop: '8px',
          zIndex: 20,
          boxShadow: '0 15px 20px rgba(0,0,0,0.9), 0 10px 15px rgba(245, 158, 11, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none'
        }}>
          {item.type === 'weapon' && (
            <>
              <div style={{ fontSize: '10px', color: '#a1a1aa' }}>Tipo: <span style={{color: '#fff'}}>{item.data.type?.toUpperCase()}</span> | Tamanho: <span style={{color: '#fff'}}>{item.data.size?.toUpperCase()}</span></div>
              {item.data.sweetSpotBonusDamage && <div style={{ fontSize: '10px', color: 'var(--color-red-primary)' }}>Sweet Spot: {item.data.sweetSpotBonusDamage} ({item.data.sweetSpot}m)</div>}
              {item.data.modes && <div style={{ fontSize: '10px', color: 'var(--color-cyan-primary)' }}>Modos: {item.data.modes.join(', ')}</div>}
            </>
          )}
          {item.type === 'attachment' && (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Compatível: {item.data.compatibility?.weaponTypes?.join(', ')}</div>
              <div style={{ fontSize: '10px', color: '#fff' }}>Efeito: {item.data.effect}</div>
            </>
          )}
          {item.type === 'armor' && (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.data.subtitle}</div>
              <div style={{ fontSize: '10px', color: '#fff' }}>{item.data.summary?.replace(/Preço: \d+ \| /, '')}</div>
              {item.data.attributes?.map((attr: any, i: number) => (
                <div key={i} style={{ fontSize: '10px', color: 'var(--color-cyan-primary)' }}>{attr.label}: {attr.value}</div>
              ))}
            </>
          )}
          {item.type === 'ammo' && (
            <div style={{ fontSize: '10px', color: '#fff' }}>Munição do tipo {item.data.type}. Pacote com 30 unidades.</div>
          )}
        </div>
      )}
    </div>
  );
};



export function checkClassCompat(char: any | undefined, itemType: string, itemData: any): boolean {
  if (!char) return true;
  const classId = char.classId;
  if (!classId) return true;
  
  // Mecha Dynamic Core Size Logic
  let mechaMockProficiencies: string[] = [];
  if (classId === 'mecha') {
    // We check if the active character has a mechaCoreSize
    const coreSize = char.mechaCoreSize || 'Half'; // default
    if (coreSize === 'Half') mechaMockProficiencies = ['Small', 'Simples'];
    else if (coreSize === 'Light') mechaMockProficiencies = ['Medium'];
    else if (coreSize === 'Heavy') mechaMockProficiencies = ['Heavy', 'Big', 'Pesada'];
  }

  const cls = CLASSES_CATALOG.find(c => c.id === classId);
  if (!cls) return true;

  if (itemType === 'weapon') {
    const profs = classId === 'mecha' ? mechaMockProficiencies : cls.weaponProficiencies;
    if (!profs || profs.length === 0 || profs.includes('None')) return false;
    
    return profs.some(p => {
      const pStr = p.toLowerCase();
      if (pStr === 'todas' || pStr === 'all') return true;
      const itemStr = `${itemData.name} ${itemData.type} ${itemData.size} ${itemData.category}`.toLowerCase();
      
      if (pStr.includes('pistol')) return itemStr.includes('pistol');
      if (pStr.includes('rifle')) return itemStr.includes('rifle');
      if (pStr.includes('melee') || pStr.includes('corpo a corpo')) return itemStr.includes('melee');
      if (pStr.includes('submachine')) return itemStr.includes('submachine') || itemStr.includes('smg');
      if (pStr.includes('sniper')) return itemStr.includes('sniper');
      if (pStr.includes('shotgun')) return itemStr.includes('shotgun');
      if (pStr.includes('heavy') || pStr.includes('pesada')) return itemStr.includes('heavy') || itemStr.includes('big');
      if (pStr.includes('simples') || pStr.includes('simple')) return itemStr.includes('small') || itemStr.includes('melee'); // heuristic
      
      return itemStr.includes(pStr) || pStr.includes(itemData.type?.toLowerCase() || 'xxx');
    });
  }
  
  if (itemType === 'armor') {
    if (classId === 'mecha') return true; // Mechas don't use regular armor
    if (!cls.armorProficiencies || cls.armorProficiencies.length === 0 || cls.armorProficiencies.includes('None')) return false;

    return cls.armorProficiencies.some(p => {
      const pStr = p.toLowerCase();
      if (pStr === 'todas' || pStr === 'all') return true;
      const itemStr = `${itemData.title} ${itemData.subtitle} ${itemData.description} ${itemData.summary}`.toLowerCase();
      
      if (pStr.includes('leve') || pStr.includes('light')) return itemStr.includes('leve') || itemStr.includes('light');
      if (pStr.includes('média') || pStr.includes('media') || pStr.includes('medium')) return itemStr.includes('média') || itemStr.includes('media') || itemStr.includes('medium');
      if (pStr.includes('pesada') || pStr.includes('heavy')) return itemStr.includes('pesada') || itemStr.includes('heavy');
      
      return itemStr.includes(pStr);
    });
  }

  // ATTACHMENT COMPATIBILITY
  if (itemType === 'attachment') {
    const equippedWeapons = [char.primaryWeapon, char.secondaryWeapon, char.backupWeapon].filter(Boolean);
    if (equippedWeapons.length === 0) return false;
    
    const comp = itemData.compatibility || {};
    if (comp.all) return true;
    
    return equippedWeapons.some(w => {
      if (comp.weaponSizes && comp.weaponSizes.length > 0 && !comp.weaponSizes.includes(w.size)) return false;
      if (comp.weaponTypes && comp.weaponTypes.length > 0 && !comp.weaponTypes.includes(w.type)) return false;
      if (comp.specificWeaponIds && comp.specificWeaponIds.length > 0 && !comp.specificWeaponIds.includes(w.id)) return false;
      return true;
    });
  }

  // AMMUNITION COMPATIBILITY
  if (itemType === 'ammunition') {
    const equippedWeapons = [char.primaryWeapon, char.secondaryWeapon, char.backupWeapon].filter(Boolean);
    if (equippedWeapons.length === 0) return false;
    
    // As long as the character has at least one non-melee weapon, ammo is potentially usable
    // For a more specific check, you'd need the ammoType mapped to weapon types, but this solves the general case.
    return equippedWeapons.some(w => w.type !== 'Melee' && w.type !== 'Branca');
  }

  return true;
}

export const ShopView: React.FC = () => {
  
  const { isOpen, shopName, availableItemIds, cart, fetchShopState, addToCart, removeFromCart, checkout, customPrices } = useShopStore();
  const { characters, fetchCharacters } = useCharacterStore();
  const { weapons, attachments, ammunitions, loreRules } = useCompendiumStore();

  const [activeCategory, setActiveCategory] = useState<GrimoireCategory>('armas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharId, setSelectedCharId] = useState<string>('');

  useEffect(() => {
    fetchShopState();
    fetchCharacters();
    const interval = setInterval(fetchShopState, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchShopState, fetchCharacters]);

  useEffect(() => {
    if (characters.length > 0 && !selectedCharId) {
      setSelectedCharId(characters[0].id);
    }
  }, [characters, selectedCharId]);

  const selectedChar = characters.find(c => c.id === selectedCharId);

  // Compile all shop items based on availableItemIds
  const allShopItems = useMemo(() => {
    const items: { id: string; category: GrimoireCategory; name: string; type: any; price: number; data: any; raw: GrimoireModalItem }[] = [];
    
    // Add logic to parse catalog items if their ID is in availableItemIds
    weapons.forEach(w => {
      const entryId = `w-${w.id}`;
      if (availableItemIds.includes(entryId)) {
        items.push({ id: entryId, category: 'armas', name: w.name, type: 'weapon', price: customPrices?.[entryId] ?? w.cost, data: w, raw: { type: 'weapon', data: w } });
      }
    });
    attachments.forEach(a => {
      const entryId = `att-${a.id}`;
      if (availableItemIds.includes(entryId)) {
        items.push({ id: entryId, category: 'attachments', name: a.name, type: 'attachment', price: customPrices?.[entryId] ?? a.price, data: a, raw: { type: 'attachment', data: a } });
      }
    });
    ammunitions.forEach(a => {
      const entryId = `ammo-${a.type}-${a.size}-${a.capacity || 0}`;
      const displayName = a.size === 'Bateria' ? `Bateria ${a.type} (${a.capacity} carga)` : `Munição ${a.type} ${a.size} (x30)`;
      if (availableItemIds.includes(entryId)) {
        items.push({ id: entryId, category: 'equipamentos_gerais', name: displayName, type: 'ammo', price: customPrices?.[entryId] ?? (a.pricePerBullet * 30), data: a, raw: { type: 'ammo', data: a } });
      }
    });
    loreRules.forEach(lr => {
      const entryId = `lore-${lr.id}`;
      if (availableItemIds.includes(entryId) && lr.category === 'equipamentos') {
        let cat: GrimoireCategory = 'equipamentos_gerais';
        let tType = 'item';
        if (lr.subtitle.includes('Armadura')) { cat = 'armaduras'; tType = 'armor'; }
        else if (lr.subtitle.includes('Implante Cibernético')) cat = 'ciberneticas';
        else if (lr.subtitle.includes('Curas e Consumíveis')) cat = 'consumiveis';
        
        const basePrice = getItemPrice(tType, lr) || 0;
        const price = customPrices?.[entryId] ?? basePrice;
        items.push({ id: entryId, category: cat, name: lr.title, type: tType, price, data: lr, raw: { type: 'lore_rule', data: lr } });
      }
    });

    return items;
  }, [weapons, attachments, ammunitions, loreRules, availableItemIds, customPrices]);

  const categoryTabs: { id: GrimoireCategory; label: string; icon: any }[] = useMemo(() => [
    { id: 'armas', label: 'Armas', icon: CATEGORY_ICONS.armas },
    { id: 'attachments', label: 'Attachments', icon: CATEGORY_ICONS.attachments },
    { id: 'armaduras', label: 'Armaduras', icon: CATEGORY_ICONS.armaduras },
    { id: 'ciberneticas', label: 'Cibernéticas', icon: CATEGORY_ICONS.ciberneticas },
    { id: 'consumiveis', label: 'Consumíveis', icon: CATEGORY_ICONS.consumiveis },
    { id: 'equipamentos_gerais', label: 'Equip. Geral', icon: CATEGORY_ICONS.equipamentos_gerais },
  ], []);

  const visibleItems = allShopItems.filter(i => {
    if (i.category !== activeCategory) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const txt = `${i.name} ${i.data.type || ''} ${i.data.size || ''} ${i.data.subtitle || ''} ${i.data.summary || ''}`.toLowerCase();
    
    if (q === 'pequena' || q === 'pequenas' || q === 'pequeno') return txt.includes('small');
    if (q === 'media' || q === 'média' || q === 'médias' || q === 'medio' || q === 'médio') return txt.includes('medium');
    if (q === 'grande' || q === 'grandes') return txt.includes('heavy') || txt.includes('big');
    if (q === 'enorme' || q === 'enormes') return txt.includes('massive') || txt.includes('big');
    
    return txt.includes(q);
  });

  const cartTotal = cart.reduce((acc, c) => acc + c.price, 0);

  if (!isOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
        <Lock size={64} color="var(--color-red-primary)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', letterSpacing: '0.1em' }}>LOJA INDISPONÍVEL</h1>
        <p style={{ color: 'var(--text-muted)' }}>O mestre ainda não abriu uma loja ou os suprimentos esgotaram.</p>
        <button className="hud-btn hud-btn-outline" style={{ marginTop: '24px' }} onClick={() => { tacticalAudio.playSelect(); fetchShopState(); }}>
          <RefreshCcw size={16} /> ATUALIZAR STATUS
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* Header (Grimoire Style) */}
      <div
        className="grimoire-breadcrumb-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          borderBottom: 'var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="grimoire-breadcrumb-segment" style={{ color: 'var(--color-amber-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={14} />
            {shopName}
          </span>
          <span className="grimoire-breadcrumb-separator" style={{ color: 'var(--text-muted)' }}>
            &gt;
          </span>
          <span className="grimoire-breadcrumb-segment--active" style={{ color: 'var(--color-red-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {categoryTabs.find(c => c.id === activeCategory)?.label || 'ESTOQUE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search Input from Grimoire */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar..."
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-3)',
                border: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                padding: '0.25rem 0.5rem 0.25rem 2rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-amber-primary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>

          <select 
            className="hud-input"
            value={selectedCharId}
            onChange={(e) => { setSelectedCharId(e.target.value); tacticalAudio.playSelect(); }}
            style={{ width: '200px', fontSize: '0.85rem', padding: '0.25rem 0.5rem', height: 'auto' }}
          >
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', border: '1px solid var(--color-cyan-primary)', borderRadius: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SALDO:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-cyan-primary)', fontWeight: 'bold', marginLeft: '6px' }}>
              ₵ {selectedChar?.credits?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '240px', overflowY: 'auto' }}>
          <GrimoireSidebar
            categories={categoryTabs}
            activeCategory={activeCategory}
            items={[]}
            selectedId={null}
            onSelectCategory={(cat) => { setActiveCategory(cat); tacticalAudio.playSelect(); }}
            onSelectItem={() => {}}
          />
        </div>

        {/* Item Grid */}
        <div className="hud-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {visibleItems.map(item => {
              const compat = checkClassCompat(selectedChar, item.type, item.data);
              return (
                <ShopItemCard key={item.id} item={item} compat={compat} addToCart={addToCart} />
              );
            })}
            {visibleItems.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Nenhum item nesta categoria.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Footer */}
      <div style={{ 
        marginTop: 'auto', 
        padding: '16px', 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'center',
        background: 'transparent',
        borderTop: '1px solid var(--color-amber-primary)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        borderRadius: '4px',
        margin: '16px 0 0 0'
      }}>
        <div style={{ width: '120px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CARRINHO</div>
          <div style={{ fontSize: '18px', color: '#fff' }}>{cart.length} ITENS</div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
          {cart.map((cItem, idx) => (
            <div 
              key={idx}
              style={{ 
                minWidth: '60px',
                aspectRatio: '1', 
                border: '1px solid var(--color-cyan-primary)',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => removeFromCart(idx)}
            >
              <div style={{ fontSize: '10px', color: '#fff', textAlign: 'center', wordBreak: 'break-word', padding: '2px' }}>{cItem.name.substring(0, 12)}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-amber-primary)' }}>₵ {cItem.price}</div>
              <div className="cart-remove-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}>
                <Trash2 size={16} color="#000" />
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhum item no carrinho
            </div>
          )}
        </div>

        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TOTAL:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: cartTotal > (selectedChar?.credits || 0) ? 'var(--color-red-primary)' : '#fff' }}>
              ₵ {cartTotal.toLocaleString()}
            </span>
          </div>
          <button 
            className="hud-btn hud-btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}
            disabled={cart.length === 0 || cartTotal > (selectedChar?.credits || 0)}
            onClick={() => {
              if (selectedCharId && checkout(selectedCharId)) {
                // success
              } else {
                tacticalAudio.playAlert();
              }
            }}
          >
            <CheckCircle2 size={18} /> COMPRAR
          </button>
        </div>
      </div>
      
      {/* Add global style for the cart overlay */}
      <style dangerouslySetInnerHTML={{__html: `
        .cart-remove-overlay:hover { opacity: 1 !important; }
      `}} />
    </div>
  );
};
