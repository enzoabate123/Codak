const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

const oldLogic = `      const updatedWeapon = {
        ...weapon,
        isMerged: !weapon.isMerged,
      };

      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeapon } : c
      );`;

const newLogic = `      const isMerging = !weapon.isMerged;
      
      const newPrimary = char.primaryWeapon ? { ...char.primaryWeapon, isMerged: slot === 'primary' ? isMerging : (isMerging ? false : char.primaryWeapon.isMerged) } : null;
      const newSecondary = char.secondaryWeapon ? { ...char.secondaryWeapon, isMerged: slot === 'secondary' ? isMerging : (isMerging ? false : char.secondaryWeapon.isMerged) } : null;
      const newBackup = char.backupWeapon ? { ...char.backupWeapon, isMerged: slot === 'backup' ? isMerging : (isMerging ? false : char.backupWeapon.isMerged) } : null;

      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { 
          ...c, 
          primaryWeapon: newPrimary,
          secondaryWeapon: newSecondary,
          backupWeapon: newBackup
        } : c
      );`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/stores/useCharacterStore.ts', code);
