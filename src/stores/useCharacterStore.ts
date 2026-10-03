import { create } from 'zustand';
import { CoreAttribute, SkillKey, Weapon, AmmunitionType } from '@/types/codak-rules';
import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';
import { CLASSES_CATALOG } from '@/data/classes-catalog';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: string;
  notes: string;
  icon?: string;
  bonusAttributes?: Partial<Record<CoreAttribute, number>>;
  type?: 'weapon' | 'attachment' | 'ammo' | 'item' | 'armor' | 'accessory';
  data?: any; // The original catalog data for the item
}

export interface EquipmentRequest {
  id: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  item: Omit<InventoryItem, 'id'>;
}

export interface CharacterSheetData {
  id: string;
  name: string;
  callsign?: string;
  characterClass: string;
  classId?: string;
  secondaryClasses?: { classId: string, level: number }[];
  unlockedSubclassAbilities?: string[];
  allocatedAttributes?: Partial<Record<CoreAttribute, number>>;
  equipment?: { armor?: InventoryItem | null, accessory?: InventoryItem | null };
  subclass?: string;
  race: string;
  age: string;
  background: string;
  bio?: string;
  level: number;
  proficiencyBonus: number;
  avatarUrl: string;

  attributes: Record<CoreAttribute, number>;
  skillProficiencies: Partial<Record<SkillKey, 0 | 1 | 2>>;

  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  armorClass: number;
  initiativeOverride?: number;
  speedMeters: number;

  featuresAndTraits: string[];
  perks: boolean[]; // 10 perks

  primaryWeapon: Weapon | null;
  secondaryWeapon: Weapon | null;
  backupWeapon: Weapon | null;

  credits: number;
  inventory: Array<InventoryItem | null>;
  pendingEquipmentRequests?: EquipmentRequest[];
  campaignNotes: string;

  activePage: 'status' | 'habilidades' | 'loadout' | 'inventario' | 'anotacoes' | 'backstory';

  mechaCoreSize?: 'Half' | 'Light' | 'Heavy';
  resourceName?: string;
  resourceCurrent?: number;
  resourceMax?: number;
}

export interface CharacterStore extends CharacterSheetData {
  characters: CharacterSheetData[];
  activeCharacterId: string;
  isInLobby: boolean;

  // Multi-character lobby actions
  selectCharacter: (id: string) => void;
  createCharacter: (preset?: Partial<CharacterSheetData>) => void;
  duplicateCharacter: (id: string) => void;
  deleteCharacter: (id: string) => void;
  fetchCharacters: () => Promise<void>;
  openCharacterSheet: (id?: string) => void;
  returnToLobby: () => void;
  updateActiveCharacterAvatar: (url: string) => void;

  // Single active character manipulation (backward compatible)
  setActivePage: (page: 'status' | 'habilidades' | 'loadout' | 'inventario' | 'anotacoes' | 'backstory') => void;
  updateBio: (fields: Partial<CharacterSheetData>) => void;
  updateAttribute: (attr: CoreAttribute, value: number) => void;
  toggleSkillProficiency: (skill: SkillKey) => void;
  updateHp: (delta: number) => void;
  updateVitals: (fields: Partial<Pick<CharacterSheetData, 'hpCurrent' | 'hpMax' | 'tempHp' | 'armorClass' | 'speedMeters'>> & { initiativeOverride?: number | null }) => void;
  updateResource: (delta: number) => void;
  setTempHp: (val: number) => void;
  addManualFeat: (feat: string) => void;
  removeManualFeat: (index: number) => void;
  togglePerk: (index: number) => void;

  // Weapons & Gunsmith
  equipWeapon: (invIndex: number, slot: 'primary' | 'secondary' | 'backup') => void;
  unequipWeapon: (slot: 'primary' | 'secondary' | 'backup', targetIndex?: number) => void;
  fireWeapon: (slot: 'primary' | 'secondary' | 'backup') => void;
  reloadWeapon: (slot: 'primary' | 'secondary' | 'backup') => void;
  attachToWeapon: (slot: 'primary' | 'secondary' | 'backup', invId: string) => void;
  detachFromWeapon: (slot: 'primary' | 'secondary' | 'backup', attachmentId: string) => void;
  setWeaponAmmoType: (slot: 'primary' | 'secondary' | 'backup', invId: string) => void;
  toggleWeaponMerge: (slot: 'primary' | 'secondary' | 'backup') => void;

  // Inventory & Notes
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  removeInventoryItem: (id: string) => void;
  updateCredits: (delta: number) => void;
  setCampaignNotes: (notes: string) => void;
  moveInventoryItem: (fromIndex: number, toIndex: number) => void;
  equipItem: (inventoryIndex: number, slot: 'armor' | 'accessory') => void;
  unequipItem: (slot: 'armor' | 'accessory', targetIndex?: number) => void;
  unlockSubclassAbility: (abilityName: string) => void;
  updateAllocatedAttribute: (attr: CoreAttribute, delta: number) => void;
}

// Initial fallback weapons
const initialKar99 = WEAPONS_CATALOG.find((w) => w.id === 'kar-99') || WEAPONS_CATALOG[0];
const initialVector = WEAPONS_CATALOG.find((w) => w.id === 'vector') || WEAPONS_CATALOG[1];
const initialWingman = WEAPONS_CATALOG.find((w) => w.id === 'wingman') || WEAPONS_CATALOG[2];
const initialScar = WEAPONS_CATALOG.find((w) => w.id === 'scar') || WEAPONS_CATALOG[0];
const initialVapr = WEAPONS_CATALOG.find((w) => w.id === 'vapr-x') || WEAPONS_CATALOG[0];


const STORAGE_KEY = 'codak_characters_vault_v1';

// Sync functions
async function syncCharacterToServer(char: CharacterSheetData) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: char })
    });
  } catch (e) {
    console.error('Failed to sync character', e);
  }
}

async function fetchCharactersFromServer(): Promise<CharacterSheetData[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/characters');
    if (!res.ok) return [];
    const data = await res.json();
    return data.characters || [];
  } catch (e) {
    console.error('Failed to fetch characters', e);
    return [];
  }
}

let syncTimeout: any = null;
function debouncedSync(char: CharacterSheetData) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncCharacterToServer(char);
  }, 1000); // 1s debounce
}

// Retrofit saveCharactersToStorage to just save the active character
function saveCharactersToStorage(chars: CharacterSheetData[], activeId?: string) {
  const active = activeId ? chars.find(c => c.id === activeId) : chars[0];
  if (active) debouncedSync(active);
}

const initialList: CharacterSheetData[] = [];
const defaultActive: CharacterSheetData | undefined = undefined;

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  // Active character properties (mirrored for full backward compatibility)
  ...(defaultActive || ({} as CharacterSheetData)),

  // Multi-character state
  characters: initialList,
  activeCharacterId: '',
  isInLobby: true,

  // Helper to sync changes to active character in the characters list & storage
  fetchCharacters: async () => {
    const chars = await fetchCharactersFromServer();
    set({ characters: chars, activeCharacterId: chars.length > 0 ? chars[0].id : '' });
  },
  selectCharacter: (id: string) => {
    const chars = get().characters;
    const target = chars.find((c) => c.id === id);
    if (!target) return;
    set({
      ...target,
      activeCharacterId: id,
    });
  },

  createCharacter: (preset) => {
    const newId = `op-${Date.now()}`;
    const newChar: CharacterSheetData = {
      id: newId,
      name: preset?.name || 'Novo Operador',
      callsign: preset?.callsign || '',
      characterClass: preset?.characterClass || '',
      subclass: preset?.subclass || 'Especialista',
      race: preset?.race || 'Humano',
      age: preset?.age || '25',
      background: preset?.background || 'Mercenário Contratado',
      level: preset?.level || 1,
      proficiencyBonus: 2,
      avatarUrl: preset?.avatarUrl || '/images/operative_vanguard.jpg',

      attributes: {
        STR: 10,
        DEX: 10,
        CON: 10,
        INT: 10,
        WIS: 10,
        CHA: 10,
        CYB: 10,
      },
      skillProficiencies: {},
      hpCurrent: 30,
      hpMax: 30,
      tempHp: 0,
      armorClass: 14,
      speedMeters: 9,

      featuresAndTraits: ['Treinamento Tático Básico: Proficiência em armas convencionais.'],
      perks: [false, false, false, false, false, false, false, false, false, false],

      primaryWeapon: null,
      secondaryWeapon: null,
      backupWeapon: null,

      credits: 5000,
      inventory: Array(30).fill(null),
      pendingEquipmentRequests: [],
      campaignNotes: 'Dossiê recém-criado. Aguardando designação de missão.',
      unlockedSubclassAbilities: [],
      activePage: 'status',
      ...preset,
    };

    const updatedChars = [...get().characters, newChar];
    saveCharactersToStorage(updatedChars, newId);
    set({
      characters: updatedChars,
      activeCharacterId: newId,
      ...newChar,
    });
  },

  duplicateCharacter: (id: string) => {
    const current = get().characters.find((c) => c.id === id);
    if (!current) return;
    const duplicated: CharacterSheetData = {
      ...current,
      id: `op-${Date.now()}`,
      name: `${current.name} (Cópia)`,
      callsign: `${current.callsign || 'OPERADOR'} [CLONE]`,
    };
    const updatedChars = [...get().characters, duplicated];
    saveCharactersToStorage(updatedChars, duplicated.id);
    set({
      characters: updatedChars,
      activeCharacterId: duplicated.id,
      ...duplicated,
    });
  },

  deleteCharacter: async (id: string) => {
    try {
      await fetch('/api/characters?id=' + id, { method: 'DELETE' });
      const currentChars = get().characters;
      const updatedChars = currentChars.filter((c) => c.id !== id);
      const nextActive = updatedChars[0] || ({} as CharacterSheetData);
      set({
        characters: updatedChars,
        activeCharacterId: nextActive.id || '',
        isInLobby: updatedChars.length === 0 ? true : get().isInLobby,
        ...nextActive,
      });
    } catch (e) {
      console.error('Failed to delete', e);
    }
  },

  openCharacterSheet: (id?: string) => {
    if (id) {
      get().selectCharacter(id);
    }
    set({ isInLobby: false });
  },

  returnToLobby: () => {
    set({ isInLobby: true });
  },

  updateActiveCharacterAvatar: (url: string) => {
    set((state) => {
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, avatarUrl: url } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return {
        avatarUrl: url,
        characters: updatedChars,
      };
    });
  },

  setActivePage: (page) => {
    set((state) => {
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, activePage: page } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { activePage: page, characters: updatedChars };
    });
  },

  updateBio: (fields) => {
    set((state) => {
      const updatedChars = state.characters.map((c) => {
        if (c.id === state.activeCharacterId) {
          const updated = { ...c, ...fields };
          // Auto-recalc proficiency bonus if level changed
                    if (fields.level !== undefined || fields.secondaryClasses !== undefined) {
            const totalLvl = (updated.level || 1) + (updated.secondaryClasses?.reduce((acc, c) => acc + (c.level || 1), 0) || 0);
            updated.proficiencyBonus = Math.ceil(totalLvl / 4) + 1;
          }

          if (updated.classId === 'mecha' && updated.mechaCoreSize) {
            let en = 0;
            const size = updated.mechaCoreSize;
            if (size === 'Half') en = 2;
            if (size === 'Light') en = 3;
            if (size === 'Heavy') en = 4;
            if ((updated.level || 1) >= 11) {
              if (size === 'Half') en = 4;
              if (size === 'Light') en = 6;
              if (size === 'Heavy') en = 7;
            }
            if (updated.resourceMax !== en) {
              updated.resourceName = 'EN';
              updated.resourceMax = en;
              if (updated.resourceCurrent === undefined || updated.resourceCurrent > en) {
                updated.resourceCurrent = en;
              }
            }
          } else if (fields.classId !== undefined && fields.classId !== 'mecha') {
            updated.mechaCoreSize = undefined;
            updated.resourceName = undefined;
            updated.resourceMax = undefined;
            updated.resourceCurrent = undefined;
          }
          return updated;
        }
        return c;
      });
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      // We don't return ...fields to root state since we removed the flat properties
      return { characters: updatedChars };
    });
  },

  updateAttribute: (attr, value) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const currentAttrs = char.attributes || {};
      const newAttributes = {
        ...currentAttrs,
        [attr]: Math.max(1, Math.min(30, value)),
      };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, attributes: newAttributes } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  toggleSkillProficiency: (skill) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const currentSkills = char.skillProficiencies || {};
      const currentVal = currentSkills[skill] || 0;
      let newVal = 0;
      if (currentVal === 0) newVal = 1;
      else if (currentVal === 1) newVal = 2;
      else newVal = 0;
      
      const newSkills = { ...currentSkills, [skill]: newVal as 0 | 1 | 2 };
      
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, skillProficiencies: newSkills } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  updateHp: (delta) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const newHp = Math.max(0, Math.min(char.hpMax, char.hpCurrent + delta));
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, hpCurrent: newHp } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },
  updateVitals: (fields) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const hpMax = Math.max(1, Number(fields.hpMax ?? char.hpMax) || 1);
      const updated = {
        ...char,
        hpMax,
        hpCurrent: Math.max(0, Math.min(hpMax, Number(fields.hpCurrent ?? char.hpCurrent) || 0)),
        tempHp: Math.max(0, Number(fields.tempHp ?? char.tempHp) || 0),
        armorClass: Math.max(0, Number(fields.armorClass ?? char.armorClass) || 0),
        initiativeOverride: fields.initiativeOverride === null
          ? undefined
          : fields.initiativeOverride === undefined
            ? char.initiativeOverride
            : Number(fields.initiativeOverride) || 0,
        speedMeters: Math.max(0, Number(fields.speedMeters ?? char.speedMeters) || 0),
      };
      const updatedChars = state.characters.map(c => c.id === state.activeCharacterId ? updated : c);
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },
  updateResource: (delta) => {
    set((state) => {
      const char = state.characters.find((c) => c.id === state.activeCharacterId);
      if (!char || !char.resourceMax) return state;
      const newRes = Math.max(0, Math.min(char.resourceMax, (char.resourceCurrent || 0) + delta));
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, resourceCurrent: newRes } : c
      );
      return { characters: updatedChars };
    });
  },

  setTempHp: (val) => {
    set((state) => {
      const newTempHp = Math.max(0, val);
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, tempHp: newTempHp } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { tempHp: newTempHp, characters: updatedChars };
    });
  },
  addManualFeat: (feat) => {
    const normalized = feat.trim();
    if (!normalized) return;
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char || (char.featuresAndTraits || []).includes(normalized)) return state;
      const updatedChars = state.characters.map(c => c.id === state.activeCharacterId
        ? { ...c, featuresAndTraits: [...(c.featuresAndTraits || []), normalized] }
        : c);
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },
  removeManualFeat: (index) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const updatedChars = state.characters.map(c => c.id === state.activeCharacterId
        ? { ...c, featuresAndTraits: (c.featuresAndTraits || []).filter((_, itemIndex) => itemIndex !== index) }
        : c);
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  togglePerk: (index) => {
    set((state) => {
      const next = [...state.perks];
      next[index] = !next[index];
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, perks: next } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { perks: next, characters: updatedChars };
    });
  },

  equipWeapon: (invIndex, slot) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char || !char.inventory[invIndex] || char.inventory[invIndex].type !== 'weapon') return state;
      
      const newInv = [...char.inventory];
      const itemToEquip = newInv[invIndex]!;
      const weaponData = itemToEquip.data as Weapon;
      
      // Initialize if missing
      if (!weaponData.equippedAttachments) weaponData.equippedAttachments = [];
      if (!weaponData.loadedAmmoType) weaponData.loadedAmmoType = 'Normal';
      if (weaponData.currentAmmo === undefined) weaponData.currentAmmo = weaponData.ammoCapacity;

      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const currentEquipped = char[weaponKey];
      
      // Put equipped weapon back into inventory grid, replacing the slot
      if (currentEquipped) {
        newInv[invIndex] = {
          id: `inv-${Date.now()}`,
          type: 'weapon',
          name: currentEquipped.name,
          quantity: 1,
          weight: '1',
          notes: '',
          data: currentEquipped,
        };
      } else {
        newInv[invIndex] = null;
      }
      
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv, [weaponKey]: weaponData } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  unequipWeapon: (slot, targetIndex) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const currentEquipped = char[weaponKey];
      if (!currentEquipped) return state;

      const newInv = [...char.inventory];
      let emptyIdx = targetIndex !== undefined && newInv[targetIndex] === null ? targetIndex : newInv.findIndex(i => i === null);
      if (emptyIdx === -1) return state; // no space to unequip

      newInv[emptyIdx] = {
        id: `inv-${Date.now()}`,
        type: 'weapon',
        name: currentEquipped.name,
        quantity: 1,
        weight: '1',
        notes: '',
        data: currentEquipped,
      };

      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv, [weaponKey]: null } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  fireWeapon: (slot) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const weapon = char[weaponKey];
      if (!weapon || weapon.currentAmmo <= 0) return state;
      const updatedWeapon = {
        ...weapon,
        currentAmmo: Math.max(0, weapon.currentAmmo - (() => {
          // Fetch fresh burst rate from catalog to avoid stale data on old characters
          const catalogWeapon = WEAPONS_CATALOG.find(w => w.id === weapon.id);
          const activeBurstRate = catalogWeapon?.burstRate || weapon.burstRate;
          return activeBurstRate ? (parseInt(activeBurstRate.split('x')[1]) || 1) : 1;
        })()),
      };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeapon } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  reloadWeapon: (slot) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const weapon = char[weaponKey];
      if (!weapon) return state;
      
      const stats = computeWeaponStats(weapon, char);
      const updatedWeapon = {
        ...weapon,
        currentAmmo: stats.effectiveAmmoCapacity || weapon.ammoCapacity,
      };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeapon } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  attachToWeapon: (slot, invId) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const weapon = char[weaponKey];
      if (!weapon) return state;
      
      const invIndex = char.inventory.findIndex(i => i?.id === invId);
      if (invIndex === -1) return state;
      const attItem = char.inventory[invIndex];
      const attachmentId = attItem?.data?.id;
      if (!attachmentId) return state;

      const current = weapon.equippedAttachments || [];
      if (current.includes(attachmentId)) return state;

      const newInv = [...char.inventory];
      if (attItem.quantity > 1) {
        newInv[invIndex] = { ...attItem, quantity: attItem.quantity - 1 };
      } else {
        newInv[invIndex] = null;
      }

      const updatedWeapon = {
        ...weapon,
        equippedAttachments: [...current, attachmentId],
      };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeapon, inventory: newInv } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  detachFromWeapon: (slot, attachmentId) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const weapon = char[weaponKey];
      if (!weapon) return state;

      const attDef = ATTACHMENTS_CATALOG.find(a => a.id === attachmentId);
      if (!attDef) return state;

      const newInv = [...char.inventory];
      const emptyIdx = newInv.findIndex(i => i === null);
      if (emptyIdx !== -1) {
        newInv[emptyIdx] = {
          id: `inv-${Date.now()}`,
          type: 'attachment',
          name: attDef.name,
          quantity: 1,
          weight: '1',
          notes: '',
          data: attDef,
        };
      } else {
        return state;
      }

      const updatedWeapon = {
        ...weapon,
        equippedAttachments: (weapon.equippedAttachments || []).filter((id) => id !== attachmentId),
      };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeapon, inventory: newInv } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  setWeaponAmmoType: (slot, invId) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const weapon = char[weaponKey];
      if (!weapon) return state;

      if (invId === 'Normal') {
        const updatedWeaponNormal = { ...weapon, loadedAmmoType: 'Normal' as any };
        const updatedCharsNormal = state.characters.map((c) =>
          c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeaponNormal } : c
        );
        saveCharactersToStorage(updatedCharsNormal, state.activeCharacterId);
        return { characters: updatedCharsNormal };
      }

      const invIndex = char.inventory.findIndex(i => i?.id === invId);
      if (invIndex === -1) return state;
      const ammoItem = char.inventory[invIndex];
      const ammoType = ammoItem?.data?.type;
      if (!ammoType) return state;

      const updatedWeapon = {
        ...weapon,
        loadedAmmoType: ammoType,
      };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, [weaponKey]: updatedWeapon } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  toggleWeaponMerge: (slot) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const weaponKey = slot === 'primary' ? 'primaryWeapon' : slot === 'secondary' ? 'secondaryWeapon' : 'backupWeapon';
      const weapon = char[weaponKey];
      if (!weapon) return state;

      const isMerging = !weapon.isMerged;
      
      const newPrimary = char.primaryWeapon ? { ...char.primaryWeapon, isMerged: slot === 'primary' ? isMerging : (isMerging ? false : char.primaryWeapon.isMerged) } : null;
      const newSecondary = char.secondaryWeapon ? { ...char.secondaryWeapon, isMerged: slot === 'secondary' ? isMerging : (isMerging ? false : char.secondaryWeapon.isMerged) } : null;
      const newBackup = char.backupWeapon ? { ...char.backupWeapon, isMerged: slot === 'backup' ? isMerging : (isMerging ? false : char.backupWeapon.isMerged) } : null;

      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { 
          ...c, 
          primaryWeapon: newPrimary,
          secondaryWeapon: newSecondary,
          backupWeapon: newBackup
        } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  addInventoryItem: (item) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const newInv = [...(char.inventory || Array(30).fill(null))];
      const emptyIdx = newInv.findIndex(i => i === null);
      if (emptyIdx === -1) return state; // inventory full
      
      newInv[emptyIdx] = { ...item, id: `inv-${Date.now()}-${window.crypto.randomUUID()}` };
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  removeInventoryItem: (id) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const newInv = (char.inventory || Array(30).fill(null)).map(item => item?.id === id ? null : item);
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  updateCredits: (delta) => {
    set((state) => {
      const currentCredits = Number(state.credits) || 0;
      const deltaNumber = Number(delta) || 0;
      const newCredits = Math.max(0, currentCredits + deltaNumber);
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, credits: newCredits } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return {
        credits: newCredits,
        characters: updatedChars,
      };
    });
  },

  
  moveInventoryItem: (fromIndex, toIndex) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const newInv = [...char.inventory];
      const temp = newInv[fromIndex];
      newInv[fromIndex] = newInv[toIndex];
      newInv[toIndex] = temp;
      
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars, inventory: newInv };
    });
  },
  
  equipItem: (invIndex, slot) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char || !char.inventory[invIndex]) return state;
      const newInv = [...char.inventory];
      const equipment = { ...char.equipment };
      
      const itemToEquip = newInv[invIndex]!;
      const currentEquipped = equipment[slot];
      
      newInv[invIndex] = currentEquipped || null;
      equipment[slot] = itemToEquip;
      
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv, equipment } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars, inventory: newInv, equipment }; // Update flat fields if needed
    });
  },

  unlockSubclassAbility: (abilityName) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const current = char.unlockedSubclassAbilities || [];
      if (current.includes(abilityName)) return state;
      
      const newUnlocked = [...current, abilityName];
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, unlockedSubclassAbilities: newUnlocked } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },
  unequipItem: (slot, targetIndex) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char || !char.equipment || !char.equipment[slot]) return state;
      
      const itemToUnequip = char.equipment[slot];
      const newInv = [...char.inventory];
      let emptyIdx = targetIndex !== undefined && newInv[targetIndex] === null ? targetIndex : newInv.findIndex(i => !i);
      
      if (emptyIdx === -1) return state; // inventory full
      
      newInv[emptyIdx] = itemToUnequip;
      const equipment = { ...char.equipment, [slot]: null };
      
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, inventory: newInv, equipment } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars, inventory: newInv, equipment };
    });
  },

  updateAllocatedAttribute: (attr, delta) => {
    set((state) => {
      const char = state.characters.find(c => c.id === state.activeCharacterId);
      if (!char) return state;
      const allocated = { ...(char.allocatedAttributes || {}) };
      allocated[attr] = (allocated[attr] || 0) + delta;
      
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, allocatedAttributes: allocated } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return { characters: updatedChars };
    });
  },

  setCampaignNotes: (notes) => {
    set((state) => {
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, campaignNotes: notes } : c
      );
      saveCharactersToStorage(updatedChars, state.activeCharacterId);
      return {
        campaignNotes: notes,
        characters: updatedChars,
      };
    });
  },
}));

// Helper Functions for Computations
export function getAttributeModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function computeSkillBonus(
  skill: SkillKey,
  attributes: Record<CoreAttribute, number>,
  profLevel: 0 | 1 | 2,
  proficiencyBonus: number
): number {
  if (skill === 'drive') {
    // Composite rule: (DEX + WIS) / 2
    const dexMod = getAttributeModifier(attributes.DEX);
    const wisMod = getAttributeModifier(attributes.WIS);
    const base = Math.floor((dexMod + wisMod) / 2);
    return base + (profLevel * proficiencyBonus);
  }

  // Find associated attribute
  const attrMap: Record<SkillKey, CoreAttribute> = {
    acrobatics: 'DEX',
    animal_handling: 'WIS',
    software: 'INT',
    mechanics: 'INT',
    athletics: 'STR',
    throw: 'STR',
    deception: 'CHA',
    history: 'INT',
    insight: 'WIS',
    intimidation: 'CHA',
    investigation: 'INT',
    medicine: 'WIS',
    nature: 'INT',
    crafting: 'INT',
    perception: 'WIS',
    performance: 'CHA',
    persuasion: 'CHA',
    religion: 'INT',
    sleight_of_hand: 'DEX',
    stealth: 'DEX',
    survival: 'WIS',
    persistence: 'CYB',
    drive: 'DEX',
  };

  const attr = attrMap[skill] || 'INT';
  const baseMod = getAttributeModifier(attributes[attr]);
  return baseMod + (profLevel * proficiencyBonus);
}

// Compute Modified Weapon Stats after Gunsmith Attachments
export interface ModifiedWeaponStats {
  effectiveDamage: string;
  effectiveSweetSpot: number;
  effectiveAccuracy: number;
  effectiveInitiative: number;
  effectiveRecharge: string;
  effectiveRechargeCost?: string;
  activeEffects: string[];
  isProficient: boolean;
  effectiveAmmoCapacity?: number;
}

export function isWeaponProficient(weapon: Weapon, char?: CharacterSheetData): boolean {
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
    const itemStr = `${weapon.name} ${weapon.type} ${weapon.size}`.toLowerCase();
    
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
  const isProf = isWeaponProficient(weapon, char);
  let extraDamage = '';
  let sweetSpotDelta = 0;
  let accuracyBonus = 0;
  let initiativeBonus = 0;
  let recharge = weapon.rechargeCost;
  const activeEffects: string[] = [];

  // Check loaded ammo
  if (weapon.loadedAmmoType && weapon.loadedAmmoType !== 'Normal') {
    const ammoData = AMMUNITIONS_CATALOG.find((a) => a.type === weapon.loadedAmmoType);
    if (ammoData?.bonusDamage) {
      extraDamage += ` ${ammoData.bonusDamage} [${weapon.loadedAmmoType}]`;
    }
    if (ammoData?.specialEffect) {
      activeEffects.push(`${weapon.loadedAmmoType}: ${ammoData.specialEffect}`);
    }
  }

  // Check attachments
  (weapon.equippedAttachments || []).forEach((attId) => {
    const att = ATTACHMENTS_CATALOG.find((a) => a.id === attId);
    if (!att) return;

    activeEffects.push(att.name);

    if (att.id === 'fast-mag') {
      recharge = '1MA';
    }
    if (att.id === 'extended-barrel') {
      sweetSpotDelta += 3;
    }
    if (att.id === 'optic-sight-3x') {
      sweetSpotDelta += 5;
    }
    if (att.id === 'tactical-stock' || att.id === 'rubber-grip' || att.id === 'muzzle-flash' || att.id === 'long-stock') {
      accuracyBonus += 1;
    }
    if (att.id === 'wire-stock' || att.id === 'field-tape') {
      initiativeBonus += 1;
    }
    if (att.id === 'fast-grip') {
      initiativeBonus += 2;
    }
    if (att.id === 'no-stock') {
      accuracyBonus -= 2;
    }
  });

  // Check Gunner's Weapon Mastery
  if (char && char.classId === 'gunner') {
    const unlocked = char.unlockedSubclassAbilities || [];
    const gunnerSubclasses = ['certain-shot', 'point-blank', 'fine-control', 'dual-wield', 'bigger-burst'];
    let hasMastery = false;

    gunnerSubclasses.forEach(subId => {
      const uniqueId = `gunner_${subId}_Weapon Mastery`;
      // Support old 'hab-gunner-weapon-mastery' and 'Weapon Mastery' for retro-compat
      const isUnlocked = unlocked.includes(uniqueId) || unlocked.includes('Weapon Mastery') || unlocked.includes('hab-gunner-weapon-mastery');
      if (isUnlocked) {
        let match = false;
        if (subId === 'certain-shot' && weapon.type === 'Sniper') match = true;
        if (subId === 'point-blank' && weapon.type === 'Shotgun') match = true;
        if (subId === 'fine-control' && weapon.type === 'Submachine') match = true;
        if (subId === 'dual-wield' && weapon.type === 'Pistol') match = true;
        if (subId === 'bigger-burst' && weapon.type === 'LMG') match = true;
        if (match) hasMastery = true;
      }
    });

    if (hasMastery) {
      accuracyBonus += 1;
      activeEffects.push('Weapon Mastery (+1 Acerto)');
    }
  }

  // Check Mecha Merge
  if (weapon.isMerged && char && char.classId === 'mecha') {
    const coreSize = char.mechaCoreSize || 'Half';
    const hasMkII = char.unlockedSubclassAbilities?.includes('hab-mecha-merge-mkii') || char.level >= 17;
    
    recharge = 'FREE'; // Ignore recharge
    
    let mergeDmg = '';
    if (hasMkII) {
      mergeDmg = coreSize === 'Half' ? '4d6' : coreSize === 'Light' ? '8d6' : '10d6';
      sweetSpotDelta += coreSize === 'Half' ? 5 : coreSize === 'Light' ? 15 : 50;
      activeEffects.push('Merge MKII (Infinito, +Range, +Dano)');
    } else {
      mergeDmg = coreSize === 'Half' ? '1d10' : coreSize === 'Light' ? '2d10' : '3d10';
      activeEffects.push('Merge (Infinito, +Dano)');
    }
    extraDamage += ` +${mergeDmg} [Chassi]`;
  }

  if (isProf) {
    activeEffects.push('Proficiência Ativa');
  } else {
    activeEffects.push('Sem Proficiência (Desvantagem no ataque)');
  }

  return {
    isProficient: isProf,
    effectiveDamage: extraDamage ? `${weapon.baseDamage}${extraDamage}` : weapon.baseDamage,
    effectiveSweetSpot: weapon.sweetSpot + sweetSpotDelta,
    effectiveAccuracy: accuracyBonus,
    effectiveInitiative: initiativeBonus,
    effectiveRecharge: recharge,
    activeEffects,
  };
}


export function computeBaseAttributes(classId: string, level: number, secondary?: {classId: string, level: number}[]): Record<CoreAttribute, number> {
  const base = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10, CYB: 10 };
  
  const applyProgression = (cid: string, lvl: number) => {
    if (!cid) return;
    const isGunner = cid.toLowerCase().includes('gunner');
    const isHacker = cid.toLowerCase().includes('hacker') || cid.toLowerCase().includes('tech');
    
    if (isGunner) {
      base.STR += 2 + Math.floor(lvl / 3);
      base.CON += 1 + Math.floor(lvl / 4);
      base.DEX += 1 + Math.floor(lvl / 5);
    } else if (isHacker) {
      base.INT += 2 + Math.floor(lvl / 3);
      base.CYB += 1 + Math.floor(lvl / 4);
      base.WIS += 1 + Math.floor(lvl / 5);
    } else {
      base.DEX += 2 + Math.floor(lvl / 3);
      base.CHA += 1 + Math.floor(lvl / 4);
      base.STR += 1 + Math.floor(lvl / 5);
    }
  };

  applyProgression(classId, level);
  if (secondary) {
    for (const sc of secondary) {
      applyProgression(sc.classId, sc.level);
    }
  }
  
  return base;
}

export function calculateTotalAttributes(char: CharacterSheetData): Record<CoreAttribute, number> {
  const base = computeBaseAttributes(char.characterClass, char.level, char.secondaryClasses);
  const allocated = char.allocatedAttributes || {};
  const eqArmor = char.equipment?.armor?.bonusAttributes || {};
  const eqAcc = char.equipment?.accessory?.bonusAttributes || {};
  
  const total = { ...base };
  for (const attr of Object.keys(base) as CoreAttribute[]) {
    total[attr] += (allocated[attr] || 0) + (eqArmor[attr] || 0) + (eqAcc[attr] || 0);
  }
  return total;
}
