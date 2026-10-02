const fs = require('fs');
let code = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf-8');

const interfaceSearch = \`export interface ModifiedWeaponStats {
  effectiveDamage: string;
  effectiveSweetSpot: number;
  effectiveAccuracy: number;
  effectiveInitiative: number;
  effectiveRecharge: string;
  effectiveRechargeCost?: string;
  activeEffects: string[];
}\`;

const interfaceReplace = \`export interface ModifiedWeaponStats {
  effectiveDamage: string;
  effectiveSweetSpot: number;
  effectiveAccuracy: number;
  effectiveInitiative: number;
  effectiveRecharge: string;
  effectiveRechargeCost?: string;
  activeEffects: string[];
  isProficient: boolean;
}\`;

code = code.replace(interfaceSearch, interfaceReplace);

const functionSearch = \`export function computeWeaponStats(weapon: Weapon, char?: CharacterSheetData): ModifiedWeaponStats {
  let extraDamage = '';\`;

const functionReplace = \`export function isWeaponProficient(weapon: Weapon, char?: CharacterSheetData): boolean {
  if (!char || !char.classId) return false;
  
  if (weapon.isMerged && char.classId === 'mecha') return true;

  let mechaMockProficiencies: string[] = [];
  if (char.classId === 'mecha') {
    const coreSize = char.mechaCoreSize || 'Half';
    if (coreSize === 'Half') mechaMockProficiencies = ['Small', 'Simples'];
    else if (coreSize === 'Light') mechaMockProficiencies = ['Medium'];
    else if (coreSize === 'Heavy') mechaMockProficiencies = ['Heavy', 'Big', 'Pesada'];
  }

  const cls = CLASSES_CATALOG.find(c => c.id === char.classId);
  if (!cls) return false;

  const profs = char.classId === 'mecha' ? mechaMockProficiencies : cls.weaponProficiencies;
  if (!profs || profs.length === 0 || profs.includes('None')) return false;
  
  return profs.some(p => {
    const pStr = p.toLowerCase();
    if (pStr === 'todas' || pStr === 'all') return true;
    const itemStr = \\\`\\\${weapon.name} \\\${weapon.type} \\\${weapon.size}\\\`.toLowerCase();
    
    if (pStr.includes('pistol')) return itemStr.includes('pistol');
    if (pStr.includes('rifle')) return itemStr.includes('rifle');
    if (pStr.includes('melee') || pStr.includes('corpo a corpo')) return itemStr.includes('melee');
    if (pStr.includes('submachine')) return itemStr.includes('submachine') || itemStr.includes('smg');
    if (pStr.includes('sniper')) return itemStr.includes('sniper');
    if (pStr.includes('shotgun')) return itemStr.includes('shotgun');
    if (pStr.includes('heavy') || pStr.includes('pesada')) return itemStr.includes('heavy') || itemStr.includes('big');
    if (pStr.includes('simples') || pStr.includes('simple')) return itemStr.includes('small') || itemStr.includes('melee');
    
    return itemStr.includes(pStr) || pStr.includes(weapon.type?.toLowerCase() || 'xxx');
  });
}

export function computeWeaponStats(weapon: Weapon, char?: CharacterSheetData): ModifiedWeaponStats {
  let extraDamage = '';
  const isProf = isWeaponProficient(weapon, char);\`;

code = code.replace(functionSearch, functionReplace);

const returnSearch = \`  return {
    effectiveDamage: extraDamage ? \`;

const returnReplace = \`  if (isProf) {
    activeEffects.push('Proficiência Ativa');
  } else {
    activeEffects.push('Sem Proficiência (Desvantagem no ataque)');
  }

  return {
    isProficient: isProf,
    effectiveDamage: extraDamage ? \`;

code = code.replace(returnSearch, returnReplace);

fs.writeFileSync('src/stores/useCharacterStore.ts', code);
