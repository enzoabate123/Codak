const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const anchor = `      </div>\n    </div>\n  );\n};\n\nexport const CampaignNotes`;
const injection = `      </div>
      
      {/* AMMO STASH */}
      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📦 MUNIÇÕES & BATERIAS
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {char.inventory.map((item, idx) => {
            if (!item || item.type !== 'ammo') return null;
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
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nenhuma munição carregada.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const CampaignNotes`;

code = code.replace(anchor, injection);
fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);
console.log("Replaced:", code.includes("📦 MUNIÇÕES & BATERIAS"));

