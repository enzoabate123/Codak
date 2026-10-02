import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/server/auth-config';
import { readShopState, writeShopState, ShopConfig } from '@/lib/server/shop-storage';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = readShopState();
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as Partial<ShopConfig>;
    const current = readShopState();
    const updated: ShopConfig = {
      isOpen: body.isOpen ?? current.isOpen,
      shopName: body.shopName ?? current.shopName,
      availableItemIds: body.availableItemIds ?? current.availableItemIds,
      profiles: body.profiles ?? current.profiles,
      customPrices: body.customPrices ?? current.customPrices,
    };
    
    writeShopState(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update shop:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
