const fs = require('fs');
let code = fs.readFileSync('src/components/character/TraitsAndPerks.tsx', 'utf-8');

// Add createPortal import
if (!code.includes("import { createPortal }")) {
  code = code.replace(
    "import React from 'react';",
    "import React from 'react';\nimport { createPortal } from 'react-dom';"
  );
}

// Fix the class features map to add the Info button
const oldClassFeature = /<div style=\{\{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' \}\}>\s*\{feat\.name\} <span style=\{\{ fontSize: '9px', color: 'var\(--color-amber-primary\)', marginLeft: '4px' \}\}>\[Nv \{feat\.level\}\]<\/span>\s*<\/div>/g;

const newClassFeature = `<div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {feat.name} <span style={{ fontSize: '9px', color: 'var(--color-amber-primary)' }}>[Nv {feat.level}]</span>
                        <button
                          onClick={() => {
                            tacticalAudio.playSelect();
                            const fullAb = CLASS_ABILITIES_CATALOG.find(a => a.id === feat.abilityId);
                            setSelectedAbility({
                              title: feat.name,
                              cost: fullAb?.actionCost || 'Passiva',
                              range: fullAb?.range || 'Pessoal',
                              usage: fullAb?.usageLimit || 'Sem limite',
                              desc: fullAb?.description || feat.desc,
                              rules: fullAb?.rules || []
                            });
                          }}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '2px', border: 'none', background: 'transparent' }}
                          title="Ver detalhes da habilidade"
                        >
                          <Info size={12} color="var(--color-amber-primary)" />
                        </button>
                      </div>`;

code = code.replace(oldClassFeature, newClassFeature);

// Wrap the modal with createPortal
const modalStart = /\{selectedAbility && \(\s*<div style=\{\{ position: 'fixed', inset: 0, zIndex: 9999/;
const modalReplacement = `{selectedAbility && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAbility(null)}>`;

code = code.replace(modalStart, modalReplacement);

// Close the createPortal
const modalEnd = /<\/div>\s*\)\}\s*<\/div>\s*\);\s*\};\s*$/;
const modalEndReplacement = `</div>\n      ), document.body)}\n    </div>\n  );\n};\n`;

code = code.replace(modalEnd, modalEndReplacement);

fs.writeFileSync('src/components/character/TraitsAndPerks.tsx', code);
console.log("Fixed modal");
