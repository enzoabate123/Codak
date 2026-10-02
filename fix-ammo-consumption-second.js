const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

const fireOld = `          return activeBurstRate ? (parseInt(activeBurstRate.split('x')[0]) || 1) : 1;`;
const fireNew = `          return activeBurstRate ? (parseInt(activeBurstRate.split('x')[1]) || 1) : 1;`;

code = code.replace(fireOld, fireNew);
fs.writeFileSync('src/stores/useCharacterStore.ts', code);
console.log("Store updated:", code.includes("split('x')[1]"));
