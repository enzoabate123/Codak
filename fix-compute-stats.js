const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

code = code.replace(
  'export function computeWeaponStats(weapon: Weapon): ModifiedWeaponStats {',
  'export function computeWeaponStats(weapon: Weapon, char?: CharacterSheetData): ModifiedWeaponStats {'
);

const originalReturn = \`  return {
    effectiveDamage: extraDamage ? \`\${weapon.baseDamage} \${extraDamage}\` : weapon.baseDamage,
    effectiveSweetSpot: weapon.sweetSpot + sweetSpotDelta,
    effectiveAccuracy: accuracyBonus,
    effectiveInitiative: initiativeBonus,
    effectiveRecharge: recharge,
    activeEffects
  };
}\`;

const newReturn = \`  // Check Gunner's Weapon Mastery
  if (char && char.classId === 'gunner' && char.unlockedSubclassAbilities?.includes('hab-gunner-weapon-mastery')) {
    const subclassId = char.subclass;
    let weaponMatch = false;
    if (subclassId === 'certain-shot' && weapon.type === 'Sniper') weaponMatch = true;
    if (subclassId === 'point-blank' && weapon.type === 'Shotgun') weaponMatch = true;
    if (subclassId === 'fine-control' && weapon.type === 'Submachine') weaponMatch = true;
    if (subclassId === 'dual-wield' && weapon.type === 'Pistol') weaponMatch = true;
    if (subclassId === 'bigger-burst' && weapon.type === 'LMG') weaponMatch = true;
    
    if (weaponMatch) {
      accuracyBonus += 1;
      activeEffects.push('Weapon Mastery (+1 Acerto)');
    }
  }

  return {
    effectiveDamage: extraDamage ? \`\${weapon.baseDamage}\${extraDamage}\` : weapon.baseDamage,
    effectiveSweetSpot: weapon.sweetSpot + sweetSpotDelta,
    effectiveAccuracy: accuracyBonus,
    effectiveInitiative: initiativeBonus,
    effectiveRecharge: recharge,
    activeEffects
  };
}\`;

code = code.replace(originalReturn, newReturn);
fs.writeFileSync('src/stores/useCharacterStore.ts', code);
