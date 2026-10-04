'use client';
import { create } from 'zustand';
import type { TacticalView, TacticalCommand } from '@/types/tactical-map';
import type { MapViewport } from '@/components/map/TacticalUiLogic';
import { canMoveToken } from '@/components/map/TacticalUiLogic';

export interface TacticalContext { sceneId:string|null; isCurrent:()=>boolean }

interface TacticalMapState {
  view:TacticalView|null; error:string|null; loading:boolean; pending:number;
  preparationSceneId:string|null; selectedTokenId:string|null; viewports:Record<string,MapViewport>;
  refresh:()=>Promise<void>; send:(command:TacticalCommand|((view:TacticalView)=>TacticalCommand|null),context?:TacticalContext)=>Promise<boolean>;
  captureContext:()=>TacticalContext; moveTokenBy:(tokenId:string,q:number,r:number)=>Promise<boolean>;
  selectScene:(id:string|null)=>void; selectToken:(id:string|null)=>void;
  setViewport:(sceneId:string,viewport:MapViewport)=>void; connect:()=>()=>void; clearError:()=>void;
}
let poll:AbortController|null=null;
let generation=0;
let sessionGeneration=0;
let write:AbortController|null=null;
let queue:Promise<unknown>=Promise.resolve();
let subscribers=0;
let timer:ReturnType<typeof setInterval>|null=null;
const endpoint=(sceneId:string|null)=>`/api/tactical-map${sceneId?`?sceneId=${encodeURIComponent(sceneId)}`:''}`;
async function responseView(response:Response):Promise<TacticalView> {
  const json=await response.json();
  if(!response.ok) throw new Error(json.error || `Falha de rede (${response.status})`);
  if (!json.self || typeof json.revision!=='number') throw new Error('Resposta inválida do mapa tático.');
  return json;
}
export const useTacticalMapStore=create<TacticalMapState>((set,get)=>({
  view:null,error:null,loading:true,pending:0,preparationSceneId:null,selectedTokenId:null,viewports:{},
  clearError:()=>set({error:null}),
  captureContext:()=>{
    const epoch=generation,session=sessionGeneration,sceneId=get().view?.scene?.id || get().preparationSceneId,selfId=get().view?.self.id;
    return {sceneId,isCurrent:()=>subscribers>0 && epoch===generation && session===sessionGeneration && selfId===get().view?.self.id && sceneId===(get().view?.scene?.id || get().preparationSceneId)};
  },
  moveTokenBy:(tokenId,q,r)=>get().send(view=>{
    const token=view.scene?.tokens.find(t=>t.id===tokenId);
    return token && canMoveToken(view,token)?{type:'moveToken',tokenId,q:token.q+q,r:token.r+r}:null;
  }),
  selectToken:(id)=>set({selectedTokenId:id}),
  setViewport:(sceneId,viewport)=>set(state=>({viewports:{...state.viewports,[sceneId]:viewport}})),
  refresh:async()=>{
    if(get().pending || poll || (typeof document!=='undefined' && document.hidden)) return;
    const controller=new AbortController(); poll=controller; const epoch=generation;
    try {
      const response=await fetch(endpoint(get().preparationSceneId),{cache:'no-store',signal:controller.signal});
      if(response.status===401) set({view:null});
      const view=await responseView(response);
      if(epoch===generation && !get().pending) set({view,loading:false});
    } catch(error) {
      if(!controller.signal.aborted && epoch===generation) set({error:error instanceof Error?error.message:'Falha ao carregar mapa',loading:false});
    } finally { if(poll===controller) poll=null; }
  },
  send:(input,context=get().captureContext())=>{
    // ponytail: one queue per browser; server owns concurrent-user conflict resolution.
    if(!context.isCurrent())return Promise.resolve(false);
    const sceneId=context.sceneId;
    const epoch=generation,session=sessionGeneration;
    poll?.abort();poll=null;
    set(state=>({pending:state.pending+1,error:null}));
    const result=queue.then(async()=>{
      let controller:AbortController|null=null;
      try {
        if(!context.isCurrent())return false;
        const current=get().view;
        const command=typeof input==='function'?(current?input(current):null):input;
        if(!command)return false;
        controller=new AbortController();write=controller;
        const view=await responseView(await fetch('/api/tactical-map',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sceneId:sceneId || undefined,command}),cache:'no-store',signal:controller.signal}));
        if(epoch===generation) {
          set({view,loading:false,...(command.type==='createScene'?{preparationSceneId:view.scene?.id || null,selectedTokenId:null}:{})});
        }
        return true;
      } catch(error) {if(session===sessionGeneration && !controller?.signal.aborted)set({error:error instanceof Error?error.message:'Não foi possível salvar'});return false;}
      finally {if(write===controller)write=null;set(state=>({pending:Math.max(0,state.pending-1)}));}
    });
    queue=result.then(()=>undefined,()=>undefined);
    void result.then(ok=>{if(!ok && session===sessionGeneration) void get().refresh();});
    return result;
  },
  selectScene:(id)=>{
    generation++;poll?.abort();poll=null;
    set({preparationSceneId:id,selectedTokenId:null,view:null,loading:true,error:null});
    void queue.then(()=>get().refresh());
  },
  connect:()=>{
    subscribers++;
    if(subscribers===1) {
      set({view:null,loading:true,error:null});
      void get().refresh();
      timer=setInterval(()=>void get().refresh(),1000);
      if(typeof document!=='undefined') document.addEventListener('visibilitychange',get().refresh);
    }
    return()=>{
      subscribers=Math.max(0,subscribers-1);
      if(!subscribers){sessionGeneration++;write?.abort();set({view:null,loading:true});if(timer)clearInterval(timer);timer=null;poll?.abort();poll=null;generation++;if(typeof document!=='undefined')document.removeEventListener('visibilitychange',get().refresh);}
    };
  },
}));
