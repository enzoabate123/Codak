import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, randomInt, createHash } from 'node:crypto';
import sharp from 'sharp';
import { applyCommand, buildTacticalView, emptyTacticalDatabase, rememberExploration, TacticalError, validateRaster, parseHexKey, hexToPoint } from '../tactical-map';
import type { TacticalDatabase, TacticalContext, TacticalSelf } from '../tactical-map';
import type { TacticalView } from '../../types/tactical-map';

export async function readTacticalPayload(request: Request): Promise<{sceneId?: string; command: unknown}> {
  const origin=request.headers.get('origin');
  const url=new URL(request.url), allowedOrigins=new Set([url.origin]);
  // Next may construct an internal localhost URL even when the browser uses the
  // incoming Host or the configured HTTPS origin behind Cloudflare.
  const host=request.headers.get('host');
  if (host && /^[a-z0-9.:[\]-]+$/i.test(host)) allowedOrigins.add(`${url.protocol}//${host.toLowerCase()}`);
  if (process.env.NEXTAUTH_URL) {
    try { allowedOrigins.add(new URL(process.env.NEXTAUTH_URL).origin); }
    catch { throw new TacticalError(500,'Origem pública configurada inválida.'); }
  }
  if ((origin && !allowedOrigins.has(origin)) || request.headers.get('sec-fetch-site') === 'cross-site') throw new TacticalError(403,'Origem não permitida.');
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw new TacticalError(400,'Envie application/json.');
  const max=7*1024*1024;
  if (Number(request.headers.get('content-length') || 0)>max || !request.body) throw new TacticalError(400,'Corpo ausente ou excessivo.');
  const reader=request.body.getReader();
  const chunks: Uint8Array[]=[];
  let size=0;
  try {
    for (;;) {
      const {done,value}=await reader.read(); if(done) break;
      size+=value.byteLength;
      if(size>max) { await reader.cancel(); throw new TacticalError(400,'Corpo excessivo.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let payload: Record<string,unknown>;
  try {
    payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!payload || typeof payload!=='object' || Array.isArray(payload) || Object.keys(payload).some(key=>!['sceneId','command'].includes(key)) || !payload.command || typeof payload.command!=='object' || Array.isArray(payload.command) || (payload.sceneId!==undefined && (typeof payload.sceneId!=='string' || !payload.sceneId.trim() || payload.sceneId.length>120))) throw new Error('Invalid envelope');
  } catch { throw new TacticalError(400,'JSON ou comando inválido.'); }
  return { ...(payload.sceneId === undefined ? {} : {sceneId:payload.sceneId as string}), command:payload.command };
}

export async function decodeRaster(image: string, width?: number, height?: number, maxBytes?: number): Promise<Buffer> {
  const {bytes,mime}=validateRaster(image,maxBytes);
  try {
    const raster=sharp(Buffer.from(bytes),{limitInputPixels:20000000,pages:1,failOn:'error'});
    const metadata=await raster.metadata();
    if (!['png','jpeg','webp','gif'].includes(metadata.format || '') || `image/${metadata.format}` !== mime || !metadata.width || !metadata.height || metadata.width>8192 || metadata.height>8192 || metadata.width*metadata.height>20000000 || (width!==undefined && width!==metadata.width) || (height!==undefined && height!==metadata.height)) throw new Error('Invalid image dimensions');
    // Re-encoding exercises the complete codec, strips metadata and flattens animation.
    return await raster.flatten({background:'#000000'}).toColourspace('srgb').png().toBuffer();
  } catch { throw new TacticalError(400,'Imagem inválida, corrompida ou com dimensões excessivas.'); }
}
const imageCache = new Map<string,Buffer>();
let imageCacheBytes=0;
function cacheRaster(key: string, raster: Buffer): void {
  if (raster.byteLength>32*1024*1024) return;
  const replaced=imageCache.get(key);
  if (replaced) { imageCacheBytes-=replaced.byteLength; imageCache.delete(key); }
  while (imageCache.size>=16 || imageCacheBytes+raster.byteLength>32*1024*1024) {
    const oldest=imageCache.keys().next().value;
    if (!oldest) break;
    imageCacheBytes-=imageCache.get(oldest)!.byteLength; imageCache.delete(oldest);
  }
  imageCache.set(key,raster); imageCacheBytes+=raster.byteLength;
}
/** Same native img URL for the UI; authorization is recomputed, never from URL revision. */
export async function getTacticalImage(self: TacticalSelf, sceneId?: string): Promise<Buffer> {
  const snapshot=await transaction(async before=> {
    const db=rememberExploration(before,self,sceneId);
    const view=buildTacticalView(db,self,sceneId); // also forbids private/unknown IDs
    const scene=db.scenes.find(s=>s.id===view.scene?.id);
    if (!scene?.image) throw new TacticalError(409,'Mapa sem imagem.');
    return {db,result:{scene,visible:view.visibleCells,explored:view.exploredCells}};
  });
  const {scene,visible,explored}=snapshot;
  const full=self.role==='admin' || !scene.fog;
  // Combat/drawings/revision do not invalidate this bounded private server cache.
  const key=createHash('sha256').update(scene.image!).update(JSON.stringify([scene.hexSize,scene.width,scene.height,full,full?[]:visible,full?[]:explored])).digest('hex');
  const cached=imageCache.get(key);
  if(cached) return Buffer.from(cached);
  const raster=await decodeRaster(scene.image!,scene.width,scene.height);
  if (full) { cacheRaster(key,raster); return Buffer.from(raster); }
  const radius=scene.hexSize/Math.sqrt(3);
  const polygon=(cell:string,fill:string) => {
    const center=hexToPoint(parseHexKey(cell),scene.hexSize);
    if (center.x+radius<0 || center.y+radius<0 || center.x-radius>scene.width || center.y-radius>scene.height) return '';
    const points=Array.from({length:6},(_,i)=> {
      const angle=(30+i*60)*Math.PI/180;
      return `${(center.x+radius*Math.cos(angle)).toFixed(4)},${(center.y+radius*Math.sin(angle)).toFixed(4)}`;
    }).join(' ');
    return `<polygon points="${points}" fill="${fill}"/>`;
  };
  // No user strings/SVG are evaluated: numeric validated cells generate this mask.
  const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}"><rect width="100%" height="100%" fill="#000000"/>${explored.map(cell=>polygon(cell,'#474747')).join('')}${visible.map(cell=>polygon(cell,'#ffffff')).join('')}</svg>`);
  try {
    const masked=await sharp(raster,{limitInputPixels:20000000}).composite([{input:mask,blend:'multiply'}]).png().toBuffer();
    cacheRaster(key,masked); return Buffer.from(masked);
  } catch { throw new TacticalError(400,'Não foi possível gerar a imagem protegida.'); }
}

export function tacticalDatabasePath(): string { return path.resolve(process.env.CODAK_TACTICAL_DB_PATH || path.join(process.cwd(),'data','tactical-map.json')); }

async function readDatabase(file: string): Promise<TacticalDatabase> {
  let raw: string;
  try { raw = await fs.readFile(file,'utf8'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyTacticalDatabase(); throw error; }
  try {
    const db = JSON.parse(raw) as TacticalDatabase;
    if (db.version !== 1 || !Number.isSafeInteger(db.revision) || db.revision < 0 || !Array.isArray(db.scenes) || db.scenes.length > 32 || !db.explored || !db.revealed || !(db.activeSceneId === null || db.scenes.some(s=>s.id === db.activeSceneId))) throw new Error('Invalid database');
    for (const scene of db.scenes) if (!scene.id || !Array.isArray(scene.tokens) || !Array.isArray(scene.walls) || !Array.isArray(scene.terrain) || !Array.isArray(scene.drawings) || !scene.combat || !scene.environment) throw new Error('Invalid scene');
    return db;
  } catch { throw new TacticalError(409,'Banco tático inválido; restaure um backup. Nenhum dado foi sobrescrito.'); }
}
async function atomicWrite(file: string, db: TacticalDatabase): Promise<void> {
  const temporary=`${file}.${randomUUID()}.tmp`;
  try {
    const handle=await fs.open(temporary,'wx',0o600);
    try { await handle.writeFile(JSON.stringify(db),'utf8'); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temporary,file);
  } finally { await fs.rm(temporary,{force:true}); }
}
/** ponytail: one filesystem lock, appropriate for a single-host JSON database.
 * Move to a transactional database for multiple hosts/high write throughput. */
async function transaction<T>(fn: (db: TacticalDatabase) => Promise<{ db: TacticalDatabase; result: T }>): Promise<T> {
  const file=tacticalDatabasePath(), lock=`${file}.lock`;
  await fs.mkdir(path.dirname(file),{recursive:true});
  const deadline=Date.now()+5000;
  let handle: Awaited<ReturnType<typeof fs.open>>;
  for (;;) {
    try { handle=await fs.open(lock,'wx',0o600); break; }
    catch(error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now()>=deadline) throw new TacticalError(409,'Banco ocupado. Tente novamente; após queda do servidor, confira o arquivo .lock.');
      await new Promise(resolve=>setTimeout(resolve,15));
    }
  }
  try {
    const before=await readDatabase(file);
    const {db,result}=await fn(before);
    if (db !== before) await atomicWrite(file,db);
    return result;
  } finally { await handle.close(); await fs.rm(lock,{force:true}); }
}
export async function getTacticalView(self: TacticalSelf, sceneId?: string): Promise<TacticalView> {
  return transaction(async before=> {
    const db=rememberExploration(before,self,sceneId);
    return {db,result:buildTacticalView(db,self,sceneId)};
  });
}
export async function executeTacticalCommand(self: TacticalSelf, value: unknown, sceneId?: string, context: TacticalContext = {}): Promise<TacticalView> {
  return transaction(async before=> {
    let db=applyCommand(before,self,value,sceneId,{...context,id:randomUUID,now:Date.now,rollDie:sides=>randomInt(1,sides+1)});
    const command=value as {type:string;image?:string;width?:number;height?:number;token?:{image?:string}};
    // Pure validation/authorization runs first. The actual raster decoder is mandatory
    // before the transaction writes any image, including player-token avatars.
    if (command.type === 'setImage') await decodeRaster(command.image!,command.width,command.height);
    if (command.type === 'addToken' && command.token?.image) await decodeRaster(command.token.image,undefined,undefined,1024*1024);
    const selected=command.type === 'createScene' ? db.scenes.at(-1)?.id : command.type === 'deleteScene' ? undefined : sceneId;
    // Preserve perception for every current owner even when they are not polling.
    const users=new Set([self.id,...(context.userIds || []),...db.scenes.flatMap(s=>s.tokens.map(t=>t.ownerId).filter((id): id is string=>!!id))]);
    for (const id of Array.from(users)) db=rememberExploration(db,{id,role:'player'});
    return {db,result:buildTacticalView(db,self,selected)};
  });
}
