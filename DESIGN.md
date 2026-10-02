# CODAK Tactical HUD — Design System

## 1. North Star: "Tactical Brutalism in the Dead Zone"
Interface militar/tática sci-fi de alta densidade e precisão de combate. Inspirada na linguagem visual de consoles de artilharia, capacetes táticos (estilo *Halo ODST*, *XCOM*, *Titanfall*) e terminais de rede com estética de aviso de perigo.

---

## 2. Paleta Cromática

### Cores de Ação e Status
- **Vermelho Tático Primário (`#EF4444` / Hover: `#DC2626` / Glow: `rgba(239, 68, 68, 0.4)`):**
  - Utilizado em elementos interativos principais, foco de mira, alertas de combate e destaque ativo.
- **Âmbar Tático Secundário (`#F59E0B` / Hover: `#D97706` / Glow: `rgba(245, 158, 11, 0.35)`):**
  - Indicadores de dados, telemetria, munição crítica, Sweet Spot (SS) de armas e status secundários.
- **Verde Operacional (`#22C55E`):**
  - HP estável, canais seguros, confirmações bem-sucedidas.
- **Cyan Cibernético (`#06B6D4`):**
  - Protocolos de Hacking, telemetria de Cybersanity e conexões de rede neural.

### Superfícies e Escala Zinc
- **Fundo Base (`--surface-bg`):** `#070709` (Preto abissal tático com textura sutil).
- **Superfície Nível 1 (`--surface-1`):** `#0D0D11` (Bunkers e containers base).
- **Superfície Nível 2 (`--surface-2`):** `#141419` (Cards, painéis e gavetas ativas).
- **Superfície Nível 3 (`--surface-3`):** `#1C1C24` (Hover e elevação intermediária).
- **Bordas & Hairlines (`--border-hud`):** `1px solid rgba(255, 255, 255, 0.08)`.
- **Borda de Foco Tático (`--border-active`):** `1px solid rgba(239, 68, 68, 0.6)`.

---

## 3. Tipografia

- **Headings, Coordenadas, Métricas e HUD:** `JetBrains Mono`, monospace tático.
  - Letter-spacing expansivo nos cabeçalhos (`0.08em` a `0.15em`), sempre maiúsculo (`uppercase`).
  - Uso de micro-prefixos técnicos: `[ SEC-01 // TACTICAL-MAP ]`, `OP-ORD-04`, `SS: 18m`.
- **Corpo de Texto e Descrições de Lore:** `Inter`, sans-serif limpa e de alta legibilidade técnica.
- **Contraste de Texto:**
  - Primário: `#F4F4F5`
  - Secundário: `#A1A1AA`
  - Desativado/Código: `#52525B`

---

## 4. Filosofia de Componentes e Brutalismo Tático

- **Chanfros Angulares (Cut-Corners):**
  - Elementos principais utilizam `clip-path: polygon(...)` com chanfros de 8px a 14px nos cantos superior direito e inferior esquerdo.
- **Molduras de Colchetes Técnicos:**
  - Badges e caixas de status encapsuladas por colchetes explícitos `[ 01 ]` ou cantoneiras `┌ ┐ └ ┘`.
- **Botões:**
  - **Tático Primário:** Chanfrado com preenchimento em gradiente sutil de vermelho/cinza escuro, borda vermelha e texto mono.
  - **Tático Secundário:** Fundo escuro translúcido com borda âmbar e linhas de mira.
  - **Ghost/Minimal:** Texto monospace com sublinhado ou cantoneiras reveladas no hover.
- **Sem Sombras Suaves Comuns:**
  - Substituição de sombras difusas por bordas nítidas, contrastes de superfícies e glows direcionados (`box-shadow: 0 0 16px rgba(239, 68, 68, 0.35)`).
- **Scanlines e Grade Sutil:**
  - Grid milimétrico de fundo tático com baixa opacidade para ancorar a sensação de terminal militar.

---

## 5. Convenções em CSS Puro

- **100% CSS Puro Modular:**
  - Todos os tokens mapeados em `variables.css`.
  - Classes atômicas e utilitárias de HUD em `hud-components.css`.
  - Módulos específicos isolados (`wheel.css`, etc.) para permitir injeção de bibliotecas e animações customizadas futuras sem conflitos de especificidade.
