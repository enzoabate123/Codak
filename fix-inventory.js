const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const overlaySearch = \`<div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                      <button onClick={() => equipItem(idx, 'armor')} style={{ fontSize: '8px', padding: '2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', marginBottom: '2px' }}>EQ: ARMADURA</button>
                      <button onClick={() => equipItem(idx, 'accessory')} style={{ fontSize: '8px', padding: '2px', background: 'var(--color-cyan-primary)', color: '#000', border: 'none', cursor: 'pointer' }}>EQ: ACESSÓRIO</button>
                    </div>\`;

const overlayReplace = \`<div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', gap: '2px' }}>
                      {item.type === 'weapon' ? (
                        <>
                          <button onClick={() => useCharacterStore.getState().equipWeapon(idx, 'primary')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-red-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: PRIMÁRIA</button>
                          <button onClick={() => useCharacterStore.getState().equipWeapon(idx, 'secondary')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: SECUNDÁR</button>
                          <button onClick={() => useCharacterStore.getState().equipWeapon(idx, 'backup')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--text-secondary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: BACKUP</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => equipItem(idx, 'armor')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-amber-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: ARMADURA</button>
                          <button onClick={() => equipItem(idx, 'accessory')} style={{ fontSize: '7.5px', padding: '2px', background: 'var(--color-cyan-primary)', color: '#000', border: 'none', cursor: 'pointer', width: '90%', fontWeight: 'bold' }}>EQ: ACESSÓR</button>
                        </>
                      )}
                    </div>\`;

code = code.replace(overlaySearch, overlayReplace);
fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
