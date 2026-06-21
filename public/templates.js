// ==========================================================================
// Codak RPG - HTML Templates (Single Responsibility: View Layer)
// ==========================================================================

const TEMPLATES = [];

// =============================================
// LOGIN & CONTA (PRÉ-AUTENTICAÇÃO)
// =============================================
TEMPLATES.login = `
<div class="login-panel">
  <div class="panel-header" style="border-bottom-color: rgba(203,160,82,0.2);">
    <h2 class="panel-title">Acesso ao Sistema Core</h2>
    <span class="status-pill color-red glow-red">PROTEGIDO</span>
  </div>
  
  <p class="panel-description" style="margin-top: 12px; font-size: 13px; line-height: 1.5;">
    Insira suas credenciais de agente ou registre uma nova assinatura criptográfica.
  </p>

  <form id="login-form" style="margin-top: 20px;">
    <div style="margin-top: 16px;">
      <label class="widget-label" style="font-size: 11px;">Identificação (Username)</label>
      <input type="text" id="login-username" class="char-select-dropdown" style="background: rgba(0,0,0,0.6); padding: 10px; font-size: 15px; margin-top: 6px;" placeholder="Ex: Agent_Lobo" required />
    </div>

    <div style="margin-top: 16px;">
      <label class="widget-label" style="font-size: 11px;">Chave de Acesso (Senha)</label>
      <input type="password" id="login-password" class="char-select-dropdown" style="background: rgba(0,0,0,0.6); padding: 10px; font-size: 15px; margin-top: 6px;" placeholder="******" required />
    </div>

    <div id="login-error-msg" class="color-red" style="font-size: 13px; margin-top: 14px; min-height: 20px; font-weight: bold; text-shadow: 0 0 4px rgba(239,68,68,0.5);"></div>

    <div style="margin-top: 24px; display: flex; gap: 12px;">
      <button type="submit" id="btn-login-submit" class="btn-tactical btn-main" style="margin-top: 0; flex: 1; padding: 12px;">
        ENTRAR
      </button>
      <button type="button" id="btn-register-submit" class="btn-tactical" style="margin-top: 0; border: 1px solid var(--color-blue); color: var(--color-blue); background: rgba(56, 189, 248, 0.05); flex: 1; padding: 12px; font-size: 20px; font-weight: bold; border-radius: 4px;">
        REGISTRAR
      </button>
    </div>
  </form>
</div>
`;

// =============================================
// 0. LOBBY (SESSÃO DO JOGADOR)
// =============================================
TEMPLATES[0] = `
<div class="session-template-container" style="display: flex; flex-direction: column; height: 100%;">
  <!-- Mode Toggle Header -->
  <div class="panel-header" style="border-bottom-color: rgba(203,160,82,0.2); padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
    <h2 class="panel-title" style="margin:0;">Central de Operações</h2>
    
    <div style="display: flex; gap: 8px;" class="mono-font">
      <button id="btn-session-mode-lobby" class="btn-tactical btn-session-mode active" style="padding: 4px 12px; font-size:12px;">LOBBY TÁTICO</button>
      <button id="btn-session-mode-tabletop" class="btn-tactical btn-session-mode" style="padding: 4px 12px; font-size:12px;">VISÃO TABLETOP</button>
    </div>
  </div>

  <!-- Mode 1: Tactical Lobby Panel -->
  <div id="session-lobby-view" class="session-view-panel" style="display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; height: 100%;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 130px; gap: 16px; align-items: center; margin-bottom: 16px;">
      <div>
        <span class="widget-label" style="font-size: 11px;">Operador Selecionado</span>
        <select id="lobby-char-select" class="char-select-dropdown" style="margin-top: 6px; padding: 10px; font-size: 16px;"></select>
      </div>
      <!-- Upload custom model button -->
      <div>
        <span class="widget-label" style="font-size: 11px;">Modelo Customizado (.glb/.gltf)</span>
        <input type="file" id="glb-uploader" style="display:none;" accept=".glb,.gltf" />
        <button onclick="document.getElementById('glb-uploader').click()" class="btn-tactical" style="margin-top: 6px; width:100%; padding:10px; font-size:13px; text-transform:uppercase; border-color: rgba(203,160,82,0.2); background: rgba(203,160,82,0.05); color: var(--color-accent); font-weight: bold; border-radius: 4px;">Carregar Modelo</button>
      </div>
      <div style="display:flex; flex-direction:column; text-align: right;">
        <span class="widget-label" style="font-size: 11px; text-transform:uppercase;">Rigging Esqueleto</span>
        <span id="rig-status-label" class="mono-font" style="font-size:11px; margin-top:8px; font-weight:bold; color: var(--color-accent); text-transform: uppercase;">NATIVO</span>
      </div>
    </div>

    <!-- Horizontal Team Grid (Lobby) -->
    <div id="lobby-party-container" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; flex-grow: 1; align-items: stretch; margin-bottom: 16px;">
      <!-- Party members injected here: side-by-side cards -->
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
      <div id="lobby-campaign-info-box" class="mono-font" style="font-size:12px; color: #9ca3af;">
        Campanha Ativa: <span id="lobby-campaign-title" style="color:var(--color-accent); font-weight:bold;">Carregando...</span>
      </div>
      <button id="action-btn-main" class="btn-tactical btn-main" style="margin: 0; padding: 10px 24px; font-size: 18px;">
        Confirmar Prontidão
      </button>
    </div>
  </div>

  <!-- Mode 2: Tabletop View Panel (initially hidden) -->
  <div id="session-tabletop-view" class="session-view-panel" style="display: none; flex-grow: 1; grid-template-columns: 1fr 280px; gap: 16px; height: 100%;">
    <!-- Left: Tabletop battlefield simulated map -->
    <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; overflow: hidden;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
        <span class="widget-label" style="font-size: 12px; color: var(--color-accent);">VISUALIZADOR TÁTICO TABLETOP</span>
        <span class="mono-font" style="font-size:11px; color:#9ca3af;">Grelha Quadrada - Turno 01</span>
      </div>
      
      <!-- Battlefield Map container -->
      <div style="flex-grow: 1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; margin: 12px 0; border: 1px dashed rgba(203,160,82,0.2); border-radius: 6px; background: radial-gradient(circle at center, rgba(15,15,15,0.9), rgba(5,5,5,0.98));">
        <div id="tabletop-battle-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: repeat(8, 1fr); gap: 1px; width: 98%; height: 98%; background: rgba(255,255,255,0.01);">
          <!-- Render dynamic grid hexes -->
        </div>
      </div>

      <div style="display:flex; gap:12px; align-items:center;">
        <button id="btn-tabletop-move" class="btn-tactical" style="flex:1; padding:8px; font-size:12px; font-weight: bold; border-color: rgba(203,160,82,0.3);">MOVER MINiatura</button>
        <button id="btn-tabletop-attack" class="btn-tactical" style="flex:1; padding:8px; font-size:12px; font-weight: bold; border-color:rgba(239,68,68,0.4); color:#ef4444; background: rgba(239,68,68,0.05);">ATACAR</button>
        <button id="btn-tabletop-endturn" class="btn-tactical" style="flex:1; padding:8px; font-size:12px; font-weight: bold; border-color:rgba(16,185,129,0.4); color:#10b981; background: rgba(16,185,129,0.05);">PASSAR TURNO</button>
      </div>
    </div>

    <!-- Right: Dice roller, Initiative order and tactical logs -->
    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; overflow: hidden;">
      <!-- Initiative Order -->
      <div class="widget-box" style="padding: 12px; height: 160px; display:flex; flex-direction:column; justify-content:space-between; margin-bottom: 12px; background: rgba(0,0,0,0.2);">
        <span class="widget-label" style="font-size:11px; color:var(--color-accent); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">Ordem de Iniciativa</span>
        <div id="tabletop-initiative-list" style="flex-grow:1; margin-top:8px; overflow-y:auto; font-size:11px; display:flex; flex-direction:column; gap:4px;" class="mono-font">
          <!-- Initiative entries -->
        </div>
      </div>

      <!-- Dice Roller -->
      <div class="widget-box" style="padding: 12px; margin-bottom: 12px; background: rgba(0,0,0,0.2);">
        <span class="widget-label" style="font-size:11px; color:var(--color-accent); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">Rolar Dados RPG</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px;">
          <button class="btn-tactical btn-roll-dice" data-dice="20" style="padding:6px; font-size:11px; font-weight:bold;">D20</button>
          <button class="btn-tactical btn-roll-dice" data-dice="12" style="padding:6px; font-size:11px; font-weight:bold;">D12</button>
          <button class="btn-tactical btn-roll-dice" data-dice="10" style="padding:6px; font-size:11px; font-weight:bold;">D10</button>
          <button class="btn-tactical btn-roll-dice" data-dice="8" style="padding:6px; font-size:11px; font-weight:bold;">D8</button>
          <button class="btn-tactical btn-roll-dice" data-dice="6" style="padding:6px; font-size:11px; font-weight:bold;">D6</button>
          <button class="btn-tactical btn-roll-dice" data-dice="4" style="padding:6px; font-size:11px; font-weight:bold;">D4</button>
          <button class="btn-tactical btn-roll-dice" data-dice="100" style="padding:6px; font-size:11px; font-weight:bold;">D100</button>
          <span id="dice-roll-result" class="mono-font" style="display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; color:var(--color-accent); border:1px solid rgba(203,160,82,0.2); border-radius:4px; background: rgba(0,0,0,0.4);">--</span>
        </div>
      </div>

      <!-- Combat Log -->
      <div class="widget-box" style="padding: 12px; flex-grow:1; display:flex; flex-direction:column; justify-content:space-between; background: rgba(0,0,0,0.2); overflow: hidden;">
        <span class="widget-label" style="font-size:11px; color:#9ca3af; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">Frequência de Rádio (Logs)</span>
        <div id="tabletop-combat-log" style="flex-grow:1; margin-top:8px; overflow-y:auto; font-size:11px; color:#d1d5db; line-height:1.4; max-height: 120px;" class="mono-font">
          <div style="color: #6b7280;">[SISTEMA] Canal seguro de rádio tático aberto.</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Compatibility elements mapping for existing scripts head/torso range selectors -->
<div style="display:none;">
  <select id="sel-rig-head"><option value=""></option></select>
  <select id="sel-rig-torso"><option value=""></option></select>
  <select id="sel-rig-shoulderLeft"><option value=""></option></select>
  <select id="sel-rig-shoulderRight"><option value=""></option></select>
  <select id="sel-rig-hipLeft"><option value=""></option></select>
  <select id="sel-rig-hipRight"><option value=""></option></select>
  <select id="rig-test-joint"></select>
  <input type="range" id="rig-test-angle" />
  <p id="lobby-campaign-desc"></p>
</div>
`;

// =============================================
// 1. CAMPANHAS (JOGADOR)
// =============================================
TEMPLATES[1] = `
<div class="campaigns-grid-wrapper" style="display: flex; flex-direction: column; height: 100%;">
  <div class="panel-header" style="border-bottom-color: rgba(56,189,248,0.2); padding-bottom: 12px; margin-bottom: 20px;">
    <h2 class="panel-title">Arquivos de Campanha</h2>
    <span class="status-pill color-blue glow-blue">MESA ATIVA</span>
  </div>

  <!-- Campaign Grid List -->
  <div id="campaigns-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; flex-grow: 1; overflow-y: auto; padding-bottom: 12px;">
    <!-- Campaign items loaded dynamically -->
  </div>

  <!-- Hidden selectors to keep existing scripts compatible -->
  <div style="display:none;">
    <select id="campaign-select"></select>
    <div id="campaign-progress-text"></div>
    <div id="campaign-progress-bar"></div>
    <div id="campaign-chapters-list"></div>
    <div id="campaign-notes-box"></div>
    <span id="active-chapter-title"></span>
    <p id="active-chapter-desc"></p>
    <div id="active-chapter-objectives"></div>
    <span id="campaign-status-label"></span>
  </div>

  <!-- Popup Overlay Modals -->
  <div id="campaign-popup-overlay" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(8px);">
    <!-- Popup content wrapper -->
    <div id="campaign-popup-content" class="hud-panel" style="width: 780px; height: 500px; border-radius: 12px; padding: 28px; border-color: rgba(56,189,248,0.3); display: flex; flex-direction: column; justify-content: space-between; position: relative;" onclick="event.stopPropagation();">
      
      <!-- Screen 1: Campaign Details inside popup -->
      <div id="popup-screen-campaign" style="display: flex; height: 100%; gap: 28px;">
        
        <!-- Left: Campaign Specs -->
        <div style="flex: 1.3; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 8px; margin-bottom: 12px;">
              <h3 id="popup-campaign-title" style="font-size: 26px; color: var(--color-blue); margin: 0; text-transform: uppercase;">Campanha</h3>
              <span id="popup-campaign-date" class="mono-font" style="font-size: 11px; color: #9ca3af;">Data: 15/09/2088</span>
            </div>
            
            <p id="popup-campaign-desc" style="font-size: 13px; color: #d1d5db; line-height: 1.5; height: 110px; overflow-y: auto; margin-bottom: 16px;"></p>
          </div>

          <!-- Discovered Tactical Map -->
          <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <span class="widget-label" style="font-size: 10px; color: var(--color-blue); display:block; margin-bottom: 4px;">MAPA REGIONAL ATUAL (DESCOBERTO)</span>
            <div style="flex-grow: 1; background: radial-gradient(circle, rgba(10,10,10,0.8), rgba(0,0,0,0.98)); border: 1px dashed rgba(56, 189, 248, 0.25); border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
              <!-- Grid grid lines visual representation -->
              <div style="width: 100%; height: 100%; background: linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px); background-size: 20px 20px;"></div>
              <!-- Simulated Radar Pulse -->
              <div style="position: absolute; width: 140px; height: 140px; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center;">
                <div style="width: 80px; height: 80px; border-radius: 50%; border: 1px dashed rgba(56, 189, 248, 0.12);"></div>
              </div>
              <span class="mono-font" style="position: absolute; bottom: 8px; right: 12px; font-size: 10px; color: rgba(56, 189, 248, 0.5);">SECTOR 7-B // DISCOVERED</span>
              <!-- Marked point -->
              <div style="position: absolute; top: 40%; left: 55%; background: var(--color-blue); width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px var(--color-blue);"></div>
            </div>
          </div>
        </div>

        <!-- Right: Party Players list -->
        <div style="flex: 1; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div>
            <span class="widget-label" style="font-size: 11px; color: var(--color-blue); display: block; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; margin-bottom: 12px;">Membros da Party</span>
            <div id="popup-party-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 380px; overflow-y: auto;">
              <!-- Players list injected here -->
            </div>
          </div>
          
          <div style="text-align: right;">
            <button id="btn-close-campaign-popup" class="btn-tactical" style="margin: 0; padding: 6px 16px; font-size: 12px; border-color: rgba(255,255,255,0.2);">FECHAR</button>
          </div>
        </div>

      </div>

      <!-- Screen 2: Character Sheet inside popup (initially hidden) -->
      <div id="popup-screen-character" style="display: none; height: 100%; gap: 28px;">
        
        <!-- Left: Character render visual layout -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div style="display: flex; justify-content: flex-start; align-items: center; gap: 12px;">
            <button id="btn-popup-char-back" class="btn-tactical" style="margin:0; padding: 4px 10px; font-size:11px; border-color: var(--color-blue); color: var(--color-blue); font-weight: bold;">◄ VOLTAR</button>
            <span class="mono-font" style="font-size: 11px; color: #9ca3af;">DADOS DO OPERADOR</span>
          </div>

          <!-- Stylized Concept Render -->
          <div style="flex-grow: 1; margin: 16px 0; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; display:flex; flex-direction:column; justify-content:center; align-items:center; position:relative; overflow:hidden;">
            <!-- Background grids -->
            <div style="position: absolute; inset:0; background: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px); background-size: 10px 10px;"></div>
            
            <div id="popup-char-avatar" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--color-blue); font-size: 32px; font-weight: bold; color: var(--color-blue); display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.6); box-shadow: 0 0 16px rgba(56, 189, 248, 0.2); z-index:2; text-transform: uppercase;">
              OP
            </div>
            
            <span id="popup-char-username" class="mono-font" style="font-size: 12px; margin-top: 12px; font-weight: bold; z-index:2; color: #fff;">Agente</span>
            <span id="popup-char-name" style="font-size: 20px; color: var(--color-blue); font-weight: bold; z-index:2; margin-top: 2px; text-transform: uppercase;">--</span>
          </div>
        </div>

        <!-- Right: Character Stats & Attributes -->
        <div style="flex: 1.3; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid rgba(56,189,248,0.2); padding-bottom: 6px; margin-bottom: 12px;">
              <span id="popup-char-class" style="font-size: 18px; font-weight: bold; color: var(--color-blue);">Classe: --</span>
              <span id="popup-char-level" class="mono-font" style="font-size: 11px; color:#9ca3af;">NÍVEL --</span>
            </div>

            <!-- HP Bars -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div style="background: rgba(239, 68, 68, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.15);">
                <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
                  <span style="color: #ef4444; font-weight: bold;">VIDA</span>
                  <span id="popup-char-hp-text">--/--</span>
                </div>
                <div class="progress-track" style="height: 4px; margin-top: 4px; background: rgba(0,0,0,0.5);">
                  <div id="popup-char-hp-bar" class="progress-fill" style="width: 100%; background-color: #ef4444;"></div>
                </div>
              </div>
              <div style="background: rgba(56, 189, 248, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.15);">
                <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
                  <span style="color: #38bdf8; font-weight: bold;">MANA</span>
                  <span id="popup-char-mana-text">--/50</span>
                </div>
                <div class="progress-track" style="height: 4px; margin-top: 4px; background: rgba(0,0,0,0.5);">
                  <div id="popup-char-mana-bar" class="progress-fill" style="width: 100%; background-color: #38bdf8;"></div>
                </div>
              </div>
            </div>

            <!-- Primary stats grid -->
            <span class="widget-label" style="font-size: 9px; display:block; margin-bottom: 6px;">ATRIBUTOS PRIMÁRIOS</span>
            <div class="mono-font" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 11px;">
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">STR</div>
                <span id="popup-stat-str" style="font-size: 14px; font-weight: bold; color: var(--color-blue);">--</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">DEX</div>
                <span id="popup-stat-dex" style="font-size: 14px; font-weight: bold; color: var(--color-blue);">--</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">CON</div>
                <span id="popup-stat-con" style="font-size: 14px; font-weight: bold; color: var(--color-blue);">--</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">INT</div>
                <span id="popup-stat-int" style="font-size: 14px; font-weight: bold; color: var(--color-blue);">--</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">WIS</div>
                <span id="popup-stat-wis" style="font-size: 14px; font-weight: bold; color: var(--color-blue);">--</span>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px; text-align: center;">
                <div style="color: #9ca3af; font-size: 8px;">CHA</div>
                <span id="popup-stat-cha" style="font-size: 14px; font-weight: bold; color: var(--color-blue);">--</span>
              </div>
            </div>

            <!-- Equipment Slots -->
            <span class="widget-label" style="font-size: 9px; display:block; margin-top: 14px; margin-bottom: 6px;">EQUIPAMENTO ATIVO</span>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;" class="mono-font">
              <div style="padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; border: 1px solid rgba(255,255,255,0.04);">
                <span style="font-size: 8px; color: #9ca3af; display:block;">ARMA PRIMÁRIA</span>
                <span id="popup-equip-primary" style="font-weight:bold; color: #fff;">--</span>
              </div>
              <div style="padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; border: 1px solid rgba(255,255,255,0.04);">
                <span style="font-size: 8px; color: #9ca3af; display:block;">ARMA SECUNDÁRIA</span>
                <span id="popup-equip-secondary" style="font-weight:bold; color: #fff;">--</span>
              </div>
              <div style="padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; border: 1px solid rgba(255,255,255,0.04);">
                <span style="font-size: 8px; color: #9ca3af; display:block;">PROTEÇÃO CABEÇA</span>
                <span id="popup-equip-head" style="font-weight:bold; color: #fff;">--</span>
              </div>
              <div style="padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; border: 1px solid rgba(255,255,255,0.04);">
                <span style="font-size: 8px; color: #9ca3af; display:block;">PROTEÇÃO TORSO</span>
                <span id="popup-equip-torso" style="font-weight:bold; color: #fff;">--</span>
              </div>
            </div>
          </div>

          <div style="text-align: right;">
            <button id="btn-close-char-popup" class="btn-tactical" style="margin: 0; padding: 6px 16px; font-size: 12px; border-color: rgba(255,255,255,0.2);">FECHAR</button>
          </div>
        </div>

      </div>

    </div>
  </div>

</div>
`;

// =============================================
// 2. PERSONAGENS & INVENTÁRIO
// =============================================
TEMPLATES[2] = `
<div style="display: grid; grid-template-columns: 220px 1fr 320px; gap: 16px; height: 100%; overflow: hidden;">
  
  <!-- Column 1 (Left): Call of Duty Style Class Select -->
  <div class="hud-panel" style="padding: 16px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; border-color: rgba(16,185,129,0.2); background: rgba(0,0,0,0.3);">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(16,185,129,0.2); padding-bottom: 8px; margin-bottom: 12px;">
        <span class="widget-label" style="font-size: 11px; color: var(--color-green);">DIVISÃO DE CLASSES</span>
        <button id="btn-create-char-modal" class="btn-tactical" style="margin:0; padding: 2px 8px; font-size:16px; border-color: var(--color-green); color:var(--color-green); font-weight:bold;">+</button>
      </div>

      <!-- Compatibility hidden select dropdown -->
      <select id="character-class-select" style="display: none;"></select>

      <!-- Vertical CoD Class List -->
      <div id="cod-class-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 420px; overflow-y: auto;">
        <!-- Injected dynamically -->
      </div>
    </div>

    <div>
      <button id="btn-delete-char" class="btn-tactical" style="margin: 0; width: 100%; padding: 8px; font-size: 12px; border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); font-weight: bold;">EXCLUIR OPERADOR</button>
    </div>
  </div>

  <!-- Column 2 (Middle): 3D Viewport Frame (vertical height fit) -->
  <div class="hud-panel" style="border-radius: 8px; border-color: rgba(16,185,129,0.15); background: rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: space-between; padding: 16px; height: 100%; position: relative;">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;">
      <span class="widget-label" style="font-size: 11px; color: var(--color-green);">SCANNER BIOMÉTRICO 3D</span>
      <span class="mono-font" style="font-size: 10px; color:#9ca3af;" id="char-scanner-status">SISTEMA ONLINE</span>
    </div>

    <!-- Center space for ThreeJS model view - we let the bg canvas do the rendering but we put a gorgeous scanning reticle here -->
    <div style="flex-grow: 1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; pointer-events: none;">
      <!-- Scanning lines/reticle overlay -->
      <div style="position: absolute; width: 85%; height: 90%; border: 1px solid rgba(16,185,129,0.05); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 140px; height: 140px; border: 1px dashed rgba(16,185,129,0.15); border-radius:50%; position: relative;">
          <!-- Diagonal crosshairs -->
          <div style="position: absolute; top:-10px; bottom:-10px; left:50%; width:1px; background: rgba(16,185,129,0.1);"></div>
          <div style="position: absolute; left:-10px; right:-10px; top:50%; height:1px; background: rgba(16,185,129,0.1);"></div>
        </div>
      </div>
      <!-- Height scale grid lines on side -->
      <div style="position: absolute; left: 24px; top: 10%; bottom: 10%; width: 12px; border-left: 1px solid rgba(16,185,129,0.15); display: flex; flex-direction: column; justify-content: space-between; font-size: 9px; color: rgba(16,185,129,0.4);" class="mono-font">
        <span>2.0m</span>
        <span>1.5m</span>
        <span>1.0m</span>
        <span>0.5m</span>
      </div>

      <!-- Double click helper note -->
      <span style="position: absolute; bottom: 8px; font-size:10px; color: rgba(16,185,129,0.5);" class="mono-font">CLIQUE DUPLO NO CARD PARA EDITAR CLASSE / MOCHILA</span>
    </div>

    <!-- Active Weapons Info Summary -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 10px;">
      <div style="padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(16,185,129,0.1); border-radius: 4px;">
        <span style="font-size: 8px; color: #9ca3af; display:block;">FUZIL PRINCIPAL</span>
        <span id="preview-slot-primary" style="font-size: 12px; font-weight:bold; color:#fff;" class="mono-font">Vazio</span>
      </div>
      <div style="padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(16,185,129,0.1); border-radius: 4px;">
        <span style="font-size: 8px; color: #9ca3af; display:block;">ARMAMENTO APOIO</span>
        <span id="preview-slot-secondary" style="font-size: 12px; font-weight:bold; color:#fff;" class="mono-font">Vazio</span>
      </div>
    </div>

  </div>

  <!-- Column 3 (Right): Stats OR Inventory Manager (Edit Mode) -->
  <div class="hud-panel" style="padding: 16px; border-radius: 8px; border-color: rgba(16,185,129,0.2); background: rgba(0,0,0,0.3); display: flex; flex-direction: column; justify-content: space-between; height: 100%; overflow: hidden;">
    
    <!-- Mode Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(16,185,129,0.2); padding-bottom: 8px; margin-bottom: 12px;">
      <span id="char-right-panel-mode" class="widget-label" style="font-size: 11px; color: var(--color-green);">ESTATÍSTICAS DA CLASSE</span>
      <button id="btn-char-mode-toggle" class="btn-tactical" style="margin:0; padding: 2px 8px; font-size:10px; border-color: var(--color-green); color: var(--color-green); font-weight: bold;">EDITAR MOCHILA</button>
    </div>

    <!-- Mode 1: Stats Container -->
    <div id="char-stats-view-panel" style="display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; overflow-y: auto; height: 100%;">
      <div>
        <!-- Showcase Header -->
        <div style="display: flex; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; margin-bottom: 12px;">
          <div id="char-avatar-box" style="border: 2px solid var(--color-green); width: 40px; height: 40px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:bold; text-transform: uppercase;">--</div>
          <div style="margin-left: 10px;">
            <h4 id="char-spec-name" style="font-size: 20px; color: #fff; margin:0; line-height: 1; text-transform: uppercase;">--</h4>
            <span id="char-spec-class" style="font-size: 11px; color: #9ca3af;">--</span>
          </div>
          <div style="margin-left: auto; text-align: right;" class="mono-font">
            <span style="font-size: 8px; color:#9ca3af;">LEVEL</span><br>
            <span id="char-spec-level" style="font-size: 20px; font-weight: bold; color: var(--color-green);">--</span>
          </div>
        </div>

        <!-- HP & Shield Bars -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
          <div style="background: rgba(239, 68, 68, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.15);">
            <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
              <span style="color: #ef4444; font-weight: bold;">HP</span>
              <span id="char-hp-text">--/--</span>
            </div>
            <div class="progress-track" style="height: 4px; margin-top: 4px; background: rgba(0,0,0,0.5);">
              <div id="char-hp-bar" class="progress-fill" style="width: 100%; background-color: #ef4444;"></div>
            </div>
          </div>
          <div style="background: rgba(56, 189, 248, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.15);">
            <div style="display: flex; justify-content: space-between; font-size: 10px;" class="mono-font">
              <span style="color: #38bdf8; font-weight: bold;">MANA</span>
              <span id="char-mana-text">--/--</span>
            </div>
            <div class="progress-track" style="height: 4px; margin-top: 4px; background: rgba(0,0,0,0.5);">
              <div id="char-mana-bar" class="progress-fill" style="width: 100%; background-color: #38bdf8;"></div>
            </div>
          </div>
        </div>

        <!-- Atributos do RPG -->
        <span class="widget-label" style="font-size: 9px; display:block; margin-bottom: 6px;">ATRIBUTOS COMBATE</span>
        <div class="mono-font" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11px; margin-bottom: 16px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#9ca3af; font-size: 9px;">FORÇA (STR)</span>
            <span id="stat-str" style="font-weight:bold; color:var(--color-green); font-size: 13px;">10</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#9ca3af; font-size: 9px;">DESTREZA</span>
            <span id="stat-dex" style="font-weight:bold; color:var(--color-green); font-size: 13px;">10</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#9ca3af; font-size: 9px;">CONSTIT.</span>
            <span id="stat-con" style="font-weight:bold; color:var(--color-green); font-size: 13px;">10</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#9ca3af; font-size: 9px;">INTELIG.</span>
            <span id="stat-int" style="font-weight:bold; color:var(--color-green); font-size: 13px;">10</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#9ca3af; font-size: 9px;">SABEDORIA</span>
            <span id="stat-wis" style="font-weight:bold; color:var(--color-green); font-size: 13px;">10</span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#9ca3af; font-size: 9px;">CARISMA</span>
            <span id="stat-cha" style="font-weight:bold; color:var(--color-green); font-size: 13px;">10</span>
          </div>
        </div>

        <!-- Hexagonal Attributes Radar -->
        <div style="display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(16,185,129,0.12); border-radius: 6px; padding: 12px; height: 110px;">
          <svg width="100" height="100" viewBox="0 0 100 100" id="stats-radar-svg">
            <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" fill="none" stroke="rgba(16,185,129,0.15)" stroke-width="1" />
            <polygon points="50,25 71.6,37.5 71.6,62.5 50,75 28.4,62.5 28.4,37.5" fill="none" stroke="rgba(16,185,129,0.15)" stroke-width="1" />
            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(16,185,129,0.2)" stroke-width="1" />
            <line x1="50" y1="50" x2="84.6" y2="30" stroke="rgba(16,185,129,0.2)" stroke-width="1" />
            <line x1="50" y1="50" x2="84.6" y2="70" stroke="rgba(16,185,129,0.2)" stroke-width="1" />
            <line x1="50" y1="50" x2="50" y2="90" stroke="rgba(16,185,129,0.2)" stroke-width="1" />
            <line x1="50" y1="50" x2="15.4" y2="70" stroke="rgba(16,185,129,0.2)" stroke-width="1" />
            <line x1="50" y1="50" x2="15.4" y2="30" stroke="rgba(16,185,129,0.2)" stroke-width="1" />
            <polygon id="radar-polygon" points="50,50 50,50 50,50 50,50 50,50 50,50" fill="rgba(16,185,129,0.2)" stroke="var(--color-green)" stroke-width="1.5" />
          </svg>
        </div>
      </div>

      <div style="border-top:1px dashed rgba(255,255,255,0.03); padding-top:10px; display:flex; justify-content:space-between; align-items:center;" class="mono-font">
        <span style="font-size:10px; color:#9ca3af;">MODIFICADORES EQUIP:</span>
        <span id="char-bonuses-value" style="font-size:11px; color:var(--color-green); font-weight:bold;">NENHUM</span>
      </div>

    </div>

    <!-- Mode 2: Inventory & Slots Manager Container (initially hidden) -->
    <div id="char-inventory-edit-panel" style="display: none; flex-direction: column; flex-grow: 1; justify-content: space-between; overflow: hidden; height: 100%;">
      
      <!-- Equipped items slots details -->
      <div style="margin-bottom: 12px;">
        <span class="widget-label" style="font-size: 9px; display:block; margin-bottom: 4px;">EQUIPAMENTO DA CLASSE</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;" class="mono-font">
          <div class="widget-box slot-item" data-slot="primary_weapon" style="padding: 6px 2px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); border-radius: 4px;">
            <div style="font-size: 7px; color: #9ca3af;">ARMA 1</div>
            <div id="slot-wep-primary" style="font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">Vazio</div>
          </div>
          <div class="widget-box slot-item" data-slot="secondary_weapon" style="padding: 6px 2px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); border-radius: 4px;">
            <div style="font-size: 7px; color: #9ca3af;">ARMA 2</div>
            <div id="slot-wep-secondary" style="font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">Vazio</div>
          </div>
          <div class="widget-box slot-item" data-slot="HEAD" style="padding: 6px 2px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); border-radius: 4px;">
            <div style="font-size: 7px; color: #9ca3af;">CABEÇA</div>
            <div id="slot-equip-head" style="font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">Vazio</div>
          </div>
          <div class="widget-box slot-item" data-slot="TORSO" style="padding: 6px 2px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); border-radius: 4px;">
            <div style="font-size: 7px; color: #9ca3af;">TORSO</div>
            <div id="slot-equip-torso" style="font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">Vazio</div>
          </div>
        </div>
      </div>

      <!-- Mochila (Backpack list) -->
      <div style="flex-grow: 1; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <span class="widget-label" style="font-size: 9px;">MOCHILA DO OPERADOR</span>
          <!-- Mini filters -->
          <div style="display: flex; gap: 3px;">
            <button class="inv-filter active" data-filter="all" style="font-size: 8px; padding: 2px 4px;">TUDO</button>
            <button class="inv-filter" data-filter="weapon" style="font-size: 8px; padding: 2px 4px;">ARMAS</button>
            <button class="inv-filter" data-filter="equipment" style="font-size: 8px; padding: 2px 4px;">EQ</button>
            <button class="inv-filter" data-filter="consumable" style="font-size: 8px; padding: 2px 4px;">CON</button>
          </div>
        </div>

        <div class="scroll-list" id="player-inventory-list" style="flex-grow: 1; max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
          <!-- Injected dynamically -->
        </div>
      </div>

    </div>

  </div>

</div>

<!-- Modal Criar Personagem -->
<div id="modal-create-char" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
  <div class="modal-box" style="border: 1px solid var(--color-green); background: rgba(10,10,10,0.95); backdrop-filter: blur(12px); border-radius: 8px; padding: 24px; width: 360px;">
    <div class="panel-header" style="border-bottom-color: rgba(16,185,129,0.2); padding-bottom: 12px;">
      <h3 class="panel-title" style="font-size: 24px; color: var(--color-green);">Novo Personagem</h3>
    </div>
    <form id="form-create-char">
      <div style="margin-top: 14px;">
        <label class="widget-label">Nome do Boneco</label>
        <input type="text" id="new-char-name" class="char-select-dropdown" placeholder="Ex: URSO-02" style="background: rgba(0,0,0,0.5);" required />
      </div>
      <div style="margin-top: 14px;">
        <label class="widget-label">Classe Operacional</label>
        <select id="new-char-class" class="char-select-dropdown" style="background: rgba(0,0,0,0.5);"></select>
      </div>
      <div style="margin-top: 14px;">
        <label class="widget-label">Cor Tática (Tema)</label>
        <input type="color" id="new-char-color" value="#10b981" style="display:block; width:100%; height:36px; background:transparent; border:1px solid rgba(16,185,129,0.3); cursor:pointer; margin-top: 6px;" />
      </div>
      <div style="margin-top: 24px; display:flex; gap: 10px;">
        <button type="submit" class="btn-tactical btn-main" style="background-color: var(--color-green); border-color: var(--color-green); color: #000; margin-top:0; flex:1; padding: 10px;">CRIAR</button>
        <button type="button" id="btn-close-char-modal" class="btn-tactical" style="margin-top:0; border: 1px solid rgba(255,255,255,0.1); color: #ccc; flex:1; padding: 10px;">CANCELAR</button>
      </div>
    </form>
  </div>
</div>
`;

// =============================================
// 3. COMPENDIUM (BIBLIOTECA DE RPG)
// =============================================
TEMPLATES[3] = `
<div class="template-grid-2col">
  <!-- Coluna 1: Abas, Busca e Lista de Itens -->
  <div class="template-col">
    <div>
      <div class="panel-header" style="border-bottom-color: rgba(168,85,247,0.2); margin-bottom: 20px;">
        <h2 class="panel-title">Banco de Dados Core</h2>
        <span class="status-pill color-purple glow-purple">CLASSIFICADO</span>
      </div>

      <!-- Search Input -->
      <div style="margin-top: 8px; margin-bottom: 12px; display: flex; gap: 6px;">
        <input type="text" id="compendium-search" class="char-select-dropdown" style="border-color: rgba(168,85,247,0.3); font-size:14px; height:36px; padding: 8px 12px;" placeholder="Buscar no compêndio..." />
      </div>

      <!-- Categorized Tabs -->
      <div class="compendium-tabs" style="margin-top: 4px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
        <button class="tab-btn active" data-table="weapons" style="font-size: 11px; padding: 8px 0;">Armas</button>
        <button class="tab-btn" data-table="equipment" style="font-size: 11px; padding: 8px 0;">Equip</button>
        <button class="tab-btn" data-table="consumables" style="font-size: 11px; padding: 8px 0;">Consum</button>
        <button class="tab-btn" data-table="vehicles" style="font-size: 11px; padding: 8px 0;">Veículos</button>
        <button class="tab-btn" data-table="npcs" style="font-size: 11px; padding: 8px 0;">NPCs</button>
        <button class="tab-btn" data-table="maps" style="font-size: 11px; padding: 8px 0;">Mapas</button>
        <button class="tab-btn" data-table="classes" style="font-size: 11px; padding: 8px 0;">Classes</button>
      </div>

      <!-- Database records list -->
      <div class="compendium-content" id="compendium-db-list" style="margin-top: 16px; max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
        <!-- Registros do compêndio -->
      </div>
    </div>
  </div>

  <!-- Coluna 2: Detalhes do Registro Selecionado -->
  <div class="template-col" style="border-left: 1px solid rgba(255, 255, 255, 0.05); padding-left: 24px;">
    <div>
      <div class="template-col-header">
        <span class="widget-label" style="font-size: 11px; color: var(--color-purple);">Especificações Técnicas</span>
      </div>

      <div class="compendium-details-box" style="border: 1px dashed rgba(168,85,247,0.3); background: rgba(0,0,0,0.5); padding: 16px; height: 350px; overflow-y: auto; border-radius: 6px; line-height: 1.6;">
        <div id="compendium-details-text" class="mono-font" style="font-size: 13px; color: #e9d5ff; white-space: pre-wrap;">
          Selecione um registro no compêndio para ler as especificações.
        </div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <button id="action-btn-main" class="btn-tactical btn-main" style="background-color: transparent; border: 1px solid var(--color-purple); color: #ffffff; padding: 12px; font-size: 20px;">
        Requisitar Download
      </button>
    </div>
  </div>
</div>
`;

// =============================================
// 4. ADMIN PANEL (MESTRE DO JOGO - 5ª ABA)
// =============================================
TEMPLATES[4] = `
<div class="flex flex-col h-full justify-between" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
  <div style="flex: 1; display: flex; flex-direction: column;">
    <div class="panel-header" style="border-bottom-color: rgba(168,85,247,0.4); margin-bottom: 12px;">
      <h2 class="panel-title">Painel de Mestre</h2>
      <span class="status-pill" style="background: rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.4); color: #a855f7;">GAME MASTER</span>
    </div>

    <!-- Admin Sub-tabs -->
    <div class="compendium-tabs" style="margin-top: 4px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
      <button class="admin-subtab active" data-subtab="users" style="padding: 10px; font-size: 14px;">Agentes & Itens</button>
      <button class="admin-subtab" data-subtab="campaigns" style="padding: 10px; font-size: 14px;">Campanhas</button>
      <button class="admin-subtab" data-subtab="compendium" style="padding: 10px; font-size: 14px;">Itens RPG</button>
    </div>

    <!-- SECTION 1: USERS & GIVE -->
    <div id="admin-subpanel-users" class="admin-subpanel" style="margin-top: 20px; flex: 1;">
      <div class="template-grid-2col">
        <!-- Coluna 1: Seleção de Agente -->
        <div class="template-col">
          <div>
            <div class="template-col-header">
              <span class="widget-label" style="font-size: 11px;">Controles de Agente</span>
            </div>
            <span class="widget-label" style="font-size: 11px;">Agente Selecionado</span>
            <select id="admin-user-select" class="char-select-dropdown" style="margin-top: 6px; padding: 10px; font-size: 15px;"></select>
            
            <div style="margin-top: 20px;">
              <span class="widget-label" style="font-size: 11px;">Cargo Operacional</span>
              <select id="admin-user-role-select" class="char-select-dropdown" style="margin-top: 6px; padding: 10px; font-size: 15px;">
                <option value="PLAYER">JOGADOR</option>
                <option value="ADMIN">MESTRE (ADMIN)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Coluna 2: Distribuição de Itens -->
        <div class="template-col" style="border-left: 1px solid rgba(255, 255, 255, 0.05); padding-left: 24px;">
          <div>
            <div class="template-col-header">
              <span class="widget-label" style="font-size: 11px; color: var(--color-purple);">Distribuição de Recursos</span>
            </div>
            <div class="rigging-box" style="margin-top: 0; padding: 16px; border: 1px solid rgba(168, 85, 247, 0.2); background: rgba(0,0,0,0.2); border-radius: 6px;">
              <span class="widget-label" style="color: var(--color-purple); font-size: 11px;">Enviar Item para o Inventário</span>
              
              <div style="margin-top: 12px;">
                <span class="widget-label" style="font-size: 10px;">Tipo de Item</span>
                <select id="admin-give-type-select" class="char-select-dropdown" style="margin-top: 4px; padding: 8px; font-size: 13px;">
                  <option value="weapon">ARMA</option>
                  <option value="equipment">EQUIPAMENTO</option>
                  <option value="consumable">CONSUMÍVEL</option>
                </select>
              </div>

              <div style="margin-top: 12px;">
                <span class="widget-label" style="font-size: 10px;">Item do Compêndio</span>
                <select id="admin-give-item-select" class="char-select-dropdown" style="margin-top: 4px; padding: 8px; font-size: 13px;"></select>
              </div>

              <div style="margin-top: 12px;">
                <span class="widget-label" style="font-size: 10px;">Quantidade</span>
                <input type="number" id="admin-give-qty" class="char-select-dropdown" value="1" min="1" style="margin-top: 4px; padding: 8px; font-size: 13px; text-align: center;" />
              </div>

              <button id="btn-admin-give-item" class="btn-tactical" style="margin-top: 20px; width: 100%; font-size: 14px; padding: 10px; border: 1px solid var(--color-purple); color: var(--color-purple); background: rgba(168, 85, 247, 0.05); border-radius: 4px;">
                ENVIAR ITEM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: CAMPAIGNS CREATION -->
    <div id="admin-subpanel-campaigns" class="admin-subpanel" style="margin-top: 20px; display: none; flex: 1;">
      <div class="template-grid-2col">
        <!-- Coluna 1: Criar Campanha -->
        <div class="template-col">
          <div>
            <div class="template-col-header">
              <span class="widget-label" style="font-size: 11px;">Nova Campanha</span>
            </div>
            <form id="admin-create-campaign-form" style="margin-top: 4px; display: flex; flex-direction: column; gap: 12px;">
              <div>
                <span class="widget-label" style="font-size: 10px;">Título da Campanha</span>
                <input type="text" id="admin-camp-title" class="char-select-dropdown" placeholder="Título da Campanha" style="margin-top: 4px; padding: 8px; font-size: 13px;" required />
              </div>
              <div>
                <span class="widget-label" style="font-size: 10px;">História / Sinopse</span>
                <textarea id="admin-camp-synopsis" class="char-select-dropdown" placeholder="Sinopse / História Principal" style="margin-top: 4px; padding: 8px; font-size: 13px; height: 120px; font-family:inherit; resize: none;"></textarea>
              </div>
              <button type="submit" class="btn-tactical" style="margin-top: 10px; width: 100%; font-size: 14px; padding: 10px; border: 1px solid var(--color-purple); color: var(--color-purple); background: rgba(168, 85, 247, 0.05); border-radius: 4px;">
                SALVAR CAMPANHA
              </button>
            </form>
          </div>
        </div>

        <!-- Coluna 2: Vincular Jogador -->
        <div class="template-col" style="border-left: 1px solid rgba(255, 255, 255, 0.05); padding-left: 24px;">
          <div>
            <div class="template-col-header">
              <span class="widget-label" style="font-size: 11px; color: var(--color-purple);">Vincular Jogador à Campanha</span>
            </div>
            <div class="rigging-box" style="margin-top: 0; padding: 16px; border: 1px solid rgba(168, 85, 247, 0.2); background: rgba(0,0,0,0.2); border-radius: 6px; display: flex; flex-direction: column; gap: 12px;">
              <div>
                <span class="widget-label" style="font-size: 10px;">Selecione a Campanha</span>
                <select id="admin-assign-camp-select" class="char-select-dropdown" style="margin-top: 4px; padding: 8px; font-size: 13px;"></select>
              </div>
              <div>
                <span class="widget-label" style="font-size: 10px;">Selecione o Jogador</span>
                <select id="admin-assign-user-select" class="char-select-dropdown" style="margin-top: 4px; padding: 8px; font-size: 13px;"></select>
              </div>
              <button id="btn-admin-assign-player" class="btn-tactical" style="margin-top: 10px; width: 100%; font-size: 14px; padding: 10px; border: 1px solid var(--color-purple); color: var(--color-purple); background: rgba(168, 85, 247, 0.05); border-radius: 4px;">
                ADICIONAR JOGADOR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 3: COMPENDIUM CRUD -->
    <div id="admin-subpanel-compendium" class="admin-subpanel" style="margin-top: 20px; display: none; flex: 1;">
      <div class="template-grid-2col">
        <!-- Coluna 1: Categoria e Nome -->
        <div class="template-col">
          <div>
            <div class="template-col-header">
              <span class="widget-label" style="font-size: 11px;">Identificação do Item</span>
            </div>
            <form id="admin-create-item-form" style="margin-top: 4px; display: flex; flex-direction: column; gap: 12px;">
              <div>
                <span class="widget-label" style="font-size: 10px;">Categoria do Item</span>
                <select id="admin-item-cat-select" class="char-select-dropdown" style="margin-top: 4px; padding: 8px; font-size: 13px;">
                  <option value="weapons">ARMA</option>
                  <option value="equipment">EQUIPAMENTO</option>
                  <option value="consumables">CONSUMÍVEL</option>
                </select>
              </div>
              <div>
                <span class="widget-label" style="font-size: 10px;">Nome do Item</span>
                <input type="text" id="admin-item-name" class="char-select-dropdown" placeholder="Nome do Item" style="margin-top: 4px; padding: 8px; font-size: 13px;" required />
              </div>
              
              <!-- Dynamic Fields -->
              <div id="admin-item-dynamic-fields" style="margin-top: 8px;">
                <!-- Weapon fields default -->
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
              </div>
              
              <button type="submit" class="btn-tactical" style="margin-top: 10px; width: 100%; font-size: 14px; padding: 10px; border: 1px solid var(--color-purple); color: var(--color-purple); background: rgba(168, 85, 247, 0.05); border-radius: 4px;">
                CADASTRAR ITEM
              </button>
            </form>
          </div>
        </div>

        <!-- Coluna 2: Instruções / Dicas de GM -->
        <div class="template-col" style="border-left: 1px solid rgba(255, 255, 255, 0.05); padding-left: 24px;">
          <div>
            <div class="template-col-header">
              <span class="widget-label" style="font-size: 11px; color: var(--color-purple);">Manual de Criação RPG</span>
            </div>
            <div style="font-size: 13px; color: #d1d5db; line-height: 1.6;" class="mono-font">
              <p>Ao criar novos itens:</p>
              <ul style="margin-top: 8px; padding-left: 16px; display: flex; flex-direction: column; gap: 6px;">
                <li><strong>Armas:</strong> Requer dano, tipo de disparo, alcance em metros e raridade.</li>
                <li><strong>Equipamento:</strong> Atribui bônus diretos a atributos (Força, HP, etc.) ao ser equipado em slots específicos.</li>
                <li><strong>Consumíveis:</strong> Podem ser usados na mochila para efeitos imediatos.</li>
              </ul>
              <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">*Itens cadastrados ficam disponíveis no Compêndio de todos os jogadores em tempo real.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 16px;">
    <button id="action-btn-main" class="btn-tactical btn-main" style="background-color: var(--color-purple); border-color: var(--color-purple); color: #fff; padding: 10px; font-size: 18px; width: 100%;">
      Fechar Sessão Tática
    </button>
  </div>
</div>
`;
