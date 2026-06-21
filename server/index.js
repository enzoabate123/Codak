const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const characterRoutes = require('./routes/characters');
const inventoryRoutes = require('./routes/inventory');
const compendiumRoutes = require('./routes/compendium');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend da pasta public/
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/compendium', compendiumRoutes);
app.use('/api/admin', adminRoutes);

// Rota coringa para servir o index.html em caso de fallback (SPA)
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Servidor Codak RPG iniciado com sucesso!`);
  console.log(`Acesse localmente em: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
