/**
 * EntityRegistry — single source of truth for all navigable Grimoire entities.
 *
 * Provides:
 *   - Lookup by prefixed ID (`findById`)
 *   - Lookup by display name or alias (`findByName`)
 *   - Bidirectional weapon ↔ attachment filtering (`getCompatibleAttachments`, `getCompatibleWeapons`)
 *   - Text-tokenization index for `grimoire-linker`
 */

import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';
import { CLASSES_CATALOG } from '@/data/classes-catalog';
import { CLASS_ABILITIES_CATALOG } from '@/data/class-abilities-catalog';
import { LORE_RULES_CATALOG } from '@/data/lore-rules-catalog';
import type { Weapon, Attachment, Ammunition, AttachmentCompatibility } from '@/types/codak-rules';
import type { ClassDefinition } from '@/data/classes-catalog';
import type { ClassAbilityDetail } from '@/data/class-abilities-catalog';
import type { LoreRuleItem } from '@/data/lore-rules-catalog';
import type { GrimoireEntityType } from '@/types/grimoire';

// ---------------------------------------------------------------------------
// Core entity reference shape
// ---------------------------------------------------------------------------

export interface EntityRef {
  /** Prefixed ID unique across all entity types (e.g. 'w-vapr-x', 'cls-gunner', 'ammo-Plasma') */
  id: string;
  type: GrimoireEntityType;
  /** Original ID without prefix (used for data lookups) */
  rawId: string;
  /** Primary display name */
  name: string;
  /** Additional name variants for text matching (lowercase) */
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Compatibility helpers
// ---------------------------------------------------------------------------

/** Returns true if the weapon satisfies the attachment's compatibility spec */
function weaponMatchesCompatibility(weapon: Weapon, compat: AttachmentCompatibility): boolean {
  if (compat.all) return true;

  if (compat.weaponSizes && !compat.weaponSizes.includes(weapon.size)) return false;
  if (compat.weaponTypes && !compat.weaponTypes.includes(weapon.type)) return false;
  if (compat.specificWeaponIds && !compat.specificWeaponIds.includes(weapon.id)) {
    // specificWeaponIds is an allowlist — only those weapons qualify
    if (!compat.weaponSizes && !compat.weaponTypes) return false;
  }

  // ammoCategories: 'Fire' means gunpowder weapons, 'Energy' means energy weapons
  if (compat.ammoCategories) {
    const usesEnergy = weapon.loadedAmmoType === 'Energy';
    const needsEnergy = compat.ammoCategories.includes('Energy');
    const needsFire = compat.ammoCategories.includes('Fire');
    if (needsEnergy && !usesEnergy) return false;
    if (needsFire && usesEnergy) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Registry class
// ---------------------------------------------------------------------------

class EntityRegistryImpl {
  private byId = new Map<string, EntityRef>();
  /** lowercase name/alias → prefixed id */
  private byName = new Map<string, string>();
  private activeWeapons: Weapon[] = [];
  private activeAttachments: Attachment[] = [];

  constructor() {
    this.build();
  }

  private register(ref: EntityRef) {
    this.byId.set(ref.id, ref);
    // Index the primary name and all aliases
    this.byName.set(ref.name.toLowerCase(), ref.id);
    for (const alias of ref.aliases) {
      if (!this.byName.has(alias)) {
        this.byName.set(alias, ref.id);
      }
    }
  }

  public rebuild(data?: {
    weapons?: Weapon[];
    attachments?: Attachment[];
    ammunitions?: Ammunition[];
    classes?: ClassDefinition[];
    abilities?: ClassAbilityDetail[];
    loreRules?: LoreRuleItem[];
  }) {
    this.byId.clear();
    this.byName.clear();
    this.build(data);
  }

  private build(data?: {
    weapons?: Weapon[];
    attachments?: Attachment[];
    ammunitions?: Ammunition[];
    classes?: ClassDefinition[];
    abilities?: ClassAbilityDetail[];
    loreRules?: LoreRuleItem[];
  }) {
    const classes = data?.classes || CLASSES_CATALOG;
    const abilities = data?.abilities || CLASS_ABILITIES_CATALOG;
    const weapons = data?.weapons || WEAPONS_CATALOG;
    const attachments = data?.attachments || ATTACHMENTS_CATALOG;
    const ammunitions = data?.ammunitions || AMMUNITIONS_CATALOG;
    const loreRules = data?.loreRules || LORE_RULES_CATALOG;

    this.activeWeapons = weapons;
    this.activeAttachments = attachments;

    // Classes
    for (const cls of classes) {
      this.register({
        id: `cls-${cls.id}`,
        type: 'class',
        rawId: cls.id,
        name: cls.name,
        aliases: [cls.id.toLowerCase(), cls.name.toLowerCase()],
      });
    }

    // Abilities
    for (const ab of abilities) {
      const aliases: string[] = [ab.name.toLowerCase()];
      // Strip PT translation in parentheses: "Sixth Sense (Sexto Sentido)" → also index "sixth sense"
      const baseName = ab.name.split('(')[0].trim().toLowerCase();
      if (baseName !== ab.name.toLowerCase()) aliases.push(baseName);

      this.register({
        id: ab.id,
        type: 'ability',
        rawId: ab.id,
        name: ab.name,
        aliases,
      });
    }

    // Weapons
    for (const w of weapons) {
      this.register({
        id: `w-${w.id}`,
        type: 'weapon',
        rawId: w.id,
        name: w.name,
        aliases: [w.name.toLowerCase(), w.id.toLowerCase()],
      });
    }

    // Attachments
    for (const att of attachments) {
      this.register({
        id: `att-${att.id}`,
        type: 'attachment',
        rawId: att.id,
        name: att.name,
        aliases: [att.name.toLowerCase(), att.id.toLowerCase()],
      });
    }

    // Ammo
    for (const ammo of ammunitions) {
      this.register({
        id: `ammo-${ammo.type}`,
        type: 'ammo',
        rawId: ammo.type,
        name: ammo.type,
        aliases: [ammo.type.toLowerCase()],
      });
    }

    // Lore / Rules
    for (const item of loreRules) {
      this.register({
        id: `lore-${item.id}`,
        type: 'lore_rule',
        rawId: item.id,
        name: item.title,
        aliases: [
          item.title.toLowerCase(),
          item.id.toLowerCase(),
          // Common shorthand aliases
          ...(item.id === 'elemento-115' ? ['elemento 115', 'e-115'] : []),
          ...(item.id === 'elemento-142' ? ['elemento 142', 'e-142', 'radiação 142', 'radiacao 142'] : []),
          ...(item.id === 'sweet-spot-rules' ? ['sweet spot', 'sweetspot', 'ss'] : []),
          ...(item.id === 'action-economy-rules' ? ['economia de ações', 'ação de movimento'] : []),
          ...(item.id === 'traje-exo-obsidian' ? ['exo-obsidian'] : []),
          ...(item.id === 'capacete-freq-neural' ? ['frequência neural', 'frequencia neural'] : []),
          ...(item.id === 'abs-ability-score-improvement' ? ['abs'] : []),
        ],
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  findById(prefixedId: string): EntityRef | undefined {
    return this.byId.get(prefixedId);
  }

  findByName(name: string): EntityRef | undefined {
    const id = this.byName.get(name.toLowerCase().trim());
    return id ? this.byId.get(id) : undefined;
  }

  getAll(): EntityRef[] {
    return Array.from(this.byId.values());
  }

  /** All sorted names (longest first) — used by grimoire-linker for greedy matching */
  getSortedNames(): Array<{ display: string; lower: string; entryId: string }> {
    const result: Array<{ display: string; lower: string; entryId: string }> = [];
    Array.from(this.byName.entries()).forEach(([lower, id]) => {
      const ref = this.byId.get(id);
      if (ref) result.push({ display: ref.name, lower, entryId: id });
    });
    // Longest match first prevents partial shadowing (e.g. "MP5" doesn't eat "MP5K")
    result.sort((a, b) => b.lower.length - a.lower.length);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Bidirectional compatibility queries
  // ---------------------------------------------------------------------------

  /** Which attachments can be installed on this weapon? */
  getCompatibleAttachments(weapon: Weapon): EntityRef[] {
    return this.activeAttachments
      .filter((att) => weaponMatchesCompatibility(weapon, att.compatibility))
      .map((att) => this.byId.get(`att-${att.id}`)!)
      .filter(Boolean);
  }

  /** Which weapons accept this attachment? */
  getCompatibleWeapons(attachment: Attachment): EntityRef[] {
    return this.activeWeapons
      .filter((w) => weaponMatchesCompatibility(w, attachment.compatibility))
      .map((w) => this.byId.get(`w-${w.id}`)!)
      .filter(Boolean);
  }
}

// Lazy singleton — built once on first access
let _registry: EntityRegistryImpl | null = null;

export function getEntityRegistry(): EntityRegistryImpl {
  if (!_registry) _registry = new EntityRegistryImpl();
  return _registry;
}

// Convenience re-export for common lookups

