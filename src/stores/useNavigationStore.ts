import { create } from 'zustand';
import { VTTView, VTTNavigationItem } from '@/types/vtt';

export const NAVIGATION_ITEMS: VTTNavigationItem[] = [
  {
    id: 'characters',
    index: 0,
    labelKey: 'navigation.characters',
    code: '01',
    sectionCode: 'navigation.characters_sec',
    icon: 'user',
  },
  {
    id: 'grimoire',
    index: 1,
    labelKey: 'navigation.grimoire',
    code: '02',
    sectionCode: 'navigation.grimoire_sec',
    icon: 'book',
  },
  {
    id: 'shop',
    index: 2,
    labelKey: 'navigation.shop',
    code: '03',
    sectionCode: 'navigation.shop_sec',
    icon: 'shop',
  },
  {
    id: 'map',
    index: 3,
    labelKey: 'navigation.map',
    code: '04',
    sectionCode: 'navigation.map_sec',
    icon: 'map',
  },
  {
    id: 'admin',
    index: 4,
    labelKey: 'navigation.admin',
    code: '05',
    sectionCode: 'navigation.admin_sec',
    icon: 'admin',
  },
];

interface NavigationState {
  activeView: VTTView;
  activeIndex: number;
  isCollapsed: boolean;
  selectView: (view: VTTView) => void;
  selectIndex: (index: number) => void;
  collapseWheel: () => void;
  expandWheel: () => void;
  toggleWheel: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeView: 'grimoire', // Initial default like prototype
  activeIndex: 1,
  isCollapsed: false,
  selectView: (view: VTTView) => {
    const item = NAVIGATION_ITEMS.find((i) => i.id === view);
    if (item) {
      set({ activeView: view, activeIndex: item.index });
    }
  },
  selectIndex: (index: number) => {
    const clampedIndex = Math.max(0, Math.min(NAVIGATION_ITEMS.length - 1, index));
    const item = NAVIGATION_ITEMS[clampedIndex];
    if (item) {
      set({ activeView: item.id, activeIndex: clampedIndex });
    }
  },
  collapseWheel: () => set({ isCollapsed: true }),
  expandWheel: () => set({ isCollapsed: false }),
  toggleWheel: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));
