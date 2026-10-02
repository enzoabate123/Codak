import { NextRequest, NextResponse } from 'next/server';
import { getStoredUsers, toPublicUser, updateUserRole, resetUserPassword, deleteUser } from '@/lib/server/auth-storage';
import { PublicUser } from '@/types/shared';
import { logAuditAction } from '@/lib/server/compendium-storage';

export async function GET() {
  try {
    const users = getStoredUsers().map(toPublicUser);
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao listar operadores' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, newRole, newPassword, adminUsername = 'admin' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    if (action === 'update_role') {
      if (!newRole || !['admin', 'player'].includes(newRole)) {
        return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 });
      }
      const ok = updateUserRole(userId, newRole);
      if (!ok) {
        return NextResponse.json({ error: 'Não foi possível alterar o papel deste operador.' }, { status: 400 });
      }
      logAuditAction({
        userId: adminUsername,
        action: 'update',
        entityType: 'system',
        entityId: userId,
        entityName: `Operador ${userId}`,
        details: `Alterou papel para ${newRole.toUpperCase()}`,
      });
      return NextResponse.json({ success: true, users: getStoredUsers().map(toPublicUser) });
    }

    if (action === 'reset_password') {
      if (!newPassword || newPassword.length < 3) {
        return NextResponse.json({ error: 'A nova senha deve ter pelo menos 3 caracteres.' }, { status: 400 });
      }
      const ok = resetUserPassword(userId, newPassword);
      if (!ok) {
        return NextResponse.json({ error: 'Erro ao redefinir senha do operador.' }, { status: 400 });
      }
      logAuditAction({
        userId: adminUsername,
        action: 'update',
        entityType: 'system',
        entityId: userId,
        entityName: `Operador ${userId}`,
        details: 'Redefiniu senha de acesso',
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar solicitação' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const adminUsername = searchParams.get('adminUsername') || 'admin';

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const ok = deleteUser(userId);
    if (!ok) {
      return NextResponse.json({ error: 'Não é possível remover o único administrador do sistema.' }, { status: 400 });
    }

    logAuditAction({
      userId: adminUsername,
      action: 'delete',
      entityType: 'system',
      entityId: userId,
      entityName: `Operador ${userId}`,
      details: 'Removeu conta do operador',
    });

    return NextResponse.json({ success: true, users: getStoredUsers().map(toPublicUser) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao remover operador' }, { status: 500 });
  }
}
