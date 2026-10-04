import type { Hex, Point, TacticalScene, TacticalView, TacticalCommand, TacticalToken, TacticalEnvironment, ActionKind } from '../types/tactical-map';

export class TacticalError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.name = 'TacticalError'; this.status = status; }
}
export type TacticalSelf = TacticalView['self'];
// Calibration in meters: map scale lives in scene.hexSize; every hop is 1 m.
export const TACTICAL_EYE_HEIGHT_METERS = 1.6;
export const TACTICAL_MAX_PLAYER_STEP_METERS = 1;
export interface TacticalDatabase {
  version: 1; revision: number; activeSceneId: string | null; scenes: TacticalScene[];
  explored: Record<string, Record<string, string[]>>; revealed: Record<string, string[]>;
}
export interface TacticalContext {
  id?: () => string; now?: () => number; rollDie?: (sides: number) => number;
  characters?: Array<{ id: string; userId: string }>; userIds?: string[];
}
export function emptyTacticalDatabase(): TacticalDatabase { return { version: 1, revision: 0, activeSceneId: null, scenes: [], explored: {}, revealed: {} }; }
const bad = (message: string): never => { throw new TacticalError(400, message); };
const conflict = (message: string): never => { throw new TacticalError(409, message); };
function gm(self: TacticalSelf): void { if (self.role !== 'admin') throw new TacticalError(403, 'Somente o mestre.'); }
function auth(self: TacticalSelf): void { if (!self?.id || !['admin','player'].includes(self.role)) throw new TacticalError(401, 'Sessão inválida.'); }
function record(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return bad('Objeto inválido.');
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).some(key => !allowed.includes(key))) return bad('Campo não permitido.');
  return obj;
}
function text(value: unknown, max = 120, empty = false): string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return bad('Texto inválido.');
  return value.trim();
}
function number(value: unknown, min = -100000, max = 100000, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) return bad('Número fora dos limites.');
  return value;
}
function bool(value: unknown): boolean { if (typeof value !== 'boolean') return bad('Booleano inválido.'); return value; }
function coord(value: unknown): number { return number(value, -10000, 10000, true); }
function color(value: unknown): string { if (typeof value !== 'string' || !/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(value)) return bad('Cor inválida.'); return value; }
function nullableId(value: unknown): string | null { return value === null ? null : text(value); }
function environment(value: unknown): TacticalEnvironment {
  const keys = ['name','biome','temperature','time','notes'];
  const obj = record(value, [...keys,'visible']);
  for (const key of keys) text(obj[key], key === 'notes' ? 4000 : 200, true);
  if (!Array.isArray(obj.visible) || obj.visible.some(key => !keys.includes(key))) return bad('Metadados visíveis inválidos.');
  return { name: obj.name as string, biome: obj.biome as string, temperature: obj.temperature as string, time: obj.time as string, notes: obj.notes as string, visible: Array.from(new Set(obj.visible as string[])) };
}
function selectedScene(db: TacticalDatabase, self: TacticalSelf, sceneId?: string): TacticalScene | null {
  auth(self);
  if (sceneId && self.role !== 'admin' && sceneId !== db.activeSceneId) throw new TacticalError(403, 'Mapa não publicado.');
  const id = sceneId || db.activeSceneId || (self.role === 'admin' ? db.scenes.at(-1)?.id : null);
  if (!id) return null;
  return db.scenes.find(s => s.id === id) || conflict('Mapa inexistente.');
}
function blankScene(id: string, name: string): TacticalScene {
  return { id, name, image: null, width: 1600, height: 1200, hexSize: 40, grid: true, fog: true,
    environment: { name: '', biome: '', temperature: '', time: '', notes: '', visible: [] }, tokens: [], walls: [], terrain: [], drawings: [],
    combat: { active: false, round: 0, order: [], index: 0, actions: {}, log: [] } };
}
export function buildTacticalView(db: TacticalDatabase, self: TacticalSelf, sceneId?: string): TacticalView {
  const original = selectedScene(db,self,sceneId);
  const scene = original ? structuredClone(original) : null;
  const visibility = original ? visibilityFor(db,original,self) : { visible: new Set<string>(), explored: new Set<string>() };
  if (scene && original && self.role !== 'admin') {

    const explored = (hex: Hex) => !scene.fog || visibility.explored.has(hexKey(hex));
    const observers = scene.tokens.filter(t => t.kind === 'player' && t.ownerId === self.id);
    scene.tokens = scene.tokens.filter(t => (t.kind === 'player' && t.ownerId === self.id) || !scene.fog || observers.some(o => hexDistance(o,t) <= o.vision && hasLineOfSight(original,o,t)));
    scene.walls = scene.walls.filter(w => !scene.fog || segmentKnown(w.a,w.b,scene.hexSize,explored));
    scene.terrain = scene.terrain.filter(explored);
    scene.drawings = scene.drawings.filter(d => !scene.fog || d.ownerId === self.id || drawingKnown(d,scene.hexSize,explored));
    const metadata: Record<string, unknown> = { visible: [...scene.environment.visible] };
    for (const key of scene.environment.visible) metadata[key] = scene.environment[key as keyof TacticalEnvironment];
    scene.environment = metadata as unknown as TacticalEnvironment;
    const allowed = new Set(scene.tokens.map(t => t.id));
    const current = scene.combat.order[scene.combat.index];
    scene.combat.order = scene.combat.order.filter(id => allowed.has(id));
    scene.combat.index = scene.combat.order.indexOf(current);
    scene.combat.actions = Object.fromEntries(Object.entries(scene.combat.actions).filter(([id]) => allowed.has(id)));
    scene.combat.log = scene.combat.log.filter(entry => allowed.has(entry.tokenId));
    if (scene.image) scene.image = `/api/tactical-map/image?sceneId=${encodeURIComponent(scene.id)}&revision=${db.revision}`;
  }
  return { revision: db.revision, activeSceneId: db.activeSceneId,
    scenes: db.scenes.filter(s => self.role === 'admin' || s.id === db.activeSceneId).map(({id,name}) => ({id,name})),
    scene, visibleCells: Array.from(visibility.visible).sort(), exploredCells: Array.from(visibility.explored).sort(), self: { id: self.id, role: self.role } };
}
export function applyCommand(input: TacticalDatabase, self: TacticalSelf, value: unknown, sceneId?: string, ctx: TacticalContext = {}): TacticalDatabase {
  auth(self);
  const raw = record(value, ['type','name','patch','image','width','height','token','tokenId','q','r','wall','id','elevation','drawing','order','kind','text','formula','label','cells']);
  const command = raw as unknown as TacticalCommand;
  const db = structuredClone(input);
  const id = () => ctx.id?.() || crypto.randomUUID();
  if (command.type === 'createScene') {
    record(raw, ['type','name']); gm(self);
    if (db.scenes.length >= 32) conflict('Limite de mapas atingido.');
    db.scenes.push(blankScene(id(), text(command.name)));
  } else {
    const scene = selectedScene(db,self,sceneId) || conflict('Crie um mapa primeiro.');
    switch (command.type) {
      case 'publishScene': record(raw,['type']); gm(self); db.activeSceneId = scene.id; break;
      case 'deleteScene':
        record(raw,['type']); gm(self);
        if (scene.id === db.activeSceneId) conflict('Publique outro mapa antes de excluir este.');
        db.scenes = db.scenes.filter(s => s.id !== scene.id); delete db.explored[scene.id]; delete db.revealed[scene.id]; break;
      case 'updateScene': {
        record(raw,['type','patch']); gm(self);
        const patch = record(command.patch,['name','hexSize','grid','fog','environment']);
        if (patch.name !== undefined) scene.name = text(patch.name);
        if (patch.hexSize !== undefined) scene.hexSize = number(patch.hexSize, 8, 200);
        if (patch.grid !== undefined) scene.grid = bool(patch.grid);
        if (patch.fog !== undefined) scene.fog = bool(patch.fog);
        if (patch.environment !== undefined) scene.environment = environment(patch.environment);
        break;
      }
      case 'setImage': {
        record(raw,['type','image','width','height']); gm(self);
        const raster = validateRaster(command.image);
        number(command.width,1,8192,true); number(command.height,1,8192,true);
        if ((raster.width !== undefined && command.width !== raster.width) || (raster.height !== undefined && command.height !== raster.height) || command.width*command.height > 20000000) bad('Dimensões divergentes.');
        scene.image = command.image; scene.width = command.width; scene.height = command.height;
        // Image replacement defines a new exploration surface.
        delete db.explored[scene.id]; delete db.revealed[scene.id];
        break;
      }
      case 'addToken': {
        record(raw,['type','token']); gm(self);
        const t = record(command.token,['name','kind','ownerId','characterId','q','r','elevation','vision','color','initiative','hp','maxHp','image']);
        if (!['player','npc','hostile'].includes(t.kind as string)) bad('Tipo de token inválido.');
        if (scene.tokens.length >= 128) conflict('Limite de tokens atingido.');
        const characterId = t.characterId === undefined ? null : nullableId(t.characterId);
        const character = characterId ? ctx.characters?.find(c => c.id === characterId) : null;
        if (characterId && !character) bad('Personagem inexistente.');
        const ownerId = character ? character.userId : t.ownerId === undefined ? null : nullableId(t.ownerId);
        if (ownerId && ctx.userIds && !ctx.userIds.includes(ownerId)) bad('Proprietário inexistente.');
        const maxHp = t.maxHp === undefined ? 1 : number(t.maxHp,1,100000,true);
        const token: TacticalToken = { id: id(), name: text(t.name), kind: t.kind as TacticalToken['kind'], characterId, ownerId,
          q: coord(t.q), r: coord(t.r), elevation: t.elevation === undefined ? 0 : number(t.elevation,-1000,1000),
          vision: t.vision === undefined ? 12 : number(t.vision,0,40), color: t.color === undefined ? '#22c55e' : color(t.color),
          initiative: t.initiative === undefined ? 0 : number(t.initiative,-1000,1000),
          hp: t.hp === undefined ? maxHp : number(t.hp,0,maxHp,true), maxHp };
        if (t.image !== undefined) { validateRaster(t.image, 1024 * 1024); token.image = t.image as string; }
        scene.tokens.push(token); break;
      }
      case 'updateToken': {
        record(raw,['type','tokenId','patch']); gm(self);
        const token = findToken(scene,command.tokenId);
        const p = record(command.patch,['name','ownerId','vision','elevation','initiative','hp','maxHp','color']);
        if (p.name !== undefined) token.name = text(p.name);
        if (p.ownerId !== undefined) {
          const owner = nullableId(p.ownerId);
          const character = token.characterId ? ctx.characters?.find(c => c.id === token.characterId) : null;
          if (token.characterId && (!character || owner !== character.userId)) bad('Proprietário definido pela ficha.');
          if (owner && ctx.userIds && !ctx.userIds.includes(owner)) bad('Proprietário inexistente.');
          token.ownerId = owner;
        }
        if (p.vision !== undefined) token.vision = number(p.vision,0,40);
        if (p.elevation !== undefined) token.elevation = number(p.elevation,-1000,1000);
        if (p.initiative !== undefined) token.initiative = number(p.initiative,-1000,1000);
        if (p.maxHp !== undefined) token.maxHp = number(p.maxHp,1,100000,true);
        if (p.hp !== undefined) token.hp = number(p.hp,0,token.maxHp,true);
        token.hp = Math.min(token.hp,token.maxHp);
        if (p.color !== undefined) token.color = color(p.color);
        break;
      }
      case 'removeToken': {
        record(raw,['type','tokenId']); gm(self); findToken(scene,command.tokenId);
        scene.tokens = scene.tokens.filter(t => t.id !== command.tokenId);
        break;
      }
      case 'moveToken': {
        record(raw,['type','tokenId','q','r']);
        const token = findToken(scene,command.tokenId); own(self,token);
        const to = { q: coord(command.q), r: coord(command.r) };
        if (self.role !== 'admin') {
          currentTurn(scene,token.id);
          const path = hexLine(token,to,200);
          for (let i=1;i<path.length;i++) {
            const from = path[i-1], dest = path[i];
            if (Math.abs(terrainHeight(scene,from)-terrainHeight(scene,dest)) > TACTICAL_MAX_PLAYER_STEP_METERS) conflict('Desnível maior que 1 m.');
            const a = hexToPoint(from,scene.hexSize), b = hexToPoint(dest,scene.hexSize);
            for (const wall of scene.walls) {
              if (wall.blocksMovement && wall.height > token.elevation && segmentsIntersect(a,b,wall.a,wall.b)) conflict('Movimento bloqueado por parede.');
            }
          }
        }
        token.q = to.q; token.r = to.r; break;
      }
      case 'addWall': {
        record(raw,['type','wall']); gm(self);
        const w = record(command.wall,['a','b','height','blocksMovement','blocksVision']);
        const a = point(w.a), b = point(w.b);
        if (Math.hypot(a.x-b.x,a.y-b.y) < 0.01) bad('Parede sem comprimento.');
        if (scene.walls.length >= 256) conflict('Limite de paredes atingido.');
        scene.walls.push({ id: id(), a, b, height: number(w.height,0,1000), blocksMovement: bool(w.blocksMovement), blocksVision: bool(w.blocksVision) }); break;
      }
      case 'updateWall': {
        record(raw,['type','id','patch']); gm(self);
        const wallId = text(command.id);
        const wall = scene.walls.find(w => w.id === wallId) || conflict('Parede inexistente.');
        const p = record(command.patch,['a','b','height','blocksMovement','blocksVision']);
        const a = p.a === undefined ? wall.a : point(p.a), b = p.b === undefined ? wall.b : point(p.b);
        if (Math.hypot(a.x-b.x,a.y-b.y) < 0.01) bad('Parede sem comprimento.');
        const height = p.height === undefined ? wall.height : number(p.height,0,1000);
        const blocksMovement = p.blocksMovement === undefined ? wall.blocksMovement : bool(p.blocksMovement);
        const blocksVision = p.blocksVision === undefined ? wall.blocksVision : bool(p.blocksVision);
        Object.assign(wall,{a,b,height,blocksMovement,blocksVision}); break;
      }
      case 'removeWall': {
        record(raw,['type','id']); gm(self); const wallId = text(command.id);
        if (!scene.walls.some(w => w.id === wallId)) conflict('Parede inexistente.');
        scene.walls = scene.walls.filter(w => w.id !== wallId); break;
      }
      case 'setTerrain': {
        record(raw,['type','q','r','elevation']); gm(self);
        const q = coord(command.q), r = coord(command.r), elevation = number(command.elevation,-1000,1000);
        const old = scene.terrain.find(t => t.q === q && t.r === r);
        scene.terrain = scene.terrain.filter(t => t !== old);
        if (elevation !== 0) {
          if (scene.terrain.length >= 10000) conflict('Limite de terreno atingido.');
          scene.terrain.push({id: old?.id || id(),q,r,elevation});
        }
        break;
      }
      case 'reveal': {
        record(raw,['type','cells']); gm(self);
        if (!Array.isArray(command.cells) || command.cells.length > 10000) bad('Células inválidas.');
        const cells = command.cells.map(parseHexKey).map(hexKey);
        db.revealed[scene.id] = Array.from(new Set([...(db.revealed[scene.id] || []),...cells]));
        if (db.revealed[scene.id].length > 100000) conflict('Limite de exploração atingido.');
        break;
      }
      case 'addDrawing': {
        record(raw,['type','drawing']);
        const d=record(command.drawing,['kind','points','color']);
        if (!['freehand','line','circle','cone','rectangle','ping'].includes(d.kind as string)) bad('Desenho inválido.');
        if (!Array.isArray(d.points) || d.points.length < (d.kind === 'ping' ? 1 : 2) || d.points.length > 1000 || (d.kind !== 'freehand' && d.points.length !== (d.kind === 'ping' ? 1 : 2))) bad('Pontos inválidos.');
        if (scene.drawings.length >= 512) conflict('Limite de desenhos atingido.');
        scene.drawings.push({id:id(),ownerId:self.id,kind:d.kind as TacticalScene['drawings'][number]['kind'],points:(d.points as unknown[]).map(point),color:color(d.color),createdAt:ctx.now?.() ?? Date.now()});
        break;
      }
      case 'removeDrawing': {
        record(raw,['type','id']); const drawingId=text(command.id);
        const drawing=scene.drawings.find(d=>d.id===drawingId) || conflict('Desenho inexistente.');
        if (self.role !== 'admin' && drawing.ownerId !== self.id) throw new TacticalError(403,'Desenho de outro usuário.');
        scene.drawings=scene.drawings.filter(d=>d.id!==drawingId); break;
      }
      case 'clearDrawings': record(raw,['type']); gm(self); scene.drawings=[]; break;
      case 'startCombat': {
        record(raw,['type']); gm(self);
        if (!scene.tokens.length) conflict('Adicione tokens antes do combate.');
        if (scene.combat.active) conflict('Combate já iniciado.');
        scene.combat.active=true; scene.combat.round=1; scene.combat.index=0;
        scene.combat.order=[...scene.tokens].sort((a,b)=>b.initiative-a.initiative).map(t=>t.id);
        scene.combat.actions=Object.fromEntries(scene.tokens.map(t=>[t.id,freshActions()])); break;
      }
      case 'stopCombat': record(raw,['type']); gm(self); scene.combat.active=false; break;
      case 'nextTurn': {
        record(raw,['type']); gm(self);
        if (!scene.combat.active || !scene.combat.order.length) conflict('Combate não iniciado.');
        scene.combat.index=(scene.combat.index+1)%scene.combat.order.length;
        if (scene.combat.index === 0) scene.combat.round++;
        scene.combat.actions[scene.combat.order[scene.combat.index]]=freshActions(); break;
      }
      case 'setOrder': {
        record(raw,['type','order']); gm(self);
        const order=command.order;
        if (!Array.isArray(order) || order.length !== scene.tokens.length || new Set(order).size !== order.length || order.some(id=>!scene.tokens.some(t=>t.id===id))) bad('Ordem deve conter todos os tokens sem duplicatas.');
        const current=scene.combat.order[scene.combat.index];
        scene.combat.order=[...order]; scene.combat.index=Math.max(0,order.indexOf(current)); break;
      }
      case 'declareAction': {
        record(raw,['type','tokenId','kind','text']); const token=findToken(scene,command.tokenId); own(self,token);
        if (self.role !== 'admin') currentTurn(scene,token.id);
        const kind=actionKind(command.kind), declaration=text(command.text,1000);
        if (scene.combat.active) {
          scene.combat.actions[token.id] ||= freshActions();
          if (!scene.combat.actions[token.id][kind]) conflict('Ação já utilizada; mestre pode restaurar.');
          scene.combat.actions[token.id][kind]=false;
        }
        scene.combat.log.push({id:id(),tokenId:token.id,kind,text:declaration,at:ctx.now?.() ?? Date.now()});
        break;
      }
      case 'restoreAction': {
        record(raw,['type','tokenId','kind']); gm(self); const token=findToken(scene,command.tokenId), kind=actionKind(command.kind);
        scene.combat.actions[token.id] ||= freshActions(); scene.combat.actions[token.id][kind]=true; break;
      }
      case 'roll': {
        record(raw,['type','tokenId','formula','label']); const token=findToken(scene,command.tokenId); own(self,token);
        const formula=text(command.formula,40), label=text(command.label,120,true);
        const match=/^(\d{1,3})?d(\d{1,4})(?:\s*([+-])\s*(\d{1,5}))?$/i.exec(formula);
        if (!match) bad('Use NdM +/- inteiro.');
        const count=number(Number(match![1] || 1),1,100,true), sides=number(Number(match![2]),2,1000,true);
        const modifier=number(Number(match![4] || 0),0,10000,true)*(match![3]==='-' ? -1 : 1);
        const dice=Array.from({length:count},()=>number(ctx.rollDie?.(sides) ?? secureDie(sides),1,sides,true));
        const result=dice.reduce((a,b)=>a+b,modifier);
        scene.combat.log.push({id:id(),tokenId:token.id,kind:'roll',text:`${label || 'Rolagem'}: ${formula} = ${result} [${dice.join(', ')}]`,at:ctx.now?.() ?? Date.now()});
        break;
      }
      default: bad('Comando inválido.');
    }
  }
  // Keep initiative structurally valid across token additions/removals.
  for (const scene of db.scenes) {
    const valid = new Set(scene.tokens.map(t=>t.id));
    const current=scene.combat.order[scene.combat.index];
    const oldIndex=scene.combat.index;
    scene.combat.order=scene.combat.order.filter(id=>valid.has(id));
    if (scene.combat.active) for (const token of scene.tokens) if (!scene.combat.order.includes(token.id)) { scene.combat.order.push(token.id); scene.combat.actions[token.id]=freshActions(); }
    const index=scene.combat.order.indexOf(current);
    scene.combat.index=index < 0 ? Math.max(0,oldIndex)%Math.max(1,scene.combat.order.length) : index;
    if (index < 0 && scene.combat.active && scene.combat.order.length) {
      if (oldIndex >= scene.combat.order.length) scene.combat.round++;
      scene.combat.actions[scene.combat.order[scene.combat.index]]=freshActions();
    }
    scene.combat.actions=Object.fromEntries(Object.entries(scene.combat.actions).filter(([id])=>valid.has(id)));
    if (!scene.combat.order.length) scene.combat.active=false;
    scene.combat.log=scene.combat.log.slice(-500);
  }
  db.revision++;
  return db;
}
function freshActions(): {movement:boolean;main:boolean;bonus:boolean} { return {movement:true,main:true,bonus:true}; }
function actionKind(value: unknown): ActionKind { if (!['movement','main','bonus'].includes(value as string)) return bad('Tipo de ação inválido.'); return value as ActionKind; }
function secureDie(sides: number): number {
  const limit=Math.floor(0x100000000/sides)*sides;
  const random=new Uint32Array(1);
  do { crypto.getRandomValues(random); } while (random[0]>=limit);
  return random[0]%sides+1;
}

export function parseHexKey(value: unknown): Hex {
  if (typeof value !== 'string' || !/^-?(?:0|[1-9]\d*),-?(?:0|[1-9]\d*)$/.test(value)) return bad('Chave hexagonal inválida.');
  const [q,r] = value.split(',').map(Number); return {q:coord(q),r:coord(r)};
}
export function hasLineOfSight(scene: TacticalScene, source: Hex & { elevation?: number }, target: Hex & { elevation?: number }): boolean {
  if (hexDistance(source,target) === 0) return true;
  const a = hexToPoint(source,scene.hexSize), b = hexToPoint(target,scene.hexSize);
  const eye = terrainHeight(scene,source) + (source.elevation || 0) + TACTICAL_EYE_HEIGHT_METERS;
  const targetEye = terrainHeight(scene,target) + (target.elevation || 0) + TACTICAL_EYE_HEIGHT_METERS;
  for (const wall of scene.walls) {
    if (!wall.blocksVision || wall.height === 0) continue;
    const t = intersectionFraction(a,b,wall.a,wall.b);
    if (t !== null) {
      const ground = terrainHeight(scene,pointToHex({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},scene.hexSize));
      if (ground+wall.height >= eye+(targetEye-eye)*t-epsilon) return false;
    }
  }
  const steps = Math.max(2,Math.ceil(hexDistance(source,target)*4));
  for (let i=1;i<steps;i++) {
    const t=i/steps, hex=pointToHex({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},scene.hexSize);
    if (hexKey(hex) !== hexKey(source) && hexKey(hex) !== hexKey(target) && terrainHeight(scene,hex) >= eye+(targetEye-eye)*t-epsilon) return false;
  }
  return true;
}
export function visibilityFor(db: TacticalDatabase, scene: TacticalScene, self: TacticalSelf): {visible: Set<string>; explored: Set<string>} {
  const visible = new Set<string>();
  for (const token of scene.tokens.filter(t => t.kind === 'player' && t.ownerId === self.id)) {
    const radius = Math.floor(token.vision);
    for (let dq=-radius;dq<=radius;dq++) for (let dr=Math.max(-radius,-dq-radius);dr<=Math.min(radius,-dq+radius);dr++) {
      const hex={q:token.q+dq,r:token.r+dr};
      if (Math.abs(hex.q)>10000 || Math.abs(hex.r)>10000) continue;
      if (!scene.fog || hasLineOfSight(scene,token,hex)) visible.add(hexKey(hex));
    }
  }
  return {visible,explored: new Set([...(db.explored[scene.id]?.[self.id] || []),...(db.revealed[scene.id] || []),...Array.from(visible)])};
}
export function rememberExploration(input: TacticalDatabase, self: TacticalSelf, sceneId?: string): TacticalDatabase {
  const scene=selectedScene(input,self,sceneId);
  if (!scene || self.role === 'admin') return input;
  const explored=Array.from(visibilityFor(input,scene,self).explored).sort();
  if (explored.length > 100000) conflict('Limite de exploração atingido.');
  if (JSON.stringify(explored) === JSON.stringify(input.explored[scene.id]?.[self.id] || [])) return input;
  const db=structuredClone(input);
  db.explored[scene.id] ||= {};
  db.explored[scene.id][self.id]=explored;
  db.revision++;
  return db;
}
function segmentKnown(a: Point,b: Point,size: number,known: (hex: Hex) => boolean): boolean {
  const steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/size*4);
  if (steps > 4000) return false;
  for (let i=0;i<=Math.max(steps,1);i++) {
    const t=i/Math.max(steps,1);
    if (!known(pointToHex({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},size))) return false;
  }
  return true;
}
function drawingKnown(d: TacticalScene['drawings'][number],size: number,known: (hex: Hex) => boolean): boolean {
  if (!d.points.length) return false;
  if (d.kind === 'freehand' || d.kind === 'line' || d.kind === 'ping') return d.points.every((p,i) => segmentKnown(d.points[Math.max(0,i-1)],p,size,known));
  let minX=Math.min(...d.points.map(p=>p.x)),maxX=Math.max(...d.points.map(p=>p.x));
  let minY=Math.min(...d.points.map(p=>p.y)),maxY=Math.max(...d.points.map(p=>p.y));
  if (d.kind === 'circle' || d.kind === 'cone') {
    const [a,b]=d.points; if (!b) return false;
    const radius=Math.hypot(a.x-b.x,a.y-b.y); minX=a.x-radius; maxX=a.x+radius; minY=a.y-radius; maxY=a.y+radius;
  }
  if ((maxX-minX)*(maxY-minY)/size**2 > 4000) return false;
  for (let x=minX;x<=maxX+size/2;x+=size/2) for(let y=minY;y<=maxY+size/2;y+=size/2) if (!known(pointToHex({x,y},size))) return false;
  return true;
}

function point(value: unknown): Point { const p = record(value,['x','y']); return {x: number(p.x,-1000000,1000000), y: number(p.y,-1000000,1000000)}; }
function own(self: TacticalSelf, token: TacticalToken): void {
  if (self.role !== 'admin' && (token.kind !== 'player' || token.ownerId !== self.id)) throw new TacticalError(403,'Token de outro jogador.');
}
function currentTurn(scene: TacticalScene, tokenId: string): void { if (scene.combat.active && scene.combat.order[scene.combat.index] !== tokenId) conflict('Aguarde seu turno.'); }
const terrainIndexes = new WeakMap<TacticalScene['terrain'], Map<string, number>>();
function terrainHeight(scene: TacticalScene, hex: Hex): number {
  // Arrays are replaced by commands; immutable snapshot identity invalidates this cache.
  let index=terrainIndexes.get(scene.terrain);
  if (!index) { index=new Map(scene.terrain.map(t=>[hexKey(t),t.elevation])); terrainIndexes.set(scene.terrain,index); }
  return index.get(hexKey(hex)) || 0;
}
export function hexLine(a: Hex, b: Hex, limit = 200): Hex[] {
  const distance = hexDistance(a,b);
  if (distance > limit) return bad('Trajeto muito longo.');
  if (distance === 0) return [{q:a.q,r:a.r}];
  const from = hexToPoint(a,1), to = hexToPoint(b,1);
  return Array.from({length: distance+1},(_,i) => pointToHex({x:from.x+(to.x-from.x)*i/distance,y:from.y+(to.y-from.y)*i/distance},1));
}
function cross(a: Point,b: Point,c: Point): number { return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }
const epsilon = 1e-8;
function onSegment(a: Point,b: Point,c: Point): boolean { return Math.abs(cross(a,b,c)) <= epsilon && c.x >= Math.min(a.x,b.x)-epsilon && c.x <= Math.max(a.x,b.x)+epsilon && c.y >= Math.min(a.y,b.y)-epsilon && c.y <= Math.max(a.y,b.y)+epsilon; }
export function segmentsIntersect(a: Point,b: Point,c: Point,d: Point): boolean {
  const abC = cross(a,b,c), abD = cross(a,b,d), cdA = cross(c,d,a), cdB = cross(c,d,b);
  return (abC*abD < -epsilon && cdA*cdB < -epsilon) || onSegment(a,b,c) || onSegment(a,b,d) || onSegment(c,d,a) || onSegment(c,d,b);
}
function intersectionFraction(a: Point,b: Point,c: Point,d: Point): number | null {
  if (!segmentsIntersect(a,b,c,d)) return null;
  const dx=b.x-a.x,dy=b.y-a.y,ex=d.x-c.x,ey=d.y-c.y;
  const den=dx*ey-dy*ex;
  if (Math.abs(den) <= epsilon) {
    const length=dx*dx+dy*dy;
    if (!length) return 0;
    return Math.max(0,Math.min(1,Math.min(((c.x-a.x)*dx+(c.y-a.y)*dy)/length,((d.x-a.x)*dx+(d.y-a.y)*dy)/length)));
  }
  return ((c.x-a.x)*ey-(c.y-a.y)*ex)/den;
}

function findToken(scene: TacticalScene, value: unknown): TacticalToken { const id = text(value); return scene.tokens.find(t => t.id === id) || conflict('Token inexistente.'); }

/** Cheap transport/magic validation. Server MUST additionally decode via sharp before persistence. */
export function validateRaster(value: unknown, maxBytes = 5 * 1024 * 1024): { mime: string; bytes: Uint8Array; width?: number; height?: number } {
  if (typeof value !== 'string' || value.length > Math.ceil(maxBytes * 4 / 3) + 100) return bad('Imagem muito grande.');
  const match = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) return bad('Envie apenas PNG, JPEG, WebP ou GIF em base64.');
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)); } catch { return bad('Base64 inválido.'); }
  if (!bytes.length || bytes.length > maxBytes) return bad('Imagem muito grande.');
  const starts = (...values: number[]) => values.every((v,i) => bytes[i] === v);
  const ascii = (start: number, end: number) => String.fromCharCode(...Array.from(bytes.slice(start,end)));
  const png = starts(137,80,78,71,13,10,26,10) && ascii(12,16) === 'IHDR' && bytes.length >= 33;
  const gif = ['GIF87a','GIF89a'].includes(ascii(0,6)) && bytes.length >= 13;
  const jpeg = starts(255,216,255) && bytes.length >= 4;
  const webp = ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP' && bytes.length >= 20;
  if (!({png,gif,jpeg,webp}[match[1] as 'png'|'gif'|'jpeg'|'webp'])) return bad('Conteúdo não corresponde ao formato declarado.');
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const width = png ? view.getUint32(16) : gif ? view.getUint16(6,true) : undefined;
  const height = png ? view.getUint32(20) : gif ? view.getUint16(8,true) : undefined;
  if (width !== undefined && height !== undefined && (width < 1 || height < 1 || width > 8192 || height > 8192 || width*height > 20000000)) bad('Dimensões excessivas.');
  return {mime: `image/${match[1]}`, bytes, width, height};
}

function validSize(size: number): void { if (!Number.isFinite(size) || size <= 0) throw new Error('Invalid hex size'); }
export function hexToPoint(hex: Hex, hexSize: number): Point {
  validSize(hexSize);
  return { x: hexSize * (hex.q + hex.r / 2), y: hexSize * Math.sqrt(3) / 2 * hex.r };
}
export function pointToHex(point: Point, hexSize: number): Hex {
  validSize(hexSize);
  const r = 2 * point.y / (Math.sqrt(3) * hexSize);
  const q = point.x / hexSize - r / 2;
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq-q), dr = Math.abs(rr-r), ds = Math.abs(rs-s);
  if (dq > dr && dq > ds) rq = -rr-rs;
  else if (dr > ds) rr = -rq-rs;
  return {q: rq === 0 ? 0 : rq, r: rr === 0 ? 0 : rr};
}
export function hexDistance(a: Hex, b: Hex): number { return Math.max(Math.abs(a.q-b.q), Math.abs(a.r-b.r), Math.abs(a.q+a.r-b.q-b.r)); }
export function hexKey(hex: Hex): string { return `${hex.q},${hex.r}`; }
