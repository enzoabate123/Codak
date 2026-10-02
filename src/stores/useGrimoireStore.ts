import { create } from 'zustand';
import { GrimoireCategory } from '@/components/grimoire/GrimoireSidebar';

interface GrimoireState {
  activeCategory: GrimoireCategory;
  searchQuery: string;
  selectedEntryId: string | null;
  navHistory: string[];

  setActiveCategory: (cat: GrimoireCategory) => void;
  setSearchQuery: (query: string) => void;
  setSelectedEntryId: (id: string | null) => void;
  setNavHistory: (history: string[]) => void;
  reset: () => void;
}

export const useGrimoireStore = create<GrimoireState>((set) => ({
  activeCategory: 'classes',
  searchQuery: '',
  selectedEntryId: null,
  navHistory: [],

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedEntryId: (id) => set({ selectedEntryId: id }),
  setNavHistory: (history) => set({ navHistory: history }),
  reset: () => set({
    activeCategory: 'classes',
    searchQuery: '',
    selectedEntryId: null,
    navHistory: [],
  })
}));
