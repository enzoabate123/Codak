import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/server/auth-config';
import fs from 'fs';
import path from 'path';

const BG_DIR = path.join(process.cwd(), 'public', 'images', 'backgrounds');

// Ensure dir once at module load
fs.mkdirSync(BG_DIR, { recursive: true });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const files = fs.readdirSync(BG_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .map(f => `/images/backgrounds/${f}`);

  return NextResponse.json({ backgrounds: files });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `bg-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(BG_DIR, filename), buffer);

  return NextResponse.json({ path: `/images/backgrounds/${filename}` });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename } = await req.json();
  if (!filename || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const fullPath = path.join(BG_DIR, path.basename(filename));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

  return NextResponse.json({ ok: true });
}
