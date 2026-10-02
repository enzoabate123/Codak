const fs = require('fs');

// Patch CharacterSheetHeader.tsx
let c = fs.readFileSync('src/components/character/CharacterSheetHeader.tsx', 'utf8');
c = c.replace(
  /if \(size === 'Half'\) en = 2;\n\s*if \(size === 'Light'\) en = 3;\n\s*if \(size === 'Heavy'\) en = 4;/,
  "if (size === 'Half') en = 3;\n                if (size === 'Light') en = 4;\n                if (size === 'Heavy') en = 5;"
);
c = c.replace(
  /if \(char\.level >= 11\) \{\n\s*if \(size === 'Half'\) en = 3;\n\s*if \(size === 'Light'\) en = 5;\n\s*if \(size === 'Heavy'\) en = 6;\n\s*\}/,
  "if (char.level >= 11) {\n                  if (size === 'Half') en = 4;\n                  if (size === 'Light') en = 6;\n                  if (size === 'Heavy') en = 7;\n                }"
);
fs.writeFileSync('src/components/character/CharacterSheetHeader.tsx', c);

// Patch class-abilities-catalog.ts
let a = fs.readFileSync('src/data/class-abilities-catalog.ts', 'utf8');
a = a.replace(/2 EN\\nLight Core/g, "3 EN\\nLight Core");
a = a.replace(/3 EN\\nHeavy Core/g, "4 EN\\nHeavy Core");
a = a.replace(/4 EN`/g, "5 EN`");

a = a.replace(/3EN\\nLight Core/g, "4 EN\\nLight Core");
a = a.replace(/5EN\\nHeavy Core/g, "6 EN\\nHeavy Core");
a = a.replace(/6EN`/g, "7 EN`");

fs.writeFileSync('src/data/class-abilities-catalog.ts', a);
