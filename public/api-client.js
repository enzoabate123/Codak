// ==========================================================================
// Codak RPG - API Client (Single Responsibility: Data Access Layer / Fetch Wrapper)
// ==========================================================================

const APIClient = {
  async fetch(url, options = {}) {
    const token = AuthClient.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição da API.');
      }
      
      return data;
    } catch (error) {
      console.error(`Erro ao consumir API [${url}]:`, error);
      throw error;
    }
  },

  // Auth profile
  async getMe() {
    return this.fetch('/api/auth/me');
  },

  // Campaigns
  async getCampaigns() {
    return this.fetch('/api/campaigns');
  },
  async getCampaign(id) {
    return this.fetch(`/api/campaigns/${id}`);
  },

  // Characters
  async getCharacters() {
    return this.fetch('/api/characters');
  },
  async createCharacter(name, classId, themeColor) {
    return this.fetch('/api/characters', {
      method: 'POST',
      body: JSON.stringify({ name, classId, themeColor })
    });
  },
  async updateCharacter(id, data) {
    return this.fetch(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteCharacter(id) {
    return this.fetch(`/api/characters/${id}`, {
      method: 'DELETE'
    });
  },
  async equipItem(characterId, slot, itemId, itemType, action = 'equip') {
    return this.fetch(`/api/characters/${characterId}/equip`, {
      method: 'PUT',
      body: JSON.stringify({ slot, itemId, itemType, action })
    });
  },

  // Inventory
  async getInventory() {
    return this.fetch('/api/inventory');
  },
  async discardItem(id) {
    return this.fetch(`/api/inventory/${id}`, {
      method: 'DELETE'
    });
  },
  async useConsumable(id, characterId) {
    return this.fetch(`/api/inventory/${id}/use`, {
      method: 'PUT',
      body: JSON.stringify({ characterId })
    });
  },

  // Compendium
  async getCompendium(category) {
    // category: weapons | equipment | consumables | vehicles | npcs | maps | classes | skills
    return this.fetch(`/api/compendium/${category}`);
  },

  // Admin: Users & Management
  async getUsers() {
    return this.fetch('/api/admin/users');
  },
  async updateUserRole(id, role) {
    return this.fetch(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },
  async giveItem(userId, itemType, itemId, quantity) {
    return this.fetch('/api/admin/give', {
      method: 'POST',
      body: JSON.stringify({ userId, itemType, itemId, quantity })
    });
  },

  // Admin: Campaign Management
  async createCampaign(title, synopsis) {
    return this.fetch('/api/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify({ title, synopsis })
    });
  },
  async updateCampaign(id, data) {
    return this.fetch(`/api/admin/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteCampaign(id) {
    return this.fetch(`/api/admin/campaigns/${id}`, {
      method: 'DELETE'
    });
  },
  async addPlayerToCampaign(campaignId, userId) {
    return this.fetch(`/api/admin/campaigns/${campaignId}/players`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  async removePlayerFromCampaign(campaignId, userId) {
    return this.fetch(`/api/admin/campaigns/${campaignId}/players/${userId}`, {
      method: 'DELETE'
    });
  },
  async addChapter(campaignId, data) {
    return this.fetch(`/api/admin/campaigns/${campaignId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateChapter(chapterId, data) {
    return this.fetch(`/api/admin/campaigns/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteChapter(chapterId) {
    return this.fetch(`/api/admin/campaigns/chapters/${chapterId}`, {
      method: 'DELETE'
    });
  },
  async addNote(campaignId, data) {
    return this.fetch(`/api/admin/campaigns/${campaignId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async deleteNote(noteId) {
    return this.fetch(`/api/admin/campaigns/notes/${noteId}`, {
      method: 'DELETE'
    });
  },

  // Admin: Compendium Collections CRUD
  async createCompendiumItem(category, data) {
    return this.fetch(`/api/admin/${category}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateCompendiumItem(category, id, data) {
    return this.fetch(`/api/admin/${category}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteCompendiumItem(category, id) {
    return this.fetch(`/api/admin/${category}/${id}`, {
      method: 'DELETE'
    });
  }
};
