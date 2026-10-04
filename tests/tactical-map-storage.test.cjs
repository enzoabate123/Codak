const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const storage = require(path.join(process.env.TACTICAL_TEST_BUILD,'lib/server/tactical-map-storage.js'));
const admin={id:'gm',role:'admin'}, player={id:'alice',role:'player'};
const ctx={characters:[{id:'char-a',userId:'alice'}],userIds:['alice','bob']};

test('HTTP mutation envelope rejects role spoofing, cross-origin, malformed and oversized bodies', async () => {
  const request=(body,headers={})=>new Request('https://codak.example/api/tactical-map',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});
  assert.deepEqual(await storage.readTacticalPayload(request(JSON.stringify({sceneId:'scene-1',command:{type:'publishScene'}}))),{sceneId:'scene-1',command:{type:'publishScene'}});
  await assert.rejects(storage.readTacticalPayload(request('{')),e=>e.status===400);
  await assert.rejects(storage.readTacticalPayload(request(JSON.stringify({role:'admin',command:{type:'publishScene'}}))),e=>e.status===400);
  await assert.rejects(storage.readTacticalPayload(request('{}',{'Origin':'https://attacker.example'})),e=>e.status===403);
  await assert.rejects(storage.readTacticalPayload(request('{}',{'Content-Type':'text/plain'})),e=>e.status===400);
  await assert.rejects(storage.readTacticalPayload(request('x'.repeat(7*1024*1024+1))),e=>e.status===400);
});

test('legitimate browser origins survive Next internal URLs and the configured public proxy origin', async () => {
  const previous=process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_URL='https://codak.example';
  const payload=JSON.stringify({command:{type:'startCombat'}});
  const request=(origin,host='127.0.0.1:3101',site='same-origin')=>new Request('http://localhost:3101/api/tactical-map',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'Host':host,'Sec-Fetch-Site':site},body:payload});
  try {
    assert.equal((await storage.readTacticalPayload(request('http://127.0.0.1:3101'))).command.type,'startCombat');
    assert.equal((await storage.readTacticalPayload(request('https://codak.example','codak.example'))).command.type,'startCombat');
    await assert.rejects(storage.readTacticalPayload(request('https://attacker.example')),e=>e.status===403);
    await assert.rejects(storage.readTacticalPayload(request('https://codak.example','codak.example','cross-site')),e=>e.status===403);
  } finally {
    if(previous===undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL=previous;
  }
});

test('atomic isolated persistence serializes concurrent writes, reloads and retains exploration', async () => {
  const dir=await fs.mkdtemp(path.join(path.dirname(process.env.TACTICAL_TEST_BUILD),'codak-tactical-db-'));
  const previous=process.env.CODAK_TACTICAL_DB_PATH;
  process.env.CODAK_TACTICAL_DB_PATH=path.join(dir,'tactical.json');
  try {
    assert.equal((await storage.getTacticalView(admin)).scene,null);
    const prepared=await storage.executeTacticalCommand(admin,{type:'createScene',name:'Fixture'},undefined,ctx);
    const sceneId=prepared.scene.id;
    assert.equal((await storage.getTacticalView(player)).scene,null);
    await storage.executeTacticalCommand(admin,{type:'publishScene'},sceneId,ctx);
    await Promise.all(Array.from({length:12},(_,i)=>storage.executeTacticalCommand(admin,{type:'addToken',token:{name:`Fixture ${i}`,kind:'player',characterId:'char-a',q:i,r:0,vision:1}},sceneId,ctx)));
    const raw=JSON.parse(await fs.readFile(process.env.CODAK_TACTICAL_DB_PATH,'utf8'));
    assert.equal(raw.scenes[0].tokens.length,12);
    const view=await storage.getTacticalView(player);
    assert.ok(view.exploredCells.includes('0,0'));
    const reloaded=JSON.parse(await fs.readFile(process.env.CODAK_TACTICAL_DB_PATH,'utf8'));
    assert.ok(reloaded.explored[sceneId].alice.includes('0,0'));
    assert.deepEqual((await fs.readdir(dir)).sort(),['tactical.json']);
    const before=await fs.readFile(process.env.CODAK_TACTICAL_DB_PATH,'utf8');
    await assert.rejects(storage.executeTacticalCommand(player,{type:'updateScene',patch:{fog:false}},sceneId,ctx),e=>e.status===403);
    assert.equal(await fs.readFile(process.env.CODAK_TACTICAL_DB_PATH,'utf8'),before);
    await fs.writeFile(process.env.CODAK_TACTICAL_DB_PATH,'{corrupt');
    await assert.rejects(storage.getTacticalView(admin),e=>e.status===409);
    assert.equal(await fs.readFile(process.env.CODAK_TACTICAL_DB_PATH,'utf8'),'{corrupt');
  } finally {
    if(previous===undefined) delete process.env.CODAK_TACTICAL_DB_PATH; else process.env.CODAK_TACTICAL_DB_PATH=previous;
    await fs.rm(dir,{recursive:true,force:true});
  }
});

test('real decoded raster masks unknown black, explored dim, visible clear, and private scenes reject', async () => {
  const sharp=require('sharp');
  const dir=await fs.mkdtemp(path.join(path.dirname(process.env.TACTICAL_TEST_BUILD),'codak-tactical-image-'));
  const previous=process.env.CODAK_TACTICAL_DB_PATH;
  process.env.CODAK_TACTICAL_DB_PATH=path.join(dir,'map.json');
  const send=(command,sceneId)=>storage.executeTacticalCommand(admin,command,sceneId,ctx);
  try {
    const created=await send({type:'createScene',name:'Raster'}), sceneId=created.scene.id;
    await assert.rejects(storage.getTacticalImage(player,sceneId),e=>e.status===403);
    await send({type:'publishScene'},sceneId);
    const bytes=await sharp({create:{width:240,height:120,channels:3,background:{r:240,g:120,b:60}}}).png().toBuffer();
    const image=`data:image/png;base64,${bytes.toString('base64')}`;
    await send({type:'setImage',image,width:240,height:120});
    await send({type:'addToken',token:{name:'Observer',kind:'player',ownerId:'alice',q:1,r:1,vision:0}});
    await send({type:'reveal',cells:['3,1']});
    const view=await storage.getTacticalView(player);
    assert.ok(!JSON.stringify(view).includes(image));
    assert.match(view.scene.image,/^\/api\/tactical-map\/image\?/);
    const masked=await storage.getTacticalImage(player,sceneId);
    const raw=await sharp(masked).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const pixel=(x,y)=>[...raw.data.subarray((y*raw.info.width+x)*3,(y*raw.info.width+x)*3+3)];
    assert.deepEqual(pixel(220,100),[0,0,0],'unknown terrain truly removed');
    assert.deepEqual(pixel(60,35),[240,120,60],'current origin clear');
    const dim=pixel(140,35); assert.ok(dim[0]>0 && dim[0]<100 && dim[1]<60,'explored terrain is dim');
    const gmRaster=await sharp(await storage.getTacticalImage(admin,sceneId)).removeAlpha().raw().toBuffer();
    assert.deepEqual([...gmRaster.subarray((100*240+220)*3,(100*240+220)*3+3)],[240,120,60]);
    await assert.rejects(send({type:'setImage',image,width:100,height:120}),e=>e.status===400);
    const forged=Buffer.alloc(40); Buffer.from([137,80,78,71,13,10,26,10]).copy(forged); forged.write('IHDR',12); forged.writeUInt32BE(1,16); forged.writeUInt32BE(1,20);
    await assert.rejects(send({type:'setImage',image:`data:image/png;base64,${forged.toString('base64')}`,width:1,height:1}),e=>e.status===400);
    const secret=await send({type:'createScene',name:'Private'});
    await assert.rejects(storage.getTacticalImage(player,secret.scene.id),e=>e.status===403);
    await assert.rejects(storage.getTacticalImage({id:'',role:'player'},sceneId),e=>e.status===401);
    await send({type:'updateScene',patch:{fog:false}},sceneId);
    const unmasked=await sharp(await storage.getTacticalImage(player,sceneId)).removeAlpha().raw().toBuffer();
    assert.deepEqual([...unmasked.subarray((100*240+220)*3,(100*240+220)*3+3)],[240,120,60]);
    await send({type:'updateScene',patch:{fog:true}},sceneId);
    const remasked=await sharp(await storage.getTacticalImage(player,sceneId)).removeAlpha().raw().toBuffer();
    assert.deepEqual([...remasked.subarray((100*240+220)*3,(100*240+220)*3+3)],[0,0,0],'cache never reuses fog-off raster');
  } finally {
    if(previous===undefined) delete process.env.CODAK_TACTICAL_DB_PATH; else process.env.CODAK_TACTICAL_DB_PATH=previous;
    await fs.rm(dir,{recursive:true,force:true});
  }
});
