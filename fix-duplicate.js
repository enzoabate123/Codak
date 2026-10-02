const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');
code = code.replace("  bio?: string;\n  campaignNotes?: string;\n", "  bio?: string;\n");
fs.writeFileSync('src/stores/useCharacterStore.ts', code);
