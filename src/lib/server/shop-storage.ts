import fs from 'fs';
import path from 'path';

export interface ShopProfile {
  id: string;
  name: string;
  availableItemIds: string[];
  customPrices?: Record<string, number>;
}

export interface ShopConfig {
  isOpen: boolean;
  shopName: string;
  availableItemIds: string[];
  profiles: ShopProfile[];
  customPrices?: Record<string, number>;
}

const DEFAULT_SHOP: ShopConfig = {
  isOpen: false,
  shopName: 'Mercado Clandestino',
  availableItemIds: [],
  profiles: [],
  customPrices: {},
};

export function getShopStoragePath() {
  return path.join(process.cwd(), 'src', 'data', 'compendium', 'shop-state.json');
}

export function readShopState(): ShopConfig {
  try {
    const file = getShopStoragePath();
    if (!fs.existsSync(file)) {
      return DEFAULT_SHOP;
    }
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    return { ...DEFAULT_SHOP, ...data };
  } catch (error) {
    console.error('Failed to read shop state:', error);
    return DEFAULT_SHOP;
  }
}

export function writeShopState(state: ShopConfig) {
  try {
    const file = getShopStoragePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to write shop state:', error);
  }
}
