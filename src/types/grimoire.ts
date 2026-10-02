// Grimoire type system — centralized entity types for all Grimoire navigation
import type { ClassDefinition } from '@/data/classes-catalog';
import type { ClassAbilityDetail } from '@/data/class-abilities-catalog';
import type { Weapon, Attachment, Ammunition } from '@/types/codak-rules';
import type { LoreRuleItem } from '@/data/lore-rules-catalog';

export type GrimoireEntityType =
  | 'class'
  | 'ability'
  | 'weapon'
  | 'attachment'
  | 'ammo'
  | 'lore_rule';

export type GrimoireModalItem =
  | { type: 'class'; data: ClassDefinition }
  | { type: 'ability'; data: ClassAbilityDetail }
  | { type: 'weapon'; data: Weapon }
  | { type: 'attachment'; data: Attachment }
  | { type: 'ammo'; data: Ammunition }
  | { type: 'lore_rule'; data: LoreRuleItem };

export interface BreadcrumbStep {
  label: string;
  entryId?: string;
}

// Prefix constants — single source of truth for all ID construction
export const ID_PREFIX: Record<GrimoireEntityType, string> = {
  class: 'cls-',
  ability: '',        // abilities use their raw id (already prefixed with 'hab-')
  weapon: 'w-',
  attachment: 'att-',
  ammo: 'ammo-',
  lore_rule: 'lore-',
};

export function resolveEntryId(type: GrimoireEntityType, rawId: string): string {
  return ID_PREFIX[type] + rawId;
}

export function parseEntryId(prefixedId: string): { type: GrimoireEntityType; rawId: string } | null {
  if (prefixedId.startsWith('cls-'))  return { type: 'class',      rawId: prefixedId.slice(4)    };
  if (prefixedId.startsWith('w-'))    return { type: 'weapon',     rawId: prefixedId.slice(2)    };
  if (prefixedId.startsWith('att-'))  return { type: 'attachment', rawId: prefixedId.slice(4)    };
  if (prefixedId.startsWith('ammo-')) return { type: 'ammo',       rawId: prefixedId.slice(5)    };
  if (prefixedId.startsWith('lore-')) return { type: 'lore_rule',  rawId: prefixedId.slice(5)    };
  if (prefixedId.startsWith('hab-'))  return { type: 'ability',    rawId: prefixedId             };
  return null;
}
