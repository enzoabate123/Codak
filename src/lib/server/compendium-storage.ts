import fs from 'fs';
import path from 'path';
import { Weapon, Attachment, Ammunition } from '@/types/codak-rules';
import { ClassDefinition } from '@/data/classes-catalog';
import { ClassAbilityDetail } from '@/data/class-abilities-catalog';
import { LoreRuleItem } from '@/data/lore-rules-catalog';

import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';
import { CLASSES_CATALOG } from '@/data/classes-catalog';
import { CLASS_ABILITIES_CATALOG } from '@/data/class-abilities-catalog';
import { LORE_RULES_CATALOG } from '@/data/lore-rules-catalog';

import { AuditLogEntry } from '@/types/shared';

export interface CompendiumData {
  weapons: Weapon[];
  attachments: Attachment[];
  ammunitions: Ammunition[];
  classes: ClassDefinition[];
  abilities: ClassAbilityDetail[];
  loreRules: LoreRuleItem[];
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'compendium');

const FILES = {
  weapons: path.join(DATA_DIR, 'weapons.json'),
  attachments: path.join(DATA_DIR, 'attachments.json'),
  ammunitions: path.join(DATA_DIR, 'ammunitions.json'),
  classes: path.join(DATA_DIR, 'classes.json'),
  abilities: path.join(DATA_DIR, 'abilities.json'),
  loreRules: path.join(DATA_DIR, 'lore-rules.json'),
  auditLogs: path.join(DATA_DIR, 'audit-logs.json'),
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readOrInit<T>(filePath: string, defaultData: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Erro ao ler ${filePath}, utilizando fallback:`, err);
    return defaultData;
  }
}

function writeData<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function logAuditAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const logs = getAuditLogs();
  const newEntry: AuditLogEntry = {
    id: `log-${Date.now()}-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.unshift(newEntry); // Latest first
  // Keep last 200 logs
  if (logs.length > 200) {
    logs.length = 200;
  }
  writeData(FILES.auditLogs, logs);
}

export function getAuditLogs(): AuditLogEntry[] {
  return readOrInit<AuditLogEntry[]>(FILES.auditLogs, []);
}

export function getCompendiumData(): CompendiumData {
  return {
    weapons: readOrInit<Weapon[]>(FILES.weapons, WEAPONS_CATALOG),
    attachments: readOrInit<Attachment[]>(FILES.attachments, ATTACHMENTS_CATALOG),
    ammunitions: readOrInit<Ammunition[]>(FILES.ammunitions, AMMUNITIONS_CATALOG),
    classes: readOrInit<ClassDefinition[]>(FILES.classes, CLASSES_CATALOG),
    abilities: readOrInit<ClassAbilityDetail[]>(FILES.abilities, CLASS_ABILITIES_CATALOG),
    loreRules: readOrInit<LoreRuleItem[]>(FILES.loreRules, LORE_RULES_CATALOG),
    auditLogs: getAuditLogs(),
  };
}

export function saveCompendiumEntity(
  type: 'weapon' | 'attachment' | 'ammo' | 'class' | 'ability' | 'lore_rule',
  item: any,
  username: string
): { success: boolean; error?: string } {
  try {
    const compendium = getCompendiumData();
    let action: 'create' | 'update' = 'create';
    let entityName = '';

    switch (type) {
      case 'weapon': {
        const weapon = item as Weapon;
        entityName = weapon.name;
        const idx = compendium.weapons.findIndex((w) => w.id === weapon.id);
        if (idx !== -1) {
          action = 'update';
          compendium.weapons[idx] = weapon;
        } else {
          compendium.weapons.push(weapon);
        }
        writeData(FILES.weapons, compendium.weapons);
        break;
      }
      case 'attachment': {
        const att = item as Attachment;
        entityName = att.name;
        const idx = compendium.attachments.findIndex((a) => a.id === att.id);
        if (idx !== -1) {
          action = 'update';
          compendium.attachments[idx] = att;
        } else {
          compendium.attachments.push(att);
        }
        writeData(FILES.attachments, compendium.attachments);
        break;
      }
      case 'ammo': {
        const ammo = item as Ammunition;
        entityName = `Munição ${ammo.type}`;
        const idx = compendium.ammunitions.findIndex((a) => a.type === ammo.type);
        if (idx !== -1) {
          action = 'update';
          compendium.ammunitions[idx] = ammo;
        } else {
          compendium.ammunitions.push(ammo);
        }
        writeData(FILES.ammunitions, compendium.ammunitions);
        break;
      }
      case 'class': {
        const cls = item as ClassDefinition;
        entityName = cls.name;
        const idx = compendium.classes.findIndex((c) => c.id === cls.id);
        if (idx !== -1) {
          action = 'update';
          compendium.classes[idx] = cls;
        } else {
          compendium.classes.push(cls);
        }
        writeData(FILES.classes, compendium.classes);
        break;
      }
      case 'ability': {
        const ab = item as ClassAbilityDetail;
        entityName = ab.name;
        const idx = compendium.abilities.findIndex((a) => a.id === ab.id);
        if (idx !== -1) {
          action = 'update';
          compendium.abilities[idx] = ab;
        } else {
          compendium.abilities.push(ab);
        }
        writeData(FILES.abilities, compendium.abilities);
        break;
      }
      case 'lore_rule': {
        const lr = item as LoreRuleItem;
        entityName = lr.title;
        const idx = compendium.loreRules.findIndex((l) => l.id === lr.id);
        if (idx !== -1) {
          action = 'update';
          compendium.loreRules[idx] = lr;
        } else {
          compendium.loreRules.push(lr);
        }
        writeData(FILES.loreRules, compendium.loreRules);
        break;
      }
      default:
        return { success: false, error: 'Tipo de entidade desconhecido' };
    }

    logAuditAction({
      userId: username,
      action,
      entityType: type,
      entityId: item.id || item.type,
      entityName,
      details: `${action === 'create' ? 'Criou' : 'Atualizou'} ${entityName}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao salvar' };
  }
}

export function deleteCompendiumEntity(
  type: 'weapon' | 'attachment' | 'ammo' | 'class' | 'ability' | 'lore_rule',
  id: string,
  username: string
): { success: boolean; error?: string } {
  try {
    const compendium = getCompendiumData();
    let entityName = id;

    switch (type) {
      case 'weapon': {
        const found = compendium.weapons.find((w) => w.id === id);
        if (found) entityName = found.name;
        compendium.weapons = compendium.weapons.filter((w) => w.id !== id);
        writeData(FILES.weapons, compendium.weapons);
        break;
      }
      case 'attachment': {
        const found = compendium.attachments.find((a) => a.id === id);
        if (found) entityName = found.name;
        compendium.attachments = compendium.attachments.filter((a) => a.id !== id);
        writeData(FILES.attachments, compendium.attachments);
        break;
      }
      case 'ammo': {
        entityName = `Munição ${id}`;
        compendium.ammunitions = compendium.ammunitions.filter((a) => a.type !== id);
        writeData(FILES.ammunitions, compendium.ammunitions);
        break;
      }
      case 'class': {
        const found = compendium.classes.find((c) => c.id === id);
        if (found) entityName = found.name;
        compendium.classes = compendium.classes.filter((c) => c.id !== id);
        writeData(FILES.classes, compendium.classes);
        break;
      }
      case 'ability': {
        const found = compendium.abilities.find((a) => a.id === id);
        if (found) entityName = found.name;
        compendium.abilities = compendium.abilities.filter((a) => a.id !== id);
        writeData(FILES.abilities, compendium.abilities);
        break;
      }
      case 'lore_rule': {
        const found = compendium.loreRules.find((l) => l.id === id);
        if (found) entityName = found.title;
        compendium.loreRules = compendium.loreRules.filter((l) => l.id !== id);
        writeData(FILES.loreRules, compendium.loreRules);
        break;
      }
      default:
        return { success: false, error: 'Tipo de entidade desconhecido' };
    }

    logAuditAction({
      userId: username,
      action: 'delete',
      entityType: type,
      entityId: id,
      entityName,
      details: `Removeu ${entityName}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao remover' };
  }
}

export function restoreOfficialDefaults(username: string): boolean {
  try {
    ensureDataDir();
    writeData(FILES.weapons, WEAPONS_CATALOG);
    writeData(FILES.attachments, ATTACHMENTS_CATALOG);
    writeData(FILES.ammunitions, AMMUNITIONS_CATALOG);
    writeData(FILES.classes, CLASSES_CATALOG);
    writeData(FILES.abilities, CLASS_ABILITIES_CATALOG);
    writeData(FILES.loreRules, LORE_RULES_CATALOG);

    logAuditAction({
      userId: username,
      action: 'restore',
      entityType: 'system',
      entityId: 'system-all',
      entityName: 'Padrões de Fábrica',
      details: 'Restaurou todos os dados oficiais do CODAK',
    });

    return true;
  } catch (err) {
    console.error('Falha ao restaurar padrões:', err);
    return false;
  }
}

export function importFullCompendium(data: Partial<CompendiumData>, username: string): boolean {
  try {
    ensureDataDir();
    if (data.weapons && Array.isArray(data.weapons)) writeData(FILES.weapons, data.weapons);
    if (data.attachments && Array.isArray(data.attachments)) writeData(FILES.attachments, data.attachments);
    if (data.ammunitions && Array.isArray(data.ammunitions)) writeData(FILES.ammunitions, data.ammunitions);
    if (data.classes && Array.isArray(data.classes)) writeData(FILES.classes, data.classes);
    if (data.abilities && Array.isArray(data.abilities)) writeData(FILES.abilities, data.abilities);
    if (data.loreRules && Array.isArray(data.loreRules)) writeData(FILES.loreRules, data.loreRules);

    logAuditAction({
      userId: username,
      action: 'import',
      entityType: 'system',
      entityId: 'compendium-import',
      entityName: 'Importação de Compêndio',
      details: 'Importou compêndio externo completo em JSON',
    });

    return true;
  } catch (err) {
    console.error('Falha ao importar compêndio:', err);
    return false;
  }
}
