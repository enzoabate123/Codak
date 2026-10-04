import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth-config';
import { findUserById } from '@/lib/server/auth-storage';
import { getTacticalImage } from '@/lib/server/tactical-map-storage';
import { TacticalError } from '@/lib/tactical-map';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' };
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session=await getServerSession(authOptions);
    const id=(session?.user as {id?:unknown}|undefined)?.id;
    if (typeof id!=='string') throw new TacticalError(401,'Não autenticado.');
    const user=findUserById(id);
    if (!user || !['admin','player'].includes(user.role)) throw new TacticalError(401,'Sessão inválida.');
    const sceneId=request.nextUrl.searchParams.get('sceneId') || undefined;
    if (sceneId && sceneId.length>120) throw new TacticalError(400,'Mapa inválido.');
    const bytes=await getTacticalImage({id:user.id,role:user.role},sceneId);
    return new NextResponse(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'image/png'}});
  } catch(error) {
    const status=error instanceof TacticalError ? error.status : 500;
    if(status===500) console.error('Tactical raster:',error);
    return NextResponse.json({error:error instanceof TacticalError ? error.message : 'Erro ao gerar imagem protegida.'},{status,headers});
  }
}
