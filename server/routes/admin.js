const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middlewares para TODAS as rotas de admin
router.use(authMiddleware);
router.use(requireAdmin);

// =============================================
// GESTÃO DE USUÁRIOS
// =============================================

// GET /api/admin/users - Listar todos os usuários
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { username: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// PUT /api/admin/users/:id/role - Mudar cargo de um usuário
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'ADMIN' ou 'PLAYER'

    if (role !== 'ADMIN' && role !== 'PLAYER') {
      return res.status(400).json({ error: 'Role inválida. Escolha ADMIN ou PLAYER.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true }
    });

    res.json({ message: 'Cargo atualizado com sucesso.', user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cargo.' });
  }
});

// =============================================
// DISTRIBUIÇÃO DE ITENS (GIVE)
// =============================================

// POST /api/admin/give - Dar item para o inventário de um jogador
router.post('/give', async (req, res) => {
  try {
    const { userId, itemType, itemId, quantity } = req.body;

    if (!userId || !itemType || !itemId) {
      return res.status(400).json({ error: 'userId, itemType e itemId são obrigatórios.' });
    }

    const qty = Number(quantity) || 1;

    // Verificar se o usuário destino existe
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return res.status(404).json({ error: 'Usuário destino não encontrado.' });

    // Verificar se o item existe na tabela correspondente
    let itemExists = false;
    if (itemType === 'weapon') itemExists = await prisma.weapon.findUnique({ where: { id: itemId } });
    if (itemType === 'equipment') itemExists = await prisma.equipment.findUnique({ where: { id: itemId } });
    if (itemType === 'consumable') itemExists = await prisma.consumable.findUnique({ where: { id: itemId } });

    if (!itemExists) {
      return res.status(400).json({ error: 'Item não cadastrado no banco de dados do compêndio.' });
    }

    // Criar ou incrementar no inventário
    const invItem = await prisma.inventoryItem.upsert({
      where: {
        userId_itemType_itemId: { userId, itemType, itemId }
      },
      update: {
        quantity: { increment: qty }
      },
      create: {
        userId,
        itemType,
        itemId,
        quantity: qty
      }
    });

    res.status(201).json({ message: 'Item distribuído com sucesso.', inventoryItem: invItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao distribuir item.' });
  }
});

// =============================================
// GESTÃO DE CAMPANHAS, CAPÍTULOS, OBJETIVOS & NOTAS
// =============================================

// POST /api/admin/campaigns - Criar campanha
router.post('/campaigns', async (req, res) => {
  try {
    const { title, synopsis } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório.' });

    const campaign = await prisma.campaign.create({
      data: { title, synopsis: synopsis || '' }
    });
    res.status(201).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar campanha.' });
  }
});

// PUT /api/admin/campaigns/:id - Editar campanha
router.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, synopsis, status } = req.body;

    const updated = await prisma.campaign.update({
      where: { id },
      data: { title, synopsis, status }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar campanha.' });
  }
});

// DELETE /api/admin/campaigns/:id - Excluir campanha
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.campaign.delete({ where: { id } });
    res.json({ message: 'Campanha excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir campanha.' });
  }
});

// POST /api/admin/campaigns/:id/players - Adicionar jogador à campanha
router.post('/campaigns/:id/players', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const added = await prisma.campaignPlayer.create({
      data: { campaignId: id, userId }
    });
    res.status(201).json(added);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar jogador à campanha.' });
  }
});

// DELETE /api/admin/campaigns/:campaignId/players/:userId - Remover jogador da campanha
router.delete('/campaigns/:campaignId/players/:userId', async (req, res) => {
  try {
    const { campaignId, userId } = req.params;
    await prisma.campaignPlayer.delete({
      where: {
        campaignId_userId: { campaignId, userId }
      }
    });
    res.json({ message: 'Jogador removido da campanha.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao remover jogador da campanha.' });
  }
});

// POST /api/admin/campaigns/:id/chapters - Adicionar capítulo
router.post('/campaigns/:id/chapters', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, synopsis, order, status, progress, objectives } = req.body;

    const chapter = await prisma.chapter.create({
      data: {
        campaignId: id,
        title,
        synopsis: synopsis || '',
        order: Number(order) || 1,
        status: status || 'LOCKED',
        progress: Number(progress) || 0
      }
    });

    // Se houver objetivos em lote, criá-los
    if (objectives && Array.isArray(objectives)) {
      const formatted = objectives.map((text, index) => ({
        chapterId: chapter.id,
        text,
        completed: false,
        order: index + 1
      }));
      await prisma.objective.createMany({ data: formatted });
    }

    res.status(201).json(chapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar capítulo.' });
  }
});

// PUT /api/admin/campaigns/chapters/:chapterId - Editar capítulo e objetivos
router.put('/campaigns/chapters/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, synopsis, order, status, progress, objectives } = req.body;

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: title !== undefined ? title : undefined,
        synopsis: synopsis !== undefined ? synopsis : undefined,
        order: order !== undefined ? Number(order) : undefined,
        status: status !== undefined ? status : undefined,
        progress: progress !== undefined ? Number(progress) : undefined
      }
    });

    // Se objetivos forem enviados, deletamos os antigos e recriamos para simplificar
    if (objectives && Array.isArray(objectives)) {
      await prisma.objective.deleteMany({ where: { chapterId } });
      const formatted = objectives.map((obj, index) => ({
        chapterId,
        text: typeof obj === 'string' ? obj : obj.text,
        completed: typeof obj === 'string' ? false : !!obj.completed,
        order: index + 1
      }));
      await prisma.objective.createMany({ data: formatted });
    }

    res.json(updatedChapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar capítulo.' });
  }
});

// DELETE /api/admin/campaigns/chapters/:chapterId - Excluir capítulo
router.delete('/campaigns/chapters/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    await prisma.chapter.delete({ where: { id: chapterId } });
    res.json({ message: 'Capítulo excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir capítulo.' });
  }
});

// POST /api/admin/campaigns/:id/notes - Adicionar nota do mestre
router.post('/campaigns/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, visibility, targetUserId } = req.body;

    if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });

    const note = await prisma.note.create({
      data: {
        campaignId: id,
        title,
        content,
        visibility: visibility || 'ALL',
        targetUserId: targetUserId || null
      }
    });
    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar nota de campanha.' });
  }
});

// DELETE /api/admin/campaigns/notes/:noteId - Excluir nota
router.delete('/campaigns/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    await prisma.note.delete({ where: { id: noteId } });
    res.json({ message: 'Nota excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir nota.' });
  }
});

// =============================================
// CRUD COMPÊNDIO: WEAPONS, EQUIPMENT, CONSUMABLES, VEHICLES, NPCS, MAPAS, CLASSES, SKILLS
// =============================================

// --- WEAPONS ---
router.post('/weapons', async (req, res) => {
  try {
    const { name, type, damage, fireRate, range, rarity, description } = req.body;
    const weapon = await prisma.weapon.create({
      data: { name, type, damage: Number(damage), fireRate: Number(fireRate), range: Number(range), rarity, description: description || '' }
    });
    res.status(201).json(weapon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar arma.' });
  }
});

router.put('/weapons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, damage, fireRate, range, rarity, description } = req.body;
    const weapon = await prisma.weapon.update({
      where: { id },
      data: { name, type, damage: Number(damage), fireRate: Number(fireRate), range: Number(range), rarity, description }
    });
    res.json(weapon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar arma.' });
  }
});

router.delete('/weapons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.weapon.delete({ where: { id } });
    res.json({ message: 'Arma excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir arma.' });
  }
});

// --- EQUIPMENT ---
router.post('/equipment', async (req, res) => {
  try {
    const { name, slot, rarity, description, bonusStrength, bonusDexterity, bonusConstitution, bonusIntelligence, bonusWisdom, bonusCharisma, bonusHp, bonusMana } = req.body;
    const equip = await prisma.equipment.create({
      data: {
        name, slot, rarity, description: description || '',
        bonusStrength: Number(bonusStrength) || 0,
        bonusDexterity: Number(bonusDexterity) || 0,
        bonusConstitution: Number(bonusConstitution) || 0,
        bonusIntelligence: Number(bonusIntelligence) || 0,
        bonusWisdom: Number(bonusWisdom) || 0,
        bonusCharisma: Number(bonusCharisma) || 0,
        bonusHp: Number(bonusHp) || 0,
        bonusMana: Number(bonusMana) || 0,
      }
    });
    res.status(201).json(equip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar equipamento.' });
  }
});

router.put('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slot, rarity, description, bonusStrength, bonusDexterity, bonusConstitution, bonusIntelligence, bonusWisdom, bonusCharisma, bonusHp, bonusMana } = req.body;
    const equip = await prisma.equipment.update({
      where: { id },
      data: {
        name, slot, rarity, description,
        bonusStrength: bonusStrength !== undefined ? Number(bonusStrength) : undefined,
        bonusDexterity: bonusDexterity !== undefined ? Number(bonusDexterity) : undefined,
        bonusConstitution: bonusConstitution !== undefined ? Number(bonusConstitution) : undefined,
        bonusIntelligence: bonusIntelligence !== undefined ? Number(bonusIntelligence) : undefined,
        bonusWisdom: bonusWisdom !== undefined ? Number(bonusWisdom) : undefined,
        bonusCharisma: bonusCharisma !== undefined ? Number(bonusCharisma) : undefined,
        bonusHp: bonusHp !== undefined ? Number(bonusHp) : undefined,
        bonusMana: bonusMana !== undefined ? Number(bonusMana) : undefined,
      }
    });
    res.json(equip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar equipamento.' });
  }
});

router.delete('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.equipment.delete({ where: { id } });
    res.json({ message: 'Equipamento excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir equipamento.' });
  }
});

// --- CONSUMABLES ---
router.post('/consumables', async (req, res) => {
  try {
    const { name, effect, duration, stackable, rarity, description } = req.body;
    const item = await prisma.consumable.create({
      data: { name, effect, duration: Number(duration) || 0, stackable: stackable !== undefined ? !!stackable : true, rarity, description: description || '' }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar consumível.' });
  }
});

router.put('/consumables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, effect, duration, stackable, rarity, description } = req.body;
    const item = await prisma.consumable.update({
      where: { id },
      data: { name, effect, duration: duration !== undefined ? Number(duration) : undefined, stackable: stackable !== undefined ? !!stackable : undefined, rarity, description }
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar consumível.' });
  }
});

router.delete('/consumables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.consumable.delete({ where: { id } });
    res.json({ message: 'Consumível excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir consumível.' });
  }
});

// --- VEHICLES ---
router.post('/vehicles', async (req, res) => {
  try {
    const { name, type, speed, armor, capacity, description } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { name, type, speed: Number(speed), armor: Number(armor), capacity: Number(capacity) || 4, description: description || '' }
    });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar veículo.' });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, speed, armor, capacity, description } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { name, type, speed: speed !== undefined ? Number(speed) : undefined, armor: armor !== undefined ? Number(armor) : undefined, capacity: capacity !== undefined ? Number(capacity) : undefined, description }
    });
    res.json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar veículo.' });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: 'Veículo excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir veículo.' });
  }
});

// --- NPCS ---
router.post('/npcs', async (req, res) => {
  try {
    const { name, role, faction, description, dialogues } = req.body; // dialogues é array de strings
    const npc = await prisma.npc.create({
      data: { name, role, faction: faction || '', description: description || '' }
    });

    if (dialogues && Array.isArray(dialogues)) {
      const formatted = dialogues.map((content, idx) => ({
        npcId: npc.id,
        content,
        order: idx + 1
      }));
      await prisma.npcDialogue.createMany({ data: formatted });
    }

    res.status(201).json(npc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar NPC.' });
  }
});

router.put('/npcs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, faction, description, dialogues } = req.body;

    const npc = await prisma.npc.update({
      where: { id },
      data: { name, role, faction, description }
    });

    if (dialogues && Array.isArray(dialogues)) {
      await prisma.npcDialogue.deleteMany({ where: { npcId: id } });
      const formatted = dialogues.map((content, idx) => ({
        npcId: id,
        content,
        order: idx + 1
      }));
      await prisma.npcDialogue.createMany({ data: formatted });
    }

    res.json(npc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar NPC.' });
  }
});

router.delete('/npcs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.npc.delete({ where: { id } });
    res.json({ message: 'NPC excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir NPC.' });
  }
});

// --- MAPS ---
router.post('/maps', async (req, res) => {
  try {
    const { name, environment, size, description, pointsOfInterest } = req.body; // POIs é array de {name, description}
    const gameMap = await prisma.gameMap.create({
      data: { name, environment, size, description: description || '' }
    });

    if (pointsOfInterest && Array.isArray(pointsOfInterest)) {
      const formatted = pointsOfInterest.map(poi => ({
        gameMapId: gameMap.id,
        name: poi.name || poi,
        description: poi.description || ''
      }));
      await prisma.mapPOI.createMany({ data: formatted });
    }

    res.status(201).json(gameMap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar mapa.' });
  }
});

router.put('/maps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, environment, size, description, pointsOfInterest } = req.body;

    const gameMap = await prisma.gameMap.update({
      where: { id },
      data: { name, environment, size, description }
    });

    if (pointsOfInterest && Array.isArray(pointsOfInterest)) {
      await prisma.mapPOI.deleteMany({ where: { gameMapId: id } });
      const formatted = pointsOfInterest.map(poi => ({
        gameMapId: id,
        name: poi.name || poi,
        description: poi.description || ''
      }));
      await prisma.mapPOI.createMany({ data: formatted });
    }

    res.json(gameMap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar mapa.' });
  }
});

router.delete('/maps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.gameMap.delete({ where: { id } });
    res.json({ message: 'Mapa excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir mapa.' });
  }
});

// --- CLASSES ---
router.post('/classes', async (req, res) => {
  try {
    const { name, description, baseStrength, baseDexterity, baseConstitution, baseIntelligence, baseWisdom, baseCharisma } = req.body;
    const cClass = await prisma.characterClass.create({
      data: {
        name, description: description || '',
        baseStrength: Number(baseStrength) || 10,
        baseDexterity: Number(baseDexterity) || 10,
        baseConstitution: Number(baseConstitution) || 10,
        baseIntelligence: Number(baseIntelligence) || 10,
        baseWisdom: Number(baseWisdom) || 10,
        baseCharisma: Number(baseCharisma) || 10,
      }
    });
    res.status(201).json(cClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar classe.' });
  }
});

router.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.characterClass.delete({ where: { id } });
    res.json({ message: 'Classe excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir classe.' });
  }
});

module.exports = router;
