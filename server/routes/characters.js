const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/characters - Listar personagens do usuário autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const characters = await prisma.character.findMany({
      where: { ownerId: req.user.id },
      include: {
        class: {
          include: { skills: true }
        },
        equippedItems: true
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(characters);
  } catch (error) {
    console.error('Erro ao buscar personagens:', error);
    res.status(500).json({ error: 'Erro interno ao buscar personagens.' });
  }
});

// POST /api/characters - Criar novo personagem para o usuário autenticado
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, classId, themeColor } = req.body;

    if (!name || !classId) {
      return res.status(400).json({ error: 'Nome e Classe são obrigatórios.' });
    }

    // Verificar se classe existe
    const charClass = await prisma.characterClass.findUnique({
      where: { id: classId }
    });

    if (!charClass) {
      return res.status(404).json({ error: 'Classe de personagem inválida.' });
    }

    const character = await prisma.character.create({
      data: {
        ownerId: req.user.id,
        name,
        classId: charClass.id,
        level: 1,
        hpMax: 100,
        hpCurrent: 100,
        mana: 50,
        themeColor: themeColor || '#cba052',
        strength: charClass.baseStrength,
        dexterity: charClass.baseDexterity,
        constitution: charClass.baseConstitution,
        intelligence: charClass.baseIntelligence,
        wisdom: charClass.baseWisdom,
        charisma: charClass.baseCharisma,
      },
      include: {
        class: true
      }
    });

    res.status(201).json(character);
  } catch (error) {
    console.error('Erro ao criar personagem:', error);
    res.status(500).json({ error: 'Erro interno ao criar personagem.' });
  }
});

// PUT /api/characters/:id - Atualizar detalhes do personagem (só o dono pode alterar)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, themeColor, modelUrl, hpCurrent, hpMax, mana, level, strength, dexterity, constitution, intelligence, wisdom, charisma } = req.body;

    // Verificar dono
    const character = await prisma.character.findUnique({
      where: { id }
    });

    if (!character) {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }

    // Permitir se for o dono ou admin
    if (character.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Você não tem permissão para alterar este personagem.' });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        themeColor: themeColor !== undefined ? themeColor : undefined,
        modelUrl: modelUrl !== undefined ? modelUrl : undefined,
        hpCurrent: hpCurrent !== undefined ? Number(hpCurrent) : undefined,
        hpMax: hpMax !== undefined ? Number(hpMax) : undefined,
        mana: mana !== undefined ? Number(mana) : undefined,
        level: level !== undefined ? Number(level) : undefined,
        strength: strength !== undefined ? Number(strength) : undefined,
        dexterity: dexterity !== undefined ? Number(dexterity) : undefined,
        constitution: constitution !== undefined ? Number(constitution) : undefined,
        intelligence: intelligence !== undefined ? Number(intelligence) : undefined,
        wisdom: wisdom !== undefined ? Number(wisdom) : undefined,
        charisma: charisma !== undefined ? Number(charisma) : undefined,
      },
      include: {
        class: true,
        equippedItems: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar personagem:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar personagem.' });
  }
});

// DELETE /api/characters/:id - Excluir personagem (só o dono ou admin pode excluir)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const character = await prisma.character.findUnique({
      where: { id }
    });

    if (!character) {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }

    if (character.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este personagem.' });
    }

    await prisma.character.delete({
      where: { id }
    });

    res.json({ message: 'Personagem excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir personagem:', error);
    res.status(500).json({ error: 'Erro interno ao excluir personagem.' });
  }
});

// PUT /api/characters/:id/equip - Equipar/desequipar item
router.put('/:id/equip', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Character ID
    const { slot, itemId, itemType, action } = req.body; // action: 'equip' | 'unequip'

    const character = await prisma.character.findUnique({
      where: { id }
    });

    if (!character) {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }

    if (character.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Você não tem permissão para equipar itens neste personagem.' });
    }

    if (action === 'unequip') {
      await prisma.equippedItem.delete({
        where: {
          characterId_slot: {
            characterId: id,
            slot
          }
        }
      });
      return res.json({ message: 'Item desequipado com sucesso.' });
    }

    // Caso seja EQUIP
    if (!slot || !itemId || !itemType) {
      return res.status(400).json({ error: 'Parâmetros slot, itemId e itemType são obrigatórios.' });
    }

    // Verificar se o item está no inventário do usuário dono do personagem
    const invItem = await prisma.inventoryItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: character.ownerId,
          itemType,
          itemId
        }
      }
    });

    if (!invItem || invItem.quantity < 1) {
      return res.status(400).json({ error: 'Item não encontrado no inventário do jogador.' });
    }

    // Criar ou atualizar o item equipado no slot do personagem
    const equipped = await prisma.equippedItem.upsert({
      where: {
        characterId_slot: {
          characterId: id,
          slot
        }
      },
      update: {
        itemId,
        itemType
      },
      create: {
        characterId: id,
        slot,
        itemId,
        itemType
      }
    });

    res.json(equipped);
  } catch (error) {
    console.error('Erro ao equipar item:', error);
    res.status(500).json({ error: 'Erro interno ao equipar item.' });
  }
});

module.exports = router;
