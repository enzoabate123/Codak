// ==========================================================================
// Codak RPG - Auth Client (Single Responsibility: Session Management)
// ==========================================================================

const AuthClient = {
  getToken() {
    return sessionStorage.getItem('codak_jwt_token');
  },

  getUser() {
    const userStr = sessionStorage.getItem('codak_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  },

  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      // Persistir sessão
      sessionStorage.setItem('codak_jwt_token', data.token);
      sessionStorage.setItem('codak_user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Erro de login:', error);
      throw error;
    }
  },

  async register(username, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao registrar usuário.');
      }

      // Persistir sessão
      sessionStorage.setItem('codak_jwt_token', data.token);
      sessionStorage.setItem('codak_user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Erro de registro:', error);
      throw error;
    }
  },

  logout() {
    sessionStorage.removeItem('codak_jwt_token');
    sessionStorage.removeItem('codak_user');
    window.location.reload(); // Recarregar a página para limpar o estado da aplicação
  }
};
