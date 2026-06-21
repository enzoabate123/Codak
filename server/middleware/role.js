function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Esta operação exige privilégios de Administrador (Mestre).' });
  }
  
  next();
}

module.exports = {
  requireAdmin
};
