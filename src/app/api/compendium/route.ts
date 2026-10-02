import { NextRequest, NextResponse } from 'next/server';
import {
  getCompendiumData,
  saveCompendiumEntity,
  deleteCompendiumEntity,
  restoreOfficialDefaults,
  importFullCompendium,
} from '@/lib/server/compendium-storage';

export async function GET() {
  try {
    const data = getCompendiumData();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Falha ao carregar compêndio' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type, item, username = 'admin', data } = body;

    if (action === 'save') {
      if (!type || !item) {
        return NextResponse.json({ error: 'Tipo e item são obrigatórios.' }, { status: 400 });
      }
      const result = saveCompendiumEntity(type, item, username);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: getCompendiumData() });
    }

    if (action === 'restore') {
      const ok = restoreOfficialDefaults(username);
      if (!ok) {
        return NextResponse.json({ error: 'Erro ao restaurar padrões.' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: getCompendiumData() });
    }

    if (action === 'import') {
      if (!data) {
        return NextResponse.json({ error: 'Nenhum dado fornecido para importação.' }, { status: 400 });
      }
      const ok = importFullCompendium(data, username);
      if (!ok) {
        return NextResponse.json({ error: 'Erro ao importar arquivo de compêndio.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: getCompendiumData() });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as any;
    const id = searchParams.get('id');
    const username = searchParams.get('username') || 'admin';

    if (!type || !id) {
      return NextResponse.json({ error: 'Tipo e ID são obrigatórios.' }, { status: 400 });
    }

    const result = deleteCompendiumEntity(type, id, username);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: getCompendiumData() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao remover item' }, { status: 500 });
  }
}
