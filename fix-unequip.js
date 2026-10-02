const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

// Replace signatures
code = code.replace("unequipWeapon: (slot: 'primary' | 'secondary' | 'backup') => void;", "unequipWeapon: (slot: 'primary' | 'secondary' | 'backup', targetIndex?: number) => void;");
code = code.replace("unequipItem: (slot: 'armor' | 'accessory') => void;", "unequipItem: (slot: 'armor' | 'accessory', targetIndex?: number) => void;");

// Replace implementations
code = code.replace("unequipWeapon: (slot) => {", "unequipWeapon: (slot, targetIndex) => {");
code = code.replace("const emptyIdx = newInv.findIndex(i => i === null);", "let emptyIdx = targetIndex !== undefined && newInv[targetIndex] === null ? targetIndex : newInv.findIndex(i => i === null);");

code = code.replace("unequipItem: (slot) => {", "unequipItem: (slot, targetIndex) => {");

fs.writeFileSync('src/stores/useCharacterStore.ts', code);
