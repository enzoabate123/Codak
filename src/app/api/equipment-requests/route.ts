import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth-config';
import { getCharacterById, saveCharacter } from '@/lib/server/character-storage';
import { InventoryItem } from '@/stores/useCharacterStore';

const ITEM_TYPES = new Set(['weapon', 'armor', 'accessory', 'item']);

function validItem(value: unknown): value is Omit<InventoryItem, 'id'> {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && item.name.trim().length > 0 &&
    typeof item.type === 'string' && ITEM_TYPES.has(item.type) &&
    Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: userId, role } = session.user as any;
  const { characterId, item } = await req.json();
  const character = getCharacterById(characterId);
  if (!character || (role !== 'admin' && character.userId !== userId)) {
    return NextResponse.json({ error: 'Forbidden or character not found' }, { status: 403 });
  }
  if (!validItem(item)) return NextResponse.json({ error: 'Invalid equipment request' }, { status: 400 });

  const request = {
    id: `request-${Date.now()}-${crypto.randomUUID()}`,
    requestedAt: new Date().toISOString(),
    status: 'pending' as const,
    item: { ...item, name: item.name.trim(), quantity: Math.max(1, Math.floor(Number(item.quantity))) },
  };
  character.pendingEquipmentRequests = [...(character.pendingEquipmentRequests || []), request];
  saveCharacter(character);
  return NextResponse.json({ success: true, request });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { characterId, requestId, decision } = await req.json();
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
  }

  const character = getCharacterById(characterId);
  const requests = character?.pendingEquipmentRequests || [];
  const requestIndex = requests.findIndex(request => request.id === requestId && request.status === 'pending');
  if (!character || requestIndex === -1) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const request = requests[requestIndex];
  if (decision === 'approved') {
    const inventory = [...(character.inventory || Array(64).fill(null))];
    const slot = inventory.findIndex(item => item === null);
    if (slot === -1) return NextResponse.json({ error: 'Inventory full' }, { status: 409 });
    inventory[slot] = { ...request.item, id: `inv-${Date.now()}-${crypto.randomUUID()}` };
    character.inventory = inventory;
  }

  character.pendingEquipmentRequests = requests.map(request =>
    request.id === requestId ? { ...request, status: decision } : request,
  );
  saveCharacter(character);
  return NextResponse.json({ success: true, character });
}
