const fs = require('fs');
let c = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf8');

const regex = /updated\.resourceCurrent = en;\n\s*\}\n\s*\}\n\s*\}/;

const replacement = `updated.resourceCurrent = en;
              }
            }
          } else if (fields.classId !== undefined && fields.classId !== 'mecha') {
            updated.mechaCoreSize = undefined;
            updated.resourceName = undefined;
            updated.resourceMax = undefined;
            updated.resourceCurrent = undefined;
          }`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/stores/useCharacterStore.ts', c);
