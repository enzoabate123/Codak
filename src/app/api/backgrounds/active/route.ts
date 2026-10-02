import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth-config';

const DATA_FILE = path.join(process.cwd(), 'data', 'active-bg.json');

export async function GET() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return NextResponse.json({ path: data.path });
    }
  } catch (e) {}
  return NextResponse.json({ path: null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { path: bgPath } = await req.json();
  
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify({ path: bgPath }));
  return NextResponse.json({ ok: true });
}
