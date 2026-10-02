const fs = require('fs');
let code = fs.readFileSync('src/data/weapons-catalog.ts', 'utf-8');

// Replace everything to [Clicks]x[AmmoSpent] format

code = code.replace(/name: 'VAPR-X',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '10x1'"));
code = code.replace(/name: 'Scar',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '10x1'"));
code = code.replace(/name: 'R3K',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x5'"));
code = code.replace(/name: 'PeaceKeeper',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x10'"));
code = code.replace(/name: 'KN-74',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x10'"));
code = code.replace(/name: 'ARM-A1',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x10'"));
code = code.replace(/name: 'Remington',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '3x1'"));
code = code.replace(/name: 'Cano Curto',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '1x1'"));
code = code.replace(/name: 'Shotgun Tática',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '3x2'"));
code = code.replace(/name: 'DCM-8',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x10'"));
code = code.replace(/name: 'MP5',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '1x20'"));
code = code.replace(/name: 'Vector',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '1x20'"));
code = code.replace(/name: 'Weevil',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x15'"));
code = code.replace(/name: 'Sammy',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x20'"));
code = code.replace(/name: '2\.8',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '6x1'"));
code = code.replace(/name: 'EMC',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '10x1'"));
code = code.replace(/name: 'Mozambique',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '2x1'"));
code = code.replace(/name: 'Wingman',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '3x2'"));
code = code.replace(/name: 'Kar-99',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '1x1'"));
code = code.replace(/name: 'HAR',[\s\S]*?burstRate: '.*?'.*?,/g, match => match.replace(/burstRate: '.*?'/, "burstRate: '3x15'"));

fs.writeFileSync('src/data/weapons-catalog.ts', code);
console.log("Weapons updated.");
