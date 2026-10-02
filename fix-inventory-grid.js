const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const replacement = `            {item && (
              <div style={{ textAlign: 'center', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>
                  {item.type === 'weapon' ? '🔫' : 
                   item.type === 'armor' ? '🛡️' : 
                   item.type === 'accessory' ? '🧲' : 
                   item.type === 'ammo' ? '📦' : 
                   item.type === 'attachment' ? '🔧' : '🧰'}
                </span>
                <div style={{ fontSize: '9px', color: '#fff', padding: '0 4px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }} title={item.name}>{item.name}</div>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>x{item.quantity}</div>
                
                <div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === idx ? 1 : 0, pointerEvents: selectedIndex === idx ? 'auto' : 'none', transition: 'opacity 0.2s', gap: '4px', zIndex: 10 }}>
                  {item.type === 'weapon' ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); useCharacterStore.getState().equipWeapon(idx, 'primary'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-red-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>PRIMÁRIA</button>
                      <button onClick={(e) => { e.stopPropagation(); useCharacterStore.getState().equipWeapon(idx, 'secondary'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>SECUNDÁRIA</button>
                      <button onClick={(e) => { e.stopPropagation(); useCharacterStore.getState().equipWeapon(idx, 'backup'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--text-secondary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>BACKUP</button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); equipItem(idx, 'armor'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>ARMADURA</button>
                      <button onClick={(e) => { e.stopPropagation(); equipItem(idx, 'accessory'); setSelectedIndex(null); }} style={{ fontSize: '8px', padding: '4px 2px', background: 'var(--color-cyan-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>ACESSÓRIO</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>`;

code = code.replace(/\{item && \(\s*<div style=\{\{ textAlign: 'center'[\s\S]*?<\/div>\s*\)\}\s*<\/div>/, replacement);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
