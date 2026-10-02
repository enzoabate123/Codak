'use client';

import React, { useRef, useEffect } from 'react';
import { Users, Zap, Package, Shield as LucideShield, Crosshair, Settings, Dna, Swords, Bug, Shield, MapPin, Award, Car, LucideIcon } from 'lucide-react';
import { tacticalAudio } from '@/lib/audio';

export type GrimoireCategory = 
  | 'classes' 
  | 'habilidades'
  | 'armas' 
  | 'attachments' 
  | 'racas' 
  | 'regras' 
  | 'infecoes' 
  | 'armaduras'
  | 'ciberneticas'
  | 'consumiveis'
  | 'equipamentos_gerais'
  | 'equipamentos' 
  | 'regioes'
  | 'feats'
  | 'veiculos';

export interface SidebarItem {
  id: string;
  title: string;
  hasSpecialContent?: boolean; // show diamond indicator
}

export interface GrimoireSidebarProps {
  categories: { id: GrimoireCategory; label: string; icon: LucideIcon }[];
  activeCategory: GrimoireCategory;
  items: SidebarItem[];
  selectedId: string | null;
  onSelectCategory: (cat: GrimoireCategory) => void;
  onSelectItem: (id: string) => void;
}

export const CATEGORY_ICONS: Record<GrimoireCategory, LucideIcon> = {
  classes: Users,
  habilidades: Zap,
  armas: Crosshair,
  attachments: Settings,
  racas: Dna,
  regras: Swords,
  infecoes: Bug,
  equipamentos: Shield,
  armaduras: Shield,
  ciberneticas: Zap,
  consumiveis: Dna,
  equipamentos_gerais: Settings,
  regioes: MapPin,
  feats: Award,
  veiculos: Car,
};

export const GrimoireSidebar: React.FC<GrimoireSidebarProps> = ({
  categories,
  activeCategory,
  items,
  selectedId,
  onSelectCategory,
  onSelectItem,
}) => {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedId, activeCategory]);

  return (
    <div className="grimoire-sidebar">
      {/* Category Icon Tabs Bar */}
      <div className="grimoire-icon-tabs">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              className={`grimoire-icon-tab ${isActive ? 'grimoire-icon-tab--active' : ''}`}
              onClick={() => {
                tacticalAudio.playSelect();
                onSelectCategory(cat.id);
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
              title={cat.label}
            >
              <Icon size={16} />
              <span className="grimoire-icon-tab-label">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Item List */}
      <div className="grimoire-item-list">
        {items.map((item, idx) => {
          const isSelected = selectedId === item.id;

          return (
            <button
              key={item.id}
              ref={isSelected ? selectedRef : null}
              className={`grimoire-sidebar-item sidebar-cascade-item ${isSelected ? 'grimoire-sidebar-item--active' : ''}`}
              style={{ '--item-idx': idx } as React.CSSProperties}
              onClick={() => {
                tacticalAudio.playSelect();
                onSelectItem(item.id);
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
            >
              <span>{item.title}</span>
              {item.hasSpecialContent && (
                <span className="grimoire-sidebar-item-indicator diamond-pulse">◆</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
