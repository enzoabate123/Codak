import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth-config';
import { findUserById, getStoredUsers } from '@/lib/server/auth-storage';
import { getCharacters } from '@/lib/server/character-storage';
import { getTacticalView, executeTacticalCommand, readTacticalPayload } from '@/lib/server/tactical-map-storage';
import { TacticalError } from '@/lib/tactical-map';
import type { TacticalSelf } from '@/lib/tactical-map';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
async function identity(): Promise<TacticalSelf> {
  const session=await getServerSession(authOptions);
  const id=(session?.user as {id?:unknown}|undefined)?.id;
  if (typeof id!=='string') throw new TacticalError(401,'Não autenticado.');
  const user=findUserById(id);
  if (!user || !['admin','player'].includes(user.role)) throw new TacticalError(401,'Sessão inválida.');
  return {id:user.id,role:user.role};
}
function failure(error: unknown): NextResponse {
  const status=error instanceof TacticalError ? error.status : 500;
  if (status===500) console.error('Tactical map:',error);
  return NextResponse.json({error:error instanceof TacticalError ? error.message : 'Erro no armazenamento tático.'},{status,headers});
}
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const self=await identity();
    const sceneId=request.nextUrl.searchParams.get('sceneId') || undefined;
    if (sceneId && sceneId.length>120) throw new TacticalError(400,'Mapa inválido.');
    return NextResponse.json(await getTacticalView(self,sceneId),{headers});
  } catch(error) { return failure(error); }
}
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const self=await identity();
    const {sceneId,command}=await readTacticalPayload(request);
    // Only server records supply character ownership. Client role/owner claims
    // cannot alter authorization; the command engine validates every field.
    const characters=self.role==='admin' ? getCharacters(self.id,'admin').map(({id,userId})=>({id,userId})) : [];
    const userIds=self.role==='admin' ? getStoredUsers().map(user=>user.id) : [];
    const view=await executeTacticalCommand(self,command,sceneId,{characters,userIds});
    return NextResponse.json(view,{headers});
  } catch(error) { return failure(error); }
}
