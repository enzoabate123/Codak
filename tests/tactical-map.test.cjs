const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const core = require(path.join(process.env.TACTICAL_TEST_BUILD, 'lib/tactical-map.js'));
const admin = { id: 'gm', role: 'admin' };
const player = { id: 'alice', role: 'player' };
const other = { id: 'bob', role: 'player' };
let sequence = 0;
const ctx = { id: () => `id-${++sequence}`, now: () => 1000, characters: [{id:'char-a',userId:'alice'}], userIds: ['alice','bob'] };
const command = (db, cmd, self = admin, sceneId) => core.applyCommand(db, self, cmd, sceneId, ctx);
function setup() {
  let db = core.emptyTacticalDatabase();
  db = command(db, {type:'createScene',name:'First'});
  db = command(db, {type:'publishScene'});
  return db;
}
function add(db, token) { return command(db, {type:'addToken',token:{name:'Token',kind:'player',q:0,r:0,...token}}); }
function denied(fn, status) { assert.throws(fn, e => e instanceof core.TacticalError && e.status === status); }

test('axial geometry round trips negative coordinates and neighbors are one meter', () => {
  for (let q=-6;q<=6;q++) for (let r=-6;r<=6;r++) {
    assert.deepEqual(core.pointToHex(core.hexToPoint({q,r},40),40),{q,r});
    assert.equal(core.hexKey({q,r}),`${q},${r}`);
  }
  assert.equal(core.hexDistance({q:0,r:0},{q:3,r:-2}),3);
  assert.equal(core.hexDistance({q:0,r:0},{q:0,r:1}),1);
  assert.deepEqual(core.pointToHex({x:39,y:0},40),{q:1,r:0});
  assert.throws(() => core.pointToHex({x:1,y:2},0));
});

test('blank production state, GM preparation is private until explicit publication', () => {
  const empty = core.emptyTacticalDatabase();
  assert.deepEqual(empty.scenes, []);
  let db = command(empty, {type:'createScene',name:'Prepared'});
  const sceneId = db.scenes[0].id;
  assert.equal(core.buildTacticalView(db,player).scene,null);
  assert.equal(core.buildTacticalView(db,admin,sceneId).scene.name,'Prepared');
  denied(() => core.buildTacticalView(db,player,sceneId),403);
  assert.equal(empty.scenes.length,0,'pure command does not mutate input');
  db = command(db,{type:'publishScene'},admin,sceneId);
  assert.equal(core.buildTacticalView(db,player).scene.id,sceneId);
  db = command(db,{type:'createScene',name:'Secret'});
  assert.equal(db.activeSceneId,sceneId);
  assert.deepEqual(core.buildTacticalView(db,player).scenes,[{id:sceneId,name:'Prepared'}]);
  denied(() => command(db,{type:'deleteScene'},admin,sceneId),409);
  denied(() => command(db,{type:'createScene',name:'No'},player),403);
  denied(() => command(db,{type:'wat'}),400);
  denied(() => command(db,{type:'updateScene',patch:{hexSize:0}}),400);
  denied(() => command(db,{type:'updateScene',patch:{image:'https://attacker'}}),400);
  denied(() => command(db,{type:'createScene',name:''}),400);
  assert.equal(db.revision,3);
});

test('tokens use real character ownership and strictly validated fields and raster inputs', () => {
  let db = setup();
  db = add(db,{characterId:'char-a',ownerId:'bob',hp:8,maxHp:10});
  const token = db.scenes[0].tokens[0];
  assert.equal(token.ownerId,'alice');
  assert.equal(token.characterId,'char-a');
  denied(() => add(db,{characterId:'missing'}),400);
  denied(() => add(db,{q:0.5}),400);
  denied(() => add(db,{vision:50000}),400);
  denied(() => add(db,{color:'url(https://attacker)'}),400);
  denied(() => add(db,{image:'data:image/svg+xml;base64,PHN2Zz4='}),400);
  denied(() => add(db,{image:'https://attacker/map.png'}),400);
  denied(() => command(db,{type:'updateToken',tokenId:token.id,patch:{hp:1}},player),403);
  db = command(db,{type:'updateToken',tokenId:token.id,patch:{name:'Updated',hp:5,vision:8}});
  assert.equal(db.scenes[0].tokens[0].hp,5);
  denied(() => command(db,{type:'updateToken',tokenId:token.id,patch:{ownerId:'bob'}}),400);
  denied(() => command(db,{type:'setImage',image:'data:image/png;base64,aGVsbG8=',width:100,height:100}),400);
  // Real tiny PNG (no production seed); signature and IHDR dimensions must match.
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlSAAAAAASUVORK5CYII=';
  db = command(db,{type:'setImage',image:png,width:1,height:1});
  assert.equal(db.scenes[0].image,png);
  denied(() => command(db,{type:'setImage',image:png,width:2,height:1}),400);
  denied(() => command(db,{type:'setImage',image:png,width:1,height:1},player),403);
  db = command(db,{type:'removeToken',tokenId:token.id});
  assert.equal(db.scenes[0].tokens.length,0);
});

test('player movement validates every hop, ownership, segment walls and terrain heights', () => {
  let db = add(setup(),{ownerId:'alice'});
  const tokenId=db.scenes[0].tokens[0].id;
  denied(() => command(db,{type:'moveToken',tokenId,q:1,r:0},other),403);
  denied(() => command(db,{type:'moveToken',tokenId,q:1.1,r:0},player),400);
  db=command(db,{type:'moveToken',tokenId,q:2,r:0},player);
  assert.equal(db.scenes[0].tokens[0].q,2);
  db=command(db,{type:'addWall',wall:{a:{x:100,y:-60},b:{x:100,y:60},height:3,blocksMovement:true,blocksVision:true}});
  const wallId=db.scenes[0].walls[0].id;
  denied(() => command(db,{type:'moveToken',tokenId,q:5,r:0},player),409);
  db=command(db,{type:'moveToken',tokenId,q:5,r:0}); // GM override
  db=command(db,{type:'removeWall',id:wallId});
  db=command(db,{type:'moveToken',tokenId,q:0,r:0});
  db=command(db,{type:'setTerrain',q:1,r:0,elevation:2});
  denied(() => command(db,{type:'moveToken',tokenId,q:2,r:0},player),409);
  db=command(db,{type:'setTerrain',q:1,r:0,elevation:1});
  db=command(db,{type:'moveToken',tokenId,q:2,r:0},player);
  assert.equal(db.scenes[0].tokens[0].q,2);
  assert.equal(core.segmentsIntersect({x:0,y:0},{x:10,y:0},{x:5,y:0},{x:20,y:0}),true);
  assert.equal(core.segmentsIntersect({x:0,y:0},{x:10,y:0},{x:10,y:0},{x:10,y:10}),true);
  denied(() => command(db,{type:'addWall',wall:{a:{x:1,y:1},b:{x:1,y:1},height:1,blocksMovement:true,blocksVision:true}}),400);
});

test('GM wall edits atomically retain identity and untouched fields', () => {
  let db=command(setup(),{type:'addWall',wall:{a:{x:0,y:0},b:{x:40,y:0},height:3,blocksMovement:true,blocksVision:true}});
  const before=structuredClone(db), wall=db.scenes[0].walls[0];
  const patch={a:{x:5,y:10},b:{x:50,y:10},height:2,blocksMovement:false,blocksVision:false};
  db=command(db,{type:'updateWall',id:wall.id,patch});
  assert.deepEqual(db.scenes[0].walls,[{id:wall.id,...patch}]);
  assert.equal(db.revision,before.revision+1,'one edit is one revision');
  assert.deepEqual(before.scenes[0].walls,[wall],'input snapshot is unchanged');
  const partial=command(db,{type:'updateWall',id:wall.id,patch:{height:4}});
  assert.deepEqual(partial.scenes[0].walls,[{id:wall.id,...patch,height:4}]);
});

test('wall edits reject players and invalid patches without changing data', () => {
  const db=command(setup(),{type:'addWall',wall:{a:{x:0,y:0},b:{x:40,y:0},height:3,blocksMovement:true,blocksVision:true}});
  const before=structuredClone(db), id=db.scenes[0].walls[0].id;
  denied(() => command(db,{type:'updateWall',id,patch:{height:2}},player),403);
  denied(() => command(db,{type:'updateWall',id:'missing',patch:{height:2}}),409);
  denied(() => command(db,{type:'updateWall',id,patch:{height:2},wall:{}}),400);
  for (const patch of [
    null, [], {id:'replacement'}, {extra:true},
    {height:-1}, {height:1001}, {height:NaN}, {height:Infinity}, {height:'2'},
    {blocksMovement:1}, {blocksVision:'false'},
    {a:{x:40,y:0}}, {b:{x:0.001,y:0}},
    {a:{x:1000001,y:0}}, {b:{x:0,y:Infinity}}, {a:{x:1}}, {b:{x:1,y:0,z:1}},
    {a:{x:5,y:5},height:2,blocksMovement:false,blocksVision:null}
  ]) {
    denied(() => command(db,{type:'updateWall',id,patch}),400);
    assert.deepEqual(db,before,'a rejected edit cannot change the wall or revision');
  }
  assert.deepEqual(db,before);
});

test('FOW is per user, LOS height-aware, and snapshots redact all unseen state and originals', () => {
  let db=add(setup(),{ownerId:'alice',vision:4});
  db=add(db,{name:'TOP SECRET',kind:'hostile',q:3,r:0,hp:37,maxHp:50,vision:0});
  db=command(db,{type:'addWall',wall:{a:{x:60,y:-80},b:{x:60,y:80},height:3,blocksMovement:true,blocksVision:true}});
  db=command(db,{type:'setTerrain',q:9,r:9,elevation:12});
  db=command(db,{type:'updateScene',patch:{environment:{name:'Public',biome:'Secret biome',temperature:'20',time:'Noon',notes:'Hidden notes',visible:['name']}}});
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlSAAAAAASUVORK5CYII=';
  db=command(db,{type:'setImage',image:png,width:1,height:1});
  let view=core.buildTacticalView(db,player);
  assert.ok(view.visibleCells.includes('0,0'));
  assert.ok(!view.visibleCells.includes('3,0'));
  assert.equal(view.scene.tokens.length,1);
  assert.equal(view.scene.terrain.length,0);
  assert.equal(view.scene.walls.length,0,'unexplored far wall endpoints are not disclosed');
  assert.deepEqual(view.scene.environment,{name:'Public',visible:['name']});
  assert.match(view.scene.image,/^\/api\/tactical-map\/image\?/);
  assert.ok(!JSON.stringify(view).includes('TOP SECRET'));
  assert.ok(!JSON.stringify(view).includes('data:image'));
  assert.equal(core.buildTacticalView(db,other).visibleCells.length,0);
  assert.equal(core.buildTacticalView(db,admin).scene.tokens.length,2);
  assert.equal(core.buildTacticalView(db,admin).scene.image,png);
  // Above the wall sees the target; the low observer does not.
  assert.equal(core.hasLineOfSight(db.scenes[0],{q:0,r:0,elevation:0},{q:3,r:0,elevation:0}),false);
  assert.equal(core.hasLineOfSight(db.scenes[0],{q:0,r:0,elevation:5},{q:3,r:0,elevation:5}),true);
  db=core.rememberExploration(db,player);
  db=command(db,{type:'moveToken',tokenId:db.scenes[0].tokens[0].id,q:-8,r:0});
  view=core.buildTacticalView(db,player);
  assert.ok(view.exploredCells.includes('0,0'));
  assert.ok(!view.visibleCells.includes('0,0'));
  db=command(db,{type:'reveal',cells:['3,0']});
  assert.ok(core.buildTacticalView(db,other).exploredCells.includes('3,0'));
  assert.equal(core.buildTacticalView(db,player).scene.tokens.length,1,'exploration never reveals current hostile state');
  denied(() => command(db,{type:'reveal',cells:['3.2,0']}),400);
  denied(() => command(db,{type:'reveal',cells:['3,0']},player),403);
  db=command(db,{type:'updateScene',patch:{fog:false}});
  assert.equal(core.buildTacticalView(db,other).scene.tokens.length,2);
});

test('intermediate high terrain blocks sight beyond but not the terrain cell itself', () => {
  let db=add(setup(),{ownerId:'alice',vision:4});
  db=command(db,{type:'setTerrain',q:1,r:0,elevation:3});
  const scene=db.scenes[0];
  assert.equal(core.hasLineOfSight(scene,{q:0,r:0,elevation:0},{q:3,r:0,elevation:0}),false);
  const view=core.buildTacticalView(db,player);
  assert.ok(view.visibleCells.includes('1,0'));
  assert.ok(!view.visibleCells.includes('3,0'));
});

test('elevated bodies can be visible above a wall while ground behind it stays occluded', () => {
  let db=add(setup(),{ownerId:'alice',vision:4});
  db=add(db,{kind:'hostile',name:'Above wall',q:3,r:0,elevation:10});
  db=command(db,{type:'addWall',wall:{a:{x:60,y:-80},b:{x:60,y:80},height:3,blocksMovement:false,blocksVision:true}});
  const view=core.buildTacticalView(db,player);
  assert.ok(!view.visibleCells.includes('3,0'));
  assert.equal(view.scene.tokens.length,2);
});

test('persistent drawings have server-owned identities and private geometry is filtered', () => {
  let db=add(setup(),{ownerId:'alice',vision:2});
  db=command(db,{type:'addDrawing',drawing:{kind:'line',points:[{x:0,y:0},{x:40,y:0}],color:'#ff0000'}},player);
  const drawing=db.scenes[0].drawings[0];
  assert.equal(drawing.ownerId,'alice');
  denied(() => command(db,{type:'removeDrawing',id:drawing.id},other),403);
  denied(() => command(db,{type:'clearDrawings'},player),403);
  denied(() => command(db,{type:'addDrawing',drawing:{kind:'line',points:[{x:0,y:0}],color:'#ff0000'}},player),400);
  denied(() => command(db,{type:'addDrawing',drawing:{kind:'ping',points:[{x:0,y:0}],color:'#ff0000',ownerId:'gm'}},player),400);
  db=command(db,{type:'addDrawing',drawing:{kind:'rectangle',points:[{x:400,y:400},{x:600,y:600}],color:'#00ffff'}});
  assert.equal(core.buildTacticalView(db,player).scene.drawings.length,1);
  db=command(db,{type:'removeDrawing',id:drawing.id},player);
  assert.equal(db.scenes[0].drawings.length,1);
  db=command(db,{type:'clearDrawings'});
  assert.equal(db.scenes[0].drawings.length,0);
});

test('initiative stable order, current turn ownership, manual action lights and GM correction', () => {
  let db=add(setup(),{ownerId:'alice',initiative:10});
  db=add(db,{name:'Hidden NPC',kind:'npc',q:40,r:0,initiative:10});
  const [a,b]=db.scenes[0].tokens.map(t=>t.id);
  denied(() => command(db,{type:'startCombat'},player),403);
  db=command(db,{type:'startCombat'});
  assert.deepEqual(db.scenes[0].combat.order,[a,b]);
  assert.deepEqual(db.scenes[0].combat.actions[a],{movement:true,main:true,bonus:true});
  db=command(db,{type:'moveToken',tokenId:a,q:1,r:0},player);
  assert.equal(db.scenes[0].combat.actions[a].movement,true,'measurement/movement never auto spends');
  db=command(db,{type:'declareAction',tokenId:a,kind:'main',text:'Use any descriptive ability'},player);
  assert.equal(db.scenes[0].combat.actions[a].main,false);
  denied(() => command(db,{type:'declareAction',tokenId:a,kind:'main',text:'again'},player),409);
  denied(() => command(db,{type:'restoreAction',tokenId:a,kind:'main'},player),403);
  db=command(db,{type:'restoreAction',tokenId:a,kind:'main'});
  db=command(db,{type:'nextTurn'});
  denied(() => command(db,{type:'moveToken',tokenId:a,q:2,r:0},player),409);
  denied(() => command(db,{type:'declareAction',tokenId:a,kind:'bonus',text:'not turn'},player),409);
  const view=core.buildTacticalView(db,player);
  assert.deepEqual(view.scene.combat.order,[a]);
  assert.equal(view.scene.combat.index,-1);
  assert.ok(!JSON.stringify(view).includes(b));
  denied(() => command(db,{type:'setOrder',order:[a,a]}),400);
  denied(() => command(db,{type:'setOrder',order:[a]}),400);
  db=command(db,{type:'setOrder',order:[b,a]});
  db=command(db,{type:'declareAction',tokenId:b,kind:'bonus',text:'NPC bonus'});
  db=command(db,{type:'nextTurn'});
  assert.equal(db.scenes[0].combat.order[db.scenes[0].combat.index],a);
  assert.equal(db.scenes[0].combat.actions[a].main,true);
  db=command(db,{type:'removeToken',tokenId:a});
  assert.deepEqual(db.scenes[0].combat.order,[b]);
  assert.equal(db.scenes[0].combat.actions[b].bonus,true,'removing the active actor resets the successor lights');
  assert.equal(db.scenes[0].combat.index,0);
  assert.equal(db.scenes[0].combat.round,2,'removing the final actor starts a new round');
  db=command(db,{type:'nextTurn'});
  assert.equal(db.scenes[0].combat.round,3);
  db=command(db,{type:'stopCombat'});
  assert.equal(db.scenes[0].combat.active,false);
});

test('removing the final active actor wraps to the next round and refreshes successor actions', () => {
  let db=add(setup(),{initiative:30});
  db=add(db,{initiative:20});
  db=add(db,{initiative:10});
  const [first,second,last]=db.scenes[0].tokens.map(t=>t.id);
  db=command(db,{type:'startCombat'});
  db=command(db,{type:'declareAction',tokenId:first,kind:'main',text:'Spent'});
  db=command(db,{type:'nextTurn'});
  db=command(db,{type:'nextTurn'});
  assert.equal(db.scenes[0].combat.index,2);
  assert.equal(db.scenes[0].combat.round,1);
  db=command(db,{type:'removeToken',tokenId:last});
  assert.deepEqual(db.scenes[0].combat.order,[first,second]);
  assert.equal(db.scenes[0].combat.index,0);
  assert.equal(db.scenes[0].combat.round,2);
  assert.deepEqual(db.scenes[0].combat.actions[first],{movement:true,main:true,bonus:true});
});

test('removing an actor before the end preserves the round and selects the successor', () => {
  for (const turns of [0,1]) {
    let db=add(add(add(setup(),{initiative:30}),{initiative:20}),{initiative:10});
    db=command(db,{type:'startCombat'});
    for (let i=0;i<turns;i++) db=command(db,{type:'nextTurn'});
    const order=[...db.scenes[0].combat.order], successor=order[turns+1];
    db=command(db,{type:'declareAction',tokenId:successor,kind:'bonus',text:'Spent'});
    db=command(db,{type:'removeToken',tokenId:order[turns]});
    assert.equal(db.scenes[0].combat.round,1);
    assert.equal(db.scenes[0].combat.order[db.scenes[0].combat.index],successor);
    assert.equal(db.scenes[0].combat.actions[successor].bonus,true);
  }
  let db=command(add(setup(),{}),{type:'startCombat'});
  db=command(db,{type:'removeToken',tokenId:db.scenes[0].tokens[0].id});
  assert.equal(db.scenes[0].combat.active,false);
  assert.equal(db.scenes[0].combat.round,1,'empty combat does not start another round');
});

test('fog-off discloses long geometry and boundary coordinates remain valid image cells', () => {
  let db=add(setup(),{ownerId:'alice',q:10000,r:0,vision:2});
  assert.ok(core.buildTacticalView(db,player).visibleCells.every(key=>{
    const [q,r]=key.split(',').map(Number); return Math.abs(q)<=10000&&Math.abs(r)<=10000;
  }));
  db=command(db,{type:'addWall',wall:{a:{x:-999999,y:0},b:{x:999999,y:0},height:2,blocksMovement:true,blocksVision:true}});
  db=command(db,{type:'addDrawing',drawing:{kind:'line',points:[{x:-999999,y:0},{x:999999,y:0}],color:'#ff0000'}});
  db=command(db,{type:'updateScene',patch:{fog:false}});
  const view=core.buildTacticalView(db,player);
  assert.equal(view.scene.walls.length,1);
  assert.equal(view.scene.drawings.length,1);
});

test('dice roll accepts bounded NdM modifiers and logs actual server randomness without eval', () => {
  let db=add(setup(),{ownerId:'alice'});
  const tokenId=db.scenes[0].tokens[0].id;
  denied(() => command(db,{type:'roll',tokenId,formula:'process.exit()',label:'test'},player),400);
  denied(() => command(db,{type:'roll',tokenId,formula:'1000d100000',label:'test'},player),400);
  denied(() => command(db,{type:'roll',tokenId,formula:'1d20',label:'test'},other),403);
  for (let i=0;i<20;i++) db=command(db,{type:'roll',tokenId,formula:'2d6 + 3',label:'Attack'},player);
  for (const log of db.scenes[0].combat.log) {
    assert.equal(log.kind,'roll');
    assert.match(log.text,/Attack: 2d6 \+ 3 = (\d+) \[/);
    const result=Number(log.text.match(/= (\d+)/)[1]); assert.ok(result>=5&&result<=15);
  }
  const deterministic=core.applyCommand(db,player,{type:'roll',tokenId,formula:'1d6-2',label:'Known'},undefined,{...ctx,rollDie:()=>4});
  assert.match(deterministic.scenes[0].combat.log.at(-1).text,/= 2 \[4\]/);
});
