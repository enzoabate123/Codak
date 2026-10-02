import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/server/auth-config";
import { getCharacters, saveCharacter, deleteCharacter } from '@/lib/server/character-storage';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, role } = session.user as any;
  const chars = getCharacters(userId, role);
  return NextResponse.json({ characters: chars });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, role } = session.user as any;
  const body = await req.json();
  const character = body.character;

  if (!character || !character.id) {
    return NextResponse.json({ error: 'Invalid character data' }, { status: 400 });
  }

  // If player, enforce they can only save their own character
  if (role !== 'admin' && character.userId && character.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Ensure userId is set
  character.userId = character.userId || userId;

  saveCharacter(character);
  return NextResponse.json({ success: true, character });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, role } = session.user as any;
  const { searchParams } = new URL(req.url);
  const charId = searchParams.get('id');

  if (!charId) {
    return NextResponse.json({ error: 'Missing character ID' }, { status: 400 });
  }

  const success = deleteCharacter(charId, userId, role);
  if (!success) {
    return NextResponse.json({ error: 'Forbidden or Not Found' }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
