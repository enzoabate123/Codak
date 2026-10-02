const fs = require('fs');
let code = fs.readFileSync('src/components/character/TraitsAndPerks.tsx', 'utf-8');

// Add imports
if (!code.includes("import { CLASS_ABILITIES_CATALOG }")) {
  code = code.replace(
    "import { CLASSES_CATALOG } from '@/data/classes-catalog';",
    "import { CLASSES_CATALOG } from '@/data/classes-catalog';\nimport { CLASS_ABILITIES_CATALOG } from '@/data/class-abilities-catalog';\nimport { LORE_RULES_CATALOG } from '@/data/lore-rules-catalog';"
  );
}

if (!code.includes("import { Info }")) {
  code = code.replace(
    "import { Sparkles, Zap, Lock, Unlock, ArrowRightCircle } from 'lucide-react';",
    "import { Sparkles, Zap, Lock, Unlock, ArrowRightCircle, Info, X } from 'lucide-react';"
  );
}

// Add state
if (!code.includes("const [selectedAbility, setSelectedAbility]")) {
  code = code.replace(
    "const { characters, activeCharacterId, unlockSubclassAbility } = useCharacterStore();",
    "const { characters, activeCharacterId, unlockSubclassAbility } = useCharacterStore();\n  const [selectedAbility, setSelectedAbility] = React.useState<any>(null);"
  );
}

// Get race abilities
if (!code.includes("const raceAbilities =")) {
  code = code.replace(
    "const allClasses: { def: any, level: number, isPrimary: boolean }[] = [];",
    `const raceAbilities = React.useMemo(() => {
    if (!char.race) return [];
    return LORE_RULES_CATALOG.filter(r => {
      if (!r.tags?.includes('Habilidade Racial')) return false;
      if (r.subtitle.includes(char.race)) return true;
      if (char.race.startsWith('Android') && r.subtitle === 'Habilidade Racial: Android') return true;
      if (char.race.startsWith('Infectado') && r.subtitle === 'Habilidade Racial: Infectado') return true;
      return false;
    });
  }, [char.race]);

  const allClasses: { def: any, level: number, isPrimary: boolean }[] = [];`
  );
}

// Replace ability display to be clickable
const oldSubclassAbility = /<div style=\{\{ flex: 1 \}\}>[\s\S]*?<div style=\{\{ fontSize: '10px', color: 'var\(--text-secondary\)', marginTop: '4px', lineHeight: '1\.4' \}\}>\{ability\.desc\}<\/div>\s*<\/div>/g;

code = code.replace(oldSubclassAbility, `<div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: isUnlocked ? 'var(--color-cyan-primary)' : '#ccc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {isUnlocked ? <Unlock size={12} /> : <Lock size={12} color={isPreviousUnlocked ? "var(--color-cyan-primary)" : "var(--text-muted)"} opacity={isPreviousUnlocked ? 0.5 : 1} />}
                                  {ability.name}
                                  <button
                                    onClick={() => {
                                      tacticalAudio.playSelect();
                                      const fullAb = CLASS_ABILITIES_CATALOG.find(a => a.id === ability.abilityId);
                                      setSelectedAbility({
                                        title: ability.name,
                                        cost: fullAb?.actionCost || 'Passiva',
                                        range: fullAb?.range || 'Pessoal',
                                        usage: fullAb?.usageLimit || 'Sem limite',
                                        desc: fullAb?.description || ability.desc,
                                        rules: fullAb?.rules || []
                                      });
                                    }}
                                    className="hud-btn hud-btn-ghost"
                                    style={{ padding: '2px', border: 'none', background: 'transparent' }}
                                    title="Ver detalhes da habilidade"
                                  >
                                    <Info size={12} color="var(--color-cyan-primary)" />
                                  </button>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{ability.desc}</div>
                              </div>`);

// Inject Race abilities UI above SUBCLASSES PANEL
if (!code.includes("Habilidades Raciais")) {
  code = code.replace(
    "{/* SUBCLASSES PANEL */}",
    `{/* RACE ABILITIES PANEL */}
      {raceAbilities.length > 0 && (
        <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(15, 10, 14, 0.6)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-amber-primary)', fontWeight: 700 }}>
              Habilidades Raciais ({char.race})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {raceAbilities.map((rAb, idx) => (
              <div key={\`race-ab-\${idx}\`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '2px solid var(--color-amber-primary)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-amber-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} />
                    {rAb.title}
                    <button
                      onClick={() => {
                        tacticalAudio.playSelect();
                        setSelectedAbility({
                          title: rAb.title,
                          cost: 'Racial',
                          range: 'Pessoal',
                          usage: 'Passiva / Especial',
                          desc: rAb.description,
                          rules: rAb.attributes?.map(attr => \`\${attr.label}: \${attr.value}\`) || []
                        });
                      }}
                      className="hud-btn hud-btn-ghost"
                      style={{ padding: '2px', border: 'none', background: 'transparent' }}
                      title="Ver detalhes da habilidade"
                    >
                      <Info size={12} color="var(--color-amber-primary)" />
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{rAb.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBCLASSES PANEL */}`
  );
}

// Inject Modal at the bottom
if (!code.includes("selectedAbility && (")) {
  code = code.replace(
    "    </div>\n  );\n};\n",
    `
      {/* ABILITY MODAL */}
      {selectedAbility && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAbility(null)}>
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              width: '400px', 
              maxWidth: '90vw', 
              background: '#0d0d12', 
              border: '1px solid var(--color-cyan-primary)', 
              borderRadius: '8px', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.1)' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="var(--color-cyan-primary)" />
                {selectedAbility.title}
              </span>
              <button onClick={() => setSelectedAbility(null)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Custo de Ação</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{selectedAbility.cost}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Alcance</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{selectedAbility.range}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Uso</div>
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{selectedAbility.usage}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-cyan-primary)', marginBottom: '6px', fontWeight: 700 }}>Efeito / Descrição:</div>
                <div style={{ fontSize: '12px', color: '#ddd', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedAbility.desc}
                </div>
              </div>

              {selectedAbility.rules && selectedAbility.rules.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-amber-primary)', marginBottom: '6px', fontWeight: 700 }}>Atributos / Regras Adicionais:</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#bbb', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedAbility.rules.map((rule: string, i: number) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`
  );
}

fs.writeFileSync('src/components/character/TraitsAndPerks.tsx', code);
console.log("Done");
