'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Grip, X } from 'lucide-react';
import styles from './tactical-map.module.css';
let nextLayer = 30;
let topWindow: string | null = null;
let openWindows:string[]=[];
const OFFSETS: Record<string, number> = { 'tactical-scene': 0, 'tactical-initiative': 1, 'tactical-library': 2, 'tactical-actions': 3, 'tactical-log': 4 };
/** Non-modal, movable windows; closing retains drafts and local position. */
export function TacticalFloatingWindow({ id, title, open, onClose, children }: {
    id: string;
    title: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const root = useRef<HTMLElement>(null), handle = useRef<HTMLElement>(null);
    const drag = useRef<{
        pointerId: number;
        x: number;
        y: number;
        left: number;
        top: number;
        target: HTMLElement;
    } | null>(null);
    const [position, setPosition] = useState({ x: 32 + (OFFSETS[id] || 0) * 24, y: 32 + (OFFSETS[id] || 0) * 24 });
    const [layer, setLayer] = useState(30), [limit, setLimit] = useState(600);
    const close = useRef(onClose);
    close.current = onClose;
    const constrain = (p: typeof position) => {
        const map = root.current?.closest('[data-testid="tactical-map"]'), bounds = map?.getBoundingClientRect();
        const width = bounds?.width || window.innerWidth, height = bounds?.height || window.innerHeight;
        const hud = map?.querySelector('[aria-label="Controles da mesa"]')?.getBoundingClientRect();
        const available = hud ? hud.top - (bounds?.top || 0) - 12 : height - 120;
        return { x: Math.max(8, Math.min(p.x, width - (root.current?.offsetWidth || Math.min(320, width - 16)) - 8)), y: Math.max(8, Math.min(p.y, available - (root.current?.offsetHeight || 240))) };
    };
    const release = () => { const d = drag.current; drag.current = null; if (d?.target.hasPointerCapture(d.pointerId))
        d.target.releasePointerCapture(d.pointerId); };
    const raise = () => { openWindows=[...openWindows.filter(value=>value!==id),id]; topWindow = id; setLayer(++nextLayer); };
    useEffect(() => {
        if (!open)
            return;
        const before = document.activeElement as HTMLElement | null;
        raise();
        const fit = () => {
            const map = root.current?.closest('[data-testid="tactical-map"]'), bounds = map?.getBoundingClientRect();
            const hud = map?.querySelector('[aria-label="Controles da mesa"]')?.getBoundingClientRect();
            setLimit(Math.max(96, (hud ? hud.top - (bounds?.top || 0) : window.innerHeight - 120) - 20));
            setPosition(constrain);
        };
        fit();
        handle.current?.focus({ preventScroll: true });
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented && topWindow === id) {
            event.preventDefault();
            close.current();
        } };
        window.addEventListener('resize', fit);
        window.addEventListener('keydown', escape);
        const observer = new ResizeObserver(fit);
        const map = root.current?.closest('[data-testid="tactical-map"]');
        if (map)
            observer.observe(map);
        const hud = map?.querySelector('[aria-label="Controles da mesa"]');
        if (hud)
            observer.observe(hud);
        return () => { release(); observer.disconnect(); window.removeEventListener('resize', fit); window.removeEventListener('keydown', escape); openWindows=openWindows.filter(value=>value!==id); topWindow=openWindows[openWindows.length-1] || null; const launcher = document.querySelector?.(`[aria-controls="${id}"]`) as HTMLElement | null; (launcher || before)?.focus?.({ preventScroll: true }); };
    }, [open, id]);
    const begin = (event: React.PointerEvent<HTMLElement>) => {
        if (event.button !== 0 || (event.target as HTMLElement).closest('button,input,select'))
            return;
        raise();
        release();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: position.x, top: position.y, target: event.currentTarget };
        event.preventDefault();
    };
    const move = (event: React.PointerEvent) => { const d = drag.current; if (!d || d.pointerId !== event.pointerId)
        return; setPosition(constrain({ x: d.left + event.clientX - d.x, y: d.top + event.clientY - d.y })); };
    const key = (event: React.KeyboardEvent) => {
        if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
            return;
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? 32 : 8;
        setPosition(p => constrain({ x: p.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), y: p.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0) }));
    };
    return <section ref={root} id={id} hidden={!open} role="dialog" aria-modal="false" aria-label={title} className={styles.floatingWindow} style={{ left: position.x, top: position.y, zIndex: layer, maxHeight: limit }} onPointerDownCapture={raise} onFocusCapture={raise} onKeyDown={event => { if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
    } }}>
    <header ref={handle} tabIndex={0} aria-label={`Mover janela ${title}. Arraste ou use as setas.`} className={styles.windowTitlebar} onKeyDown={key} onPointerDown={begin} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><Grip size={16}/><h2>{title}</h2><button type="button" aria-label={`Fechar ${title}`} title={`Fechar ${title}`} onClick={onClose}><X size={18}/></button></header>
    <div className={styles.floatingContent}>{children}</div>
  </section>;
}
