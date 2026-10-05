'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, Grip, Maximize2, Dices } from 'lucide-react';
import { useCharacterStore, calculateTotalAttributes, computeSkillBonus, formatModifier, getAttributeModifier } from '@/stores/useCharacterStore';
import { useCompendiumStore } from '@/stores/useCompendiumStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useTacticalMapStore } from '@/stores/useTacticalMapStore';
import { CODAK_SKILLS, CoreAttribute } from '@/types/codak-rules';
import { characterActions, clampWindow } from './TacticalUiLogic';
import { saveTacticalCharacter } from './TacticalCharacterTransport';
import { TacticalFloatingWindow } from './TacticalFloatingWindow';
import styles from './tactical-map.module.css';
export function TacticalDialog({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const error = useTacticalMapStore(state => state.error);
    return <TacticalFloatingWindow id="tactical-form" title={title} open onClose={onClose}><div className={styles.formContent}>{error && <p role="alert" className={styles.errorText}>{error}</p>}{children}</div></TacticalFloatingWindow>;
}
export function TacticalCharacterWindow({ characterId, onSelect, onClose }: {
    characterId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    const { characters } = useCharacterStore();
    const compendium = useCompendiumStore();
    const { dict } = useLocaleStore();
    const { view, selectedTokenId, send, error: networkError } = useTacticalMapStore();
    const char = characters.find(c => c.id === characterId);
    const [tab, setTab] = useState('status');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [vitals, setVitals] = useState({ hpCurrent: char?.hpCurrent || 0, tempHp: char?.tempHp || 0 });
    const [rect, setRect] = useState({ x: 76, y: 84, width: 560, height: 640 });
    const root = useRef<HTMLDivElement>(null);
    const drag = useRef<{
        x: number;
        y: number;
        rect: typeof rect;
        resize: boolean;
        target: HTMLElement;
        pointerId: number;
    } | null>(null);
    const saveController = useRef<AbortController | null>(null);
    const fitRect = (value: typeof rect) => {
        const map = root.current?.closest('[data-testid="tactical-map"]'), bounds = map?.getBoundingClientRect();
        const hud = map?.querySelector('[aria-label="Controles da mesa"]')?.getBoundingClientRect();
        return clampWindow(value, bounds?.width || window.innerWidth, Math.max(96, hud ? hud.top - (bounds?.top || 0) - 12 : window.innerHeight - 120));
    };
    const release = () => { const d = drag.current; drag.current = null; if (d?.target.hasPointerCapture(d.pointerId))
        d.target.releasePointerCapture(d.pointerId); };
    useEffect(() => { setSaving(false); return () => { saveController.current?.abort(); saveController.current = null; }; }, [characterId]);
    useEffect(() => { const before = document.activeElement as HTMLElement; root.current?.focus(); const fit = () => setRect(fitRect); fit(); window.addEventListener('resize', fit); const observer = new ResizeObserver(fit); const map = root.current?.closest('[data-testid="tactical-map"]'); if (map)
        observer.observe(map); const hud = map?.querySelector('[aria-label="Controles da mesa"]'); if (hud)
        observer.observe(hud); return () => { release(); observer.disconnect(); window.removeEventListener('resize', fit); before?.focus(); }; }, []);
    useEffect(() => { setEditing(false); setVitals({ hpCurrent: char?.hpCurrent || 0, tempHp: char?.tempHp || 0 }); }, [characterId]);
    if (!char)
        return <div className={styles.window} data-testid="tactical-character-window"><button onClick={onClose}>Fechar ficha</button><p>Selecione um personagem existente.</p></div>;
    const selectedToken = view?.scene?.tokens.find(t => t.id === selectedTokenId), admin = view?.self.role === 'admin';
    const token = (selectedToken?.characterId === char.id && (admin || selectedToken.ownerId === view?.self.id) ? selectedToken : null) || view?.scene?.tokens.find(t => t.characterId === char.id && (admin || t.ownerId === view?.self.id));
    const lastRoll = [...(view?.scene?.combat.log || [])].reverse().find(entry => entry.kind === 'roll' && entry.tokenId === token?.id);
    const attributes = calculateTotalAttributes(char);
    const actions = characterActions(char, compendium.classes, compendium.abilities, compendium.loreRules);
    const roll = (formula: string, label: string) => { if (!token) {
        setError('O mestre precisa posicionar o token deste personagem para registrar testes.');
        return;
    } void send({ type: 'roll', tokenId: token.id, formula, label }); };
    const begin = (event: React.PointerEvent, resize: boolean) => {
        if (!resize && (event.target as HTMLElement).closest('button,select,input'))
            return;
        release();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, y: event.clientY, rect, resize, target: event.currentTarget as HTMLElement, pointerId: event.pointerId };
        event.preventDefault();
    };
    const move = (event: React.PointerEvent) => { const d = drag.current; if (!d)
        return; const dx = event.clientX - d.x, dy = event.clientY - d.y; setRect(fitRect(d.resize ? { ...d.rect, width: d.rect.width + dx, height: d.rect.height + dy } : { ...d.rect, x: d.rect.x + dx, y: d.rect.y + dy })); };
    const save = async () => {
        if (!Number.isFinite(vitals.hpCurrent) || !Number.isFinite(vitals.tempHp)) {
            setError('Use valores numéricos finitos.');
            return;
        }
        const controller = new AbortController(), context = useTacticalMapStore.getState().captureContext();
        saveController.current?.abort();
        saveController.current = controller;
        const current = () => !controller.signal.aborted && context.isCurrent();
        const unsubscribe = useTacticalMapStore.subscribe(() => { if (!context.isCurrent())
            controller.abort(); });
        setSaving(true);
        setError(null);
        try {
            const latest = useCharacterStore.getState().characters.find(c => c.id === characterId);
            if (!latest)
                throw new Error('Personagem não encontrado.');
            const saved = await saveTacticalCharacter({ ...latest, hpCurrent: Math.max(0, Math.min(latest.hpMax, vitals.hpCurrent)), tempHp: Math.max(0, vitals.tempHp) }, controller.signal, current);
            if (saved && current())
                setEditing(false);
        }
        catch (e) {
            if (current())
                setError(e instanceof Error ? e.message : 'Falha ao salvar');
        }
        finally {
            unsubscribe();
            if (saveController.current === controller) {
                setSaving(false);
                saveController.current = null;
            }
        }
    };
    return <div ref={root} id="tactical-character" role="dialog" aria-modal="false" aria-label={`Ficha de ${char.name}`} tabIndex={-1} className={styles.window} style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }} data-testid="tactical-character-window" onKeyDown={event => { if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
    } }}>
    <header tabIndex={0} aria-label="Mover ficha. Arraste ou use as setas." onKeyDown={event => { if (event.target !== event.currentTarget || !event.key.startsWith('Arrow'))
        return; event.preventDefault(); event.stopPropagation(); setRect(fitRect({ ...rect, x: rect.x + (event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0), y: rect.y + (event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0) })); }} className={`${styles.panelHeader} ${styles.dragHandle}`} onPointerDown={event => begin(event, false)} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <Grip size={16}/><strong>FICHA / {char.name}</strong><button type="button" title="Fechar ficha" aria-label="Fechar ficha" onClick={onClose}><X size={18}/></button>
    </header>
    <div className={styles.windowBody}>
      <label>Personagem<select aria-label="Personagem da ficha" value={characterId} onChange={event => onSelect(event.target.value)}>{characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <p className={styles.telemetry}>{char.characterClass} · {char.race} · Nível {char.level}</p>
      <nav className={styles.tabs} aria-label="Seções da ficha">{[['status', 'Status'], ['skills', 'Perícias'], ['abilities', 'Habilidades'], ['items', 'Itens']].map(([id, name]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{name}</button>)}</nav>
      {(error || networkError) && <p role="alert" className={styles.errorText}>{error || networkError}</p>}
      {lastRoll && <p role="status" className={styles.rollResult}>{lastRoll.text}</p>}
      {tab === 'status' && <>
        <div className={styles.vitals}><div><span>HP</span><strong>{char.hpCurrent}/{char.hpMax}</strong></div><div><span>TEMP</span><strong>{char.tempHp}</strong></div><div><span>CA</span><strong>{char.armorClass}</strong></div><div><span>DESLOCAMENTO</span><strong>{char.speedMeters}m</strong></div></div>
        {char.resourceName && <p>{char.resourceName}: {char.resourceCurrent}/{char.resourceMax}</p>}
        <button type="button" onClick={() => { setVitals({ hpCurrent: char.hpCurrent, tempHp: char.tempHp }); setEditing(!editing); }}>Editar vida / HP temporário</button>
        {editing && <form onSubmit={event => { event.preventDefault(); void save(); }} className={styles.formGrid}><label>HP atual<input type="number" min={0} max={char.hpMax} value={vitals.hpCurrent} onChange={event => setVitals({ ...vitals, hpCurrent: Number(event.target.value) })}/></label><label>HP temporário<input type="number" min={0} value={vitals.tempHp} onChange={event => setVitals({ ...vitals, tempHp: Number(event.target.value) })}/></label><button disabled={saving} type="submit">{saving ? 'Salvando…' : 'Salvar ficha'}</button></form>}
        <h3>Atributos / testes d20</h3><div className={styles.attributeGrid}>{(Object.keys(attributes) as CoreAttribute[]).map(attr => { const bonus = getAttributeModifier(attributes[attr]); return <button key={attr} type="button" title={`Rolar teste de ${attr}`} aria-label={`Rolar teste de ${attr}`} onClick={() => roll(`1d20${formatModifier(bonus)}`, `Teste ${attr}`)}><span>{attr}</span><strong>{attributes[attr]}</strong><small>{formatModifier(bonus)}</small></button>; })}</div>
        {char.featuresAndTraits.length > 0 && <p>Talentos: {char.featuresAndTraits.join(' · ')}</p>}
      </>}
      {tab === 'skills' && <div className={styles.skillList}>{CODAK_SKILLS.map(skill => { const bonus = computeSkillBonus(skill.id, attributes, char.skillProficiencies[skill.id] || 0, char.proficiencyBonus); const label = dict.skills[skill.id as keyof typeof dict.skills] || skill.id; return <button key={skill.id} type="button" title={`Rolar ${label}`} aria-label={`Rolar ${label}`} onClick={() => roll(`1d20${formatModifier(bonus)}`, label)}><span>{label}</span><span>{skill.attribute === 'COMPOSITE_DRIVE' ? 'DEX/WIS' : skill.attribute} · {formatModifier(bonus)} <Dices size={14}/></span></button>; })}</div>}
      {tab === 'abilities' && actions.filter(a => a.category === 'ability' || a.category === 'feat').map(a => <article className={styles.ruleCard} key={a.id}><h3>{a.name}</h3><p>{a.description}</p></article>)}
      {tab === 'items' && <>{[char.primaryWeapon, char.secondaryWeapon, char.backupWeapon].filter(Boolean).map((weapon, i) => <article className={styles.ruleCard} key={i}><h3>{weapon!.name}</h3><p>{weapon!.baseDamage} · Munição {weapon!.currentAmmo}/{weapon!.ammoCapacity}</p></article>)}{char.inventory.filter(Boolean).map(item => <article className={styles.ruleCard} key={item!.id}><h3>{item!.quantity}× {item!.name}</h3><p>{item!.notes || item!.weight}</p></article>)}{!char.inventory.some(Boolean) && <p>Inventário vazio.</p>}</>}
    </div>
    <button type="button" className={styles.resizeHandle} title="Redimensionar ficha. Arraste ou use as setas." aria-label="Redimensionar ficha" onPointerDown={event => begin(event, true)} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={event => { if (!event.key.startsWith('Arrow'))
        return; event.preventDefault(); event.stopPropagation(); setRect(fitRect({ ...rect, width: rect.width + (event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0), height: rect.height + (event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0) })); }}><Maximize2 size={16}/></button>
  </div>;
}
