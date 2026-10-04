# Mapa tático — backend autoritativo

## Executar verificações

Na raiz do projeto:

```sh
node tests/tactical-map-run.cjs
node tests/tactical-ui-review.cjs
npm run build
```

O runner usa o TypeScript e `node:test` já disponíveis, compila apenas tipos/domínio/armazenamento em uma pasta descartável do scratch Hermes, executa os testes e remove a compilação. Os testes de persistência usam exclusivamente `CODAK_TACTICAL_DB_PATH` com arquivos temporários; não leem nem sobrescrevem o banco tático real. Nenhuma rota de teste ou bootstrap de NPC/mapa foi adicionada.

Resultado backend: **19 testes passando** em `node tests/tactical-map-run.cjs`, incluindo pixels reais PNG via sharp, regressão de origem pública/localhost sob proxy, avanço de rodada ao remover o último ator ativo e edição atômica de paredes. O build Next de produção e as verificações integradas descritas abaixo passaram no integrador.

## Contrato e integração

- Tipos e comandos: `src/types/tactical-map.ts`, com nomes/campos do contrato compartilhado, sem alterações incompatíveis.
- Edição de parede: `{type:'updateWall', id:string, patch:{a?:Point,b?:Point,height?:number,blocksMovement?:boolean,blocksVision?:boolean}}`, exclusiva do mestre, mantém o ID e altera apenas os campos fornecidos em uma única transação/revisão. Campos desconhecidos, pontos inválidos, altura fora de 0–1000 e segmento sem comprimento são rejeitados sem alterar o estado.
- `GET /api/tactical-map?sceneId=...` e `POST /api/tactical-map {sceneId?,command}` retornam `TacticalView` diretamente; erros têm `{error}` e HTTP 400/401/403/409, ou 500 para falhas inesperadas de I/O.
- Sessão NextAuth real; o usuário ainda deve existir no armazenamento real de usuários. A função e o papel atuais vêm do servidor, nunca do corpo. Personagens vinculados usam o `userId` da ficha persistida.
- Criar ou selecionar um mapa é preparação. Apenas `publishScene` muda `activeSceneId`. Excluir um mapa publicado retorna 409 até outro mapa ser publicado. Mapas não publicados não aparecem para jogadores e não podem ser consultados pela rota JSON ou de imagem.
- Combatentes invisíveis não aparecem em tokens, ordem, ações ou logs. Se o turno atual não puder ser visto, `combat.index` é **-1**, sem ID secreto ou placeholder identificável. Campos de ambiente não liberados são **omitidos**, e não apenas esvaziados.
- `scene.image` do jogador é `/api/tactical-map/image?sceneId=<id>&revision=<revision>`; usar `<img>` normal com cookies da mesma origem. O mestre recebe o data URL original. A revisão da URL não é prova de acesso; a imagem é sempre autorizada novamente.
- Todas as respostas são `private, no-store`; a mutação exige JSON, limita o corpo a 7 MiB e rejeita origens alheias / `Sec-Fetch-Site: cross-site`. A validação aceita a origem da URL, o Host recebido com o protocolo interno e a origem explícita de `NEXTAUTH_URL`, para funcionar atrás do Cloudflare sem liberar origens arbitrárias.

## Fog / imagem / segurança

**O raster original jamais é entregue no JSON do jogador.** `GET /api/tactical-map/image` transforma a imagem em PNG no servidor: células desconhecidas são pixels pretos, exploradas são atenuadas (~28%), visíveis são claras. Não há fallback para o original quando o codec falha. `sharp`, instalado pelo integrador, foi exercitado de verdade; não existe decoder artesanal de JPEG/WebP nem imagem SVG enviada pelo usuário. O SVG interno da máscara é gerado somente com números de células validadas.

O cache privado do servidor é limitado a 16 entradas / 32 MiB, usa SHA-256 do raster e da máscara efetiva e ignora alterações de combate/desenho sem mudança de percepção. Autorizar acontece antes de consultar o cache. A URL pode mudar a cada revisão, mas o processamento pesado reutiliza o raster protegido equivalente.

Uploads: somente data URLs PNG/JPEG/WebP/GIF; assinatura/MIME coerentes e decodificação completa obrigatória por sharp antes de gravar. Limites: mapa 5 MiB, avatar 1 MiB, dimensão máxima 8192 por lado e 20 milhões de pixels. GIF é servido como primeiro frame. Saída PNG remove metadados. Não são aceitos SVG, links remotos, caminhos de arquivo, NaN/Infinity, coordenadas axiais fracionárias, propriedades desconhecidas ou cores CSS arbitrárias.

Fog é individual, derivado dos tokens `player` pertencentes ao usuário. Exploração é persistida por mapa/usuário; `reveal` libera terreno permanentemente, não a posição/HP atual de NPCs ocultos. Paredes só são enviadas quando o segmento foi explorado por inteiro; desenhos de outros usuários usam filtragem conservadora da região ocupada. Fog desligado é uma liberação intencional do mapa pelo mestre. Conteúdo já visto/baixado pelo jogador não pode ser "desvisto"; isso não expõe estados novos de NPCs fora de visão.

## Geometria e ações

Hexágonos axiais pontudos; `hexSize` é a distância entre centros, e cada salto mede 1 m. Movimento do jogador segue a linha hexagonal entre origem e destino, validando cada salto/segmento contra paredes e desníveis maiores que 1 m; não procura automaticamente um caminho ao redor do obstáculo. O mestre tem override de movimento. Posição/elevation é relativa ao terreno; LOS interpola a altura dos olhos e cruza paredes com altura, usando quatro amostras por salto para o terreno. Corpos elevados podem aparecer acima de paredes mesmo quando o chão atrás continua escuro.

Calibração explícita em `TACTICAL_EYE_HEIGHT_METERS` (1,6 m), `TACTICAL_MAX_PLAYER_STEP_METERS` (1 m) e no `hexSize` por mapa. Movimento não debita ações automaticamente. Declaração manual em combate apaga a luz correspondente, recusa repetição até restauração pelo mestre e não interpreta habilidades. Fora de combate, declarações apenas registram o texto. Iniciativa é decrescente estável; novo turno/restauração/remoção do ator atual mantêm as três luzes coerentes. Remover o último ator ativo da ordem inicia a próxima rodada no índice 0 e restaura as ações do sucessor; remover ator ativo antes do fim preserva a rodada. Remover o único ator encerra o combate sem incrementar a rodada. Rolagens usam `crypto.randomInt` no servidor, NdM +/- inteiro limitado a 100 dados, 1000 faces e modificador absoluto 10000; não usam eval nem números cosméticos.

Limites defensivos adicionais: 32 mapas, 128 tokens/mapa, 256 paredes, 10000 células de terreno, 512 desenhos, 1000 pontos/desenho, visão até 40 m, 200 saltos por movimento do jogador, coordenadas axiais ±10000, 100000 células exploradas/usuário/mapa e 500 registros de log/mapa. Ping persistente pode ser removido por seu proprietário; não há expiração automática nesta etapa.

## Persistência e limites operacionais

Banco dedicado: `data/tactical-map.json`, ou caminho absoluto resolvido de `CODAK_TACTICAL_DB_PATH`. Transação com lock exclusivo de arquivo cobre leitura/modificação/escrita entre processos. Gravação usa arquivo temporário no mesmo diretório, fsync e rename, sem reset silencioso de JSON corrompido. Banco corrompido retorna 409 e é preservado.

**Escopo de operação: um host com filesystem local compartilhado pelos workers.** Após queda abrupta, pode restar `<db>.lock`; a API retorna 409 após 5 s. Só remova o lock após confirmar que nenhum worker ainda o possui. Para múltiplos hosts/NFS ou throughput alto, migrar para banco transacional. Não foi feito ensaio de carga dos limites máximos. A visibilidade de terreno usa raio para o centro da célula, não simulação volumétrica contínua.

## Aceitação / handoff

Verificados: contratos TS, preparação/publicação, permissões, vínculo de ficha, validação de upload, geometria negativa, paredes/desníveis, LOS com alturas, filtragem por usuário, exploração, desenho persistente, iniciativa/turnos/luzes, RNG real, escrita concorrente/atomicidade/releitura e falha sem perda em JSON corrompido. Testes verificam pixels preto/dim/claro, tentativa de imagem privada e troca de fog sem reaproveitamento inseguro do cache.

Verificação integrada concluída em um servidor Next de produção isolado, com usuários e fichas sintéticos em arquivos separados dos dados reais: **31 verificações HTTP** e **75 verificações no navegador hidratado** (50 do fluxo principal, 19 de ferramentas/layout e 6 da regressão do editor de paredes), com sessões distintas de mestre/jogador. Exercitados: arraste de token próprio, rejeição de token alheio, sincronização entre dois navegadores, pan/zoom/pinch, desenho/desfazer, iniciativa e declaração manual, dados reais na hotbar/ficha, edição de HP com releitura, upload, criação/posicionamento de NPC e preparação privada. HUD verificado em 1440×900, 768×1024, 390×844 e 844×390, incluindo menus expandidos; biblioteca/combate do mestre também verificados em 601×390. Ferramentas exercitadas: círculo, cone, retângulo, régua em metros, paredes, elevação e drag/drop nativo da biblioteca. O editor troca rascunhos por parede e grava uma única mutação `updateWall`, com ID e quantidade preservados na releitura HTTP. Nenhum `pageerror` nesses ensaios. A imagem recebida por HTTP foi decodificada e confirmou pixels desconhecidos pretos, não apenas uma máscara CSS.

O build Next de produção e **14 regressões de callbacks reais** passaram após as correções. Esses checks nativos cobrem upload em mudança de cena/sessão, leitura de ficha atrasada, cancelamento de save, seleção de personagem/token (incluindo múltiplos tokens e carregamento tardio), teclado rápido/fora de turno, cancelamento de ponteiro e paredes. Não são testes de navegador para as corridas assíncronas; o ensaio hidratado cobre os fluxos acima.

Limites desta primeira etapa: modelos manuais de NPC são locais à sessão, mas tokens colocados persistem; HP da ficha e HP do token ainda são controles separados; regras contextuais de skills/itens não são interpretadas automaticamente. O editor frontend usa `updateWall` atômico; adicionar/remover uma substituta não é mais o mecanismo de edição. O acesso público e a reinicialização da instância real devem ser reportados separadamente dos testes isolados. `.env`, dados reais de personagens e guias de design preexistentes não participaram das mutações de teste.
