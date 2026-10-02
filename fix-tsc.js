const fs = require('fs');
let code = fs.readFileSync('src/components/character/TraitsAndPerks.tsx', 'utf-8');

code = code.replace("), document.body)}", ", document.body)}");

fs.writeFileSync('src/components/character/TraitsAndPerks.tsx', code);
console.log("Fixed TSC");
