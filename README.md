# 🖥️ CODAK RPG — Terminal Tático de Operações

**CODAK** é um Terminal VTT (Virtual Tabletop) de alto desempenho e painel tático integrado para campanhas de RPG de Mesa com ambientação futurista, militar e cyberpunk. 

Desenvolvido com uma estética *glassmorphism* premium, micro-animações fluidas e renderização 3D em tempo real, o sistema conecta jogadores e mestres a um ecossistema persistente e dinâmico.

---

## 🚀 Principais Módulos & Recursos

### 1. Central de Operações (Lobby & Tabletop)
A interface principal se adapta às necessidades do grupo com um **Dual-Mode Toggle**:
- **Lobby Tático**: Apresenta todos os operadores da party lado a lado, exibindo nível, barras dinâmicas de HP/Mana e status de prontidão em tempo real.
- **Visão Tabletop**: Grelha de combate tática 12x8 interativa com miniaturas virtuais, painel de rolagem rápida de dados (D4 a D100) com logs de rádio e listagem de Ordem de Iniciativa automática.
- **Scanner 3D**: Integrado com Three.js, renderiza o modelo tridimensional do operador (procedural ou carregado via arquivos `.glb` / `.gltf` personalizados).

### 2. Painel de Arquivos de Campanhas
- **Grid de Missões**: Lista todas as campanhas em andamento usando gradientes de cores dinâmicos.
- **Relatório de Setor**: Clicar em um arquivo abre um popup tático com a sinopse da missão, data estelar e um mapa regional radar descoberto atualmente.
- **Party & Ficha do Operador**: Permite visualizar a party ativa. Ao clicar em qualquer membro, a interface transiciona de forma fluida para a ficha técnica completa do personagem selecionado (atributos primários, HP/Mana e equipamentos equipados) com suporte a pilha de navegação ("◄ VOLTAR").

### 3. Divisão de Operadores ("Create-a-Class" Style)
Inspirado nas telas de seleção de armamento militar (estilo *Call of Duty*):
- **Seletor de Divisão**: Lista vertical ágil de operadores no canto esquerdo.
- **Scanner Biométrico**: Espaço centralizado onde a câmera do Three.js foca no modelo do personagem selecionado com retículas e escalas de altura em sobreposição.
- **Mochila & Atributos**:
  - **Ficha Técnica**: Exibe os atributos primários (FOR, DES, CON, INT, SAB, CAR) com um gráfico de radar poligonal SVG.
  - **Edição de Mochila**: Tocar duas vezes (ou em "EDITAR MOCHILA") revela os slots ativos (Arma 1, Arma 2, Cabeça, Torso) e a mochila do operador.
  - **Cálculo Dinâmico**: Ao equipar ou desequipar itens da mochila, o sistema busca os bônus no compêndio e recalcula em tempo real os atributos e os limites de HP/Mana, destacando os modificadores em verde/vermelho (ex: `12 (+2)`).

### 4. Banco de Dados Core (Compêndio)
Um banco de dados de inteligência militar completo com busca textual e abas categorizadas para **Armas, Equipamentos, Consumíveis, Veículos, NPCs, Mapas e Classes**:
- **Badges de Status**: Cada registro possui etiquetas visuais de raridade (COMMON, RARE, EPIC, LEGENDARY), facções ou portes.
- **Technical Specifications Report**: Abertura de especificações formatada como um terminal de diagnósticos, exibindo gráficos de barras de dano/alcance, tabelas de bônus, diálogos e pontos de interesse do mapa.

### 5. Controle de Comando (Mestre / Admin)
Painel exclusivo para usuários com permissão `ADMIN`:
- **Recursos**: Distribuir armas, consumíveis e equipamentos diretamente para a mochila de qualquer jogador conectado.
- **Operações**: Criar novas campanhas e vincular jogadores cadastrados às mesas.
- **CRUD Compêndio**: Cadastrar novas armas, consumíveis e equipamentos de forma global no banco de dados.

---

## 🛠️ Stack Tecnológica

### Frontend:
- **Estruturação & Estilos**: HTML5 Semântico e CSS3 Vanilla (Design system de variáveis táticas, blur de fundo 16px e animações CRT scanlines).
- **3D Engine**: Three.js para renderização do pedestal de estações e dos operadores.
- **Animations**: GSAP (GreenSock) para movimentações de câmera suaves e transições de painéis.

### Backend:
- **Servidor**: Node.js & Express.
- **Banco de Dados**: SQLite gerenciado via Prisma ORM para persistência local veloz e leve.
- **Segurança**: Autenticação de contas via JSON Web Tokens (JWT) e criptografia de senhas usando `bcryptjs`.

---

## 📦 Como Instalar e Rodar Localmente

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** instalado em sua máquina.

### 2. Instalar Dependências
No diretório raiz do projeto, instale as dependências executando:
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (se já não existir) e adicione a URL de conexão do banco de dados SQLite:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_criptografica_secreta_aqui"
PORT=3000
```

### 4. Rodar Migrations & Seeding
Execute os comandos do Prisma para gerar a estrutura e semear o banco de dados inicial:
```bash
# Executa as migrations do banco
npx prisma migrate dev --name init

# Popula o banco com classes, itens, npc e dados de teste
npx prisma db seed
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse localmente em seu navegador pelo endereço: **`http://localhost:3000`**

---

## 🔐 Credenciais de Teste (Seed)

Após rodar o script de seeding, você poderá fazer login imediatamente usando os seguintes perfis teste:

*   **Jogador Comum**:
    *   **Usuário:** `jogador`
    *   **Senha:** `player123`
*   **Mestre de Campanha (Admin)**:
    *   **Usuário:** `admin`
    *   **Senha:** `admin123`
