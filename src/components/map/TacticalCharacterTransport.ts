import { useCharacterStore } from '@/stores/useCharacterStore';
import type { CharacterSheetData } from '@/stores/useCharacterStore';

// ponytail: one freshness counter for this browser's tactical sheet transport.
let generation=0;
let writing=0;
export async function readTacticalCharacters(signal:AbortSignal,isCurrent:()=>boolean,confirm=false):Promise<CharacterSheetData[]|null> {
  if(writing && !confirm)return null;
  const epoch=generation;
  const response=await fetch('/api/characters',{cache:'no-store',signal});
  if(!response.ok)throw new Error('Não foi possível carregar os personagens.');
  const data=await response.json();
  if(signal.aborted || !isCurrent() || epoch!==generation)return null;
  const characters:CharacterSheetData[]=data.characters || [];
  useCharacterStore.setState(state=>{
    const active=characters.find(c=>c.id===state.activeCharacterId);
    return {characters,...(active?{hpCurrent:active.hpCurrent,tempHp:active.tempHp}:{})};
  });
  return characters;
}
export async function saveTacticalCharacter(character:CharacterSheetData,signal:AbortSignal,isCurrent:()=>boolean):Promise<boolean> {
  generation++;writing++;
  try {
    if(signal.aborted || !isCurrent())return false;
    const response=await fetch('/api/characters',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character}),signal});
    const result=await response.json();
    if(!response.ok || !result.success)throw new Error(result.error || 'Falha ao salvar ficha.');
    generation++;
    if(signal.aborted || !isCurrent())return false;
    const characters=await readTacticalCharacters(signal,isCurrent,true);
    if(!characters)return false;
    if(!characters.some(c=>c.id===character.id))throw new Error('Ficha não confirmada.');
    return true;
  } finally {writing--;generation++;}
}
