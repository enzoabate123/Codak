// Native isolated callback regressions: transpiles UI; no app build or live requests.
// Run one named check per process, or run this file with no arguments for all.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(root + '/node_modules/typescript');
const React = require(root + '/node_modules/react');
let hooks = [], index = 0, effects = [], cache = {};
const fakeReact = { ...React, useState(initial) { let i = index++; if (!(i in hooks))
        hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], v => hooks[i] = typeof v === 'function' ? v(hooks[i]) : v]; }, useRef(value) { let i = index++; return hooks[i] || (hooks[i] = { current: value }); }, useMemo(fn) { index++; return fn(); }, useEffect(fn, deps) { let i = index++, old = hooks[i]; if (!old || !deps || deps.some((d, j) => d !== old.deps[j])) {
        old?.cleanup?.();
        hooks[i] = { deps: deps || [], cleanup: null };
        effects.push(() => hooks[i].cleanup = fn());
    } }, useId() { index++; return 'test'; } };
function load(file) { file = path.resolve(file); if (cache[file])
    return cache[file].exports; let m = { exports: {} }; cache[file] = m; const baseline = process.env.CODAK_UI_BASELINE === '1' && /src[\\/]((components[\\/]map[\\/]Tactical(Workspace|CharacterWindow|Board|UiLogic))|stores[\\/]useTacticalMapStore)\.tsx?$/.test(file); const source = baseline ? require('node:child_process').execFileSync('git', ['show', ':' + path.relative(root, file).replaceAll('\\', '/')], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(file, 'utf8'); const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText; const req = id => { if (id === 'zustand')
    return { create: function create(init) { if (!init) return create; const actual = require(root + '/node_modules/zustand').create(init); const wrapped = selector => selector ? selector(actual.getState()) : actual.getState(); Object.assign(wrapped, actual); return wrapped; } }; if (id === 'react')
    return fakeReact; if (id === 'react/jsx-runtime')
    return require(root + '/node_modules/react/jsx-runtime'); if (id.endsWith('.css'))
    return { __esModule: true, default: new Proxy({}, { get: (_, k) => k }) }; if (id.startsWith('@/') || id.startsWith('.')) {
    let p = id.startsWith('@/') ? root + '/src/' + id.slice(2) : path.resolve(path.dirname(file), id);
    for (const ext of ['.ts', '.tsx', '/index.ts', ''])
        if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile())
            return load(p + ext);
} return require(require.resolve(id, { paths: [root] })); }; vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(req, m, m.exports); return m.exports; }
function render(component) { index = 0; let result = component(); while (effects.length)
    effects.shift()(); return result; }
function find(tree, p) { if (!tree)
    return; if (Array.isArray(tree)) {
    for (let child of tree) {
        let r = find(child, p);
        if (r)
            return r;
    }
}
else if (typeof tree === 'object') {
    if (p(tree))
        return tree;
    return find(tree.props?.children, p);
} }
const tick = () => new Promise(r => setImmediate(r));
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const reply = v => ({ ok: true, status: 200, json: async () => v });
Object.defineProperty(global, 'localStorage', { configurable: true, value: { getItem() { return null; }, setItem() {}, removeItem() {} } });
global.document = { hidden: false, addEventListener() { }, removeEventListener() { }, activeElement: null, createElement() { return { width: 0, height: 0, getContext: () => ({ drawImage() { } }), toDataURL: () => 'data:image/webp;base64,abc' }; } };
global.window = { addEventListener() { }, removeEventListener() { }, innerWidth: 1000, innerHeight: 800 };
global.ResizeObserver = class {
    observe() { }
    disconnect() { }
};
const store = load(root + '/src/stores/useTacticalMapStore.ts').useTacticalMapStore;
const scene = id => ({ id, name: id, tokens: [], walls: [], drawings: [], terrain: [], hexSize: 40, grid: false, environment: { visible: [] }, combat: { active: false, order: [], index: 0, actions: {}, log: [] } });
const view = id => ({ self: { id: 'gm', role: 'admin' }, revision: 1, scene: scene(id), scenes: [], activeSceneId: id });
async function setup() { global.fetch = async () => reply(view('a')); let disconnect = store.getState().connect(); await tick(); store.setState({ view: view('a'), pending: 0 }); return disconnect; }
async function testUpload(cancel) { hooks = []; const disconnect = await setup(), bitmap = deferred(), posts = []; global.createImageBitmap = () => bitmap.promise; global.fetch = async (url, options) => { if (options?.method === 'POST')
    posts.push(JSON.parse(options.body)); return reply(view('a')); }; const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace; const tree = render(() => Workspace()); const input = find(tree, n => n.type === 'input' && n.props.type === 'file'); input.props.onChange({ target: { files: [{ type: 'image/png', size: 12 }], value: 'file' } }); let reconnect; if (cancel) {
    unmount();
    disconnect();
    reconnect = await setup();
    global.fetch = async (url, options) => { if (options?.method === 'POST')
        posts.push(JSON.parse(options.body)); return reply(view('a')); };
}
else
    store.getState().selectScene('b'); bitmap.resolve({ width: 10, height: 10, close() { } }); await tick(); await tick(); assert.equal(posts.filter(p => p.command.type === 'setImage').length, 0, 'obsolete decoded upload must not post'); if (!cancel)
    unmount(); disconnect(); reconnect?.(); }
async function testMoves() { const disconnect = await setup(); let v = view('a'); v.self = { id: 'owner', role: 'player' }; v.scene.tokens = [{ id: 'token', name: 'Token', hp: 10, maxHp: 10, elevation: 0, vision: 10, ownerId: 'owner', q: 0, r: 0 }]; store.setState({ view: v, selectedTokenId: 'token' }); let gate = deferred(), posts = []; global.fetch = async (_, options) => { let body = JSON.parse(options.body); posts.push(body); if (posts.length === 1)
    await gate.promise; v = { ...v, scene: { ...v.scene, tokens: [{ ...v.scene.tokens[0], q: body.command.q, r: body.command.r }] } }; return reply(v); }; hooks = []; const Board = load(root + '/src/components/map/TacticalBoard.tsx').TacticalBoard; const tree = render(() => Board({ scene: v.scene, view: v, tool: 'select', settings: {}, onPlace() { }, onWall() { }, onDrawing() { } })); for (let i = 0; i < 3; i++)
    tree.props.onKeyDown({ key: 'ArrowRight', preventDefault() { }, stopPropagation() { } }); await tick(); gate.resolve(); await tick(); await tick(); assert.deepEqual(posts.map(p => p.command.q), [1, 2, 3], 'queued arrows must resolve from confirmed position'); disconnect(); }
async function testTurn() { let disconnect = await setup(), v = view('a'); v.self = { id: 'owner', role: 'player' }; v.scene.tokens = [{ id: 'token', name: 'Token', hp: 10, maxHp: 10, elevation: 0, vision: 10, ownerId: 'owner', q: 0, r: 0 }]; v.scene.combat = { ...v.scene.combat, active: true, order: ['other'], index: 0 }; store.setState({ view: v, selectedTokenId: 'token' }); let posts = []; global.fetch = async (_, o) => { posts.push(o); return reply(v); }; hooks = []; const Board = load(root + '/src/components/map/TacticalBoard.tsx').TacticalBoard; render(() => Board({ scene: v.scene, view: v, tool: 'select', settings: {}, onPlace() { }, onWall() { }, onDrawing() { } })).props.onKeyDown({ key: 'ArrowRight', preventDefault() { }, stopPropagation() { } }); await tick(); assert.equal(posts.length, 0, 'out of turn arrows must not send'); disconnect(); }
const chars = load(root + '/src/stores/useCharacterStore.ts').useCharacterStore;
function seedChars() { let a = { id: 'a', name: 'A', hpCurrent: 10, hpMax: 20, tempHp: 0, attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10, CYB: 10 }, skillProficiencies: {}, featuresAndTraits: [], inventory: [], secondaryClasses: [], level: 1, proficiencyBonus: 2 }, b = { ...a, id: 'b', name: 'B' }; chars.setState({ characters: [a, b] }); return [a, b]; }
function unmount() { for (const h of hooks)
    h?.cleanup?.(); hooks = []; effects = []; }
async function testWall(atomic) { hooks = []; const disconnect = await setup(), Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace; const v = view('a'); v.scene.walls = [{ id: 'wall-a', a: { x: 0, y: 0 }, b: { x: 1, y: 1 }, height: 2, blocksMovement: true, blocksVision: true }, { id: 'wall-b', a: { x: 0, y: 0 }, b: { x: 2, y: 2 }, height: 8, blocksMovement: false, blocksVision: false }]; store.setState({ view: v }); let tree = render(() => Workspace()); find(tree, n => n.type?.name === 'TacticalBoard').props.onWall('wall-a'); tree = render(() => Workspace()); const editor = find(tree, n => n.props?.className?.includes('wallEditor')); if (!atomic) {
    assert.equal(editor.key, 'wall-a', 'wall drafts must have identity key');
    assert.equal(find(tree, n => n.type?.name === 'TacticalFloatingWindow' && n.props.id === 'tactical-wall').props.open, true, 'selected walls open a movable editor');
    find(tree, n => n.type?.name === 'TacticalBoard').props.onWall('wall-b');
    tree = render(() => Workspace());
    assert.equal(find(tree, n => n.props?.className?.includes('wallEditor')).key, 'wall-b');
}
else {
    let posts = [];
    global.FormData = class {
        get() { return '6'; }
        has() { return true; }
    };
    global.fetch = async (_, o) => { if (o?.method === 'POST')
        posts.push(JSON.parse(o.body).command); return reply(v); };
    find(editor, n => n.type === 'form').props.onSubmit({ preventDefault() { }, currentTarget: {} });
    await tick();
    await tick();
    assert.deepEqual(posts, [{ type: 'updateWall', id: 'wall-a', patch: { height: 6, blocksMovement: true, blocksVision: true } }], 'wall edit must be single atomic command');
} unmount(); disconnect(); }
async function testSelection() { hooks = []; const disconnect = await setup(); seedChars(); let v = view('a'); v.scene.tokens = [{ id: 'token-a', characterId: 'a', ownerId: 'gm', name: 'A' }, { id: 'token-b', characterId: 'b', ownerId: 'gm', name: 'B' }]; v.scene.combat = { ...v.scene.combat, active: true, order: ['token-a', 'token-b'], actions: { 'token-a': { movement: true }, 'token-b': { movement: false } } }; store.setState({ view: v, selectedTokenId: 'token-a' }); const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace; let tree = render(() => Workspace()); tree = render(() => Workspace()); find(tree, n => n.props?.label === 'Abrir ficha flutuante do personagem').props.onClick(); tree = render(() => Workspace()); find(tree, n => n.type?.name === 'TacticalCharacterWindow').props.onSelect('b'); tree = render(() => Workspace()); assert.equal(store.getState().selectedTokenId, 'token-b', 'sheet selection must select matching B token'); chars.setState(s => ({ characters: s.characters.map(c => ({ ...c })) })); tree = render(() => Workspace()); tree = render(() => Workspace()); assert.equal(find(tree, n => n.props?.['aria-label'] === 'Personagem da barra de ações').props.value, 'b', 'old token polling must not reset B selection'); const light = find(tree, n => n.props?.['aria-label']?.startsWith('Movimento:')); assert.ok(light.props['aria-label'].includes('gasta'), 'resources must be from B'); unmount(); disconnect(); }
async function testHP(cancel) { hooks = []; const disconnect = await setup(); const [a, b] = seedChars(), stale = deferred(), post = deferred(); let reads = 0; global.fetch = async (url, o) => { if (url === '/api/characters') {
    if (o?.method === 'POST') {
        if (cancel)
            await post.promise;
        return reply({ success: true });
    }
    if (reads++ === 0)
        return stale.promise;
    return reply({ characters: [{ ...a, hpCurrent: 7 }, b] });
} return reply(view('a')); }; const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace; render(() => Workspace()); const workspaceHooks = hooks; hooks = []; const Sheet = load(root + '/src/components/map/TacticalCharacterWindow.tsx').TacticalCharacterWindow; const renderSheet = () => render(() => Sheet({ characterId: 'a', onSelect() { }, onClose() { } })); let tree = renderSheet(); find(tree, n => n.type === 'button' && n.props.children === 'Editar vida / HP temporário').props.onClick(); tree = renderSheet(); find(tree, n => n.type === 'input' && n.props.max === 20).props.onChange({ target: { value: '7' } }); tree = renderSheet(); find(tree, n => n.type === 'form').props.onSubmit({ preventDefault() { } }); await tick(); if (cancel) {
    unmount();
    post.resolve();
    await tick();
    await tick();
    assert.equal(chars.getState().characters[0].hpCurrent, 10, 'unmounted save must not apply confirmation');
}
else {
    await tick();
    assert.equal(chars.getState().characters[0].hpCurrent, 7, 'saved HP confirmed');
    stale.resolve(reply({ characters: [a, b] }));
    await tick();
    await tick();
    assert.equal(chars.getState().characters[0].hpCurrent, 7, 'delayed old poll must not overwrite confirmed HP');
    unmount();
} hooks = workspaceHooks; unmount(); disconnect(); }
async function testPointer() { const disconnect = await setup(), v = view('a'); hooks = []; const Board = load(root + '/src/components/map/TacticalBoard.tsx').TacticalBoard; let tree = render(() => Board({ scene: v.scene, view: v, tool: 'wall', settings: { height: 2 }, onPlace() { }, onWall() { }, onDrawing() { } })); const target = { focus() { }, setPointerCapture() { }, getBoundingClientRect() { return { left: 0, top: 0 }; } }; hooks[0].current = target; const event = { button: 0, pointerId: 1, clientX: 10, clientY: 10, preventDefault() { }, currentTarget: target, target: { closest() { return null; } } }; tree.props.onPointerDown(event); tree.props.onPointerCancel(); let posts = []; global.fetch = async (_, o) => { posts.push(o); return reply(v); }; tree.props.onPointerDown({ ...event, clientX: 50 }); await tick(); assert.equal(posts.length, 0, 'canceled wall anchor must not create a wall'); assert.equal(typeof tree.props.onLostPointerCapture, 'function', 'lost capture must clean gesture'); disconnect(); }
async function testStale() { hooks = []; const disconnect = await setup(); store.setState({ error: 'offline' }); const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace; const tree = render(() => Workspace()); assert.notEqual(find(tree, n => n.props?.className === 'sync').props.children, 'LIVE', 'error must not show LIVE'); unmount(); disconnect(); }
async function testDuplicateToken(sheetRoll) {
    hooks = []; const disconnect = await setup(); const [a, b] = seedChars();
    chars.setState({ characters: [{ ...a, primaryWeapon: { id: 'weapon', name: 'Weapon', baseDamage: '1d6' }, featuresAndTraits: ['Feat'], inventory: [{ id: 'item', name: 'Item', quantity: 1 }], classId: 'test' }, b] });
    load(root + '/src/stores/useCompendiumStore.ts').useCompendiumStore.setState({ classes: [{ id: 'test', classFeatures: [{ level: 1, name: 'Ability', desc: 'Ability' }], subclasses: [] }] });
    let v = view('a'); v.self = { id: 'owner', role: 'player' };
    v.scene.tokens = [{ id: 'first-a', characterId: 'a', ownerId: 'owner', name: 'First' }, { id: 'second-a', characterId: 'a', ownerId: 'owner', name: 'Second' }, { id: 'other-a', characterId: 'a', ownerId: 'other', name: 'Other' }];
    v.scene.combat = { ...v.scene.combat, active: true, order: ['second-a'], actions: { 'first-a': { main: false }, 'second-a': { main: true } } };
    store.setState({ view: v, selectedTokenId: 'second-a' });
    global.fetch = async url => reply(url === '/api/characters' ? { characters: chars.getState().characters } : v);
    const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace;
    let tree = render(() => Workspace()); tree = render(() => Workspace());
    if (!sheetRoll) {
        assert.ok(find(tree, n => n.props?.['aria-label']?.startsWith('Ação principal:')).props['aria-label'].includes('disponível'));
        for (const name of ['Weapon', 'Feat', 'Ability', 'Item']) {
            find(tree, n => n.props?.['aria-label'] === 'Ver ação ' + name).props.onClick(); tree = render(() => Workspace());
            const dialog = find(tree, n => n.type?.name === 'TacticalActionDialog');
            assert.equal(dialog.props.tokenId, 'second-a', name + ' must use selected duplicate token'); dialog.props.onClose(); tree = render(() => Workspace());
        }
        store.setState({ selectedTokenId: 'other-a' }); tree = render(() => Workspace()); tree = render(() => Workspace());
        find(tree, n => n.props?.['aria-label'] === 'Ver ação Weapon').props.onClick(); tree = render(() => Workspace());
        assert.equal(find(tree, n => n.type?.name === 'TacticalActionDialog').props.tokenId, 'first-a', 'foreign selection must fall back to owned token');
    } else {
        find(tree, n => n.props?.label === 'Abrir ficha flutuante do personagem').props.onClick(); tree = render(() => Workspace());
        const sheet = find(tree, n => n.type?.name === 'TacticalCharacterWindow'); const workspaceHooks = hooks; hooks = [];
        let posts = []; global.fetch = async (url, o) => { if (o?.method === 'POST') posts.push(JSON.parse(o.body).command); return reply(url === '/api/characters' ? { characters: chars.getState().characters } : v); };
        let sheetTree = render(() => sheet.type(sheet.props));
        find(sheetTree, n => n.props?.['aria-label'] === 'Rolar teste de STR').props.onClick(); await tick(); await tick();
        assert.equal(posts[0].tokenId, 'second-a', 'sheet attribute roll must use selected duplicate token');

        find(sheetTree, n => n.type === 'button' && n.props.children === 'Perícias').props.onClick(); sheetTree = render(() => sheet.type(sheet.props));
        find(sheetTree, n => n.type === 'button' && n.props?.['aria-label']?.startsWith('Rolar ')).props.onClick(); await tick(); await tick();
        assert.equal(posts[1].tokenId, 'second-a', 'sheet skill roll must use selected duplicate token');
        store.setState({ selectedTokenId: 'other-a' }); sheetTree = render(() => sheet.type(sheet.props));
        find(sheetTree, n => n.type === 'button' && n.props?.['aria-label']?.startsWith('Rolar ')).props.onClick(); await tick(); await tick();
        assert.equal(posts[2].tokenId, 'first-a', 'sheet must fall back to owned token');
        unmount(); hooks = workspaceHooks;
    }
    unmount(); disconnect();
}
async function testLateSelection() {
    hooks = []; const disconnect = await setup(); const records = seedChars(); chars.setState({ characters: [] });
    const v = view('a'); v.scene.tokens = [{ id: 'token-a', characterId: 'a', ownerId: 'gm' }, { id: 'token-b', characterId: 'b', ownerId: 'gm' }, { id: 'npc', name: 'NPC', ownerId: 'gm' }];
    store.setState({ view: v, selectedTokenId: 'token-b' });
    const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace;
    const selected = tree => find(tree, n => n.props?.['aria-label'] === 'Personagem da barra de ações').props.value;
    render(() => Workspace()); chars.setState({ characters: records }); render(() => Workspace()); let tree = render(() => Workspace());
    assert.equal(selected(tree), 'b', 'late records must honor selected B token, not default A');
    store.setState({ selectedTokenId: 'npc' }); render(() => Workspace()); chars.setState({ characters: records.map(c => ({ ...c })) }); tree = render(() => Workspace());
    assert.equal(selected(tree), 'b', 'NPC selection must preserve existing sheet');
    chars.setState({ characters: [records[0]] }); render(() => Workspace()); tree = render(() => Workspace());
    assert.equal(selected(tree), 'a', 'deleted selected character must fall back');
    chars.setState({ characters: [] }); render(() => Workspace()); tree = render(() => Workspace());
    assert.equal(selected(tree), '', 'deleting all characters must clear stale selection');
    unmount(); disconnect();
}
async function testHudWindows() {
    hooks = []; const disconnect = await setup(); const v = view('a'); v.scene.combat.active = true;
    store.setState({ view: v });
    const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace;
    let tree = render(() => Workspace());
    const launch = find(tree, n => n.props?.label === 'Abrir iniciativa');
    assert.ok(launch, 'initiative must have an icon-only on-demand HUD launcher');
    assert.equal(launch.props.expanded, false, 'initiative is closed initially, even in combat');
    assert.ok(find(tree, n => n.props?.['aria-label'] === 'Controles da mesa'), 'bottom HUD groups map controls');
    launch.props.onClick(); tree = render(() => Workspace());
    const win = find(tree, n => n.type?.name === 'TacticalFloatingWindow' && n.props.title === 'Iniciativa');
    assert.equal(win.props.open, true, 'HUD click opens the initiative window');
    win.props.onClose(); tree = render(() => Workspace());
    assert.equal(find(tree, n => n.props?.label === 'Abrir iniciativa').props.expanded, false, 'close resets launcher state');
    const library = find(tree, n => n.props?.label === 'Abrir biblioteca do mestre');
    assert.equal(library.props.expanded, false, 'library must not occupy map by default');
    library.props.onClick(); tree = render(() => Workspace());
    assert.equal(find(tree, n => n.type?.name === 'TacticalFloatingWindow' && n.props.title === 'Biblioteca do mestre').props.open, true);
    unmount(); disconnect();
}
async function testFloatingWindow() {
    hooks = []; const Window = load(root + '/src/components/map/TacticalFloatingWindow.tsx').TacticalFloatingWindow;
    let closed = 0; const props = { id: 'test-window', title: 'Test', open: true, onClose() { closed++; }, children: 'Content' };
    let tree = render(() => Window(props));
    let handle = find(tree, n => n.type === 'header');
    assert.equal(handle.props.tabIndex, 0, 'window titlebar must be keyboard reachable');
    assert.equal(typeof handle.props.onKeyDown, 'function', 'arrow keys must move window');
    const initial = tree.props.style.left;
    const event = key => ({ key, target: handle, currentTarget: handle, preventDefault() {}, stopPropagation() {} });
    handle.props.onKeyDown(event('ArrowRight')); tree = render(() => Window(props));
    assert.equal(tree.props.style.left, initial + 8, 'arrow moves window by 8 px');
    handle = find(tree, n => n.type === 'header');
    let captured = false, released = false;
    const target = { setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; released = true; } };
    handle.props.onPointerDown({ button: 0, pointerId: 1, clientX: 100, clientY: 100, currentTarget: target, target: { closest() { return null; } }, preventDefault() {} });
    assert.ok(captured, 'drag must capture pointer');
    handle.props.onPointerMove({ pointerId: 1, clientX: 140, clientY: 130 }); tree = render(() => Window(props));
    assert.equal(tree.props.style.left, initial + 48, 'pointer drag follows movement');
    handle = find(tree, n => n.type === 'header'); handle.props.onPointerCancel({ pointerId: 1, currentTarget: target });
    assert.ok(released, 'cancel must release pointer capture');
    const x = tree.props.style.left;
    handle.props.onPointerMove({ pointerId: 1, clientX: 900, clientY: 100 }); tree = render(() => Window(props));
    assert.equal(tree.props.style.left, x, 'cancelled drag cannot keep moving');
    tree.props.onKeyDown({ key: 'Escape', preventDefault() {}, stopPropagation() {} }); assert.equal(closed, 1, 'Escape closes focused window');
    unmount();
}
async function testMapNavigation() {
    hooks = []; const auth = load(root + '/src/stores/useAuthStore.ts').useAuthStore;
    const nav = load(root + '/src/stores/useNavigationStore.ts').useNavigationStore;
    auth.setState({ user: { id: 'gm', role: 'admin', username: 'GM' }, hasCheckedSession: true, checkSession: async () => {} });
    load(root + '/src/stores/useCompendiumStore.ts').useCompendiumStore.setState({ fetchCompendium: async () => {} });
    nav.getState().selectView('map');
    const Shell = load(root + '/src/components/layout/TacticalAppShell.tsx').TacticalAppShell;
    let tree = render(() => Shell()); find(tree, n => n.type?.name === 'TacticalLoader').props.onComplete(); tree = render(() => Shell());
    assert.ok(find(tree, n => n.type?.name === 'TacticalWheel'), 'map keeps the requested tactical wheel available');
    assert.equal(find(tree, n => n.type?.name === 'TacticalUserBadge'), undefined, 'map must not collide with global bottom badge');
    nav.getState().selectView('grimoire'); tree = render(() => Shell());
    assert.ok(find(tree, n => n.type?.name === 'TacticalWheel'), 'other views keep global navigation'); unmount();
    hooks = []; const disconnect = await setup();
    const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace;
    tree = render(() => Workspace()); const button = find(tree, n => n.props?.label === 'Abrir compêndio');
    assert.ok(button, 'map has replacement app-level navigation in HUD'); button.props.onClick(); assert.equal(nav.getState().activeView, 'grimoire');
    assert.ok(find(tree, n => n.props?.label === 'Sair da conta'), 'logout remains reachable in HUD');
    unmount(); disconnect();
}
async function testLayoutFixture() {
    if (!process.env.CODAK_UI_FIXTURE_PATH) return;
    hooks = []; const disconnect = await setup(); seedChars();
    const v = view('a'); v.scene.width = 1200; v.scene.height = 800;
    v.scene.combat = { ...v.scene.combat, active: true, round: 1 }; store.setState({ view: v });
    const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace;
    let tree = render(() => Workspace()); tree = render(() => Workspace());
    if (process.env.CODAK_UI_FIXTURE_OPEN) {
        find(tree, n => n.props?.label === process.env.CODAK_UI_FIXTURE_OPEN).props.onClick(); tree = render(() => Workspace());
    }
    const html = require(root + '/node_modules/react-dom/server').renderToStaticMarkup(tree);
    const css = fs.readFileSync(root + '/src/components/map/tactical-map.module.css', 'utf8');
    fs.writeFileSync(process.env.CODAK_UI_FIXTURE_PATH, '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}' + css + '</style><body>' + html + '</body></html>');
    unmount(); disconnect();
}
async function testDialogWindow() {
    hooks = []; const Dialog = load(root + '/src/components/map/TacticalCharacterWindow.tsx').TacticalDialog;
    const tree = render(() => Dialog({ title: 'Configurar cena', onClose() {}, children: 'Form' }));
    assert.equal(tree.type?.name, 'TacticalFloatingWindow', 'forms must use the same freely movable non-modal window');
    assert.equal(tree.props.open, true);
    unmount();
}
async function testSheetBounds() {
    hooks = []; seedChars(); const Sheet = load(root + '/src/components/map/TacticalCharacterWindow.tsx').TacticalCharacterWindow;
    const props = { characterId: 'a', onSelect() {}, onClose() {} };
    let tree = render(() => Sheet(props)); tree = render(() => Sheet(props));
    const map = { getBoundingClientRect() { return { width: 390, height: 844, top: 0 }; }, querySelector() { return { getBoundingClientRect() { return { top: 648 }; } }; } };
    tree.ref.current = { closest() { return map; }, focus() {} };
    let handle = find(tree, n => n.type === 'header');
    handle.props.onKeyDown({ key: 'ArrowRight', target: handle, currentTarget: handle, preventDefault() {}, stopPropagation() {} });
    tree = render(() => Sheet(props));
    assert.ok(tree.props.style.top + tree.props.style.height <= 636, 'character window must stay above wrapped bottom HUD');
    handle = find(tree, n => n.type === 'header');
    assert.equal(typeof handle.props.onLostPointerCapture, 'function', 'character drag must clean up lost pointer capture');
    unmount();
}
async function testTokenAppearance() {
    hooks = []; const v = view('a'); v.scene.tokens = [{ id: 'token', name: 'Token', kind: 'player', ownerId: 'gm', hp: 10, maxHp: 10, elevation: 0, vision: 10, color: '#22c55e', q: 0, r: 0 }];
    store.setState({ view: v, selectedTokenId: 'token' });
    const Board = load(root + '/src/components/map/TacticalBoard.tsx').TacticalBoard;
    const tree = render(() => Board({ scene: v.scene, view: v, tool: 'select', settings: {}, onPlace() {}, onWall() {}, onDrawing() {} }));
    const token = find(tree, n => n.props?.['data-token'] === 'token');
    assert.equal(token.props['aria-pressed'], true, 'selected token exposes its state');
    const ring = find(token, n => n.props?.className === 'tokenSelection');
    assert.ok(ring, 'selected token has an independent red ring, not a replacement colored border');
    const face = find(token, n => n.props?.className === 'tokenFace');
    assert.ok(face, 'token base has a neutral outlined face');
    assert.equal(find(token, n => n.props?.className === 'tokenColor').props.fill, '#22c55e', 'custom token color is retained as a restrained marker');
    unmount();
}
async function testWindowStack() {
    hooks = []; const Window = load(root + '/src/components/map/TacticalFloatingWindow.tsx').TacticalFloatingWindow;
    const listeners = new Set(), originalAdd = window.addEventListener, originalRemove = window.removeEventListener;
    window.addEventListener = (name, fn) => { if (name === 'keydown') listeners.add(fn); };
    window.removeEventListener = (name, fn) => { if (name === 'keydown') listeners.delete(fn); };
    let closed = [];
    render(() => Window({ id: 'first', title: 'First', open: true, onClose() { closed.push('first'); }, children: null })); const firstHooks = hooks; hooks = [];
    render(() => Window({ id: 'second', title: 'Second', open: true, onClose() { closed.push('second'); }, children: null }));
    const escape = () => { const e = { key: 'Escape', defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; for (const fn of listeners) fn(e); };
    escape(); assert.deepEqual(closed, ['second'], 'Escape closes only top window'); unmount();
    hooks = firstHooks; escape(); assert.deepEqual(closed, ['second', 'first'], 'Escape can close the remaining window after top closes');
    unmount(); window.addEventListener = originalAdd; window.removeEventListener = originalRemove;
}
const tests = { windowstack: testWindowStack, tokenappearance: testTokenAppearance, sheetbounds: testSheetBounds, dialogwindow: testDialogWindow, layoutfixture: testLayoutFixture, mapnavigation: testMapNavigation, floatingwindow: testFloatingWindow, hudwindows: testHudWindows, duplicateaction: () => testDuplicateToken(false), duplicateroll: () => testDuplicateToken(true), lateselection: testLateSelection, pointer: testPointer, stale: testStale, upload: () => testUpload(false), session: () => testUpload(true), moves: testMoves, turn: testTurn, wallkey: () => testWall(false), wallatomic: () => testWall(true), selection: testSelection, hp: () => testHP(false), savecancel: () => testHP(true) };
tests.deletehud = async () => {
    hooks = []; const disconnect = await setup();
    const Workspace = load(root + '/src/components/map/TacticalWorkspace.tsx').TacticalWorkspace;
    const nav = load(root + '/src/stores/useNavigationStore.ts').useNavigationStore;
    let v = view('a'), posts = [];
    v.scene.drawings = [{ id: 'drawing', ownerId: 'owner', kind: 'line', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], color: '#ffffff' }];
    global.fetch = async (_, o) => { if (o?.method === 'POST') posts.push(JSON.parse(o.body).command); return reply(v); };
    store.setState({ view: v, pending: 0 });
    let tree = render(() => Workspace());
    find(tree, n => n.type?.name === 'TacticalBoard').props.onDrawing('drawing');
    tree = render(() => Workspace());
    let del = find(tree, n => n.props?.label?.startsWith('Excluir seleção'));
    assert.equal(del.props.disabled, false, 'GM can delete another user drawing');
    del.props.onClick(); await tick(); await tick();
    assert.deepEqual(posts[0], { type: 'removeDrawing', id: 'drawing' });
    v = { ...v, self: { id: 'stranger', role: 'player' } }; store.setState({ view: v, pending: 0 });
    tree = render(() => Workspace()); find(tree, n => n.type?.name === 'TacticalBoard').props.onDrawing('drawing');
    tree = render(() => Workspace()); del = find(tree, n => n.props?.label?.startsWith('Excluir seleção'));
    assert.equal(del.props.disabled, true, 'players cannot delete someone else drawing');
    del.props.onClick(); await tick(); assert.equal(posts.length, 1);
    nav.getState().collapseWheel(); find(tree, n => n.props?.label === 'Abrir roda tática').props.onClick();
    assert.equal(nav.getState().isCollapsed, false);
    unmount(); disconnect();
};
if(process.argv.length===2){
  const {spawnSync}=require('node:child_process');
  let failed=false;
  for(const name of Object.keys(tests)){
    const result=spawnSync(process.execPath,[__filename,name],{stdio:'inherit',env:process.env});
    if(result.status!==0)failed=true;
  }
  process.exit(failed?1:0);
}
(async () => { let failed = false; for (let name of process.argv.slice(2)) {
    try {
        await tests[name]();
        console.log('PASS ' + name);
    }
    catch (e) {
        failed = true;
        console.error('FAIL ' + name + ': ' + e.stack);
    }
} process.exit(failed ? 1 : 0); })();