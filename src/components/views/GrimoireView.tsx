'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { tacticalAudio } from '@/lib/audio';
import { useGrimoireStore } from '@/stores/useGrimoireStore';
import { CLASSES_CATALOG } from '@/data/classes-catalog';
import { CLASS_ABILITIES_CATALOG } from '@/data/class-abilities-catalog';
import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { ATTACHMENTS_CATALOG, AMMUNITIONS_CATALOG } from '@/data/attachments-catalog';
import { LORE_RULES_CATALOG } from '@/data/lore-rules-catalog';
import { GrimoireModalItem, BreadcrumbStep } from '@/types/grimoire';
import { GrimoireBreadcrumb } from '@/components/grimoire/GrimoireBreadcrumb';
import { GrimoireSidebar, CATEGORY_ICONS, GrimoireCategory, SidebarItem } from '@/components/grimoire/GrimoireSidebar';
import { GrimoireContentPanel } from '@/components/grimoire/GrimoireContentPanel';
import { useCompendiumStore } from '@/stores/useCompendiumStore';
import { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Unified Entry Type (kept from previous implementation)
// ---------------------------------------------------------------------------
interface UnifiedGrimoireEntry {
  id: string;
  code: string;
  category: GrimoireCategory;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  desc: string;
  metric: string;
  tags: string[];
  rawItem: GrimoireModalItem;
  hasSpecialContent?: boolean;
  imageUrl?: string;
}

// Ponytail approach: static mapping for images without heavy db migrations
const IMAGE_ENRICHMENT_MAP: Record<string, string> = {
  // Raças (Lore Rules)
  'lore-android': '/images/grimoire/Android.png',
  'lore-cyborgue': '/images/grimoire/Cyborgue.jpg',
  'lore-humano': '/images/grimoire/Human.jpg',
  'lore-infectado': '/images/grimoire/Infected.jpg',
  'lore-infectado-142': '/images/grimoire/infected%20142%20a.png',
  'lore-infectado-115': '/images/grimoire/infected%20115.jpg',
  'lore-android-analogo': '/images/grimoire/Analog%20Android%202.png',
  'lore-android-psitronico': '/images/grimoire/Positronic%20android.png',
  
  // Habilidades (Raciais/Lore)
  'lore-good-old-days': '/images/grimoire/old%20android.png', // Analog Android
  'lore-modular-limbs': '/images/grimoire/Glue%20Limbs.png',
  'lore-originium-arts': '/images/grimoire/Originium_Arts.png',
  'lore-positronic-brain': '/images/grimoire/Positronic%20android.png',
  'lore-synesthesia': '/images/grimoire/Synesthesia.png',
  'lore-quantum-calculus': '/images/grimoire/Quantum%20Calculus.png',
  'lore-update-available': '/images/grimoire/Analog%20Android%202.png',
  
  // Classes
  'cls-gunner': '/images/grimoire/50mm%20PathFinder.png',
  'cls-hacker': '/images/grimoire/GAMMA_MALE_2_TOKEN.png',
  'cls-mecha': '/images/grimoire/HeavyStell%20III.jpg',
  
  // Equipamentos & Consumíveis (Lore Rules)
  'lore-item-gunner-s-jacket': '/images/grimoire/Gunner%27s%20Jacket.jpeg',
  'lore-item-augmented-suit': '/images/grimoire/OriginiumSuit.jpg',
  'lore-item-metal-armor': '/images/grimoire/HeavyStell%20III.jpg',
  'lore-item-advanced-vest': '/images/grimoire/OperatorMod.jpg',
  'lore-item-memory-chip': '/images/grimoire/Supendrive.jpg',
  'lore-item-nanobots-pill': '/images/grimoire/Enhanced%20Pills.png',
  'lore-item-pill-medbots': '/images/grimoire/Enhanced%20Pills.png',
  'lore-item-pill-regen': '/images/grimoire/Enhanced%20Pills.png',
  'lore-granada-emp': '/images/grimoire/Granada%20EMP.png',
  
  // Attachments
  'att-suppressor': '/images/grimoire/silenciador.png',
  
  // Armas
  'w-vapr-x': '/images/grimoire/Vapr-XKG_menu_icon_BO4.png',
  'w-scar': '/images/grimoire/Scar-h.png',
  'w-r3k': '/images/grimoire/R3K.png',
  'w-peacekeeper': '/images/grimoire/Peacekeeper_MK2_Gunsmith_model_BO3.png',
  'w-kn-74': '/images/grimoire/KN-44_Gunsmith_model_BO3.webp',
  'w-arm-a1': '/images/grimoire/ARM-A1.jpeg',
  'w-remington': '/images/grimoire/Remington_870_MCS_Cut_Icon_BO3.png',
  'w-cano-curto': '/images/grimoire/Cano%20Curto.png',
  'w-shotgun': '/images/grimoire/Shotgun.png',
  'w-dcm-8': '/images/grimoire/DCM-8.png',
  'w-mp5': '/images/grimoire/MP5.png',
  'w-vector': '/images/grimoire/vector.jpeg',
  'w-weevil': '/images/grimoire/Weevil.png',
  'w-sammy': '/images/grimoire/smart%20pistol.png',
  'w-2.8': '/images/grimoire/3.8.jpg', // ou 3oitao.png
  'w-emc': '/images/grimoire/EMC.png',
  'w-mozambique': '/images/grimoire/mozanbique.png', // Note o 'n' no arquivo
  'w-wingman': '/images/grimoire/Wingman.png',
  'w-kar-99': '/images/grimoire/Kar98K.png',
  'w-har': '/images/grimoire/HAR.jpg',
};

// ---------------------------------------------------------------------------
// GrimoireView — Endfield-style Master/Detail Layout
// ---------------------------------------------------------------------------
export const GrimoireView: React.FC = () => {
  const { dict } = useLocaleStore();
  const {
    weapons,
    attachments,
    ammunitions,
    classes,
    abilities,
    loreRules,
  } = useCompendiumStore();

  const { 
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    selectedEntryId, setSelectedEntryId,
    navHistory, setNavHistory
  } = useGrimoireStore();

  // =========================================================================
  // DATA INDEXING — Unify all datasets
  // =========================================================================
  const allEntries: UnifiedGrimoireEntry[] = useMemo(() => {
    const list: UnifiedGrimoireEntry[] = [];

    // 1. Classes
    (classes || []).forEach((cls) => {
      list.push({
        id: `cls-${cls.id}`,
        code: cls.code,
        category: 'classes',
        categoryLabel: 'Classes & Subclasses',
        title: cls.name,
        subtitle: cls.tagline,
        desc: cls.description,
        metric: `Dado: ${cls.hitDice} • ${cls.subclasses.length} subclasses`,
        tags: [cls.name, cls.keyStats, ...cls.subclasses.map((s) => s.name)],
        rawItem: { type: 'class', data: cls },
        hasSpecialContent: cls.subclasses.length > 0,
        imageUrl: IMAGE_ENRICHMENT_MAP[`cls-${cls.id}`],
      });
    });

    // 2. Habilidades de Classe
    (abilities || []).forEach((ab) => {
      list.push({
        id: ab.id,
        code: ab.code,
        category: 'habilidades',
        categoryLabel: 'Habilidades de Classe',
        title: ab.name,
        subtitle: `${ab.className} • ${ab.subclassName || 'Geral'} (Nível ${ab.level})`,
        desc: ab.summary,
        metric: `Ação: ${ab.actionCost} • Usos: ${ab.usageLimit}`,
        tags: [ab.name, ab.className, ab.subclassName || '', ab.actionCost, ...(ab.tags || [])],
        rawItem: { type: 'ability', data: ab },
        imageUrl: IMAGE_ENRICHMENT_MAP[ab.id],
      });
    });

    // 3. Armas
    (weapons || []).forEach((w) => {
      list.push({
        id: `w-${w.id}`,
        code: w.id.toUpperCase(),
        category: 'armas',
        categoryLabel: 'Armas',
        title: w.name,
        subtitle: `${w.type} (${w.size})`,
        desc: `Sweet Spot: ${w.sweetSpot}m. Rajada: ${w.burstRate}. Recarga: ${w.rechargeCost}.`,
        metric: `Dano: ${w.baseDamage} • SS: ${w.sweetSpot}m`,
        tags: [w.name, w.type, w.size, `${w.sweetSpot}m`],
        rawItem: { type: 'weapon', data: w },
        imageUrl: IMAGE_ENRICHMENT_MAP[`w-${w.id}`],
      });
    });

    // 4. Attachments & Ammunitions
    (attachments || []).forEach((att) => {
      let compatStr = 'Universal';
      if (!att.compatibility.all) {
        compatStr = Object.values(att.compatibility).flat().filter(Boolean).join(', ') || 'Específico';
      }
      list.push({
        id: `att-${att.id}`,
        code: att.category.toUpperCase().slice(0, 4),
        category: 'attachments',
        categoryLabel: 'Attachments & Munições',
        title: att.name,
        subtitle: `${att.category} (Slots: ${att.slots})`,
        desc: att.effect,
        metric: `Compat: ${compatStr} • ₵ ${att.price}`,
        tags: [att.name, att.category, att.effect],
        rawItem: { type: 'attachment', data: att },
      });
    });

    (ammunitions || []).forEach((ammo) => {
      list.push({
        id: `ammo-${ammo.type}`,
        code: 'AMMO',
        category: 'attachments',
        categoryLabel: 'Attachments & Munições',
        title: `Munição ${ammo.type}`,
        subtitle: ammo.bonusDamage ? `Dano Extra: ${ammo.bonusDamage}` : 'Calibre Padrão',
        desc: ammo.specialEffect || 'Projéteis balísticos convencionais.',
        metric: `₵ ${ammo.pricePerBullet} / bala`,
        tags: [ammo.type, 'Munição', ammo.bonusDamage || ''],
        rawItem: { type: 'ammo', data: ammo },
      });
    });

    // 5. Lore, Raças, Regras, Equipamentos, Regiões
    (loreRules || []).forEach((item) => {
      const catMap: Record<string, { cat: GrimoireCategory; label: string }> = {
        racas: { cat: 'racas', label: 'Raças' },
        regras: { cat: 'regras', label: 'Regras de Combate' },
        infecoes: { cat: 'infecoes', label: 'Infecções & Lore' },
        equipamentos: { cat: 'equipamentos', label: 'Equipamentos' },
        regioes: { cat: 'regioes', label: 'Regiões & Materiais' },
        materiais: { cat: 'regioes', label: 'Regiões & Materiais' },
        feats: { cat: 'feats', label: 'Feats & Talentos' },
        habilidades: { cat: 'habilidades', label: 'Habilidades Raciais' },
        veiculos: { cat: 'veiculos', label: 'Veículos' },
      };
            let mapped = catMap[item.category] || { cat: 'regras', label: 'Regras de Combate' };
      if (item.category === 'equipamentos') {
        if (item.subtitle.includes('Armadura')) {
          mapped = { cat: 'armaduras', label: 'Armaduras' };
        } else if (item.subtitle.includes('Implante Cibernético')) {
          mapped = { cat: 'ciberneticas', label: 'Cibernéticas' };
        } else if (item.subtitle.includes('Curas e Consumíveis')) {
          mapped = { cat: 'consumiveis', label: 'Consumíveis' };
        } else {
          mapped = { cat: 'equipamentos_gerais', label: 'Equipamentos Gerais' };
        }
      }

      list.push({
        id: `lore-${item.id}`,
        code: item.code,
        category: mapped.cat,
        categoryLabel: mapped.label,
        title: item.title,
        subtitle: item.subtitle,
        desc: item.summary,
        metric: (item.attributes && item.attributes[0]) ? `${item.attributes[0].label}: ${item.attributes[0].value}` : '',
        tags: [item.title, ...(item.tags || [])],
        rawItem: { type: 'lore_rule', data: item },
        hasSpecialContent: !!item.tableData,
        imageUrl: IMAGE_ENRICHMENT_MAP[`lore-${item.id}`],
      });
    });

    return list;
  }, [classes, abilities, weapons, attachments, ammunitions, loreRules]);

  // =========================================================================
  // CATEGORY TABS (with icons)
  // =========================================================================
  const categoryTabs: { id: GrimoireCategory; label: string; icon: LucideIcon }[] = useMemo(() => [
    { id: 'classes', label: 'Classes', icon: CATEGORY_ICONS.classes },
    { id: 'habilidades', label: 'Habilidades', icon: CATEGORY_ICONS.habilidades },
    { id: 'armas', label: 'Armas', icon: CATEGORY_ICONS.armas },
    { id: 'attachments', label: 'Attachments', icon: CATEGORY_ICONS.attachments },
    { id: 'racas', label: 'Raças', icon: CATEGORY_ICONS.racas },
    { id: 'armaduras', label: 'Armaduras', icon: CATEGORY_ICONS.armaduras },
    { id: 'ciberneticas', label: 'Cibernéticas', icon: CATEGORY_ICONS.ciberneticas },
    { id: 'consumiveis', label: 'Consumíveis', icon: CATEGORY_ICONS.consumiveis },
    { id: 'equipamentos_gerais', label: 'Equip. Geral', icon: CATEGORY_ICONS.equipamentos_gerais },
    { id: 'regras', label: 'Regras', icon: CATEGORY_ICONS.regras },
    { id: 'infecoes', label: 'Infecções', icon: CATEGORY_ICONS.infecoes },
    { id: 'regioes', label: 'Regiões', icon: CATEGORY_ICONS.regioes },
    { id: 'feats', label: 'Feats', icon: CATEGORY_ICONS.feats },
    { id: 'veiculos', label: 'Veículos', icon: CATEGORY_ICONS.veiculos },
  ], []);

  // =========================================================================
  // FILTERING — by active category + search
  // =========================================================================
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allEntries.filter((item) => {
      const matchCategory = item.category === activeCategory;
      if (!matchCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allEntries, activeCategory, searchQuery]);

  // Sidebar items derived from filteredEntries
  const sidebarItems: SidebarItem[] = useMemo(() => {
    return filteredEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      hasSpecialContent: entry.hasSpecialContent,
    }));
  }, [filteredEntries]);

  // =========================================================================
  // SELECTION & NAVIGATION
  // =========================================================================
  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return allEntries.find((e) => e.id === selectedEntryId) || null;
  }, [allEntries, selectedEntryId]);

  const handleSelectEntry = (id: string) => {
    setSelectedEntryId(id);
    setNavHistory([id]);
    tacticalAudio.playSelect();
  };

  const handleNavigateToEntry = (targetId: string) => {
    const cleanTargetId = targetId.trim();
    if (!cleanTargetId || cleanTargetId === selectedEntryId) return;

    // Find the target entry to switch category if needed
    const targetEntry = allEntries.find((e) => e.id === cleanTargetId);
    if (targetEntry && targetEntry.category !== activeCategory) {
      setActiveCategory(targetEntry.category);
    }

    const existingIdx = navHistory.indexOf(cleanTargetId);
    if (existingIdx !== -1) {
      setNavHistory(navHistory.slice(0, existingIdx + 1));
    } else {
      setNavHistory([...navHistory, cleanTargetId]);
    }

    setSelectedEntryId(cleanTargetId);
    tacticalAudio.playSelect();
  };

  const handleCloseAll = () => {
    setSelectedEntryId(null);
    setNavHistory([]);
    tacticalAudio.playSelect();
  };

  // Keyboard: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEntryId) {
        handleCloseAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntryId]);

  // =========================================================================
  // BREADCRUMBS
  // =========================================================================
  const breadcrumbSteps: BreadcrumbStep[] = useMemo(() => {
    const steps: BreadcrumbStep[] = [{ label: 'GRIMÓRIO' }];

    if (selectedEntry) {
      // If nav history has intermediate steps, show them
      if (navHistory.length > 1) {
        for (let i = 0; i < navHistory.length - 1; i++) {
          const hId = navHistory[i];
          const entry = allEntries.find((e) => e.id === hId);
          if (entry) {
            steps.push({ label: entry.title, entryId: entry.id });
          }
        }
      } else {
        steps.push({ label: selectedEntry.categoryLabel });
      }
      steps.push({ label: selectedEntry.title });
    } else {
      // No selection — show the active category
      const activeCat = categoryTabs.find(c => c.id === activeCategory);
      if (activeCat) {
        steps.push({ label: activeCat.label });
      }
    }

    return steps;
  }, [selectedEntry, navHistory, allEntries, activeCategory, categoryTabs]);

  const handleBreadcrumbNavigate = (step: BreadcrumbStep, index: number) => {
    if (index === 0) {
      // Click on "GRIMÓRIO" — clear selection
      handleCloseAll();
    } else if (step.entryId) {
      // Click on an intermediate step — navigate to it
      handleNavigateToEntry(step.entryId);
    } else {
      // Click on category label — clear selection but stay in category
      setSelectedEntryId(null);
      setNavHistory([]);
      tacticalAudio.playSelect();
    }
  };

  // =========================================================================
  // RENDER — Endfield-style Master/Detail Layout
  // =========================================================================
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* BREADCRUMB BAR — always visible */}
      <GrimoireBreadcrumb
        steps={breadcrumbSteps}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateToStep={handleBreadcrumbNavigate}
        onCloseAll={handleCloseAll}
      />

      {/* MAIN AREA — Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR — always visible */}
        <GrimoireSidebar
          categories={categoryTabs}
          activeCategory={activeCategory}
          items={sidebarItems}
          selectedId={selectedEntryId}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setSelectedEntryId(null);
            setNavHistory([]);
            setSearchQuery('');
            tacticalAudio.playSelect();
          }}
          onSelectItem={handleSelectEntry}
        />

        {/* CONTENT PANEL */}
        <GrimoireContentPanel
          item={selectedEntry?.rawItem ?? null}
          categoryLabel={selectedEntry?.categoryLabel ?? ''}
          imageUrl={selectedEntry?.imageUrl}
          onNavigateToEntry={handleNavigateToEntry}
        />
      </div>
    </div>
  );
};
