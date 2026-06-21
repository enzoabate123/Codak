const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register - Registra um novo usuário
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'O usuário deve ter pelo menos 3 caracteres e a senha pelo menos 6.' });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }

    // Conta quantos usuários existem. Se for o primeiro, será ADMIN.
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'PLAYER';

    // Hash da senha
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });

    // Se for jogador comum, cria um personagem inicial automático
    if (role === 'PLAYER') {
      // Tenta achar a classe assalto
      const defaultClass = await prisma.characterClass.findFirst();
      if (defaultClass) {
        await prisma.character.create({
          data: {
            ownerId: user.id,
            name: `Recruta_${username}`,
            classId: defaultClass.id,
            level: 1,
            hpMax: 100,
            hpCurrent: 100,
            mana: 50,
            strength: defaultClass.baseStrength,
            dexterity: defaultClass.baseDexterity,
            constitution: defaultClass.baseConstitution,
            intelligence: defaultClass.baseIntelligence,
            wisdom: defaultClass.baseWisdom,
            charisma: defaultClass.baseCharisma,
          }
        });
      }
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso.',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
  }
});

// POST /api/auth/login - Autentica o usuário e gera JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso.',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// GET /api/auth/me - Retorna informações do usuário atual
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, role: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
