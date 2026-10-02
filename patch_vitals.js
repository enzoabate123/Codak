const fs = require('fs');
let c = fs.readFileSync('src/components/character/VitalsAndStats.tsx', 'utf8');

c = c.replace(
  /const \{ characters, activeCharacterId, updateHp, setTempHp \} = useCharacterStore\(\);/,
  "const { characters, activeCharacterId, updateHp, setTempHp, updateResource } = useCharacterStore();"
);

c = c.replace(
  /const \{ hpCurrent, hpMax, tempHp, speedMeters, proficiencyBonus \} = char;/,
  "const { hpCurrent, hpMax, tempHp, speedMeters, proficiencyBonus, resourceName, resourceCurrent, resourceMax } = char;"
);

c = c.replace(
  /<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.8fr 1fr 1fr 1fr 1fr', gap: '10px' \}\}>/,
  "<div style={{ display: 'grid', gridTemplateColumns: resourceMax ? '1.8fr 1.8fr 1fr 1fr 1fr 1fr' : '1.8fr 1fr 1fr 1fr 1fr', gap: '10px' }}>"
);

const resourceBlock = `
      {/* Resource Container */}
      {resourceMax ? (
      <div className="hud-panel-chamfer" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(13, 13, 17, 0.95) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#3b82f6" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-cyan-primary)' }}>{resourceName || 'Energy'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 800, color: '#fff' }}>{resourceCurrent || 0}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>/ {resourceMax}</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: \`\${((resourceCurrent || 0) / resourceMax) * 100}%\`, background: 'var(--color-cyan-primary)', transition: 'all var(--transition-normal)' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--color-cyan-border)' }} onClick={() => { updateResource(-1); tacticalAudio.playAlert(); }}>-1</button>
          <button type="button" className="hud-btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--color-cyan-border)' }} onClick={() => { updateResource(1); tacticalAudio.playSelect(); }}>+1</button>
        </div>
      </div>
      ) : null}
`;

c = c.replace(
  /\{\/\* Armor Class \*\/\}/,
  resourceBlock + "\n      {/* Armor Class */}"
);

fs.writeFileSync('src/components/character/VitalsAndStats.tsx', c);
