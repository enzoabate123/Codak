'use client';
import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import type { Point,TacticalDrawing,TacticalScene,TacticalView } from '@/types/tactical-map';
import { hexDistance,hexToPoint,pointToHex } from '@/lib/tactical-map';
import { useTacticalMapStore } from '@/stores/useTacticalMapStore';
import { canMoveToken,templatePoints,zoomAt } from './TacticalUiLogic';
import styles from './tactical-map.module.css';

export type TacticalTool='select'|'pan'|'freehand'|'ping'|'measure'|'line'|'circle'|'cone'|'rectangle'|'wall'|'height'|'reveal';
export interface ToolSettings {color:string;meters:number;width:number;height:number;blocksMovement:boolean;blocksVision:boolean}
interface Props { scene:TacticalScene;view:TacticalView;tool:TacticalTool;settings:ToolSettings;onPlace:(point:Point,id?:string)=>void;placing:boolean;onWall:(id:string)=>void;selectedDrawing:string|null;onDrawing:(id:string|null)=>void }
function polygon(center:Point,size:number) {
  const radius=size/Math.sqrt(3);
  return Array.from({length:6},(_,i)=>{const angle=(i*60-30)*Math.PI/180;return `${center.x+radius*Math.cos(angle)},${center.y+radius*Math.sin(angle)}`;}).join(' ');
}
export function TacticalShape({drawing,size,preview=false,hitArea=false}:{drawing:Pick<TacticalDrawing,'kind'|'points'|'color'>;size:number;preview?:boolean;hitArea?:boolean}) {
  const [a,b]=drawing.points;if(!a)return null;
  const common={stroke:hitArea?'transparent':drawing.color,strokeWidth:hitArea?16:2,vectorEffect:'non-scaling-stroke' as const,fill:'none',opacity:preview?.65:1,pointerEvents:hitArea?'stroke' as const:undefined};
  if(drawing.kind==='ping')return <g><circle cx={a.x} cy={a.y} r={size*.7} {...common}/><path d={`M${a.x-size} ${a.y}h${size*2}M${a.x} ${a.y-size}v${size*2}`} {...common}/></g>;
  if(drawing.kind==='circle' && b)return <circle cx={a.x} cy={a.y} r={Math.hypot(b.x-a.x,b.y-a.y)} {...common} fill={drawing.color} fillOpacity={.12}/>;
  if(drawing.kind==='rectangle' && b)return <rect x={Math.min(a.x,b.x)} y={Math.min(a.y,b.y)} width={Math.abs(a.x-b.x)} height={Math.abs(a.y-b.y)} {...common} fill={drawing.color} fillOpacity={.12}/>;
  if(drawing.kind==='cone' && b){const angle=Math.atan2(b.y-a.y,b.x-a.x),radius=Math.hypot(b.x-a.x,b.y-a.y);const sides=[a,{x:a.x+Math.cos(angle-Math.PI/6)*radius,y:a.y+Math.sin(angle-Math.PI/6)*radius},{x:a.x+Math.cos(angle+Math.PI/6)*radius,y:a.y+Math.sin(angle+Math.PI/6)*radius}];return <polygon points={sides.map(p=>`${p.x},${p.y}`).join(' ')} {...common} fill={drawing.color} fillOpacity={.12}/>;}
  return <polyline points={drawing.points.map(p=>`${p.x},${p.y}`).join(' ')} {...common} strokeLinecap="round" strokeLinejoin="round"/>;
}
export function TacticalBoard({scene,view,tool,settings,onPlace,placing,onWall,selectedDrawing,onDrawing}:Props) {
  const root=useRef<SVGSVGElement>(null);
  const {viewports,setViewport,selectedTokenId,selectToken,send,moveTokenBy}=useTacticalMapStore();
  const viewport=viewports[scene.id] || {x:100,y:150,scale:1};
  const viewportRef=useRef(viewport);viewportRef.current=viewport;
  const [size,setSize]=useState({width:1,height:1});
  const [preview,setPreview]=useState<Point[]>([]);
  const [dragToken,setDragToken]=useState<{id:string;point:Point}|null>(null);
  const wallStart=useRef<Point|null>(null);
  const pointers=useRef(new Map<number,Point>());
  const gesture=useRef<{start:Point;last:Point;world:Point;tokenId?:string;points:Point[];moved:boolean}|null>(null);
  const admin=view.self.role==='admin';
  const maskId=`fog-${useId().replace(/:/g,'')}`;
  useEffect(()=>{
    const node=root.current;if(!node)return;
    const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({width:r.width,height:r.height});});observer.observe(node);
    const wheel=(event:WheelEvent)=>{event.preventDefault();event.stopPropagation();const r=node.getBoundingClientRect();setViewport(scene.id,zoomAt(viewportRef.current,{x:event.clientX-r.left,y:event.clientY-r.top},viewportRef.current.scale*Math.exp(-event.deltaY*.0015)));};
    node.addEventListener('wheel',wheel,{passive:false});
    return()=>{observer.disconnect();node.removeEventListener('wheel',wheel);};
  },[scene.id,setViewport]);
  useEffect(()=>{wallStart.current=null;setPreview([]);gesture.current=null;setDragToken(null);pointers.current.clear();},[tool,scene.id]);
  const local=(event:{clientX:number;clientY:number})=>{const rect=root.current!.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top};};
  const world=(point:Point)=>({x:(point.x-viewportRef.current.x)/viewportRef.current.scale,y:(point.y-viewportRef.current.y)/viewportRef.current.scale});
  const bounds={x:-viewport.x/viewport.scale,y:-viewport.y/viewport.scale,width:size.width/viewport.scale,height:size.height/viewport.scale};
  const grid=useMemo(()=>{
    if(!scene.grid || scene.hexSize*viewport.scale<12)return [];
    const result:{key:string;point:Point}[]=[];
    const minR=Math.floor(bounds.y/(scene.hexSize*Math.sqrt(3)/2))-2;
    const maxR=Math.ceil((bounds.y+bounds.height)/(scene.hexSize*Math.sqrt(3)/2))+2;
    for(let r=minR;r<=maxR;r++) {
      const minQ=Math.floor(bounds.x/scene.hexSize-r/2)-2,maxQ=Math.ceil((bounds.x+bounds.width)/scene.hexSize-r/2)+2;
      for(let q=minQ;q<=maxQ;q++)result.push({key:`${q},${r}`,point:hexToPoint({q,r},scene.hexSize)});
    }
    return result;
  },[scene.grid,scene.hexSize,bounds.x,bounds.y,bounds.width,bounds.height,viewport.scale]);
  const shapePoints=(a:Point,b:Point)=>templatePoints(tool,a,b,settings.meters,settings.width,scene.hexSize);
  const down=(event:React.PointerEvent<SVGSVGElement>)=>{
    if(event.button!==0 && event.button!==1)return;
    event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);
    const p=local(event),w=world(p);pointers.current.set(event.pointerId,p);
    if(pointers.current.size>1){gesture.current=null;setDragToken(null);setPreview([]);wallStart.current=null;return;}
    const tokenId=(event.target as Element).closest('[data-token]')?.getAttribute('data-token') || undefined;
    const drawingId=(event.target as Element).closest('[data-drawing]')?.getAttribute('data-drawing') || null;
    if(tool==='select'){selectToken(tokenId || null);onDrawing(drawingId);}
    const token=scene.tokens.find(t=>t.id===tokenId);
    const movable=tool==='select' && token && canMoveToken(view,token);
    gesture.current={start:p,last:p,world:w,tokenId:movable?tokenId:undefined,points:[w],moved:false};
    if(tool==='wall' && admin){
      if(wallStart.current){void send({type:'addWall',wall:{a:wallStart.current,b:w,height:settings.height,blocksMovement:settings.blocksMovement,blocksVision:settings.blocksVision}});wallStart.current=null;setPreview([]);}else{wallStart.current=w;setPreview([w,w]);}
      gesture.current=null;
    }
  };
  const move=(event:React.PointerEvent<SVGSVGElement>)=>{
    const p=local(event);
    if(!pointers.current.has(event.pointerId)){if(wallStart.current)setPreview([wallStart.current,world(p)]);return;}
    const old=pointers.current.get(event.pointerId)!;
    if(pointers.current.size===2){
      const other=Array.from(pointers.current.entries()).find(([id])=>id!==event.pointerId)![1];
      const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(p.x-other.x,p.y-other.y);
      const anchor={x:(old.x+other.x)/2,y:(old.y+other.y)/2};
      const next=zoomAt(viewportRef.current,anchor,viewportRef.current.scale*after/Math.max(1,before));
      next.x+=(p.x-old.x)/2;next.y+=(p.y-old.y)/2;setViewport(scene.id,next);pointers.current.set(event.pointerId,p);return;
    }
    pointers.current.set(event.pointerId,p);
    const g=gesture.current;if(!g)return;
    const w=world(p);g.moved ||= Math.hypot(p.x-g.start.x,p.y-g.start.y)>4;
    if(g.tokenId)setDragToken({id:g.tokenId,point:hexToPoint(pointToHex(w,scene.hexSize),scene.hexSize)});
    else if((tool==='pan' || tool==='select') && !placing){setViewport(scene.id,{...viewportRef.current,x:viewportRef.current.x+p.x-g.last.x,y:viewportRef.current.y+p.y-g.last.y});}
    else if(tool==='freehand'){if(Math.hypot(w.x-g.points[g.points.length-1].x,w.y-g.points[g.points.length-1].y)>2){if(g.points.length>=1000)g.points=g.points.filter((_,i)=>i%2===0);g.points.push(w);setPreview([...g.points]);}}
    else if(['measure','line','circle','cone','rectangle'].includes(tool))setPreview(shapePoints(g.world,w));
    g.last=p;
  };
  const up=(event:React.PointerEvent<SVGSVGElement>)=>{
    pointers.current.delete(event.pointerId);
    if(pointers.current.size){gesture.current=null;return;}
    const g=gesture.current;gesture.current=null;if(!g)return;
    const w=world(local(event));
    if(g.tokenId && g.moved){const h=pointToHex(w,scene.hexSize);void send({type:'moveToken',tokenId:g.tokenId,...h});}
    else if(placing && !g.moved)onPlace(w);
    else if(tool==='ping')void send({type:'addDrawing',drawing:{kind:'ping',points:[w],color:settings.color}});
    else if(tool==='height' && admin)void send({type:'setTerrain',...pointToHex(w,scene.hexSize),elevation:settings.height});
    else if(tool==='reveal' && admin){const h=pointToHex(w,scene.hexSize);const cells:string[]=[];const radius=Math.min(30,Math.round(settings.meters));for(let q=h.q-radius;q<=h.q+radius;q++)for(let r=h.r-radius;r<=h.r+radius;r++)if(hexDistance(h,{q,r})<=radius)cells.push(`${q},${r}`);void send({type:'reveal',cells});}
    else if(tool==='freehand' && g.points.length>1)void send({type:'addDrawing',drawing:{kind:'freehand',points:g.points,color:settings.color}});
    else if(['measure','line','circle','cone','rectangle'].includes(tool) && g.moved)void send({type:'addDrawing',drawing:{kind:tool==='measure'?'line':tool as 'line'|'circle'|'cone'|'rectangle',points:shapePoints(g.world,w),color:settings.color}});
    setDragToken(null);setPreview([]);
  };
  const cancelGesture=()=>{wallStart.current=null;pointers.current.clear();gesture.current=null;setPreview([]);setDragToken(null);};
  const fogPolygon=(cell:string)=>{const [q,r]=cell.split(',').map(Number);return polygon(hexToPoint({q,r},scene.hexSize),scene.hexSize+1);};
  return <svg ref={root} data-testid="tactical-canvas" className={styles.board} aria-label="Mapa tático interativo. Arraste para mover a câmera; use a roda ou dois dedos para zoom." role="application" tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancelGesture} onLostPointerCapture={event=>{if(pointers.current.has(event.pointerId))cancelGesture();}}
    onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const id=event.dataTransfer.getData('application/codak-token');if(admin && id)onPlace(world(local(event)),id);}}
    onKeyDown={event=>{if(event.key==='Escape'){wallStart.current=null;gesture.current=null;pointers.current.clear();setDragToken(null);setPreview([]);}if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();event.stopPropagation();const current=useTacticalMapStore.getState().view,token=current?.scene?.tokens.find(t=>t.id===useTacticalMapStore.getState().selectedTokenId);if(current && token && canMoveToken(current,token)){const delta=event.key==='ArrowUp'?{q:0,r:-1}:event.key==='ArrowDown'?{q:0,r:1}:event.key==='ArrowLeft'?{q:-1,r:0}:{q:1,r:0};void moveTokenBy(token.id,delta.q,delta.r);}else if(!token){setViewport(scene.id,{...viewportRef.current,x:viewportRef.current.x+(event.key==='ArrowLeft'?40:event.key==='ArrowRight'?-40:0),y:viewportRef.current.y+(event.key==='ArrowUp'?40:event.key==='ArrowDown'?-40:0)});}}}>
    <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
      {scene.image && <image href={scene.image} width={scene.width} height={scene.height} preserveAspectRatio="none"/>}
      {grid.map(cell=><polygon key={cell.key} points={polygon(cell.point,scene.hexSize)} fill="none" stroke="#a1a1aa" strokeOpacity={.2} strokeWidth={.7} vectorEffect="non-scaling-stroke" pointerEvents="none"/>)}
      {scene.terrain.map(cell=>{const p=hexToPoint(cell,scene.hexSize);return <g key={cell.id} pointerEvents="none"><polygon points={polygon(p,scene.hexSize)} fill="#f59e0b" fillOpacity={.12}/><text x={p.x} y={p.y} textAnchor="middle" fontSize={12} fill="#f59e0b">{cell.elevation}m</text></g>;})}
      {scene.walls.map(wall=><g key={wall.id} data-wall={wall.id} onPointerDown={event=>{if(admin && tool==='select'){event.stopPropagation();onWall(wall.id);}}}><line x1={wall.a.x} y1={wall.a.y} x2={wall.b.x} y2={wall.b.y} stroke="transparent" strokeWidth={14/viewport.scale}/><line x1={wall.a.x} y1={wall.a.y} x2={wall.b.x} y2={wall.b.y} stroke="#ef4444" strokeWidth={3} vectorEffect="non-scaling-stroke"/><title>{`Parede · ${wall.height}m · movimento ${wall.blocksMovement?'bloqueado':'livre'} · visão ${wall.blocksVision?'bloqueada':'livre'}`}</title></g>)}
      {scene.drawings.map(drawing=><g key={drawing.id} data-drawing={drawing.id} role="button" tabIndex={0} aria-label={`Selecionar ${drawing.kind}`} onKeyDown={event=>{if(event.key==='Enter' || event.key===' '){event.preventDefault();selectToken(null);onDrawing(drawing.id);}}} className={selectedDrawing===drawing.id?styles.selectedDrawing:undefined}><TacticalShape drawing={drawing} size={scene.hexSize} hitArea/><TacticalShape drawing={drawing} size={scene.hexSize}/><title>{`${drawing.kind} · ${drawing.ownerId===view.self.id?'Seu desenho':'Desenho compartilhado'}`}</title>{drawing.kind==='line' && drawing.points[1] && <text x={(drawing.points[0].x+drawing.points[1].x)/2} y={(drawing.points[0].y+drawing.points[1].y)/2-8} fill={drawing.color} fontSize={14} textAnchor="middle" paintOrder="stroke" stroke="#070709" strokeWidth={3}>{hexDistance(pointToHex(drawing.points[0],scene.hexSize),pointToHex(drawing.points[1],scene.hexSize))}m</text>}</g>)}
      {scene.fog && !admin && <><defs><mask id={maskId} maskUnits="userSpaceOnUse" x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height}><rect {...bounds} fill="white"/>{view.exploredCells.map(cell=><polygon key={cell} points={fogPolygon(cell)} fill="#aaa"/>)}{view.visibleCells.map(cell=><polygon key={cell} points={fogPolygon(cell)} fill="black"/>)}</mask></defs><rect {...bounds} fill="#000" mask={`url(#${maskId})`} pointerEvents="none"/></>}
      {scene.tokens.map(token=>{const p=dragToken?.id===token.id?dragToken.point:hexToPoint(token,scene.hexSize);const selected=token.id===selectedTokenId;const current=scene.combat.active && scene.combat.order[scene.combat.index]===token.id;return <g key={token.id} data-token={token.id} data-token-id={token.id} className={styles.mapToken} aria-pressed={selected} data-current-turn={current} transform={`translate(${p.x} ${p.y})`} role="button" tabIndex={0} aria-label={`${token.name}, HP ${token.hp}/${token.maxHp}, altura ${token.elevation} metros`} onKeyDown={event=>{if(event.key==='Enter' || event.key===' '){event.preventDefault();selectToken(token.id);}}} style={{cursor:'pointer'}}>
        <title>{`${token.name} · HP ${token.hp}/${token.maxHp} · ${token.elevation}m · visão ${token.vision}m`}</title>{selected && <circle className={styles.tokenSelection} r={scene.hexSize*.56} fill="none" stroke="#ef4444" strokeWidth={3} vectorEffect="non-scaling-stroke" pointerEvents="none"/>}{token.kind==='hostile'?<rect className={styles.tokenFace} x={-scene.hexSize*.43} y={-scene.hexSize*.43} width={scene.hexSize*.86} height={scene.hexSize*.86} rx={3} fill="#101015" stroke="#fafafa" strokeWidth={2} strokeDasharray="5 3" vectorEffect="non-scaling-stroke"/>:<circle className={styles.tokenFace} r={scene.hexSize*.43} fill="#101015" stroke="#fafafa" strokeWidth={2} vectorEffect="non-scaling-stroke"/>}<circle className={styles.tokenColor} r={2} cx={-scene.hexSize*.22} cy={-scene.hexSize*.22} fill={token.color} pointerEvents="none"/>{token.image?<image href={token.image} x={-scene.hexSize*.28} y={-scene.hexSize*.28} width={scene.hexSize*.56} height={scene.hexSize*.56} preserveAspectRatio="xMidYMid slice"/>:<text textAnchor="middle" dominantBaseline="central" fill="#fafafa" fontSize={scene.hexSize*.34} pointerEvents="none">{token.name.slice(0,2).toUpperCase()}</text>}<text className={styles.tokenLabel} y={scene.hexSize*.75} textAnchor="middle" fill="#fafafa" fontSize={12} stroke="#070709" strokeWidth={3} paintOrder="stroke" pointerEvents="none">{token.name}</text><rect x={-scene.hexSize*.35} y={scene.hexSize*.29} width={scene.hexSize*.7} height={3} fill="#3f3f46"/><rect x={-scene.hexSize*.35} y={scene.hexSize*.29} width={scene.hexSize*.7*Math.max(0,Math.min(1,token.hp/Math.max(1,token.maxHp)))} height={3} fill={token.hp/token.maxHp<.25?'#ef4444':'#fafafa'}/></g>;})}
      {preview.length>0 && <g pointerEvents="none"><TacticalShape drawing={{kind:tool==='wall'?'line':tool==='measure'?'line':tool as TacticalDrawing['kind'],points:preview,color:settings.color}} size={scene.hexSize} preview/>{tool==='measure' && preview[1] && <text x={preview[1].x} y={preview[1].y-12} fill="#06b6d4" fontSize={16}>{hexDistance(pointToHex(preview[0],scene.hexSize),pointToHex(preview[1],scene.hexSize))}m</text>}</g>}
    </g>
  </svg>;
}
