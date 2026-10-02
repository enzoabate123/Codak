const fs = require('fs');
let code = fs.readFileSync('src/data/weapons-catalog.ts', 'utf-8');

// The format must be AmmoSpent x NumberOfShots
code = code.replace(/name: '2\.8',[\s\S]*?burstRate: '6x1',/g, match => match.replace("6x1", "1x6"));
code = code.replace(/name: 'Mozambique',[\s\S]*?burstRate: '2x1',/g, match => match.replace("2x1", "1x2"));
code = code.replace(/name: 'Wingman',[\s\S]*?burstRate: '3x2',/g, match => match.replace("3x2", "1x6"));
code = code.replace(/name: 'Remington',[\s\S]*?burstRate: '1x1',/g, match => match.replace("1x1", "1x3"));
code = code.replace(/name: 'Shotgun Tática',[\s\S]*?burstRate: '3x2',/g, match => match.replace("3x2", "1x6"));
code = code.replace(/name: 'Kar-99',[\s\S]*?burstRate: '1',/g, match => match.replace("'1'", "'1x1'"));

fs.writeFileSync('src/data/weapons-catalog.ts', code);
