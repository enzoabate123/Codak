// CODAK System Rules & Entity Definitions (BETA 1.1)

export type CoreAttribute = 
  | 'STR' // Strength
  | 'DEX' // Dexterity
  | 'CON' // Constitution
  | 'INT' // Intelligence
  | 'WIS' // Wisdom
  | 'CHA' // Charisma
  | 'CYB'; // Cybersanity (CODAK custom attribute)

export interface AttributeScore {
  value: number;
  modifier: number;
}

export type AttributeMap = Record<CoreAttribute, AttributeScore>;

export type SkillKey =
  | 'acrobatics'
  | 'animal_handling'
  | 'software'
  | 'mechanics'
  | 'athletics'
  | 'throw'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'crafting'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight_of_hand'
  | 'stealth'
  | 'survival'
  | 'persistence'
  | 'drive';

export interface SkillDefinition {
  id: SkillKey;
  labelKey: string;
  attribute: CoreAttribute | 'COMPOSITE_DRIVE'; // Drive is (DEX + WIS) / 2
  isProficient?: boolean;
}

export const CODAK_SKILLS: SkillDefinition[] = [
  { id: 'acrobatics', labelKey: 'skills.acrobatics', attribute: 'DEX' },
  { id: 'animal_handling', labelKey: 'skills.animal_handling', attribute: 'WIS' },
  { id: 'software', labelKey: 'skills.software', attribute: 'INT' },
  { id: 'mechanics', labelKey: 'skills.mechanics', attribute: 'INT' },
  { id: 'athletics', labelKey: 'skills.athletics', attribute: 'STR' },
  { id: 'throw', labelKey: 'skills.throw', attribute: 'STR' },
  { id: 'deception', labelKey: 'skills.deception', attribute: 'CHA' },
  { id: 'history', labelKey: 'skills.history', attribute: 'INT' },
  { id: 'insight', labelKey: 'skills.insight', attribute: 'WIS' },
  { id: 'intimidation', labelKey: 'skills.intimidation', attribute: 'CHA' },
  { id: 'investigation', labelKey: 'skills.investigation', attribute: 'INT' },
  { id: 'medicine', labelKey: 'skills.medicine', attribute: 'WIS' },
  { id: 'nature', labelKey: 'skills.nature', attribute: 'INT' },
  { id: 'crafting', labelKey: 'skills.crafting', attribute: 'INT' },
  { id: 'perception', labelKey: 'skills.perception', attribute: 'WIS' },
  { id: 'performance', labelKey: 'skills.performance', attribute: 'CHA' },
  { id: 'persuasion', labelKey: 'skills.persuasion', attribute: 'CHA' },
  { id: 'religion', labelKey: 'skills.religion', attribute: 'INT' },
  { id: 'sleight_of_hand', labelKey: 'skills.sleight_of_hand', attribute: 'DEX' },
  { id: 'stealth', labelKey: 'skills.stealth', attribute: 'DEX' },
  { id: 'survival', labelKey: 'skills.survival', attribute: 'WIS' },
  { id: 'persistence', labelKey: 'skills.persistence', attribute: 'CYB' },
  { id: 'drive', labelKey: 'skills.drive', attribute: 'COMPOSITE_DRIVE' },
];

export type WeaponType = 'Rifle' | 'Shotgun' | 'Submachine' | 'Pistol' | 'Sniper' | 'LMG';
export type WeaponSize = 'Small' | 'Medium' | 'Big';

export interface IdealRange {
  min: number; // meters
  max: number; // meters
}

export const WEAPON_IDEAL_RANGES: Record<WeaponType, IdealRange> = {
  Rifle: { min: 12, max: 20 },
  Pistol: { min: 2, max: 10 },
  Sniper: { min: 20, max: 200 },
  Shotgun: { min: 1, max: 7 },
  Submachine: { min: 7, max: 15 },
  LMG: { min: 20, max: 60 },
};

export type ActionCost = '1A' | '1MA' | '1BA' | '2A' | 'FREE';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  size: WeaponSize;
  cost: number;
  sweetSpot: number; // exact distance in meters for sweet spot bonus
  baseDamage: string; // e.g. "2d4", "1d10"
  sweetSpotBonusDamage: string; // e.g. "+1d2", "+1d12"
  ammoCapacity: number;
  currentAmmo: number;
  burstRate: string; // e.g. "1x10", "3x2"
  rechargeCost: ActionCost; // Action cost to reload
  attachmentSlots: number;
  equippedAttachments?: string[];
  loadedAmmoType?: AmmunitionType;
  isMerged?: boolean;
}

export type AttachmentCategory = 
  | 'Stock'
  | 'Mags'
  | 'Grips'
  | 'Barrels'
  | 'Optics'
  | 'Modifiers';

export type FiringMode = 'Automatic' | 'Semi-auto' | 'Single-fire' | 'Shells';

// Structured compatibility — replaces the old free-text string
export interface AttachmentCompatibility {
  weaponSizes?: WeaponSize[];       // e.g. ['Small', 'Medium']
  weaponTypes?: WeaponType[];       // e.g. ['Shotgun', 'Sniper']
  ammoCategories?: ('Fire' | 'Energy')[]; // Fire = gunpowder, Energy = battery
  firingModes?: FiringMode[];       // e.g. ['Automatic', 'Semi-auto']
  specificWeaponIds?: string[];     // raw weapon IDs for exceptional cases
  all?: true;                        // compatible with everything
  notes?: string;                   // human-readable note for edge cases
}

export interface Attachment {
  id: string;
  name: string;
  category: AttachmentCategory;
  slots: number;
  compatibility: AttachmentCompatibility;
  effect: string;
  price: number;
}

export type AmmunitionType = 
  | 'Normal'
  | 'Fire'
  | 'Cryo'
  | 'Plasma'
  | 'Corrosion'
  | 'Electric'
  | 'Nuke'
  | 'MD'
  | 'Etched'
  | 'Energy'
  | 'FMJ';

export type AmmoSize = 'Pequena' | 'Média' | 'Grande' | 'Bateria';

export interface Ammunition {
  type: AmmunitionType;
  size: AmmoSize;
  capacity?: number;
  pricePerBullet: number;
  bonusDamage?: string;
  specialEffect?: string;
}

export type CombatActionSlot = 'ACTION' | 'BONUS_ACTION' | 'MOVEMENT_ACTION' | 'REACTION';

export interface CombatTurnState {
  hasAction: boolean;
  hasBonusAction: boolean;
  hasMovementAction: boolean;
  hasReaction: boolean;
}
