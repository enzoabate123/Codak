const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/campaigns - Listar campanhas do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const campaigns = await prisma.campaign.findMany({
        include: {
          chapters: {
            include: { objectives: true, rewards: true }
          },
          notes: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(campaigns);
    } else {
      // Jogador: listar apenas campanhas em que ele está participando
      const campaigns = await prisma.campaign.findMany({
        where: {
          players: {
            some: { userId: req.user.id }
          }
        },
        include: {
          chapters: {
            include: { objectives: true, rewards: true }
          },
          notes: {
            where: {
              OR: [
                { visibility: 'ALL' },
                { AND: [{ visibility: 'SPECIFIC' }, { targetUserId: req.user.id }] }
              ]
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(campaigns);
    }
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    res.status(500).json({ error: 'Erro interno ao buscar campanhas.' });
  }
});

// GET /api/campaigns/:id - Detalhes de uma campanha
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o jogador tem acesso à campanha
    if (req.user.role !== 'ADMIN') {
      const access = await prisma.campaignPlayer.findUnique({
        where: {
          campaignId_userId: {
            campaignId: id,
            userId: req.user.id
          }
        }
      });
      if (!access) {
        return res.status(403).json({ error: 'Você não tem acesso a esta campanha.' });
      }
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        chapters: {
          include: { objectives: true, rewards: true },
          orderBy: { order: 'asc' }
        },
        players: {
          include: {
            user: {
              include: {
                characters: {
                  include: {
                    class: true,
                    equippedItems: true
                  }
                }
              }
            }
          }
        },
        notes: {
          where: req.user.role === 'ADMIN' ? undefined : {
            OR: [
              { visibility: 'ALL' },
              { AND: [{ visibility: 'SPECIFIC' }, { targetUserId: req.user.id }] }
            ]
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Erro ao buscar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
