const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const regex = /<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\\(8, minmax\\(0, 1fr\\)\\)', gap: '6px' \}\}>[\\s\\S]*?\{\(char\.inventory \|\| Array\(64\)\.fill\(null\)\)\.map\(\(item, idx\) => \([\s\S]*?<\/div>\\s*\)\)\}\\s*<\/div>/;

const newRender = `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: '6px' }}>
        {(char.inventory || Array(64).fill(null)).map((item, idx) => {
          if (item && item.type === 'ammo') return null; // Hide ammo from main grid
          return (
            <div
              key={item ? item.id : \`empty-\${idx}\`}
              draggable={!!item}
              onDragStart={(e) => { if (item) handleDragStart(e, idx); }}
              onDragEnter={(e) => handleDragEnter(e, idx)}
              onDragLeave={(e) => handleDragLeave(e, idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => {
                if (item) {
                  setSelectedIndex(selectedIndex === idx ? null : idx);
                  tacticalAudio.playSelect();
                }
              }}
              style={{
                aspectRatio: '1',
                background: item ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                border: dragOverIdx === idx ? '1px solid rgba(6, 182, 212, 0.6)' : item ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: dragOverIdx === idx ? '0 0 8px rgba(6, 182, 212, 0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: item ? 'pointer' : 'default',
                position: 'relative',
                minWidth: 0,
                minHeight: 0,
                overflow: 'hidden'
              }}
            >
              {item && (
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
            </div>
          );
        })}
      </div>

      {/* AMMO STASH */}
      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📦 MUNIÇÕES & BATERIAS
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {char.inventory.map((item, idx) => {
            if (item?.type !== 'ammo') return null;
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '14px' }}>{item.name.includes('Bateria') ? '🔋' : '📦'}</span>
                <div>
                  <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Qtd: {item.quantity}</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Deletar essa munição?')) {
                      useCharacterStore.getState().removeInventoryItem(item.id);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-amber-primary)',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    fontSize: '12px'
                  }}
                  title="Descartar"
                >
                  ✕
                </button>
              </div>
            );
          })}
          {char.inventory.filter(i => i?.type === 'ammo').length === 0 && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nenhuma munição na mochila.</span>
          )}
        </div>
      </div>`;

code = code.replace(regex, newRender);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
