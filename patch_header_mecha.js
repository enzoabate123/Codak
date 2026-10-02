const fs = require('fs');
let c = fs.readFileSync('src/components/character/CharacterSheetHeader.tsx', 'utf8');

c = c.replace(
  /<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.5fr 1\.5fr 0\.8fr 1fr' \+ \(selectedRaceConfig\?\.subraces\.length \? ' 1fr' : ''\), gap: '12px', alignItems: 'center' \}\}>/,
  "<div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr' + (selectedRaceConfig?.subraces.length ? ' 1fr' : '') + (char.classId === 'mecha' ? ' 1fr' : ''), gap: '12px', alignItems: 'center' }}>"
);

c = c.replace(
  /\{\/\* NÍVEL \*\/\}/,
  `{/* MECHA CORE SIZE */}
        {char.classId === 'mecha' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber-primary)' }}>Tamanho do Core</label>
            <select
              value={char.mechaCoreSize || ''}
              onChange={(e) => {
                const size = e.target.value;
                let en = 0;
                if (size === 'Half') en = 2;
                if (size === 'Light') en = 3;
                if (size === 'Heavy') en = 4;
                if (char.level >= 11) {
                  if (size === 'Half') en = 3;
                  if (size === 'Light') en = 5;
                  if (size === 'Heavy') en = 6;
                }
                updateBio({ mechaCoreSize: size as any, resourceName: 'EN', resourceMax: en, resourceCurrent: en });
              }}
              style={{ background: 'rgba(8, 8, 12, 0.8)', border: '1px solid var(--color-amber-border)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
            >
              <option value="">Selecione...</option>
              <option value="Half">Half Core</option>
              <option value="Light">Light Core</option>
              <option value="Heavy">Heavy Core</option>
            </select>
          </div>
        )}

        {/* NÍVEL */}`
);

fs.writeFileSync('src/components/character/CharacterSheetHeader.tsx', c);
