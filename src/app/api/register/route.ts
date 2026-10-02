import { NextRequest, NextResponse } from 'next/server';
import { registerNewUser } from '@/lib/server/auth-storage';

export async function POST(req: NextRequest) {
  try {
    const { username, password, displayName } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }
    const result = registerNewUser(username, displayName || username, password, 'player');
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
