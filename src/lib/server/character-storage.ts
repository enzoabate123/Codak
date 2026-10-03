import fs from 'fs';
import path from 'path';
import { CharacterSheetData } from '@/stores/useCharacterStore';

export interface ServerCharacter extends CharacterSheetData {
  userId: string;
}

const DB_PATH = path.join(process.cwd(), 'src/data/compendium/characters.json');

function readDB(): ServerCharacter[] {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading characters DB', e);
    return [];
  }
}

function writeDB(data: ServerCharacter[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing characters DB', e);
  }
}

export function getCharacters(userId: string, role: string): ServerCharacter[] {
  const allChars = readDB();
  if (role === 'admin') {
    return allChars;
  }
  return allChars.filter(c => c.userId === userId);
}

export function getCharacterById(charId: string): ServerCharacter | undefined {
  return readDB().find(character => character.id === charId);
}

export function saveCharacter(character: ServerCharacter): void {
  const allChars = readDB();
  const index = allChars.findIndex(c => c.id === character.id);
  
  if (index !== -1) {
    allChars[index] = character;
  } else {
    allChars.push(character);
  }
  
  writeDB(allChars);
}

export function deleteCharacter(charId: string, userId: string, role: string): boolean {
  const allChars = readDB();
  const index = allChars.findIndex(c => c.id === charId);
  
  if (index === -1) return false;
  
  const char = allChars[index];
  if (role !== 'admin' && char.userId !== userId) {
    return false; // Unauthorized
  }
  
  allChars.splice(index, 1);
  writeDB(allChars);
  return true;
}
