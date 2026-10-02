const fs = require('fs');
let code = fs.readFileSync('src/components/character/TraitsAndPerks.tsx', 'utf-8');

const badLine = `<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAbility(null)}>, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAbility(null)}>`;

const goodLine = `<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAbility(null)}>`;

code = code.replace(badLine, goodLine);
fs.writeFileSync('src/components/character/TraitsAndPerks.tsx', code);
console.log("Fixed duplicated string");
