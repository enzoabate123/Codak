const fs = require('fs');

// 1. Update store
let store = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf8');
const recalcLogic = `          if (fields.level !== undefined || fields.secondaryClasses !== undefined) {
            const totalLvl = (updated.level || 1) + (updated.secondaryClasses?.reduce((acc, c) => acc + (c.level || 1), 0) || 0);
            updated.proficiencyBonus = Math.ceil(totalLvl / 4) + 1;
          }

          if (updated.classId === 'mecha' && updated.mechaCoreSize) {
            let en = 0;
            const size = updated.mechaCoreSize;
            if (size === 'Half') en = 2;
            if (size === 'Light') en = 3;
            if (size === 'Heavy') en = 4;
            if ((updated.level || 1) >= 11) {
              if (size === 'Half') en = 4;
              if (size === 'Light') en = 6;
              if (size === 'Heavy') en = 7;
            }
            if (updated.resourceMax !== en) {
              updated.resourceName = 'EN';
              updated.resourceMax = en;
              if (updated.resourceCurrent === undefined || updated.resourceCurrent > en) {
                updated.resourceCurrent = en;
              }
            }
          }`;

store = store.replace(
  /if \(fields\.level \!\=\= undefined \|\| fields\.secondaryClasses \!\=\= undefined\) \{[\s\S]*?updated\.proficiencyBonus = Math\.ceil\(totalLvl \/ 4\) \+ 1;\n          \}/,
  recalcLogic
);
fs.writeFileSync('src/stores/useCharacterStore.ts', store);

// 2. Update Header
let header = fs.readFileSync('src/components/character/CharacterSheetHeader.tsx', 'utf8');
const cleanHeader = `onChange={(e) => updateBio({ mechaCoreSize: e.target.value as any })}`;
header = header.replace(
  /onChange=\{\(e\) => \{[\s\S]*?updateBio\(\{ mechaCoreSize: size as any, resourceName: 'EN', resourceMax: en, resourceCurrent: en \}\);\n              \}\}/,
  cleanHeader
);
fs.writeFileSync('src/components/character/CharacterSheetHeader.tsx', header);

