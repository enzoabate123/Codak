const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/compendium/weapons - Listar armas
router.get('/weapons', authMiddleware, async (req, res) => {
  try {
    const weapons = await prisma.weapon.findMany();
    res.json(weapons);
  } catch (error) {
    console.error('Erro ao buscar armas no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar armas.' });
  }
});

// GET /api/compendium/equipment - Listar equipamentos
router.get('/equipment', authMiddleware, async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany();
    res.json(equipment);
  } catch (error) {
    console.error('Erro ao buscar equipamentos no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar equipamentos.' });
  }
});

// GET /api/compendium/consumables - Listar consumíveis
router.get('/consumables', authMiddleware, async (req, res) => {
  try {
    const consumables = await prisma.consumable.findMany();
    res.json(consumables);
  } catch (error) {
    console.error('Erro ao buscar consumíveis no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar consumíveis.' });
  }
});

// GET /api/compendium/vehicles - Listar veículos
router.get('/vehicles', authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json(vehicles);
  } catch (error) {
    console.error('Erro ao buscar veículos no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar veículos.' });
  }
});

// GET /api/compendium/npcs - Listar NPCs e seus diálogos
router.get('/npcs', authMiddleware, async (req, res) => {
  try {
    const npcs = await prisma.npc.findMany({
      include: {
        dialogues: {
          orderBy: { order: 'asc' }
        }
      }
    });
    res.json(npcs);
  } catch (error) {
    console.error('Erro ao buscar NPCs no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar NPCs.' });
  }
});

// GET /api/compendium/maps - Listar mapas e POIs
router.get('/maps', authMiddleware, async (req, res) => {
  try {
    const maps = await prisma.gameMap.findMany({
      include: {
        pointsOfInterest: true
      }
    });
    res.json(maps);
  } catch (error) {
    console.error('Erro ao buscar mapas no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar mapas.' });
  }
});

// GET /api/compendium/classes - Listar classes de personagem
router.get('/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await prisma.characterClass.findMany({
      include: {
        skills: true
      }
    });
    res.json(classes);
  } catch (error) {
    console.error('Erro ao buscar classes no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar classes.' });
  }
});

// GET /api/compendium/skills - Listar habilidades
router.get('/skills', authMiddleware, async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        class: true
      }
    });
    res.json(skills);
  } catch (error) {
    console.error('Erro ao buscar habilidades no compêndio:', error);
    res.status(500).json({ error: 'Erro interno ao buscar habilidades.' });
  }
});

module.exports = router;
