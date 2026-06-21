// ==========================================================================
// Codak RPG - Orchestrator (Single Responsibility: State & UI Coordination)
// ==========================================================================

// Global configurations (colors, camera positions, visual states)
const CONFIG = {
  colors: {
    accent: 0xcba052,
    blue: 0x38bdf8,
    green: 0x10b981,
    purple: 0xa855f7,
    ambient: 0x222222,
    fog: 0x060606
  },
  cameraStations: [
    { pos: { x: 0, y: 3.5, z: 9.5 }, lookAt: { x: 0, y: 0.4, z: 0 } },       // 0: Lobby/Sessão
    { pos: { x: -15, y: 4.0, z: 6.0 }, lookAt: { x: -15, y: 1.5, z: -5 } },  // 1: Campanhas
    { pos: { x: 15, y: 2.2, z: 6.5 }, lookAt: { x: 15, y: 1.0, z: -5 } },    // 2: Personagens/Ficha
    { pos: { x: 0, y: -6.5, z: 7.5 }, lookAt: { x: 0, y: -9.5, z: -5 } },    // 3: Compendium
    { pos: { x: -25, y: 5.0, z: 12.0 }, lookAt: { x: -25, y: 1.0, z: -5 } }  // 4: Admin Panel (5ª Estação 3D)
  ]
};

class MenuNavigationController {
  constructor(sceneManager, audioEngine) {
    this.sceneManager = sceneManager;
    this.audioEngine = audioEngine;
    
    this.activeIndex = -1; // -1 significa tela de login
    
    // Elementos da interface
    this.navItems = document.querySelectorAll('.nav-item');
    this.rightPanel = document.getElementById('right-panel');
    this.glitchScreen = document.getElementById('glitch-screen');
    this.navItemAdmin = document.getElementById('nav-item-admin');
    
    // Mapeamento de ossos
    this.uploadedBoneList = [];
    this.rigMap = {
      head: "Cabeça",
      torso: "Tronco",
      shoulderLeft: "Braço Esq",
      shoulderRight: "Braço Dir",
      hipLeft: "Perna Esq",
      hipRight: "Perna Dir"
    };

    // Estado da Ficha de Personagem
    this.activeCharacterId = null;
    this.activeCharacter = null;
    this.inventoryItems = [];
    this.currentInventoryFilter = 'all';

    // Estado da Campanha
    this.activeCampaignId = null;
    this.activeChapterId = null;

    // Estado do Compêndio
    this.activeCompendiumTab = 'weapons';
    this.compendiumSearchQuery = '';

    // Estado do Admin
    this.activeAdminSubtab = 'users';

    this._setupListeners();
  }

  _setupListeners() {
    this.navItems.forEach(item => {
      const index = parseInt(item.getAttribute('data-index'), 10);
      
      item.addEventListener('click', () => {
        if (!AuthClient.isLoggedIn()) return;
        this.setActive(index);
      });
      
      item.addEventListener('mouseenter', () => {
        if (!AuthClient.isLoggedIn()) return;
        this.audioEngine.playHover();
      });
    });

    // Botão de Logout no header
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.audioEngine.playSelect();
        AuthClient.logout();
      });
    }
  }

  initSession() {
    const container = document.querySelector('.hud-container');
    if (AuthClient.isLoggedIn()) {
      if (container) container.classList.remove('login-mode');
      // Atualizar interface com perfil do usuário
      const user = AuthClient.getUser();
      document.getElementById('header-username').textContent = `[${user.role}] ${user.username}`;
      document.getElementById('header-user-role').textContent = `STATUS: ONLINE`;
      document.getElementById('btn-logout').style.display = 'block';

      // Habilitar a 5ª aba se for ADMIN
      if (AuthClient.isAdmin()) {
        this.navItemAdmin.style.display = 'flex';
      } else {
        this.navItemAdmin.style.display = 'none';
      }

      // Ativar primeiro menu (Lobby)
      this.setActive(0);
    } else {
      if (container) container.classList.add('login-mode');
      // Forçar tela de login
      this.activeIndex = -1;
      this._renderLoginPanel();
      
      // Esconder aba de admin
      this.navItemAdmin.style.display = 'none';

      // Posicionar a câmera no Lobby (estação 0) como fundo decorativo
      const targetStation = CONFIG.cameraStations[0];
      this.sceneManager.camera.position.set(targetStation.pos.x, targetStation.pos.y, targetStation.pos.z);
      this.sceneManager.cameraTarget.copy(targetStation.lookAt);
      this.sceneManager.updateLobbyCharacter("#cba052");

      document.getElementById('header-username').textContent = 'Desconectado';
      document.getElementById('header-user-role').textContent = 'SESSÃO: NENHUMA';
      document.getElementById('btn-logout').style.display = 'none';
    }
  }

  setActive(index) {
    const maxIndex = AuthClient.isAdmin() ? 4 : 3;
    if (index < 0 || index > maxIndex) return;

    if (index !== this.activeIndex) {
      this.audioEngine.playTransition();
      this._triggerGlitchFeedback();
    }

    this.activeIndex = index;

    // Efeito visual Coverflow nos itens de navegação
    this.navItems.forEach((item, idx) => {
      const offset = idx - this.activeIndex;
      const absOffset = Math.abs(offset);
      
      item.className = 'nav-item';
      
      let translateY = offset * 42;
      if (absOffset > 1) translateY = offset * 36;
      
      let translateZ = -absOffset * 60;
      let scale = 1 - (absOffset * 0.12);
      let opacity = 1 - (absOffset * 0.35);
      let zIndex = 40 - absOffset;
      
      if (offset === 0) {
        item.classList.add('active-border');
      }

      item.style.transform = `translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`;
      item.style.opacity = Math.max(0, opacity);
      item.style.zIndex = zIndex;
      item.style.pointerEvents = opacity <= 0 ? 'none' : 'auto';
    });

    // Transição de câmera baseada na estação
    const targetStation = CONFIG.cameraStations[this.activeIndex];
    
    gsap.to(this.sceneManager.camera.position, {
      x: targetStation.pos.x,
      y: targetStation.pos.y,
      z: targetStation.pos.z,
      duration: 1.5,
      ease: "power2.out"
    });

    gsap.to(this.sceneManager.cameraTarget, {
      x: targetStation.lookAt.x,
      y: targetStation.lookAt.y,
      z: targetStation.lookAt.z,
      duration: 1.5,
      ease: "power2.out"
    });

    // Reposition the 3D character container based on active station pedestal
    if (this.sceneManager && this.sceneManager.characterContainer) {
      if (this.activeIndex === 2) {
        this.sceneManager.characterContainer.position.set(15, 0.05, -5);
      } else {
        this.sceneManager.characterContainer.position.set(0, 0, 0);
      }
    }

    this._renderActivePanel();
  }

  _triggerGlitchFeedback() {
    this.glitchScreen.classList.add('glitch-active');
    setTimeout(() => {
      this.glitchScreen.classList.remove('glitch-active');
    }, 300);
  }

  // --------------------------------------------------
  // RENDERIZADOR DE PAINÉIS
  // --------------------------------------------------
  _renderLoginPanel() {
    this.rightPanel.innerHTML = TEMPLATES.login;
    this.rightPanel.style.borderColor = 'rgba(239, 68, 68, 0.25)';

    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const registerBtn = document.getElementById('btn-register-submit');
    const errorEl = document.getElementById('login-error-msg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = 'Autenticando...';
      this.audioEngine.playSelect();

      try {
        await AuthClient.login(usernameInput.value, passwordInput.value);
        this.initSession();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });

    registerBtn.addEventListener('click', async () => {
      if (!usernameInput.value || !passwordInput.value) {
        errorEl.textContent = 'Preencha usuário e senha para registrar.';
        return;
      }
      errorEl.textContent = 'Registrando agente...';
      this.audioEngine.playSelect();

      try {
        await AuthClient.register(usernameInput.value, passwordInput.value);
        this.initSession();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }

  _renderActivePanel() {
    gsap.to(this.rightPanel, {
      opacity: 0,
      x: 10,
      duration: 0.15,
      onComplete: () => {
        this.rightPanel.innerHTML = TEMPLATES[this.activeIndex];
        
        const themes = [
          'rgba(203, 160, 82, 0.2)', // 0: Lobby
          'rgba(56, 189, 248, 0.2)', // 1: Campanhas
          'rgba(16, 185, 129, 0.2)', // 2: Personagens
          'rgba(168, 85, 247, 0.2)', // 3: Compendium
          'rgba(168, 85, 247, 0.4)'  // 4: Admin Panel
        ];
        this.rightPanel.style.borderColor = themes[this.activeIndex];

        // Ligar eventos e popular dados da rota
        if (this.activeIndex === 0) this._bindLobbyControls();
        else if (this.activeIndex === 1) this._bindCampaignControls();
        else if (this.activeIndex === 2) this._bindCharacterControls();
        else if (this.activeIndex === 3) this._bindCompendiumControls();
        else if (this.activeIndex === 4) this._bindAdminControls();

        gsap.to(this.rightPanel, {
          opacity: 1,
          x: 0,
          duration: 0.25,
          ease: "power2.out"
        });
      }
    });
  }

  // =============================================
  // LOBBY (SESSÃO DO JOGADOR)
  // =============================================
  async _bindLobbyControls() {
    const dropdown = document.getElementById('lobby-char-select');
    const uploader = document.getElementById('glb-uploader');
    const testRange = document.getElementById('rig-test-angle');
    const testJoint = document.getElementById('rig-test-joint');
    const campaignTitleEl = document.getElementById('lobby-campaign-title');

    // Toggles de Visão
    const btnLobby = document.getElementById('btn-session-mode-lobby');
    const btnTabletop = document.getElementById('btn-session-mode-tabletop');
    const lobbyView = document.getElementById('session-lobby-view');
    const tabletopView = document.getElementById('session-tabletop-view');

    // Logs e Combat Log
    const combatLog = document.getElementById('tabletop-combat-log');
    const addLog = (message, color = '#d1d5db') => {
      if (!combatLog) return;
      const div = document.createElement('div');
      div.style.color = color;
      div.style.marginBottom = '4px';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
      div.style.paddingBottom = '2px';
      div.innerHTML = `<span style="color:#6b7280; margin-right:4px;">[${new Date().toLocaleTimeString()}]</span> ${message}`;
      combatLog.appendChild(div);
      combatLog.scrollTop = combatLog.scrollHeight;
    };

    if (btnLobby && btnTabletop && lobbyView && tabletopView) {
      btnLobby.addEventListener('click', () => {
        this.audioEngine.playSelect();
        btnLobby.classList.add('active');
        btnTabletop.classList.remove('active');
        lobbyView.style.display = 'flex';
        tabletopView.style.display = 'none';
      });

      btnTabletop.addEventListener('click', () => {
        this.audioEngine.playSelect();
        btnTabletop.classList.add('active');
        btnLobby.classList.remove('active');
        lobbyView.style.display = 'none';
        tabletopView.style.display = 'grid';
        addLog("Visão Tabletop carregada. Conectado ao mapa tático.", 'var(--color-accent)');
      });
    }

    try {
      // Carregar personagens do jogador
      const characters = await APIClient.getCharacters();
      dropdown.innerHTML = characters.map(c => 
        `<option value="${c.id}" ${c.id === this.activeCharacterId ? 'selected' : ''}>${c.name} - Classe ${c.class.name}</option>`
      ).join('') + `<option value="uploaded" style="display:none;" id="opt-uploaded">Modelo Customizado</option>`;

      // Se nenhum tiver selecionado e existirem bonecos, selecione o primeiro
      if (!this.activeCharacterId && characters.length > 0) {
        this.activeCharacterId = characters[0].id;
        dropdown.value = this.activeCharacterId;
      }

      // Atualizar o boneco 3D
      const activeChar = characters.find(c => c.id === this.activeCharacterId);
      if (activeChar) {
        this.sceneManager.updateLobbyCharacter(activeChar.themeColor);
      }

      // Carregar campanha ativa
      const campaigns = await APIClient.getCampaigns();
      const activeCamp = campaigns.find(c => c.status === 'ACTIVE');
      if (activeCamp) {
        this.activeCampaignId = activeCamp.id;
        if (campaignTitleEl) campaignTitleEl.textContent = activeCamp.title;
      } else {
        if (campaignTitleEl) campaignTitleEl.textContent = 'Sem Campanha Ativa';
      }

      // Renderizar time (Party) lado a lado (Lobby Tático)
      const renderPartyGrid = () => {
        const partyContainer = document.getElementById('lobby-party-container');
        if (!partyContainer) return;

        const mockParty = [
          { name: "Lobo Cinzento", class: { name: "Batedor" }, level: 4, hpCurrent: 85, hpMax: 100, mana: 40, themeColor: "#cba052", status: "PRONTO" },
          { name: "Sombra Tática", class: { name: "Assalto" }, level: 3, hpCurrent: 90, hpMax: 90, mana: 30, themeColor: "#38bdf8", status: "SELECIONANDO" },
          { name: "Blindado-01", class: { name: "Defensor" }, level: 5, hpCurrent: 120, hpMax: 120, mana: 20, themeColor: "#10b981", status: "PRONTO" },
          { name: "Sentinela-V", class: { name: "Suporte" }, level: 3, hpCurrent: 75, hpMax: 80, mana: 50, themeColor: "#a855f7", status: "AUSENTE" }
        ];

        if (characters.length > 0) {
          const mainChar = characters.find(c => c.id === this.activeCharacterId) || characters[0];
          mockParty[0] = {
            name: mainChar.name,
            class: mainChar.class,
            level: mainChar.level,
            hpCurrent: mainChar.hpCurrent,
            hpMax: mainChar.hpMax,
            mana: mainChar.mana,
            themeColor: mainChar.themeColor,
            status: "VOCÊ (PRONTO)"
          };
        }

        partyContainer.innerHTML = mockParty.map((player) => {
          const hpPercent = Math.round((player.hpCurrent / player.hpMax) * 100);
          const manaPercent = Math.round((player.mana / 50) * 100);
          return `
            <div class="hud-panel" style="padding: 16px; border: 1px solid ${player.themeColor}33; background: rgba(0,0,0,0.35); border-radius: 8px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="border: 2px solid ${player.themeColor}; border-radius: 50%; width: 40px; height: 40px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:bold; color:${player.themeColor}; background: rgba(0,0,0,0.6); text-transform: uppercase;">
                  ${player.name.substring(0,2)}
                </div>
                <div style="text-align: right;" class="mono-font">
                  <span style="font-size: 8px; color: #9ca3af;">NÍVEL</span><br>
                  <span style="font-size: 18px; font-weight: bold; color: ${player.themeColor};">${player.level}</span>
                </div>
              </div>

              <div style="margin-top: 12px;">
                <span style="font-size: 18px; font-weight: bold; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff;">${player.name}</span>
                <span style="font-size: 11px; color:#9ca3af; display: block; margin-top: 2px;">${player.class.name}</span>
              </div>

              <!-- HP and Mana Bars -->
              <div style="margin-top: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 9px;" class="mono-font">
                  <span style="color:#ef4444; font-weight:bold;">HP</span>
                  <span>${player.hpCurrent}/${player.hpMax}</span>
                </div>
                <div class="progress-track" style="height: 5px; margin-top: 3px; background: rgba(0,0,0,0.6); border-radius: 2px;">
                  <div class="progress-fill" style="width: ${hpPercent}%; background-color:#ef4444; border-radius: 2px;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 6px;" class="mono-font">
                  <span style="color:#38bdf8; font-weight:bold;">MANA</span>
                  <span>${player.mana}/50</span>
                </div>
                <div class="progress-track" style="height: 5px; margin-top: 3px; background: rgba(0,0,0,0.6); border-radius: 2px;">
                  <div class="progress-fill" style="width: ${manaPercent}%; background-color:#38bdf8; border-radius: 2px;"></div>
                </div>
              </div>

              <div style="margin-top: 16px; text-align: center; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px;">
                <span class="mono-font" style="font-size:9px; padding: 3px 10px; border-radius: 4px; background: ${player.status.includes('PRONTO') ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)'}; color: ${player.status.includes('PRONTO') ? '#10b981' : '#9ca3af'}; border: 1px solid ${player.status.includes('PRONTO') ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}; text-transform: uppercase; font-weight: bold;">
                  ${player.status}
                </span>
              </div>
            </div>
          `;
        }).join('');
      };

      renderPartyGrid();

      // Renderizar grade do Tabletop
      const tabletopGrid = document.getElementById('tabletop-battle-grid');
      if (tabletopGrid) {
        let gridHTML = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 12; col++) {
            let inner = '';
            let isObstacle = (row === 2 || row === 4) && col === 6;
            let isPlayer = row === 3 && col === 4;
            let isEnemy = row === 3 && col === 8;
            
            if (isPlayer) {
              inner = '<div style="background:var(--color-accent); border-radius:50%; width:16px; height:16px; border:2px solid #fff; box-shadow:0 0 8px var(--color-accent);" title="Sua Miniatura"></div>';
            } else if (isEnemy) {
              inner = '<div style="background:#ef4444; border-radius:50%; width:16px; height:16px; border:2px solid #fff; box-shadow:0 0 8px #ef4444;" title="Alvo Mutante"></div>';
            } else if (isObstacle) {
              inner = '<div style="background:rgba(255,255,255,0.15); width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#6b7280;">█</div>';
            }

            gridHTML += `
              <div class="tabletop-tile" data-row="${row}" data-col="${col}" style="border: 1px solid rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; cursor:pointer; background:${isObstacle ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)'};" onclick="this.style.background='rgba(203,160,82,0.1)'">
                ${inner}
              </div>
            `;
          }
        }
        tabletopGrid.innerHTML = gridHTML;
      }

      // Iniciativa Tabletop
      const initiativeList = document.getElementById('tabletop-initiative-list');
      if (initiativeList) {
        const order = [
          { name: "Você (Ativo)", val: 18, active: true },
          { name: "Blindado-01 (Defensor)", val: 15, active: false },
          { name: "Ameaça Mutante X (Inimigo)", val: 11, active: false },
          { name: "Sentinela-V (Suporte)", val: 8, active: false }
        ];
        initiativeList.innerHTML = order.map(it => `
          <div style="display:flex; justify-content:space-between; padding: 4px 8px; background: ${it.active ? 'rgba(203,160,82,0.12)' : 'transparent'}; border-left: 2px solid ${it.active ? 'var(--color-accent)' : 'transparent'}; font-size:11px;">
            <span style="color: ${it.active ? 'var(--color-accent)' : '#d1d5db'}; font-weight: ${it.active ? 'bold' : 'normal'};">${it.name}</span>
            <span style="font-weight:bold; color:var(--color-accent);">${it.val}</span>
          </div>
        `).join('');
      }

      // Evento de troca de operador
      dropdown.addEventListener('change', async (e) => {
        this.audioEngine.playSelect();
        this.activeCharacterId = e.target.value;
        
        if (this.activeCharacterId === 'uploaded') return;

        try {
          const characters = await APIClient.getCharacters();
          const activeChar = characters.find(c => c.id === this.activeCharacterId);
          if (activeChar) {
            this.sceneManager.updateLobbyCharacter(activeChar.themeColor);
            this._updateRigSelectors([]);
            document.getElementById('rig-status-label').textContent = "NATIVO";
            renderPartyGrid();
          }
        } catch (err) {
          console.error(err);
        }
      });

    } catch (err) {
      console.error(err);
    }

    // Upload de GLB
    uploader.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.audioEngine.playSelect();
      document.getElementById('rig-status-label').textContent = "CARREGANDO...";

      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target.result;
        this.sceneManager.loadCustomModel(
          buffer,
          (boneNames) => {
            this.uploadedBoneList = boneNames;
            this.activeCharacterId = "uploaded";
            
            const optUploaded = document.getElementById('opt-uploaded');
            if (optUploaded) optUploaded.style.display = 'block';
            dropdown.value = "uploaded";
            
            document.getElementById('rig-status-label').textContent = "MAPEAR";
            this._updateRigSelectors(boneNames);
          },
          (err) => {
            document.getElementById('rig-status-label').textContent = "ERRO";
            alert("Erro ao ler arquivo GLB. Certifique-se de que é uma malha compatível.");
          }
        );
      };
      reader.readAsArrayBuffer(file);
    });

    // Mapeamento de juntas (hidden compatibility)
    const joints = ['head', 'torso', 'shoulderLeft', 'shoulderRight', 'hipLeft', 'hipRight'];
    joints.forEach(j => {
      const sel = document.getElementById(`sel-rig-${j}`);
      if (sel) {
        sel.addEventListener('change', (e) => {
          this.rigMap[j] = e.target.value;
          this.audioEngine.playSelect();
          this._updateJointDropdown();
        });
      }
    });

    if (testRange) {
      testRange.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const mappedBone = testJoint.value;
        if (mappedBone) {
          this.sceneManager.rotateModelBone(mappedBone, value);
        }
      });
    }

    if (this.activeCharacterId === 'uploaded' && this.uploadedBoneList.length > 0) {
      this._updateRigSelectors(this.uploadedBoneList);
      dropdown.value = "uploaded";
    }

    // Ações do Tabletop
    const btnMove = document.getElementById('btn-tabletop-move');
    const btnAttack = document.getElementById('btn-tabletop-attack');
    const btnEndTurn = document.getElementById('btn-tabletop-endturn');

    if (btnMove) {
      btnMove.addEventListener('click', () => {
        this.audioEngine.playSelect();
        addLog("Você iniciou movimentação de miniatura. Clique em um tile adjacente na grelha.", '#38bdf8');
      });
    }
    if (btnAttack) {
      btnAttack.addEventListener('click', () => {
        this.audioEngine.playSelect();
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + 4; // bonus
        addLog(`Ação de Ataque contra Mutante Alfa! Teste de Pontaria: Rolagem D20 = ${roll} + 4 = <strong>${total}</strong>. ${total >= 12 ? '<span style="color:#10b981;">ACERTOU!</span>' : '<span style="color:#ef4444;">ERROU!</span>'}`, '#ef4444');
      });
    }
    if (btnEndTurn) {
      btnEndTurn.addEventListener('click', () => {
        this.audioEngine.playSelect();
        addLog("Turno finalizado pelo agente. Iniciativa repassada ao mestre.", '#10b981');
      });
    }

    // Rolagem de Dados
    const diceResult = document.getElementById('dice-roll-result');
    const diceBtns = document.querySelectorAll('.btn-roll-dice');

    diceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audioEngine.playSelect();
        const sides = parseInt(e.target.getAttribute('data-dice'), 10);
        const roll = Math.floor(Math.random() * sides) + 1;
        if (diceResult) diceResult.textContent = roll;
        addLog(`Dado rolando... D${sides} = <strong>${roll}</strong>`, 'var(--color-accent)');
      });
    });

    const mainBtn = document.getElementById('action-btn-main');
    if (mainBtn) {
      mainBtn.addEventListener('click', () => {
        this.audioEngine.playSelect();
        alert('Confirmação de prontidão enviada ao Mestre da Campanha!');
      });
    }
  }

  _updateRigSelectors(boneNames) {
    const joints = ['head', 'torso', 'shoulderLeft', 'shoulderRight', 'hipLeft', 'hipRight'];
    joints.forEach(j => {
      const sel = document.getElementById(`sel-rig-${j}`);
      if (!sel) return;

      if (boneNames.length === 0) {
        sel.innerHTML = `<option value="">Automático</option>`;
        sel.disabled = true;
      } else {
        sel.disabled = false;
        const matchGuess = this._guessBoneMatch(j, boneNames);
        sel.innerHTML = boneNames.map(b => 
          `<option value="${b}" ${b === matchGuess ? 'selected' : ''}>${b}</option>`
        ).join('');
        this.rigMap[j] = sel.value;
      }
    });
    this._updateJointDropdown();
  }

  _guessBoneMatch(joint, boneNames) {
    const keywords = {
      head: ['head', 'cabeca', 'neck', 'pescoco'],
      torso: ['spine', 'chest', 'torso', 'tronco', 'root', 'hips'],
      shoulderLeft: ['shoulder.l', 'shoulder_l', 'arm.l', 'arm_l', 'leftshoulder', 'leftarm'],
      shoulderRight: ['shoulder.r', 'shoulder_r', 'arm.r', 'arm_r', 'rightshoulder', 'rightarm'],
      hipLeft: ['hip.l', 'hip_l', 'leg.l', 'leg_l', 'lefthip', 'leftleg'],
      hipRight: ['hip.r', 'hip_r', 'leg.r', 'leg_r', 'righthip', 'rightleg']
    };
    const searches = keywords[joint] || [];
    for (let s of searches) {
      const match = boneNames.find(b => b.toLowerCase().includes(s));
      if (match) return match;
    }
    return boneNames[0];
  }

  _updateJointDropdown() {
    const testJoint = document.getElementById('rig-test-joint');
    if (!testJoint) return;

    if (this.activeCharacterId === 'uploaded') {
      testJoint.innerHTML = Object.entries(this.rigMap).map(([jointName, boneName]) => 
        `<option value="${boneName}">Junta: ${jointName.toUpperCase()} (${boneName})</option>`
      ).join('');
    } else {
      testJoint.innerHTML = `
        <option value="head">CABEÇA</option>
        <option value="torso">TRONCO</option>
        <option value="shoulderLeft">BRAÇO ESQ</option>
        <option value="shoulderRight">BRAÇO DIR</option>
        <option value="hipLeft">PERNA ESQ</option>
        <option value="hipRight">PERNA DIR</option>
      `;
    }
  }

  // =============================================
  // CAMPANHAS
  // =============================================
  async _bindCampaignControls() {
    const gridContainer = document.getElementById('campaigns-grid');
    const overlay = document.getElementById('campaign-popup-overlay');
    const screenCampaign = document.getElementById('popup-screen-campaign');
    const screenCharacter = document.getElementById('popup-screen-character');
    
    // Elementos do popup de Campanha
    const popupTitle = document.getElementById('popup-campaign-title');
    const popupDesc = document.getElementById('popup-campaign-desc');
    const popupDate = document.getElementById('popup-campaign-date');
    const popupPartyList = document.getElementById('popup-party-list');
    const btnClosePopup = document.getElementById('btn-close-campaign-popup');

    // Elementos do popup de Personagem (Ficha)
    const btnCharBack = document.getElementById('btn-popup-char-back');
    const btnCloseCharPopup = document.getElementById('btn-close-char-popup');
    const popupAvatar = document.getElementById('popup-char-avatar');
    const popupUsername = document.getElementById('popup-char-username');
    const popupCharName = document.getElementById('popup-char-name');
    const popupCharClass = document.getElementById('popup-char-class');
    const popupCharLevel = document.getElementById('popup-char-level');
    const popupHpText = document.getElementById('popup-char-hp-text');
    const popupHpBar = document.getElementById('popup-char-hp-bar');
    const popupManaText = document.getElementById('popup-char-mana-text');
    const popupManaBar = document.getElementById('popup-char-mana-bar');
    
    const popupStatStr = document.getElementById('popup-stat-str');
    const popupStatDex = document.getElementById('popup-stat-dex');
    const popupStatCon = document.getElementById('popup-stat-con');
    const popupStatInt = document.getElementById('popup-stat-int');
    const popupStatWis = document.getElementById('popup-stat-wis');
    const popupStatCha = document.getElementById('popup-stat-cha');
    
    const popupEqPrimary = document.getElementById('popup-equip-primary');
    const popupEqSecondary = document.getElementById('popup-equip-secondary');
    const popupEqHead = document.getElementById('popup-equip-head');
    const popupEqTorso = document.getElementById('popup-equip-torso');

    const closeAll = () => {
      this.audioEngine.playSelect();
      overlay.style.display = 'none';
      screenCampaign.style.display = 'flex';
      screenCharacter.style.display = 'none';
    };

    if (overlay) {
      overlay.addEventListener('click', closeAll);
    }
    if (btnClosePopup) btnClosePopup.addEventListener('click', closeAll);
    if (btnCloseCharPopup) btnCloseCharPopup.addEventListener('click', closeAll);

    if (btnCharBack) {
      btnCharBack.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audioEngine.playSelect();
        screenCharacter.style.display = 'none';
        screenCampaign.style.display = 'flex';
      });
    }

    try {
      const campaigns = await APIClient.getCampaigns();
      if (campaigns.length === 0) {
        gridContainer.innerHTML = `<div class="mono-font color-blue" style="font-size:14px; padding: 20px; text-align:center; grid-column: 1/-1;">Sem campanhas atribuídas a você no momento.</div>`;
        return;
      }

      // Renderizar o Grid de cards de campanha
      gridContainer.innerHTML = campaigns.map((c, idx) => {
        // Gera um gradiente de cor diferente com base na campanha
        const colors = [
          'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(0, 0, 0, 0.85))',
          'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(0, 0, 0, 0.85))',
          'linear-gradient(135deg, rgba(203, 160, 82, 0.15), rgba(0, 0, 0, 0.85))',
          'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(0, 0, 0, 0.85))'
        ];
        const gradient = colors[idx % colors.length];
        return `
          <div class="hud-panel campaign-card" data-id="${c.id}" style="height: 180px; padding: 20px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.15); background: ${gradient}; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.3s ease;">
            <!-- Background detail grid lines inside card -->
            <div style="position: absolute; inset:0; background: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px); background-size: 15px 15px; pointer-events: none;"></div>
            
            <div style="z-index: 2;">
              <span class="mono-font" style="font-size: 10px; color: var(--color-blue); text-transform: uppercase;">CÓDIGO // CAP-0${idx+1}</span>
              <h3 style="font-size: 22px; color: #fff; font-weight: bold; margin-top: 4px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${c.title}</h3>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; z-index: 2;" class="mono-font">
              <span style="font-size: 11px; color:#9ca3af;">STATUS: ${c.status}</span>
              <span style="font-size: 11px; color: var(--color-blue); font-weight: bold;">ACESSAR MESA ►</span>
            </div>
          </div>
        `;
      }).join('');

      // Adicionar listeners para abrir o Popup
      gridContainer.querySelectorAll('.campaign-card').forEach(card => {
        card.addEventListener('click', async (e) => {
          this.audioEngine.playSelect();
          const campId = e.currentTarget.getAttribute('data-id');
          
          try {
            const camp = await APIClient.getCampaign(campId);
            this.activeCampaignId = camp.id;
            
            // Preencher dados básicos da Campanha
            popupTitle.textContent = camp.title;
            popupDesc.textContent = camp.synopsis || 'Sem história cadastrada para esta campanha.';
            
            // Format data
            const dateStr = new Date(camp.createdAt).toLocaleDateString('pt-BR');
            popupDate.textContent = `CRIAÇÃO: ${dateStr}`;

            // Renderizar membros do grupo (Players/Party)
            if (camp.players && camp.players.length > 0) {
              
              // Carregar compêndio para resolver nomes dos slots equipados
              const compWeapons = await APIClient.getCompendium('weapons');
              const compEquipment = await APIClient.getCompendium('equipment');
              const itemsMap = new Map([
                ...compWeapons.map(w => [w.id, w.name]),
                ...compEquipment.map(eq => [eq.id, eq.name])
              ]);

              popupPartyList.innerHTML = camp.players.map(p => {
                const character = p.user.characters && p.user.characters[0];
                const charName = character ? character.name : 'Sem Personagem';
                const charClass = character ? character.class.name : 'Recruta';
                const charLvl = character ? `Lvl ${character.level}` : '--';
                const charTheme = character ? character.themeColor : '#6b7280';

                return `
                  <div class="scroll-list-item party-player-row" data-userid="${p.user.id}" style="cursor: pointer; padding: 8px 12px; display:flex; align-items:center; justify-content:space-between; border-color: rgba(255,255,255,0.05); background: rgba(0,0,0,0.25);" onclick="event.stopPropagation();">
                    <div style="display:flex; align-items:center; gap: 10px;">
                      <div style="border: 2px solid ${charTheme}; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; color:${charTheme}; background: rgba(0,0,0,0.4); text-transform: uppercase;">
                        ${charName.substring(0, 2)}
                      </div>
                      <div>
                        <span style="font-weight:bold; color:#fff; display:block; font-size:13px; text-transform: uppercase;">${charName}</span>
                        <span style="font-size:10px; color:#9ca3af;">@${p.user.username} // ${charClass}</span>
                      </div>
                    </div>
                    <span class="mono-font" style="font-size: 11px; color: var(--color-blue); font-weight: bold;">${charLvl}</span>
                  </div>
                `;
              }).join('');

              // Adicionar click listener para ver a ficha do operador
              popupPartyList.querySelectorAll('.party-player-row').forEach(row => {
                row.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  this.audioEngine.playSelect();
                  const userId = ev.currentTarget.getAttribute('data-userid');
                  const player = camp.players.find(p => p.user.id === userId);
                  if (player && player.user.characters && player.user.characters.length > 0) {
                    const char = player.user.characters[0];
                    
                    // Mudar de tela
                    screenCampaign.style.display = 'none';
                    screenCharacter.style.display = 'flex';

                    // Preencher ficha
                    popupAvatar.textContent = char.name.substring(0, 2).toUpperCase();
                    popupAvatar.style.borderColor = char.themeColor;
                    popupAvatar.style.color = char.themeColor;

                    popupUsername.textContent = `@${player.user.username}`;
                    popupCharName.textContent = char.name;
                    popupCharClass.textContent = `Classe: ${char.class.name}`;
                    popupCharLevel.textContent = `NÍVEL ${String(char.level).padStart(2, '0')}`;

                    // Hp e mana
                    popupHpText.textContent = `${char.hpCurrent}/${char.hpMax}`;
                    popupHpBar.style.width = `${Math.min(100, Math.round((char.hpCurrent / char.hpMax) * 100))}%`;
                    popupManaText.textContent = `${char.mana}/50`;
                    popupManaBar.style.width = `${Math.min(100, Math.round((char.mana / 50) * 100))}%`;

                    // Atributos
                    popupStatStr.textContent = char.strength;
                    popupStatDex.textContent = char.dexterity;
                    popupStatCon.textContent = char.constitution;
                    popupStatInt.textContent = char.intelligence;
                    popupStatWis.textContent = char.wisdom;
                    popupStatCha.textContent = char.charisma;

                    // Equipamento
                    const getEquipped = (slot) => {
                      const item = char.equippedItems.find(eq => eq.slot === slot);
                      if (!item) return 'Vazio';
                      return itemsMap.get(item.itemId) || 'Item';
                    };
                    
                    popupEqPrimary.textContent = getEquipped('primary_weapon');
                    popupEqSecondary.textContent = getEquipped('secondary_weapon');
                    popupEqHead.textContent = getEquipped('HEAD');
                    popupEqTorso.textContent = getEquipped('TORSO');
                  } else {
                    alert('Este usuário ainda não criou um personagem ativo.');
                  }
                });
              });

            } else {
              popupPartyList.innerHTML = `<span class="mono-font" style="color:#6b7280; font-size:11px; padding:10px; display:block; text-align:center;">Nenhum jogador na party desta campanha.</span>`;
            }

            // Exibir Popup overlay
            overlay.style.display = 'flex';

          } catch (err) {
            console.error(err);
          }
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  // =============================================
  // PERSONAGENS & INVENTÁRIO
  // =============================================
  async _bindCharacterControls() {
    const charSelect = document.getElementById('character-class-select');
    const avatarBox = document.getElementById('char-avatar-box');
    const nameEl = document.getElementById('char-spec-name');
    const classEl = document.getElementById('char-spec-class');
    const lvlEl = document.getElementById('char-spec-level');
    const hpText = document.getElementById('char-hp-text');
    const hpBar = document.getElementById('char-hp-bar');
    const manaText = document.getElementById('char-mana-text');
    const manaBar = document.getElementById('char-mana-bar');
    
    // Atributos
    const statStr = document.getElementById('stat-str');
    const statDex = document.getElementById('stat-dex');
    const statCon = document.getElementById('stat-con');
    const statInt = document.getElementById('stat-int');
    const statWis = document.getElementById('stat-wis');
    const statCha = document.getElementById('stat-cha');

    // Slots de equipamentos
    const slotPrimary = document.getElementById('slot-wep-primary');
    const slotSecondary = document.getElementById('slot-wep-secondary');
    const slotHead = document.getElementById('slot-equip-head');
    const slotTorso = document.getElementById('slot-equip-torso');

    const previewSlotPrimary = document.getElementById('preview-slot-primary');
    const previewSlotSecondary = document.getElementById('preview-slot-secondary');

    // Inventário
    const inventoryList = document.getElementById('player-inventory-list');
    const filterBtns = document.querySelectorAll('.inv-filter');

    // Modais
    const openModalBtn = document.getElementById('btn-create-char-modal');
    const closeModalBtn = document.getElementById('btn-close-char-modal');
    const modal = document.getElementById('modal-create-char');
    const createForm = document.getElementById('form-create-char');
    const newCharClassSelect = document.getElementById('new-char-class');
    const deleteCharBtn = document.getElementById('btn-delete-char');

    // Edit Mode Toggle
    const statsPanel = document.getElementById('char-stats-view-panel');
    const inventoryPanel = document.getElementById('char-inventory-edit-panel');
    const rightPanelModeHeader = document.getElementById('char-right-panel-mode');
    const modeToggleBtn = document.getElementById('btn-char-mode-toggle');

    let isEditMode = false;

    const setEditMode = (active) => {
      isEditMode = active;
      if (isEditMode) {
        statsPanel.style.display = 'none';
        inventoryPanel.style.display = 'flex';
        rightPanelModeHeader.textContent = 'MOCHILA & SLOTS';
        rightPanelModeHeader.style.color = 'var(--color-blue)';
        modeToggleBtn.textContent = 'VER FICHA';
        modeToggleBtn.style.borderColor = 'var(--color-blue)';
        modeToggleBtn.style.color = 'var(--color-blue)';
        
        const scannerStatus = document.getElementById('char-scanner-status');
        if (scannerStatus) {
          scannerStatus.textContent = 'MODO INVENTÁRIO TÁTICO';
          scannerStatus.style.color = 'var(--color-blue)';
        }
      } else {
        statsPanel.style.display = 'flex';
        inventoryPanel.style.display = 'none';
        rightPanelModeHeader.textContent = 'ESTATÍSTICAS DA CLASSE';
        rightPanelModeHeader.style.color = 'var(--color-green)';
        modeToggleBtn.textContent = 'EDITAR MOCHILA';
        modeToggleBtn.style.borderColor = 'var(--color-green)';
        modeToggleBtn.style.color = 'var(--color-green)';
        
        const scannerStatus = document.getElementById('char-scanner-status');
        if (scannerStatus) {
          scannerStatus.textContent = 'SCANNER BIOMÉTRICO 3D';
          scannerStatus.style.color = 'var(--color-green)';
        }
      }
    };

    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', () => {
        this.audioEngine.playSelect();
        setEditMode(!isEditMode);
      });
    }

    const updateRadar = (char) => {
      const polygon = document.getElementById('radar-polygon');
      if (!polygon) return;

      const center = 50;
      const scaleFactor = 2.0; // Converter stat (max 20) para distância de radar (max 40)
      
      const stats = [
        char.strength,
        char.dexterity,
        char.constitution,
        char.intelligence,
        char.wisdom,
        char.charisma
      ];

      const points = stats.map((val, i) => {
        const radius = Math.min(40, val * scaleFactor);
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

      polygon.setAttribute('points', points);
    };

    const loadCharacterDetails = async () => {
      try {
        const characters = await APIClient.getCharacters();
        const codClassList = document.getElementById('cod-class-list');

        if (characters.length === 0) {
          charSelect.innerHTML = `<option value="">Nenhum personagem</option>`;
          if (codClassList) codClassList.innerHTML = `<span class="mono-font" style="color:#6b7280; font-size:11px; padding:10px; display:block; text-align:center;">Nenhum operador registrado.</span>`;
          nameEl.textContent = 'SEM AGENTE';
          classEl.textContent = 'Crie um personagem';
          lvlEl.textContent = '--';
          hpText.textContent = '0/0';
          hpBar.style.width = '0%';
          manaText.textContent = '0/0';
          manaBar.style.width = '0%';
          
          if (slotPrimary) slotPrimary.textContent = 'Vazio';
          if (slotSecondary) slotSecondary.textContent = 'Vazio';
          if (slotHead) slotHead.textContent = 'Vazio';
          if (slotTorso) slotTorso.textContent = 'Vazio';
          if (previewSlotPrimary) previewSlotPrimary.textContent = 'Vazio';
          if (previewSlotSecondary) previewSlotSecondary.textContent = 'Vazio';
          return;
        }

        // Keep compatibility selector in sync
        charSelect.innerHTML = characters.map(c => 
          `<option value="${c.id}" ${c.id === this.activeCharacterId ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        if (!this.activeCharacterId) {
          this.activeCharacterId = characters[0].id;
        }

        // Render CoD Vertical Class Selector
        if (codClassList) {
          codClassList.innerHTML = characters.map(c => {
            const isActive = c.id === this.activeCharacterId;
            return `
              <div class="cod-class-item" data-id="${c.id}" style="border: 1px solid ${isActive ? 'var(--color-green)' : 'rgba(255,255,255,0.06)'}; padding: 12px; background: ${isActive ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.25)'}; border-radius: 6px; cursor: pointer; transition: all 0.2s; position:relative; overflow:hidden;">
                ${isActive ? '<div style="position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--color-green); box-shadow: 0 0 8px var(--color-green);"></div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold; color: ${isActive ? '#fff' : '#d1d5db'}; font-size: 13px; text-transform:uppercase;">${c.name}</span>
                  <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 2px; color: ${c.themeColor};" class="mono-font">LVL ${c.level}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size: 10px; color: #9ca3af; margin-top: 6px;">
                  <span>${c.class.name}</span>
                  <span style="font-size:9px; color: #10b981; font-weight: bold; display: ${isActive ? 'inline' : 'none'};">ATIVO</span>
                </div>
              </div>
            `;
          }).join('');

          // Click events for CoD selection list
          codClassList.querySelectorAll('.cod-class-item').forEach(itemNode => {
            itemNode.addEventListener('click', () => {
              const clickedId = itemNode.getAttribute('data-id');
              if (clickedId !== this.activeCharacterId) {
                this.audioEngine.playSelect();
                this.activeCharacterId = clickedId;
                charSelect.value = clickedId;
                // Dispatch change event to keep other selectors sync
                charSelect.dispatchEvent(new Event('change'));
                loadCharacterDetails();
              }
            });

            itemNode.addEventListener('dblclick', () => {
              const clickedId = itemNode.getAttribute('data-id');
              if (clickedId !== this.activeCharacterId) {
                this.audioEngine.playSelect();
                this.activeCharacterId = clickedId;
                charSelect.value = clickedId;
                charSelect.dispatchEvent(new Event('change'));
                loadCharacterDetails();
              }
              setEditMode(true);
            });
          });
        }

        const char = characters.find(c => c.id === this.activeCharacterId);
        if (!char) return;
        this.activeCharacter = char;

        // Fetch compendium items to calculate stats dynamically
        const compWeapons = await APIClient.getCompendium('weapons');
        const compEquipment = await APIClient.getCompendium('equipment');

        const weaponsMap = new Map(compWeapons.map(w => [w.id, w]));
        const equipMap = new Map(compEquipment.map(e => [e.id, e]));

        // Calculate dynamic stats + active equipment bonuses
        let bonusStr = 0;
        let bonusDex = 0;
        let bonusCon = 0;
        let bonusInt = 0;
        let bonusWis = 0;
        let bonusCha = 0;
        let bonusHp = 0;
        let bonusMana = 0;

        char.equippedItems.forEach(eq => {
          if (eq.itemType === 'equipment') {
            const itemDetails = equipMap.get(eq.itemId);
            if (itemDetails) {
              bonusStr += itemDetails.bonusStrength || 0;
              bonusDex += itemDetails.bonusDexterity || 0;
              bonusCon += itemDetails.bonusConstitution || 0;
              bonusInt += itemDetails.bonusIntelligence || 0;
              bonusWis += itemDetails.bonusWisdom || 0;
              bonusCha += itemDetails.bonusCharisma || 0;
              bonusHp += itemDetails.bonusHp || 0;
              bonusMana += itemDetails.bonusMana || 0;
            }
          }
        });

        const finalStr = char.strength + bonusStr;
        const finalDex = char.dexterity + bonusDex;
        const finalCon = char.constitution + bonusCon;
        const finalInt = char.intelligence + bonusInt;
        const finalWis = char.wisdom + bonusWis;
        const finalCha = char.charisma + bonusCha;
        const finalHpMax = char.hpMax + bonusHp;
        const finalHpCurrent = Math.min(char.hpCurrent, finalHpMax);
        const finalManaMax = 50 + bonusMana;
        const finalMana = Math.min(char.mana, finalManaMax);

        // Update texts
        nameEl.textContent = char.name;
        classEl.textContent = `Classe: ${char.class.name}`;
        lvlEl.textContent = String(char.level).padStart(2, '0');
        avatarBox.textContent = char.name.substring(0, 2).toUpperCase();
        avatarBox.style.borderColor = char.themeColor;
        avatarBox.style.color = char.themeColor;

        // Render dynamic stats with bonus tags
        const setStatText = (el, baseVal, bonusVal) => {
          if (!el) return;
          if (bonusVal > 0) {
            el.innerHTML = `${baseVal + bonusVal} <span style="font-size: 9px; color: var(--color-green); font-weight: normal;">(+${bonusVal})</span>`;
          } else if (bonusVal < 0) {
            el.innerHTML = `${baseVal + bonusVal} <span style="font-size: 9px; color: #ef4444; font-weight: normal;">(${bonusVal})</span>`;
          } else {
            el.textContent = baseVal;
          }
        };

        setStatText(statStr, char.strength, bonusStr);
        setStatText(statDex, char.dexterity, bonusDex);
        setStatText(statCon, char.constitution, bonusCon);
        setStatText(statInt, char.intelligence, bonusInt);
        setStatText(statWis, char.wisdom, bonusWis);
        setStatText(statCha, char.charisma, bonusCha);

        // HP and Mana bars update
        const hpPercent = Math.min(100, Math.round((finalHpCurrent / finalHpMax) * 100));
        hpText.textContent = `${finalHpCurrent}/${finalHpMax}`;
        hpBar.style.width = `${hpPercent}%`;

        const manaPercent = Math.min(100, Math.round((finalMana / finalManaMax) * 100));
        manaText.textContent = `${finalMana}/${finalManaMax}`;
        manaBar.style.width = `${manaPercent}%`;

        // Update Radar with final stats
        updateRadar({
          strength: finalStr,
          dexterity: finalDex,
          constitution: finalCon,
          intelligence: finalInt,
          wisdom: finalWis,
          charisma: finalCha
        });

        // Update active mannequin color
        this.sceneManager.updateLobbyCharacter(char.themeColor);

        // Update slots descriptions
        const getEquippedName = (slot) => {
          const item = char.equippedItems.find(eq => eq.slot === slot);
          if (!item) return 'Vazio';
          
          if (item.itemType === 'weapon') {
            const wep = weaponsMap.get(item.itemId);
            return wep ? wep.name : 'Arma Desconhecida';
          } else {
            const eq = equipMap.get(item.itemId);
            return eq ? eq.name : 'Equipamento Desconhecido';
          }
        };

        if (slotPrimary) slotPrimary.textContent = getEquippedName('primary_weapon');
        if (slotSecondary) slotSecondary.textContent = getEquippedName('secondary_weapon');
        if (slotHead) slotHead.textContent = getEquippedName('HEAD');
        if (slotTorso) slotTorso.textContent = getEquippedName('TORSO');

        if (previewSlotPrimary) previewSlotPrimary.textContent = getEquippedName('primary_weapon');
        if (previewSlotSecondary) previewSlotSecondary.textContent = getEquippedName('secondary_weapon');

        // Update Modifiers Summary label
        const bonusesLabel = document.getElementById('char-bonuses-value');
        if (bonusesLabel) {
          const list = [];
          if (bonusStr > 0) list.push(`FOR+${bonusStr}`);
          if (bonusDex > 0) list.push(`DES+${bonusDex}`);
          if (bonusCon > 0) list.push(`CON+${bonusCon}`);
          if (bonusInt > 0) list.push(`INT+${bonusInt}`);
          if (bonusWis > 0) list.push(`SAB+${bonusWis}`);
          if (bonusCha > 0) list.push(`CAR+${bonusCha}`);
          if (bonusHp > 0) list.push(`HP+${bonusHp}`);
          if (bonusMana > 0) list.push(`MANA+${bonusMana}`);

          bonusesLabel.textContent = list.length > 0 ? list.join(', ') : 'NENHUM';
        }

        // Render Mochila Inventory
        await loadInventory();

      } catch (err) {
        console.error(err);
      }
    };

    const loadInventory = async () => {
      try {
        const inventory = await APIClient.getInventory();
        this.inventoryItems = inventory;

        let filtered = inventory;
        if (this.currentInventoryFilter !== 'all') {
          filtered = inventory.filter(i => i.itemType === this.currentInventoryFilter);
        }

        inventoryList.innerHTML = filtered.length > 0
          ? filtered.map(item => {
              let actionBtn = '';
              let equipBtn = '';
              
              if (item.itemType === 'consumable') {
                actionBtn = `<button class="btn-tactical btn-use-item" data-id="${item.id}" style="padding: 2px 6px; font-size:9px; border-color:var(--color-green); color:var(--color-green);">USAR</button>`;
              }

              if (item.itemType === 'weapon' || item.itemType === 'equipment') {
                equipBtn = `<button class="btn-tactical btn-equip-item" data-id="${item.id}" data-type="${item.itemType}" data-itemid="${item.itemId}" style="padding: 2px 6px; font-size:9px; border-color:var(--color-blue); color:var(--color-blue);">EQUIPAR</button>`;
              }

              const rarityColor = {
                COMMON: '#ffffff',
                UNCOMMON: '#38bdf8',
                RARE: '#10b981',
                EPIC: '#a855f7',
                LEGENDARY: '#cba052'
              }[item.details.rarity] || '#ffffff';

              return `
                <div class="scroll-list-item" style="padding: 8px; margin-bottom: 4px; display:flex; justify-content:space-between; align-items:center;">
                  <div class="list-item-meta" style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span class="list-item-title" style="color: ${rarityColor}; font-size:12px; font-weight:bold;">${item.details.name} (x${item.quantity})</span>
                      <span style="font-size:9px; color: #9ca3af; text-transform:uppercase;">${item.itemType}</span>
                    </div>
                    <span style="font-size:10px; color:#d1d5db; display:block; margin-top:2px;">${item.details.description}</span>
                  </div>
                  <div style="display:flex; gap:4px; align-items:center; margin-left: 8px;">
                    ${actionBtn}
                    ${equipBtn}
                    <button class="btn-tactical btn-discard-item" data-id="${item.id}" style="padding: 2px 6px; font-size:9px; border-color:#ef4444; color:#ef4444;">DESC.</button>
                  </div>
                </div>
              `;
            }).join('')
          : `<span class="mono-font" style="color:#6b7280; font-size:11px; padding:10px; display:block; text-align:center;">Nenhum item na mochila.</span>`;

        // Inventory list click buttons binding
        inventoryList.querySelectorAll('.btn-use-item').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            this.audioEngine.playSelect();
            const itemId = e.target.getAttribute('data-id');
            try {
              const res = await APIClient.useConsumable(itemId, this.activeCharacterId);
              alert(res.message);
              await loadCharacterDetails();
            } catch (err) {
              alert(err.message);
            }
          });
        });

        inventoryList.querySelectorAll('.btn-discard-item').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            this.audioEngine.playSelect();
            const itemId = e.target.getAttribute('data-id');
            if (confirm('Deseja mesmo descartar este item da sua mochila?')) {
              try {
                await APIClient.discardItem(itemId);
                await loadInventory();
              } catch (err) {
                alert(err.message);
              }
            }
          });
        });

        inventoryList.querySelectorAll('.btn-equip-item').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            this.audioEngine.playSelect();
            const itemId = e.target.getAttribute('data-itemid');
            const itemType = e.target.getAttribute('data-type');
            
            let slot = 'primary_weapon';
            if (itemType === 'weapon') {
              slot = confirm('Equipar no slot PRIMÁRIO? (Pressione CANCELAR para Secundário)') ? 'primary_weapon' : 'secondary_weapon';
            } else {
              const invItem = this.inventoryItems.find(i => i.itemId === itemId && i.itemType === itemType);
              slot = invItem ? invItem.details.slot : 'HEAD';
            }

            try {
              await APIClient.equipItem(this.activeCharacterId, slot, itemId, itemType, 'equip');
              await loadCharacterDetails();
            } catch (err) {
              alert(err.message);
            }
          });
        });

      } catch (err) {
        console.error(err);
      }
    };

    // Filter clicks
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audioEngine.playHover();
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentInventoryFilter = e.target.getAttribute('data-filter');
        loadInventory();
      });
    });

    // Dropdown change compatibility
    charSelect.addEventListener('change', (e) => {
      this.audioEngine.playSelect();
      this.activeCharacterId = e.target.value;
      loadCharacterDetails();
    });

    // Modals bindings
    openModalBtn.addEventListener('click', async () => {
      this.audioEngine.playSelect();
      try {
        const classes = await APIClient.getCompendium('classes');
        newCharClassSelect.innerHTML = classes.map(cl => `<option value="${cl.id}">${cl.name}</option>`).join('');
        modal.style.display = 'flex';
      } catch (err) {
        console.error(err);
      }
    });

    closeModalBtn.addEventListener('click', () => {
      this.audioEngine.playSelect();
      modal.style.display = 'none';
    });

    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-char-name').value;
      const classId = newCharClassSelect.value;
      const themeColor = document.getElementById('new-char-color').value;

      try {
        const newChar = await APIClient.createCharacter(name, classId, themeColor);
        modal.style.display = 'none';
        this.activeCharacterId = newChar.id;
        createForm.reset();
        await loadCharacterDetails();
      } catch (err) {
        alert(err.message);
      }
    });

    deleteCharBtn.addEventListener('click', async () => {
      this.audioEngine.playSelect();
      if (!this.activeCharacterId) return;
      if (confirm(`Deseja mesmo excluir permanentemente o personagem ${this.activeCharacter.name}?`)) {
        try {
          await APIClient.deleteCharacter(this.activeCharacterId);
          this.activeCharacterId = null;
          await loadCharacterDetails();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Unequip slot listeners
    document.querySelectorAll('.slot-item').forEach(slotNode => {
      slotNode.addEventListener('click', async (e) => {
        this.audioEngine.playSelect();
        const slotName = e.currentTarget.getAttribute('data-slot');
        const value = e.currentTarget.querySelector('div:last-child').textContent;
        
        if (value === 'Vazio') return;

        if (confirm(`Deseja desequipar o item do slot ${slotName}?`)) {
          try {
            await APIClient.equipItem(this.activeCharacterId, slotName, null, null, 'unequip');
            await loadCharacterDetails();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    await loadCharacterDetails();
  }

  // =============================================
  // COMPENDIUM
  // =============================================
  async _bindCompendiumControls() {
    const tabs = document.querySelectorAll('.tab-btn');
    const searchInput = document.getElementById('compendium-search');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.audioEngine.playHover();
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        this.activeCompendiumTab = e.target.getAttribute('data-table');
        this._renderCompendiumTable(this.activeCompendiumTab);
      });
    });

    searchInput.addEventListener('input', (e) => {
      this.compendiumSearchQuery = e.target.value.toLowerCase();
      this._renderCompendiumTable(this.activeCompendiumTab);
    });

    this._renderCompendiumTable('weapons');

    const mainBtn = document.getElementById('action-btn-main');
    if (mainBtn) {
      mainBtn.addEventListener('click', () => {
        this.audioEngine.playSelect();
        alert('Banco de dados em cache sincronizado para acesso offline.');
      });
    }
  }

  async _renderCompendiumTable(category) {
    const listEl = document.getElementById('compendium-db-list');
    const descEl = document.getElementById('compendium-details-text');

    try {
      const records = await APIClient.getCompendium(category);
      
      // Filtrar por busca
      const filtered = records.filter(r => 
        r.name.toLowerCase().includes(this.compendiumSearchQuery) ||
        (r.description && r.description.toLowerCase().includes(this.compendiumSearchQuery))
      );

      listEl.innerHTML = filtered.length > 0
        ? filtered.map((item, idx) => {
            // Determine rarity badge if applicable
            const rarity = item.rarity || 'COMMON';
            const rarityColors = {
              COMMON: { border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.02)', text: '#9ca3af' },
              UNCOMMON: { border: 'rgba(56,189,248,0.2)', bg: 'rgba(56,189,248,0.05)', text: '#38bdf8' },
              RARE: { border: 'rgba(16,185,129,0.2)', bg: 'rgba(16,185,129,0.05)', text: '#10b981' },
              EPIC: { border: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.05)', text: '#a855f7' },
              LEGENDARY: { border: 'rgba(203,160,82,0.2)', bg: 'rgba(203,160,82,0.05)', text: '#cba052' }
            };
            const rc = rarityColors[rarity] || rarityColors.COMMON;

            let badgeHtml = `<span style="font-size: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid ${rc.border}; background: ${rc.bg}; color: ${rc.text}; font-weight: bold; text-transform: uppercase;" class="mono-font">${rarity}</span>`;

            // Adjust badges for categories without rarity
            if (category === 'vehicles') {
              badgeHtml = `<span style="font-size: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(168,85,247,0.25); background: rgba(168,85,247,0.05); color: #c084fc; font-weight: bold; text-transform: uppercase;" class="mono-font">${item.type}</span>`;
            } else if (category === 'npcs') {
              badgeHtml = `<span style="font-size: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.25); background: rgba(56,189,248,0.05); color: #38bdf8; font-weight: bold; text-transform: uppercase;" class="mono-font">${item.faction || 'Neutro'}</span>`;
            } else if (category === 'maps') {
              badgeHtml = `<span style="font-size: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.25); background: rgba(16,185,129,0.05); color: #10b981; font-weight: bold; text-transform: uppercase;" class="mono-font">${item.size}</span>`;
            } else if (category === 'classes') {
              badgeHtml = `<span style="font-size: 8px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(203,160,82,0.25); background: rgba(203,160,82,0.05); color: #cba052; font-weight: bold; text-transform: uppercase;" class="mono-font">CLASSE</span>`;
            }

            let detail = 'REGISTRO';
            if (item.damage) detail = `DANO: ${item.damage}`;
            else if (item.speed) detail = `SPD: ${item.speed} km/h`;
            else if (item.slot) detail = `SLOT: ${item.slot}`;
            else if (item.role) detail = `CARGO: ${item.role}`;
            else if (item.environment) detail = `AMBIENTE: ${item.environment}`;
            else if (item.baseStrength) detail = `FOR: ${item.baseStrength}`;

            return `
              <div class="db-list-item ${idx === 0 ? 'selected' : ''}" data-id="${item.id}" style="cursor:pointer; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;">
                <div class="list-item-meta" style="display: flex; flex-direction: column;">
                  <span class="db-item-name" style="font-size: 14px; font-weight: bold; text-transform: uppercase;">${item.name}</span>
                  <span class="db-item-type" style="font-size: 10px; color:#9ca3af; text-transform: uppercase; margin-top: 2px;">${item.type || item.faction || item.size || 'Core'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${badgeHtml}
                  <span class="db-item-detail mono-font" style="font-size: 11px; color:var(--color-purple); font-weight: bold;">${detail}</span>
                </div>
              </div>
            `;
          }).join('')
        : `<span class="mono-font" style="color:#6b7280; font-size:11px; padding:10px; display:block; text-align:center;">Nenhum registro correspondente.</span>`;

      // Detalhar o primeiro registro
      if (filtered.length > 0) {
        this._showCompendiumDetails(category, filtered[0], descEl);
      } else {
        descEl.innerHTML = '<div style="color: #6b7280; font-size:13px; text-align:center; padding-top:40px;">Nenhum registro selecionado.</div>';
      }

      // Detalhar ao clicar
      listEl.querySelectorAll('.db-list-item').forEach(itemNode => {
        itemNode.addEventListener('click', (e) => {
          this.audioEngine.playHover();
          listEl.querySelectorAll('.db-list-item').forEach(i => i.classList.remove('selected'));
          e.currentTarget.classList.add('selected');

          const id = e.currentTarget.getAttribute('data-id');
          const record = filtered.find(r => r.id === id);
          this._showCompendiumDetails(category, record, descEl);
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  _showCompendiumDetails(category, record, container) {
    if (!record) {
      container.innerHTML = `<div style="color: #6b7280; font-size:13px; text-align:center; padding-top:40px;">Selecione um registro para abrir especificações.</div>`;
      return;
    }

    const rarity = record.rarity || 'COMMON';
    const rarityColors = {
      COMMON: '#9ca3af',
      UNCOMMON: '#38bdf8',
      RARE: '#10b981',
      EPIC: '#a855f7',
      LEGENDARY: '#cba052'
    };
    const rColor = rarityColors[rarity] || rarityColors.COMMON;

    let contentHTML = `
      <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
        <!-- Header -->
        <div style="border-bottom: 1px solid rgba(168, 85, 247, 0.3); padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <span style="font-size: 9px; color: #a855f7; display: block; font-weight: bold; letter-spacing: 0.1em;">CLASSIFIED SPECIFICATION REPORT</span>
            <span style="font-size: 24px; font-weight: bold; color: #fff; text-transform: uppercase;">${record.name}</span>
          </div>
          <span style="font-size: 9px; font-weight: bold; padding: 2px 8px; border: 1px solid ${rColor}55; background: ${rColor}11; color: ${rColor}; border-radius: 4px;" class="mono-font">${rarity}</span>
        </div>
        
        <!-- Main body specifications -->
        <div style="flex-grow: 1; font-size: 13px; color: #d8b4fe; line-height: 1.5; overflow-y: auto; padding-right: 6px;">
    `;

    if (category === 'weapons') {
      const dmgPercent = Math.min(100, Math.round((record.damage / 120) * 100));
      const rangePercent = Math.min(100, Math.round((record.range / 500) * 100));
      const firePercent = Math.min(100, Math.round((record.fireRate / 1000) * 100));

      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">DETALHES DA ARMA</span>
            <span style="font-size: 12px; color:#fff;">Classe: ${record.type}</span>
          </div>
          
          <!-- Bar Graph Specs -->
          <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.25); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
                <span>DANO DE COMBATE</span>
                <span>${record.damage} / 120</span>
              </div>
              <div class="progress-track" style="height: 5px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top:3px;">
                <div class="progress-fill" style="width: ${dmgPercent}%; background-color:#a855f7; border-radius: 2px;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
                <span>ALCANCE TÁTICO</span>
                <span>${record.range}m / 500m</span>
              </div>
              <div class="progress-track" style="height: 5px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top:3px;">
                <div class="progress-fill" style="width: ${rangePercent}%; background-color:#a855f7; border-radius: 2px;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
                <span>CADÊNCIA DE DISPARO</span>
                <span>${record.fireRate} RPM / 1000 RPM</span>
              </div>
              <div class="progress-track" style="height: 5px; background: rgba(0,0,0,0.5); border-radius: 2px; margin-top:3px;">
                <div class="progress-fill" style="width: ${firePercent}%; background-color:#a855f7; border-radius: 2px;"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (category === 'equipment') {
      const bonuses = [];
      if (record.bonusStrength) bonuses.push({ name: 'FORÇA (STR)', val: record.bonusStrength });
      if (record.bonusDexterity) bonuses.push({ name: 'DESTREZA (DEX)', val: record.bonusDexterity });
      if (record.bonusConstitution) bonuses.push({ name: 'CONSTITUIÇÃO (CON)', val: record.bonusConstitution });
      if (record.bonusIntelligence) bonuses.push({ name: 'INTELIGÊNCIA (INT)', val: record.bonusIntelligence });
      if (record.bonusWisdom) bonuses.push({ name: 'SABEDORIA (WIS)', val: record.bonusWisdom });
      if (record.bonusCharisma) bonuses.push({ name: 'CARISMA (CHA)', val: record.bonusCharisma });
      if (record.bonusHp) bonuses.push({ name: 'PONTOS DE VIDA (HP)', val: record.bonusHp });
      if (record.bonusMana) bonuses.push({ name: 'MANA EXTRA', val: record.bonusMana });

      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display:flex; justify-content:space-between;">
            <div>
              <span style="font-size: 10px; color:#9ca3af; display:block;">SLOT DE EQUIPAMENTO</span>
              <span style="font-size: 12px; color:#fff;" class="mono-font">${record.slot}</span>
            </div>
          </div>
          
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block; margin-bottom: 6px;">BÔNUS DE ATRIBUTOS APLICADOS</span>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${bonuses.length > 0 
                ? bonuses.map(b => `
                    <div style="background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.15); border-radius: 4px; padding: 6px; display:flex; justify-content:space-between; align-items:center;" class="mono-font">
                      <span style="color:#d1d5db; font-size:10px;">${b.name}</span>
                      <span style="color:#10b981; font-weight:bold; font-size:12px;">+${b.val}</span>
                    </div>
                  `).join('')
                : '<div style="color:#6b7280; font-size:11px; font-style:italic;">Nenhum bônus de atributo.</div>'
              }
            </div>
          </div>
        </div>
      `;
    } else if (category === 'consumables') {
      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">EFEITO IMEDIATO</span>
            <span style="font-size: 13px; color:#10b981; font-weight:bold;" class="mono-font">${record.effect}</span>
          </div>
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">DURAÇÃO</span>
            <span style="font-size: 12px; color:#fff;">${record.duration > 0 ? record.duration + ' Turnos' : 'Instantâneo'}</span>
          </div>
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">EMPILHÁVEL</span>
            <span style="font-size: 12px; color:#fff;">${record.stackable ? 'SIM' : 'NÃO'}</span>
          </div>
        </div>
      `;
    } else if (category === 'vehicles') {
      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <span style="font-size: 10px; color:#9ca3af; display:block;">VELOCIDADE MÁXIMA</span>
              <span style="font-size: 14px; color:#fff; font-weight:bold;" class="mono-font">${record.speed} km/h</span>
            </div>
            <div>
              <span style="font-size: 10px; color:#9ca3af; display:block;">BLINDAGEM</span>
              <span style="font-size: 14px; color:#fff; font-weight:bold;" class="mono-font">${record.armor} ARM</span>
            </div>
          </div>
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">CAPACIDADE MÁXIMA</span>
            <span style="font-size: 12px; color:#fff;">${record.capacity} Operadores</span>
          </div>
        </div>
      `;
    } else if (category === 'npcs') {
      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">REGISTRO DE FACÇÃO</span>
            <span style="font-size: 12px; color:#fff; font-weight:bold;">${record.faction || 'Independente / Neutro'}</span>
          </div>
          
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block; margin-bottom: 6px;">TRANSMISSÕES DE DIÁLOGO</span>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px; padding: 10px; max-height: 120px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
              ${record.dialogues && record.dialogues.length > 0
                ? record.dialogues.map(d => `
                    <div style="font-size: 11px; border-bottom: 1px solid rgba(255,255,255,0.01); padding-bottom:4px;" class="mono-font">
                      <span style="color:#a855f7;">►</span> <span style="color:#d1d5db;">"${d.content}"</span>
                    </div>
                  `).join('')
                : '<div style="color:#6b7280; font-size:11px; font-style:italic;">Sem diálogos gravados.</div>'
              }
            </div>
          </div>
        </div>
      `;
    } else if (category === 'maps') {
      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block;">BIOMA / AMBIENTE</span>
            <span style="font-size: 12px; color:#fff;">${record.environment}</span>
          </div>
          
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block; margin-bottom: 6px;">SETORES INTERESSE (POIs)</span>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${record.pointsOfInterest && record.pointsOfInterest.length > 0
                ? record.pointsOfInterest.map(p => `
                    <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); border-radius: 4px; padding: 6px;" class="mono-font">
                      <span style="color:#fff; font-weight:bold; font-size:11px; display:block; text-transform:uppercase;">${p.name}</span>
                      <span style="color:#9ca3af; font-size:10px; display:block; margin-top:2px;">${p.description}</span>
                    </div>
                  `).join('')
                : '<div style="color:#6b7280; font-size:11px; font-style:italic;">Sem pontos demarcados.</div>'
              }
            </div>
          </div>
        </div>
      `;
    } else if (category === 'classes') {
      contentHTML += `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <span style="font-size: 10px; color:#9ca3af; display:block; margin-bottom: 6px;">MODIFICADORES DE ATRIBUTOS BASE</span>
            <div class="mono-font" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 11px;">
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">FORÇA</div>
                <span style="font-size: 14px; font-weight: bold; color: var(--color-purple);">${record.baseStrength}</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">DESTREZA</div>
                <span style="font-size: 14px; font-weight: bold; color: var(--color-purple);">${record.baseDexterity}</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">CONSTIT.</div>
                <span style="font-size: 14px; font-weight: bold; color: var(--color-purple);">${record.baseConstitution}</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">INTELIG.</div>
                <span style="font-size: 14px; font-weight: bold; color: var(--color-purple);">${record.baseIntelligence}</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">SABEDORIA</div>
                <span style="font-size: 14px; font-weight: bold; color: var(--color-purple);">${record.baseWisdom || 10}</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">CARISMA</div>
                <span style="font-size: 14px; font-weight: bold; color: var(--color-purple);">${record.baseCharisma || 10}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    contentHTML += `
          <!-- Description -->
          <div style="margin-top: 14px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px;">
            <span style="font-size: 10px; color:#9ca3af; display:block; margin-bottom: 2px;">SINOPSE // DETALHES GERAIS</span>
            <p style="color:#d1d5db; font-size:12px; line-height: 1.5;">${record.description || 'Sem descrição cadastrada no sistema.'}</p>
          </div>
        </div>
        
        <!-- Footer Info -->
        <div style="border-top: 1px solid rgba(168, 85, 247, 0.2); padding-top: 8px; margin-top: 12px; display:flex; justify-content:space-between; align-items:center;" class="mono-font">
          <span style="font-size: 9px; color:rgba(168, 85, 247, 0.65);">ESTADO: REGISTRO INTEGRAL</span>
          <span style="font-size: 9px; color:rgba(168, 85, 247, 0.65);">ID: ${record.id}</span>
        </div>
      </div>
    `;

    container.innerHTML = contentHTML;
  }

  // =============================================
  // ADMIN PANEL (MESTRE DO JOGO - 5ª ABA)
  // =============================================
  async _bindAdminControls() {
    const subtabs = document.querySelectorAll('.admin-subtab');
    const userSelect = document.getElementById('admin-user-select');
    const roleSelect = document.getElementById('admin-user-role-select');
    
    // Give item selects
    const giveUserSelect = userSelect; // Reusando dropdown
    const giveItemSelect = document.getElementById('admin-give-item-select');
    const giveTypeSelect = document.getElementById('admin-give-type-select');
    const giveQtyInput = document.getElementById('admin-give-qty');
    const giveBtn = document.getElementById('btn-admin-give-item');

    // Campaign form
    const campForm = document.getElementById('admin-create-campaign-form');
    const assignCampSelect = document.getElementById('admin-assign-camp-select');
    const assignUserSelect = document.getElementById('admin-assign-user-select');
    const assignBtn = document.getElementById('btn-admin-assign-player');

    // Compendium crud form
    const itemForm = document.getElementById('admin-create-item-form');
    const itemCatSelect = document.getElementById('admin-item-cat-select');
    const itemDynamicFields = document.getElementById('admin-item-dynamic-fields');

    // Ligar sub-abas do admin
    subtabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.audioEngine.playHover();
        subtabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        this.activeAdminSubtab = e.target.getAttribute('data-subtab');
        document.querySelectorAll('.admin-subpanel').forEach(p => p.style.display = 'none');
        document.getElementById(`admin-subpanel-${this.activeAdminSubtab}`).style.display = 'block';
      });
    });

    const loadAdminData = async () => {
      try {
        // Carregar Usuários
        const users = await APIClient.getUsers();
        userSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.username} [${u.role}]</option>`).join('');
        assignUserSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.username}</option>`).join('');

        if (users.length > 0) {
          roleSelect.value = users[0].role;
        }

        // Carregar campanhas para associação
        const campaigns = await APIClient.getCampaigns();
        assignCampSelect.innerHTML = campaigns.map(c => `<option value="${c.id}">${c.title}</option>`).join('');

        // Carregar itens para distribuição baseados no tipo selecionado
        await populateGiveItems();

      } catch (err) {
        console.error(err);
      }
    };

    const populateGiveItems = async () => {
      const type = giveTypeSelect.value;
      let items = [];
      if (type === 'weapon') items = await APIClient.getCompendium('weapons');
      else if (type === 'equipment') items = await APIClient.getCompendium('equipment');
      else if (type === 'consumable') items = await APIClient.getCompendium('consumables');

      giveItemSelect.innerHTML = items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    };

    // Eventos de alteração
    userSelect.addEventListener('change', (e) => {
      const userId = e.target.value;
      const targetUser = userSelect.options[userSelect.selectedIndex].text;
      const role = targetUser.includes('[ADMIN]') ? 'ADMIN' : 'PLAYER';
      roleSelect.value = role;
    });

    roleSelect.addEventListener('change', async (e) => {
      this.audioEngine.playSelect();
      const userId = userSelect.value;
      const role = e.target.value;
      try {
        await APIClient.updateUserRole(userId, role);
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });

    giveTypeSelect.addEventListener('change', async () => {
      this.audioEngine.playSelect();
      await populateGiveItems();
    });

    giveBtn.addEventListener('click', async () => {
      this.audioEngine.playSelect();
      const userId = giveUserSelect.value;
      const itemType = giveTypeSelect.value;
      const itemId = giveItemSelect.value;
      const qty = giveQtyInput.value;

      if (!userId || !itemId) return alert('Selecione um agente e um item válidos.');

      try {
        await APIClient.giveItem(userId, itemType, itemId, qty);
        alert('Item enviado com sucesso ao inventário do jogador!');
      } catch (err) {
        alert(err.message);
      }
    });

    // Submeter nova campanha
    campForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('admin-camp-title').value;
      const synopsis = document.getElementById('admin-camp-synopsis').value;

      try {
        await APIClient.createCampaign(title, synopsis);
        document.getElementById('admin-camp-title').value = '';
        document.getElementById('admin-camp-synopsis').value = '';
        alert('Nova campanha criada com sucesso!');
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });

    // Vincular jogador à campanha
    assignBtn.addEventListener('click', async () => {
      this.audioEngine.playSelect();
      const campId = assignCampSelect.value;
      const userId = assignUserSelect.value;

      if (!campId || !userId) return;

      try {
        await APIClient.addPlayerToCampaign(campId, userId);
        alert('Jogador vinculado à campanha com sucesso!');
      } catch (err) {
        alert(err.message);
      }
    });

    // Alteração de campos dinâmicos no CRUD de itens
    itemCatSelect.addEventListener('change', (e) => {
      const cat = e.target.value;
      if (cat === 'weapons') {
        itemDynamicFields.innerHTML = `
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            <div>
              <span class="widget-label" style="font-size: 9px;">Tipo</span>
              <input type="text" id="admin-wep-type" class="char-select-dropdown" placeholder="Fuzil/Pistola" style="font-size: 11px; padding: 6px; margin-top: 4px;" required />
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Dano</span>
              <input type="number" id="admin-wep-damage" class="char-select-dropdown" placeholder="Dano" style="font-size: 11px; padding: 6px; margin-top: 4px;" required />
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Alcance (m)</span>
              <input type="number" id="admin-wep-range" class="char-select-dropdown" placeholder="Alcance" style="font-size: 11px; padding: 6px; margin-top: 4px;" required />
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
            <div>
              <span class="widget-label" style="font-size: 9px;">Cadência</span>
              <input type="number" id="admin-wep-firerate" class="char-select-dropdown" placeholder="RPM" style="font-size: 11px; padding: 6px; margin-top: 4px;" required />
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Raridade</span>
              <select id="admin-wep-rarity" class="char-select-dropdown" style="font-size: 11px; padding: 6px; margin-top: 4px;">
                <option value="COMMON">COMMON</option>
                <option value="UNCOMMON">UNCOMMON</option>
                <option value="RARE">RARE</option>
                <option value="EPIC">EPIC</option>
                <option value="LEGENDARY">LEGENDARY</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 8px;">
            <span class="widget-label" style="font-size: 9px;">Descrição da Arma</span>
            <input type="text" id="admin-wep-desc" class="char-select-dropdown" placeholder="Descrição" style="font-size: 11px; padding: 6px; margin-top: 4px;" />
          </div>
        `;
      } else if (cat === 'equipment') {
        itemDynamicFields.innerHTML = `
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span class="widget-label" style="font-size: 9px;">Slot</span>
              <select id="admin-eq-slot" class="char-select-dropdown" style="font-size: 11px; padding: 6px; margin-top: 4px;">
                <option value="HEAD">HEAD</option>
                <option value="TORSO">TORSO</option>
                <option value="HANDS">HANDS</option>
                <option value="LEGS">LEGS</option>
              </select>
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Raridade</span>
              <select id="admin-eq-rarity" class="char-select-dropdown" style="font-size: 11px; padding: 6px; margin-top: 4px;">
                <option value="COMMON">COMMON</option>
                <option value="UNCOMMON">UNCOMMON</option>
                <option value="RARE">RARE</option>
              </select>
            </div>
          </div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px;">
            <div>
              <span class="widget-label" style="font-size: 9px;">Bônus CON</span>
              <input type="number" id="admin-eq-con" class="char-select-dropdown" placeholder="+CON" style="font-size: 11px; padding: 6px; margin-top: 4px;" />
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Bônus HP</span>
              <input type="number" id="admin-eq-hp" class="char-select-dropdown" placeholder="+HP" style="font-size: 11px; padding: 6px; margin-top: 4px;" />
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Bônus FOR</span>
              <input type="number" id="admin-eq-str" class="char-select-dropdown" placeholder="+FOR" style="font-size: 11px; padding: 6px; margin-top: 4px;" />
            </div>
          </div>
          <div style="margin-top: 8px;">
            <span class="widget-label" style="font-size: 9px;">Descrição do Equipamento</span>
            <input type="text" id="admin-eq-desc" class="char-select-dropdown" placeholder="Descrição" style="font-size: 11px; padding: 6px; margin-top: 4px;" />
          </div>
        `;
      } else if (cat === 'consumables') {
        itemDynamicFields.innerHTML = `
          <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap: 6px;">
            <div>
              <span class="widget-label" style="font-size: 9px;">Efeito</span>
              <input type="text" id="admin-cons-effect" class="char-select-dropdown" placeholder="Ex: Cura 50 HP" style="font-size: 11px; padding: 6px; margin-top: 4px;" required />
            </div>
            <div>
              <span class="widget-label" style="font-size: 9px;">Raridade</span>
              <select id="admin-cons-rarity" class="char-select-dropdown" style="font-size: 11px; padding: 6px; margin-top: 4px;">
                <option value="COMMON">COMMON</option>
                <option value="UNCOMMON">UNCOMMON</option>
                <option value="RARE">RARE</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 8px;">
            <span class="widget-label" style="font-size: 9px;">Descrição do Consumível</span>
            <input type="text" id="admin-cons-desc" class="char-select-dropdown" placeholder="Descrição" style="font-size: 11px; padding: 6px; margin-top: 4px;" />
          </div>
        `;
      }
    });

    // Submeter criação de item
    itemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = itemCatSelect.value;
      const name = document.getElementById('admin-item-name').value;
      
      let payload = { name };

      if (cat === 'weapons') {
        payload.type = document.getElementById('admin-wep-type').value;
        payload.damage = document.getElementById('admin-wep-damage').value;
        payload.range = document.getElementById('admin-wep-range').value;
        payload.fireRate = document.getElementById('admin-wep-firerate').value;
        payload.rarity = document.getElementById('admin-wep-rarity').value;
        payload.description = document.getElementById('admin-wep-desc').value;
      } else if (cat === 'equipment') {
        payload.slot = document.getElementById('admin-eq-slot').value;
        payload.rarity = document.getElementById('admin-eq-rarity').value;
        payload.bonusConstitution = document.getElementById('admin-eq-con').value || 0;
        payload.bonusHp = document.getElementById('admin-eq-hp').value || 0;
        payload.bonusStrength = document.getElementById('admin-eq-str').value || 0;
        payload.description = document.getElementById('admin-eq-desc').value;
      } else if (cat === 'consumables') {
        payload.effect = document.getElementById('admin-cons-effect').value;
        payload.rarity = document.getElementById('admin-cons-rarity').value;
        payload.description = document.getElementById('admin-cons-desc').value;
        payload.duration = 0;
        payload.stackable = true;
      }

      try {
        await APIClient.createCompendiumItem(cat, payload);
        document.getElementById('admin-item-name').value = '';
        alert('Item cadastrado com sucesso no compêndio!');
        await loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    });

    // Iniciar dados
    await loadAdminData();

    // Botão de ação (fechar sessão)
    const mainBtn = document.getElementById('action-btn-main');
    if (mainBtn) {
      mainBtn.addEventListener('click', () => {
        this.audioEngine.playSelect();
        AuthClient.logout();
      });
    }
  }
}

// ==================================================
// WIDGETS AUXILIARES (Relógio, Ping, Som e Atalhos)
// ==================================================
class UIWidgetController {
  constructor(audioEngine, navController) {
    this.audioEngine = audioEngine;
    this.navController = navController;

    this.clockEl = document.getElementById('tactical-clock');
    this.pingEl = document.getElementById('ping-indicator');
    this.fpsEl = document.getElementById('fps-indicator');
    this.muteBtn = document.getElementById('btn-mute');
    this.muteIcon = document.getElementById('mute-icon');

    this._setupWidgets();
    this._bindShortcuts();
  }

  _setupWidgets() {
    // Sincronizador de Relógio Real
    setInterval(() => {
      const d = new Date();
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      this.clockEl.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);

    // Oscilação de Ping
    setInterval(() => {
      const randPing = Math.floor(20 + Math.random() * 8);
      this.pingEl.textContent = `PING: ${randPing} MS`;
    }, 3000);

    // Quadros FPS
    setInterval(() => {
      const randFps = Math.floor(58 + Math.random() * 3);
      this.fpsEl.textContent = `FPS: ${randFps}`;
    }, 1000);

    this.muteBtn.addEventListener('click', () => this.handleMuteToggle());
  }

  handleMuteToggle() {
    const isMuted = this.audioEngine.toggleMute();
    
    if (isMuted) {
      this.muteIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      `;
    } else {
      this.muteIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      `;
      this.audioEngine.playSelect();
    }
  }

  _bindShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignorar atalhos se estiver em campos de input
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const maxIndex = AuthClient.isAdmin() ? 4 : 3;

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navController.setActive(Math.min(this.navController.activeIndex + 1, maxIndex));
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navController.setActive(Math.max(this.navController.activeIndex - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          const actionBtn = document.getElementById('action-btn-main');
          if (actionBtn) {
            actionBtn.click();
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.navController.setActive(0);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          this.handleMuteToggle();
          break;
      }
    });
  }
}

// ==================================================
// INICIALIZAÇÃO DO LOGOBBY / ENGINE
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bg-canvas');
  
  const sceneManager = new TacticalSceneManager(canvas);
  const audioEngine = new AudioEngine();
  
  const navController = new MenuNavigationController(sceneManager, audioEngine);
  const widgetController = new UIWidgetController(audioEngine, navController);

  // Inicializar sessão
  navController.initSession();

  // Setup loop clocks
  const threeClock = new THREE.Clock();
  
  function tick() {
    requestAnimationFrame(tick);
    sceneManager.update(threeClock.getElapsedTime());
  }
  
  tick();
});
