const fs = require('fs');
let code = fs.readFileSync('src/components/character/TraitsAndPerks.tsx', 'utf-8');

code = code.replace(
  'const isUnlocked = unlockedAbilities.includes(ability.name);',
  'const uniqueId = \`\${cls.def.id}_\${sub.id}_\${ability.name}\`;\n                          const isUnlocked = unlockedAbilities.includes(uniqueId) || unlockedAbilities.includes(ability.name);'
);

code = code.replace(
  'const isPreviousUnlocked = previousAbility ? unlockedAbilities.includes(previousAbility.name) : true;',
  'const isPreviousUnlocked = previousAbility ? (unlockedAbilities.includes(\`\${cls.def.id}_\${sub.id}_\${previousAbility.name}\`) || unlockedAbilities.includes(previousAbility.name)) : true;'
);

code = code.replace(
  'unlockSubclassAbility(ability.name);',
  'unlockSubclassAbility(uniqueId);'
);

fs.writeFileSync('src/components/character/TraitsAndPerks.tsx', code);
