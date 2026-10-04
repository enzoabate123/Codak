import type { CharacterSheetData } from '@/stores/useCharacterStore';
import type { ClassDefinition } from '@/data/classes-catalog';
import type { ClassAbilityDetail } from '@/data/class-abilities-catalog';
import type { LoreRuleItem } from '@/data/lore-rules-catalog';

import type { Point,TacticalView,TacticalToken } from '@/types/tactical-map';
export function canMoveToken(view:TacticalView,token:TacticalToken):boolean {
  return view.self.role==='admin' || (token.ownerId===view.self.id && (!view.scene?.combat.active || view.scene.combat.order[view.scene.combat.index]===token.id));
}
export function templatePoints(kind:string,a:Point,b:Point,meters:number,width:number,hexSize:number):Point[] {
  if(kind==='circle')return[a,{x:a.x+meters*hexSize,y:a.y}];
  if(kind==='rectangle')return[a,{x:a.x+(b.x<a.x?-1:1)*meters*hexSize,y:a.y+(b.y<a.y?-1:1)*width*hexSize}];
  if(kind==='cone'){const angle=Math.atan2(b.y-a.y,b.x-a.x);return[a,{x:a.x+Math.cos(angle)*meters*hexSize,y:a.y+Math.sin(angle)*meters*hexSize}];}
  return[a,b];
}
export interface MapViewport { x: number; y: number; scale: number }
export function zoomAt(view: MapViewport, anchor: {x:number;y:number}, scale: number): MapViewport {
  const next = Math.max(0.25, Math.min(4, scale));
  return { x: anchor.x - (anchor.x - view.x) * next / view.scale, y: anchor.y - (anchor.y - view.y) * next / view.scale, scale: next };
}
export function clampWindow(rect: {x:number;y:number;width:number;height:number}, width:number,height:number) {
  const w = Math.min(width, Math.max(280, rect.width));
  const h = Math.min(height, Math.max(240, rect.height));
  return {x:Math.max(0,Math.min(width-w,rect.x)),y:Math.max(0,Math.min(height-h,rect.y)),width:w,height:h};
}
export interface CharacterAction { id:string; name:string; description:string; category:'weapon'|'ability'|'feat'|'item'; formula?:string }
export function characterActions(char: CharacterSheetData | undefined, classes:ClassDefinition[], abilities:ClassAbilityDetail[], lore:LoreRuleItem[]):CharacterAction[] {
  if (!char) return [];
  const actions: CharacterAction[] = [];
  for (const [slot,weapon] of [['primary',char.primaryWeapon],['secondary',char.secondaryWeapon],['backup',char.backupWeapon]] as const) {
    if (weapon) actions.push({id:`${slot}-${weapon.id}`,name:weapon.name,category:'weapon',description:`${weapon.type} · ${weapon.baseDamage} · Munição ${weapon.currentAmmo}/${weapon.ammoCapacity}`,formula:weapon.baseDamage});
  }
  const ownedClasses = [{classId:char.classId,level:char.level},...(char.secondaryClasses || [])];
  for (const owned of ownedClasses) {
    const def = classes.find(c => c.id === owned.classId || (!owned.classId && c.name === char.characterClass));
    if (!def) continue;
    for (const feature of def.classFeatures.filter(f=>Number(f.level)<=owned.level)) {
      const detail = abilities.find(a=>a.id===feature.abilityId);
      actions.push({id:`feature-${def.id}-${feature.name}`,name:feature.name,category:'ability',description:detail?.description || feature.desc});
    }
    for (const sub of def.subclasses) for (const ability of sub.abilities) {
      const unlocked = char.unlockedSubclassAbilities || [];
      if (!unlocked.includes(ability.name) && !unlocked.includes(`${def.id}_${sub.id}_${ability.name}`)) continue;
      const detail = abilities.find(a=>a.id===ability.abilityId);
      actions.push({id:`sub-${def.id}-${sub.id}-${ability.name}`,name:ability.name,category:'ability',description:detail?.description || ability.desc});
    }
  }
  for (const name of char.featuresAndTraits || []) {
    const feat=lore.find(r=>r.title===name);
    actions.push({id:`feat-${name}`,name,category:'feat',description:feat?.description || name});
  }
  for (const racial of lore.filter(r=>char.race && r.tags.includes('Habilidade Racial') && (r.subtitle.includes(char.race) || (char.race.startsWith('Android') && r.subtitle==='Habilidade Racial: Android') || (char.race.startsWith('Infectado') && r.subtitle==='Habilidade Racial: Infectado')))) {
    actions.push({id:racial.id,name:racial.title,category:'ability',description:racial.description});
  }
  for (const item of char.inventory || []) if (item) actions.push({id:`item-${item.id}`,name:item.name,category:'item',description:`${item.quantity}× · ${item.notes || item.weight || 'Item do inventário'}`});
  return actions.filter((a,i,list)=>list.findIndex(other=>other.id===a.id)===i);
}
