const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

const fireOld = `currentAmmo: Math.max(0, weapon.currentAmmo - (weapon.burstRate ? (parseInt(weapon.burstRate.split('x')[0]) || 1) : 1)),`;
const fireNew = `currentAmmo: Math.max(0, weapon.currentAmmo - (weapon.burstRate ? (parseInt(weapon.burstRate.split('x')[1]) || 1) : 1)),`;
code = code.replace(fireOld, fireNew);

fs.writeFileSync('src/stores/useCharacterStore.ts', code);
