// VTT Application & Navigation Types

export type VTTView = 'characters' | 'grimoire' | 'map' | 'shop' | 'admin';

export type UserRole = 'gm' | 'player';

export type SupportedLocale = 'pt' | 'en';

export interface VTTNavigationItem {
  id: VTTView;
  index: number;
  labelKey: string;
  code: string;
  sectionCode: string;
  icon: 'user' | 'book' | 'map' | 'shop' | 'admin';
}

export interface SessionStatus {
  isConnected: boolean;
  pingMs: number;
  campaignName: string;
  sectorName: string;
  activeCombat: boolean;
  roundNumber?: number;
}
