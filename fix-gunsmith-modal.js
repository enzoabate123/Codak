const fs = require('fs');
let code = fs.readFileSync('src/components/gunsmith/GunsmithModal.tsx', 'utf-8');

const oldLogic = \`  const subclassId = char.subclass;
  let weaponMatch = false;
  if (subclassId === 'certain-shot' && weapon.type === 'Sniper') weaponMatch = true;
  if (subclassId === 'point-blank' && weapon.type === 'Shotgun') weaponMatch = true;
  if (subclassId === 'fine-control' && weapon.type === 'Submachine') weaponMatch = true;
  if (subclassId === 'dual-wield' && weapon.type === 'Pistol') weaponMatch = true;
  if (subclassId === 'bigger-burst' && weapon.type === 'LMG') weaponMatch = true;

  const hasMoreAttachmentsAbility = char.unlockedSubclassAbilities?.includes('hab-gunner-more-attachments') || false;
  const hasMoreAttachments = hasMoreAttachmentsAbility && weaponMatch;\`;

const newLogic = \`  let hasMoreAttachments = false;
  const unlocked = char.unlockedSubclassAbilities || [];
  const gunnerSubclasses = ['certain-shot', 'point-blank', 'fine-control', 'dual-wield', 'bigger-burst'];
  
  if (char.classId === 'gunner') {
    gunnerSubclasses.forEach(subId => {
      const uniqueId = \`gunner_\${subId}_More Attachments\`;
      const isUnlocked = unlocked.includes(uniqueId) || unlocked.includes('More Attachments');
      if (isUnlocked) {
        let match = false;
        if (subId === 'certain-shot' && weapon.type === 'Sniper') match = true;
        if (subId === 'point-blank' && weapon.type === 'Shotgun') match = true;
        if (subId === 'fine-control' && weapon.type === 'Submachine') match = true;
        if (subId === 'dual-wield' && weapon.type === 'Pistol') match = true;
        if (subId === 'bigger-burst' && weapon.type === 'LMG') match = true;
        if (match) hasMoreAttachments = true;
      }
    });
  }\`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/gunsmith/GunsmithModal.tsx', code);
