export interface Point { x: number; y: number }
export interface Hex { q: number; r: number }
export type ActionKind = 'movement' | 'main' | 'bonus';
export interface TacticalToken {
  id: string; name: string; kind: 'player' | 'npc' | 'hostile'; ownerId: string | null; characterId: string | null;
  q: number; r: number; elevation: number; vision: number; color: string; initiative: number; hp: number; maxHp: number; image?: string;
}
export interface TacticalWall { id: string; a: Point; b: Point; height: number; blocksMovement: boolean; blocksVision: boolean }
export interface TacticalTerrain { id: string; q: number; r: number; elevation: number }
export interface TacticalDrawing { id: string; ownerId: string; kind: 'freehand' | 'line' | 'circle' | 'cone' | 'rectangle' | 'ping'; points: Point[]; color: string; createdAt: number }
export interface TacticalEnvironment { name: string; biome: string; temperature: string; time: string; notes: string; visible: string[] }
export interface TacticalCombat {
  active: boolean; round: number; order: string[]; index: number;
  actions: Record<string, { movement: boolean; main: boolean; bonus: boolean }>;
  log: Array<{ id: string; tokenId: string; kind: ActionKind | 'roll'; text: string; at: number }>;
}
export interface TacticalScene {
  id: string; name: string; image: string | null; width: number; height: number; hexSize: number; grid: boolean; fog: boolean;
  environment: TacticalEnvironment; tokens: TacticalToken[]; walls: TacticalWall[]; terrain: TacticalTerrain[]; drawings: TacticalDrawing[]; combat: TacticalCombat;
}
export interface TacticalView {
  revision: number; activeSceneId: string | null; scenes: Array<{ id: string; name: string }>; scene: TacticalScene | null;
  visibleCells: string[]; exploredCells: string[]; self: { id: string; role: 'admin' | 'player' };
}
export type TacticalCommand =
  | { type: 'createScene'; name: string }
  | { type: 'updateScene'; patch: Partial<Pick<TacticalScene, 'name' | 'hexSize' | 'grid' | 'fog' | 'environment'>> }
  | { type: 'setImage'; image: string; width: number; height: number }
  | { type: 'publishScene' }
  | { type: 'deleteScene' }
  | { type: 'addToken'; token: Pick<TacticalToken, 'name' | 'kind' | 'q' | 'r'> & Partial<Omit<TacticalToken, 'id' | 'name' | 'kind' | 'q' | 'r'>> }
  | { type: 'moveToken'; tokenId: string; q: number; r: number }
  | { type: 'updateToken'; tokenId: string; patch: Partial<Pick<TacticalToken, 'name' | 'ownerId' | 'vision' | 'elevation' | 'initiative' | 'hp' | 'maxHp' | 'color'>> }
  | { type: 'removeToken'; tokenId: string }
  | { type: 'addWall'; wall: Omit<TacticalWall, 'id'> }
  | { type: 'updateWall'; id: string; patch: { a?: Point; b?: Point; height?: number; blocksMovement?: boolean; blocksVision?: boolean } }
  | { type: 'removeWall'; id: string }
  | { type: 'setTerrain'; q: number; r: number; elevation: number }
  | { type: 'addDrawing'; drawing: Pick<TacticalDrawing, 'kind' | 'points' | 'color'> }
  | { type: 'removeDrawing'; id: string }
  | { type: 'clearDrawings' }
  | { type: 'startCombat' }
  | { type: 'stopCombat' }
  | { type: 'nextTurn' }
  | { type: 'setOrder'; order: string[] }
  | { type: 'declareAction'; tokenId: string; kind: ActionKind; text: string }
  | { type: 'restoreAction'; tokenId: string; kind: ActionKind }
  | { type: 'roll'; tokenId: string; formula: string; label: string }
  | { type: 'reveal'; cells: string[] };
