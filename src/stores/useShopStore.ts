import { create } from 'zustand';
import { useCharacterStore } from './useCharacterStore';
import { tacticalAudio } from '@/lib/audio';

export interface ShopProfile { id: string; name: string; availableItemIds: string[]; customPrices?: Record<string, number>; }

export interface CartItem {
  id: string; // unique id for the cart
  catalogId: string;
  name: string;
  price: number;
  type: 'weapon' | 'attachment' | 'ammo' | 'item' | 'armor';
  data: any;
}

interface ShopState {
  isOpen: boolean;
  shopName: string;
  availableItemIds: string[];
  cart: CartItem[];
  profiles: ShopProfile[];
  customPrices: Record<string, number>;
  
  fetchShopState: () => Promise<void>;
  setShopState: (name: string, itemIds: string[], open: boolean, profiles?: ShopProfile[], customPrices?: Record<string, number>) => Promise<void>;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  checkout: (characterId: string) => boolean;
}

export const useShopStore = create<ShopState>((set, get) => ({
  isOpen: false,
  shopName: 'Mercado Clandestino',
  availableItemIds: [],
  profiles: [],
  customPrices: {},
  cart: [],

  fetchShopState: async () => {
    try {
      const res = await fetch('/api/shop');
      if (res.ok) {
        const data = await res.json();
        set({ isOpen: data.isOpen, shopName: data.shopName, availableItemIds: data.availableItemIds, profiles: data.profiles || [], customPrices: data.customPrices || {} });
      }
    } catch (e) {
      console.error('Failed to fetch shop state:', e);
    }
  },

  setShopState: async (name, itemIds, open, profiles, customPrices) => {
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName: name, availableItemIds: itemIds, isOpen: open, profiles: profiles || get().profiles, customPrices: customPrices || get().customPrices }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ isOpen: data.isOpen, shopName: data.shopName, availableItemIds: data.availableItemIds, profiles: data.profiles || [], customPrices: data.customPrices || {} });
      }
    } catch (e) {
      console.error('Failed to set shop state:', e);
    }
  },

  addToCart: (item) => {
    set((state) => {
      // Limit cart size to 10 for safety/UI
      
      tacticalAudio.playSelect();
      return { cart: [...state.cart, { ...item, id: ('crypto' in globalThis && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substr(2, 9)) }] };
    });
  },

  removeFromCart: (index) => {
    set((state) => {
      const newCart = [...state.cart];
      newCart.splice(index, 1);
      tacticalAudio.playSelect();
      return { cart: newCart };
    });
  },

  clearCart: () => set({ cart: [] }),

  checkout: (characterId) => {
    const { cart } = get();
    if (cart.length === 0) return false;

    const charStore = useCharacterStore.getState();
    const char = charStore.characters.find(c => c.id === characterId);
    if (!char) return false;

    const totalCost = cart.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    if (char.credits < totalCost) {
      tacticalAudio.playAlert();
      return false;
    }

    const emptySlots = (char.inventory || Array(30).fill(null)).filter(i => i === null).length;
    if (emptySlots < cart.length) {
      tacticalAudio.playAlert();
      return false; // not enough space
    }

    // Deduct
    const originalActiveCharId = charStore.activeCharacterId;
    if (originalActiveCharId !== characterId) {
      charStore.selectCharacter(characterId);
    }
    
    charStore.updateCredits(-totalCost);
    cart.forEach(cartItem => {
      let weight = '1';
      if (cartItem.type === 'attachment') weight = '0.2';
      if (cartItem.type === 'ammo') weight = '0.5';
      let qty = 1;
      if (cartItem.type === 'ammo') qty = 30;

      charStore.addInventoryItem({
        name: cartItem.name,
        quantity: qty,
        weight,
        notes: '',
        type: cartItem.type,
        data: cartItem.data
      });
    });

    if (originalActiveCharId !== characterId) {
      charStore.selectCharacter(originalActiveCharId);
    }

    tacticalAudio.playWheelToggle(false); // Play success sound
    set({ cart: [] });
    return true;
  }
}));

// Helper function to extract price from any entity
export function getItemPrice(type: string, data: any): number | null {
  if (type === 'weapon') return data.cost || 0;
  if (type === 'attachment') return data.price || 0;
  if (type === 'ammo') return (data.pricePerBullet || 0) * 30; 
  if (data.summary) {
    const match = data.summary.match(/Preço:\s*(\d+)/i);
    if (match) return parseInt(match[1], 10);
  }
  return 0; // free if no price
}
