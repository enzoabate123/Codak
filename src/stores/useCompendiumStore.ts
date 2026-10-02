'use client';

import { create } from 'zustand';
import { Weapon, Attachment, Ammunition } from '@/types/codak-rules';
import { ClassDefinition, CLASSES_CATALOG } from '@/data/classes-catalog';
import { ClassAbilityDetail, CLASS_ABILITIES_CATALOG } from '@/data/class-abilities-catalog';
import { LoreRuleItem, LORE_RULES_CATALOG } from '@/data/lore-rules-catalog';
import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';
import { getEntityRegistry } from '@/lib/entity-registry';

import { AuditLogEntry } from '@/types/shared';

interface CompendiumState {
  weapons: Weapon[];
  attachments: Attachment[];
  ammunitions: Ammunition[];
  classes: ClassDefinition[];
  abilities: ClassAbilityDetail[];
  loreRules: LoreRuleItem[];
  auditLogs: AuditLogEntry[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  fetchCompendium: () => Promise<void>;
  saveEntity: (
    type: 'weapon' | 'attachment' | 'ammo' | 'class' | 'ability' | 'lore_rule',
    item: any,
    username?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteEntity: (
    type: 'weapon' | 'attachment' | 'ammo' | 'class' | 'ability' | 'lore_rule',
    id: string,
    username?: string
  ) => Promise<{ success: boolean; error?: string }>;
  restoreDefaults: (username?: string) => Promise<{ success: boolean; error?: string }>;
  importCompendium: (data: any, username?: string) => Promise<{ success: boolean; error?: string }>;
}

export const useCompendiumStore = create<CompendiumState>((set, get) => ({
  weapons: WEAPONS_CATALOG,
  attachments: ATTACHMENTS_CATALOG,
  ammunitions: AMMUNITIONS_CATALOG,
  classes: CLASSES_CATALOG,
  abilities: CLASS_ABILITIES_CATALOG,
  loreRules: LORE_RULES_CATALOG,
  auditLogs: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  fetchCompendium: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch('/api/compendium');
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const { weapons, attachments, ammunitions, classes, abilities, loreRules, auditLogs } = json.data;
        set({
          weapons: weapons || get().weapons,
          attachments: attachments || get().attachments,
          ammunitions: ammunitions || get().ammunitions,
          classes: classes || get().classes,
          abilities: abilities || get().abilities,
          loreRules: loreRules || get().loreRules,
          auditLogs: auditLogs || [],
          isLoading: false,
          isInitialized: true,
        });

        // Rebuild EntityRegistry with latest data
        getEntityRegistry().rebuild({
          weapons,
          attachments,
          ammunitions,
          classes,
          abilities,
          loreRules,
        });
      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (err: any) {
      console.warn('Compendium offline or error loading:', err.message);
      set({ isLoading: false, isInitialized: true });
    }
  },

  saveEntity: async (type, item, username = 'admin') => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/compendium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', type, item, username }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        set({ isLoading: false });
        return { success: false, error: json.error || 'Erro ao salvar' };
      }

      if (json.data) {
        const { weapons, attachments, ammunitions, classes, abilities, loreRules, auditLogs } = json.data;
        set({
          weapons: weapons || get().weapons,
          attachments: attachments || get().attachments,
          ammunitions: ammunitions || get().ammunitions,
          classes: classes || get().classes,
          abilities: abilities || get().abilities,
          loreRules: loreRules || get().loreRules,
          auditLogs: auditLogs || [],
          isLoading: false,
        });

        getEntityRegistry().rebuild({
          weapons,
          attachments,
          ammunitions,
          classes,
          abilities,
          loreRules,
        });
      }
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  deleteEntity: async (type, id, username = 'admin') => {
    try {
      set({ isLoading: true });
      const res = await fetch(`/api/compendium?type=${type}&id=${encodeURIComponent(id)}&username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        set({ isLoading: false });
        return { success: false, error: json.error || 'Erro ao excluir' };
      }

      if (json.data) {
        const { weapons, attachments, ammunitions, classes, abilities, loreRules, auditLogs } = json.data;
        set({
          weapons: weapons || get().weapons,
          attachments: attachments || get().attachments,
          ammunitions: ammunitions || get().ammunitions,
          classes: classes || get().classes,
          abilities: abilities || get().abilities,
          loreRules: loreRules || get().loreRules,
          auditLogs: auditLogs || [],
          isLoading: false,
        });

        getEntityRegistry().rebuild({
          weapons,
          attachments,
          ammunitions,
          classes,
          abilities,
          loreRules,
        });
      }
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  restoreDefaults: async (username = 'admin') => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/compendium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', username }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        set({ isLoading: false });
        return { success: false, error: json.error || 'Erro ao restaurar' };
      }

      if (json.data) {
        const { weapons, attachments, ammunitions, classes, abilities, loreRules, auditLogs } = json.data;
        set({
          weapons: weapons || get().weapons,
          attachments: attachments || get().attachments,
          ammunitions: ammunitions || get().ammunitions,
          classes: classes || get().classes,
          abilities: abilities || get().abilities,
          loreRules: loreRules || get().loreRules,
          auditLogs: auditLogs || [],
          isLoading: false,
        });

        getEntityRegistry().rebuild({
          weapons,
          attachments,
          ammunitions,
          classes,
          abilities,
          loreRules,
        });
      }
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  importCompendium: async (data, username = 'admin') => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/compendium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', data, username }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        set({ isLoading: false });
        return { success: false, error: json.error || 'Erro ao importar' };
      }

      if (json.data) {
        const { weapons, attachments, ammunitions, classes, abilities, loreRules, auditLogs } = json.data;
        set({
          weapons: weapons || get().weapons,
          attachments: attachments || get().attachments,
          ammunitions: ammunitions || get().ammunitions,
          classes: classes || get().classes,
          abilities: abilities || get().abilities,
          loreRules: loreRules || get().loreRules,
          auditLogs: auditLogs || [],
          isLoading: false,
        });

        getEntityRegistry().rebuild({
          weapons,
          attachments,
          ammunitions,
          classes,
          abilities,
          loreRules,
        });
      }
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));
