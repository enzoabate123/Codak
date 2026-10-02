import { create } from 'zustand';
import { WEAPONS_CATALOG } from '@/data/weapons-catalog';
import { WEAPON_IDEAL_RANGES, Weapon } from '@/types/codak-rules';

export type GridType = 'square' | 'hex';
export type GridScaleMeters = 1.5 | 2.0 | 3.0;

export interface MapToken {
  id: string;
  name: string;
  code: string;
  type: 'player' | 'npc' | 'hostile';
  x: number;
  y: number;
  sizeInCells: number;
  color: string;
  hpCurrent: number;
  hpMax: number;
  armorClass: number;
  speedMeters: number;
  equippedWeaponId: string;
  elevation: number; // 0 = ground, 1 = elevated, etc.
}

export interface TargetingEvaluation {
  distanceMeters: number;
  distanceCells: number;
  isSweetSpot: boolean;
  isIdealRange: boolean;
  isDisadvantage: boolean;
  weapon: Weapon | null;
  sweetSpotBonusDamage: string;
}

interface MapState {
  // Viewport
  stageScale: number;
  stagePos: { x: number; y: number };

  // Grid
  gridType: GridType;
  cellSize: number; // 50px default
  cellMeters: GridScaleMeters; // 2.0m default
  gridVisible: boolean;
  fogEnabled: boolean;

  // Tokens
  tokens: MapToken[];
  selectedTokenId: string | null;
  targetedTokenId: string | null;

  // Action Economy of active turn
  roundNumber: number;
  hasAction: boolean;
  hasBonusAction: boolean;
  hasMovementAction: boolean;
  hasReaction: boolean;
  movementRemainingMeters: number;

  // Actions
  setStageScale: (scale: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setGridType: (type: GridType) => void;
  setCellMeters: (scale: GridScaleMeters) => void;
  toggleGridVisible: () => void;
  toggleFog: () => void;

  selectToken: (id: string | null) => void;
  targetToken: (id: string | null) => void;
  updateTokenPosition: (id: string, x: number, y: number) => void;
  addToken: (token: Omit<MapToken, 'id'>) => void;
  removeToken: (id: string) => void;

  // Combat Actions
  spendAction: (slot: 'ACTION' | 'BONUS_ACTION' | 'MOVEMENT_ACTION' | 'REACTION') => void;
  resetTurn: () => void;
  deductMovement: (distanceMeters: number) => void;

  // Calculation helpers
  getTargetingEvaluation: () => TargetingEvaluation | null;
}

const INITIAL_TOKENS: MapToken[] = [
  {
    id: 'tok-aerys',
    name: 'Aerys Vance',
    code: 'AE',
    type: 'player',
    x: 250,
    y: 350,
    sizeInCells: 1,
    color: '#ef4444',
    hpCurrent: 48,
    hpMax: 48,
    armorClass: 16,
    speedMeters: 9,
    equippedWeaponId: 'kar-99', // Kar-99 Sweet spot is 32m!
    elevation: 0,
  },
  {
    id: 'tok-kaelen',
    name: 'Kaelen Riggs',
    code: 'KL',
    type: 'player',
    x: 400,
    y: 450,
    sizeInCells: 1,
    color: '#06b6d4',
    hpCurrent: 36,
    hpMax: 36,
    armorClass: 14,
    speedMeters: 9,
    equippedWeaponId: 'vector', // Vector Sweet spot is 7m
    elevation: 0,
  },
  {
    id: 'tok-lyra',
    name: 'Lyra Sol',
    code: 'LY',
    type: 'player',
    x: 200,
    y: 500,
    sizeInCells: 1,
    color: '#3b82f6',
    hpCurrent: 42,
    hpMax: 42,
    armorClass: 15,
    speedMeters: 9,
    equippedWeaponId: 'scar',
    elevation: 0,
  },
  {
    id: 'tok-hostile-1',
    name: 'Titã de Obsidiana Corrompido',
    code: 'TO',
    type: 'hostile',
    x: 1050, // 800px away from Aerys = 16 cells * 2m = 32m (Exact Sweet Spot!)
    y: 350,
    sizeInCells: 2,
    color: '#f59e0b',
    hpCurrent: 95,
    hpMax: 95,
    armorClass: 18,
    speedMeters: 6,
    equippedWeaponId: 'har',
    elevation: 0,
  },
  {
    id: 'tok-hostile-2',
    name: 'Infectado 115 Rastejante',
    code: 'I1',
    type: 'hostile',
    x: 650,
    y: 200,
    sizeInCells: 1,
    color: '#ef4444',
    hpCurrent: 28,
    hpMax: 28,
    armorClass: 12,
    speedMeters: 12,
    equippedWeaponId: 'shotgun',
    elevation: 0,
  },
];

export const useMapStore = create<MapState>((set, get) => ({
  stageScale: 0.9,
  stagePos: { x: 50, y: 30 },

  gridType: 'square',
  cellSize: 50,
  cellMeters: 2.0,
  gridVisible: true,
  fogEnabled: true,

  tokens: INITIAL_TOKENS,
  selectedTokenId: 'tok-aerys', // Aerys selected by default
  targetedTokenId: 'tok-hostile-1', // Targeting the Titan at 32m (Sweet Spot!)

  roundNumber: 1,
  hasAction: true,
  hasBonusAction: true,
  hasMovementAction: true,
  hasReaction: true,
  movementRemainingMeters: 9,

  setStageScale: (scale) => set({ stageScale: Math.max(0.2, Math.min(3.0, scale)) }),
  setStagePos: (pos) => set({ stagePos: pos }),
  setGridType: (type) => set({ gridType: type }),
  setCellMeters: (scale) => set({ cellMeters: scale }),
  toggleGridVisible: () => set((state) => ({ gridVisible: !state.gridVisible })),
  toggleFog: () => set((state) => ({ fogEnabled: !state.fogEnabled })),

  selectToken: (id) => {
    const token = get().tokens.find((t) => t.id === id);
    set({
      selectedTokenId: id,
      movementRemainingMeters: token ? token.speedMeters : 9,
    });
  },

  targetToken: (id) => set({ targetedTokenId: id }),

  updateTokenPosition: (id, x, y) => {
    const { tokens, cellSize, cellMeters, selectedTokenId, movementRemainingMeters } = get();
    const token = tokens.find((t) => t.id === id);
    if (!token) return;

    // Calculate movement distance
    const distPx = Math.hypot(x - token.x, y - token.y);
    const distMeters = Math.round((distPx / cellSize) * cellMeters * 10) / 10;

    // Deduct movement if this is the selected player token
    let remaining = movementRemainingMeters;
    if (id === selectedTokenId) {
      remaining = Math.max(0, Math.round((movementRemainingMeters - distMeters) * 10) / 10);
    }

    set({
      tokens: tokens.map((t) => (t.id === id ? { ...t, x, y } : t)),
      movementRemainingMeters: remaining,
      hasMovementAction: remaining > 0,
    });
  },

  addToken: (tokenData) => {
    const id = `tok-${Date.now()}`;
    set((state) => ({
      tokens: [...state.tokens, { ...tokenData, id }],
    }));
  },

  removeToken: (id) => {
    set((state) => ({
      tokens: state.tokens.filter((t) => t.id !== id),
      selectedTokenId: state.selectedTokenId === id ? null : state.selectedTokenId,
      targetedTokenId: state.targetedTokenId === id ? null : state.targetedTokenId,
    }));
  },

  spendAction: (slot) => {
    if (slot === 'ACTION') set({ hasAction: false });
    if (slot === 'BONUS_ACTION') set({ hasBonusAction: false });
    if (slot === 'MOVEMENT_ACTION') set({ hasMovementAction: false, movementRemainingMeters: 0 });
    if (slot === 'REACTION') set({ hasReaction: false });
  },

  resetTurn: () => {
    const { selectedTokenId, tokens } = get();
    const token = tokens.find((t) => t.id === selectedTokenId);
    set((state) => ({
      roundNumber: state.roundNumber + 1,
      hasAction: true,
      hasBonusAction: true,
      hasMovementAction: true,
      hasReaction: true,
      movementRemainingMeters: token ? token.speedMeters : 9,
    }));
  },

  deductMovement: (dist) => {
    set((state) => {
      const next = Math.max(0, state.movementRemainingMeters - dist);
      return {
        movementRemainingMeters: next,
        hasMovementAction: next > 0,
      };
    });
  },

  getTargetingEvaluation: () => {
    const { selectedTokenId, targetedTokenId, tokens, cellSize, cellMeters } = get();
    if (!selectedTokenId || !targetedTokenId || selectedTokenId === targetedTokenId) {
      return null;
    }

    const shooter = tokens.find((t) => t.id === selectedTokenId);
    const target = tokens.find((t) => t.id === targetedTokenId);
    if (!shooter || !target) return null;

    const distPx = Math.hypot(target.x - shooter.x, target.y - shooter.y);
    const distanceCells = Math.round((distPx / cellSize) * 10) / 10;
    const distanceMeters = Math.round(distanceCells * cellMeters * 10) / 10;

    const weapon = WEAPONS_CATALOG.find((w) => w.id === shooter.equippedWeaponId) || WEAPONS_CATALOG[0];
    const idealRange = WEAPON_IDEAL_RANGES[weapon.type] || { min: 10, max: 30 };

    const isSweetSpot = Math.abs(distanceMeters - weapon.sweetSpot) <= 1.0;
    const isIdealRange = distanceMeters >= idealRange.min && distanceMeters <= idealRange.max;
    const isDisadvantage = !isIdealRange && !isSweetSpot;

    return {
      distanceMeters,
      distanceCells,
      isSweetSpot,
      isIdealRange,
      isDisadvantage,
      weapon,
      sweetSpotBonusDamage: weapon.sweetSpotBonusDamage,
    };
  },
}));
