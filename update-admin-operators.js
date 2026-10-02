const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf-8');

// 1. Add imports
if (!code.includes("useCharacterStore")) {
  code = code.replace(
    "import { useAuthStore } from '@/stores/useAuthStore';",
    "import { useAuthStore } from '@/stores/useAuthStore';\nimport { useCharacterStore } from '@/stores/useCharacterStore';\nimport { useNavigationStore } from '@/stores/useNavigationStore';"
  );
}

// 2. Wrap the tr in a React.Fragment and add a sub-row for characters
const trRegex = /(<tr key=\{op\.id\} style=\{\{ borderBottom: '1px solid rgba\(255, 255, 255, 0\.04\)' \}\}>[\s\S]*?<\/tr>)/g;

code = code.replace(trRegex, (match) => {
  return `<React.Fragment key={op.id}>
                    ${match.replace('key={op.id}', '')}
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)' }}>
                      <td colSpan={5} style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>PERSONAGENS:</span>
                          {useCharacterStore.getState().characters.filter(c => (c as any).userId === op.id || ((c as any).userId === undefined && op.username === 'admin')).map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                tacticalAudio.playSelect();
                                useCharacterStore.getState().openCharacterSheet(c.id);
                                useNavigationStore.getState().selectView('characters');
                              }}
                              className="hud-btn hud-btn-outline"
                              style={{ padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Abrir Ficha"
                            >
                              <User size={10} />
                              {c.name}
                            </button>
                          ))}
                          {useCharacterStore.getState().characters.filter(c => (c as any).userId === op.id || ((c as any).userId === undefined && op.username === 'admin')).length === 0 && (
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>NENHUM PERSONAGEM</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>`;
});

fs.writeFileSync('src/components/admin/AdminView.tsx', code);
console.log("Updated operators table");
