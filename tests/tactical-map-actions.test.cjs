const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const source=path.resolve('src/components/map/TacticalUiLogic.ts');
const loaded=new Module(source,module);
loaded.filename=source;loaded.paths=module.paths;
loaded._compile(ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,source);
const {characterActions}=loaded.exports;
const character={classId:'',level:1,race:'Humano',featuresAndTraits:[],inventory:[]};
// Explicit regression fixtures: admin-created compendium rules may omit these optional fields.
const incomplete=[
 {id:'without-tags',title:'Optional tags absent',description:'Test rule'},
 {id:'without-subtitle',title:'Optional subtitle absent',description:'Test rule',tags:['Habilidade Racial']},
 {id:'invalid-tags',title:'Invalid tags shape',description:'Test rule',tags:{},subtitle:'Habilidade Racial: Humano'},
];
assert.deepEqual(characterActions(character,[],[],incomplete),[]);
console.log('PASS optional/invalid racial metadata cannot crash the map hotbar');
const racial={id:'human-racial',title:'Human racial ability',description:'Test ability',tags:['Habilidade Racial'],subtitle:'Habilidade Racial: Humano'};
const android={...racial,id:'android-racial',subtitle:'Habilidade Racial: Android'};
const feat={id:'feat-test',title:'Test feat',description:'Feat description'};
assert.deepEqual(characterActions({...character,featuresAndTraits:['Test feat']},[],[],[...incomplete,racial,android,feat]).map(a=>a.id),['feat-Test feat','human-racial']);
assert.deepEqual(characterActions({...character,race:'Android Combat'},[],[],[...incomplete,racial,android]).map(a=>a.id),['android-racial']);
assert.deepEqual(characterActions(undefined,[],[],incomplete),[]);
console.log('PASS valid feats and matching racial abilities remain available');
