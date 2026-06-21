const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/inventory - Retorna o inventário do usuário autenticado resolvendo os detalhes dos itens
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rawItems = await prisma.inventoryItem.findMany({
      where: { userId: req.user.id }
    });

    // Separar IDs para buscar em lotes
    const weaponIds = rawItems.filter(i => i.itemType === 'weapon').map(i => i.itemId);
    const equipmentIds = rawItems.filter(i => i.itemType === 'equipment').map(i => i.itemId);
    const consumableIds = rawItems.filter(i => i.itemType === 'consumable').map(i => i.itemId);

    // Buscar detalhes dos bancos de dados
    const [weapons, equipment, consumables] = await Promise.all([
      prisma.weapon.findMany({ where: { id: { in: weaponIds } } }),
      prisma.equipment.findMany({ where: { id: { in: equipmentIds } } }),
      prisma.consumable.findMany({ where: { id: { in: consumableIds } } })
    ]);

    // Mapear detalhes para busca rápida
    const weaponsMap = new Map(weapons.map(w => [w.id, w]));
    const equipMap = new Map(equipment.map(e => [e.id, e]));
    const consMap = new Map(consumables.map(c => [c.id, c]));

    // Resolver os itens
    const resolvedItems = rawItems.map(item => {
      let details = null;
      if (item.itemType === 'weapon') details = weaponsMap.get(item.itemId);
      if (item.itemType === 'equipment') details = equipMap.get(item.itemId);
      if (item.itemType === 'consumable') details = consMap.get(item.itemId);

      return {
        id: item.id,
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: item.quantity,
        details: details || { name: 'Item Desconhecido', description: 'Nenhuma descrição disponível.', rarity: 'COMMON' }
      };
    });

    res.json(resolvedItems);
  } catch (error) {
    console.error('Erro ao processar inventário:', error);
    res.status(500).json({ error: 'Erro interno ao buscar inventário.' });
  }
});

// DELETE /api/inventory/:id - Descartar um item do inventário
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o item pertence ao usuário
    const item = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no inventário.' });
    }

    if (item.userId !== req.user.id) {
      return res.status(403).json({ error: 'Operação não autorizada.' });
    }

    if (item.quantity > 1) {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: { quantity: item.quantity - 1 }
      });
      res.json({ message: 'Quantidade reduzida em 1.', item: updated });
    } else {
      await prisma.inventoryItem.delete({
        where: { id }
      });
      res.json({ message: 'Item removido do inventário.' });
    }
  } catch (error) {
    console.error('Erro ao descartar item:', error);
    res.status(500).json({ error: 'Erro interno ao descartar item.' });
  }
});

// PUT /api/inventory/:id/use - Usar consumível (aplica cura/efeitos e consome quantidade)
router.put('/:id/use', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    const item = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item || item.itemType !== 'consumable') {
      return res.status(400).json({ error: 'Item inválido ou não consumível.' });
    }

    if (item.userId !== req.user.id) {
      return res.status(403).json({ error: 'Operação não autorizada.' });
    }

    // Buscar detalhes do consumível para saber seu efeito
    const details = await prisma.consumable.findUnique({
      where: { id: item.itemId }
    });

    if (!details) {
      return res.status(404).json({ error: 'Efeito do consumível não encontrado.' });
    }

    let feedbackMessage = `Você usou ${details.name}.`;

    // Se um ID de personagem foi fornecido, aplicar o efeito
    if (characterId) {
      const character = await prisma.character.findUnique({
        where: { id: characterId }
      });

      if (!character) {
        return res.status(404).json({ error: 'Personagem não encontrado.' });
      }

      if (character.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Esse personagem não pertence a você.' });
      }

      // Aplicar cura se o efeito contiver "Cura" ou "HP"
      if (details.effect.includes('Cura') || details.effect.includes('HP')) {
        // Tentar extrair o número do efeito, ex: "Cura 50 HP" -> 50
        const match = details.effect.match(/\d+/);
        const healAmount = match ? parseInt(match[0], 10) : 30;

        const newHp = Math.min(character.hpMax, character.hpCurrent + healAmount);

        await prisma.character.update({
          where: { id: characterId },
          data: { hpCurrent: newHp }
        });

        feedbackMessage = `${character.name} usou ${details.name} e recuperou ${newHp - character.hpCurrent} HP (HP Atual: ${newHp}/${character.hpMax}).`;
      }
    }

    // Decrementar quantidade do consumível
    if (item.quantity > 1) {
      await prisma.inventoryItem.update({
        where: { id },
        data: { quantity: item.quantity - 1 }
      });
    } else {
      await prisma.inventoryItem.delete({
        where: { id }
      });
    }

    res.json({ message: feedbackMessage });
  } catch (error) {
    console.error('Erro ao usar consumível:', error);
    res.status(500).json({ error: 'Erro interno ao usar consumível.' });
  }
});

module.exports = router;
