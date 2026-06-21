const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando banco de dados...');
  // Limpar tabelas em ordem de dependência reversa
  await prisma.equippedItem.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.partyMember.deleteMany({});
  await prisma.party.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.mapPOI.deleteMany({});
  await prisma.gameMap.deleteMany({});
  await prisma.npcDialogue.deleteMany({});
  await prisma.npc.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.consumable.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.weapon.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.objective.deleteMany({});
  await prisma.chapterReward.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.campaignPlayer.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.characterClass.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Semeando usuários...');
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const playerPasswordHash = bcrypt.hashSync('player123', salt);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const player = await prisma.user.create({
    data: {
      username: 'jogador',
      passwordHash: playerPasswordHash,
      role: 'PLAYER',
    },
  });

  console.log('Semeando classes...');
  const classAssalto = await prisma.characterClass.create({
    data: {
      id: 'c_class_assalto',
      name: 'Assalto',
      description: 'Especialista em combate direto de curta a média distância com alta mobilidade.',
      baseStrength: 14,
      baseDexterity: 12,
      baseConstitution: 13,
      baseIntelligence: 9,
      baseWisdom: 10,
      baseCharisma: 10,
    },
  });

  const classRecon = await prisma.characterClass.create({
    data: {
      id: 'c_class_recon',
      name: 'Reconhecimento',
      description: 'Especialista em inteligência, sensores e tiro de precisão a longas distâncias.',
      baseStrength: 9,
      baseDexterity: 15,
      baseConstitution: 10,
      baseIntelligence: 13,
      baseWisdom: 12,
      baseCharisma: 9,
    },
  });

  const classSuporte = await prisma.characterClass.create({
    data: {
      id: 'c_class_suporte',
      name: 'Suporte Pesado',
      description: 'Soldado blindado, focado em suporte defensivo e armas pesadas.',
      baseStrength: 12,
      baseDexterity: 9,
      baseConstitution: 15,
      baseIntelligence: 9,
      baseWisdom: 11,
      baseCharisma: 12,
    },
  });

  console.log('Semeando armas...');
  const w_ar50 = await prisma.weapon.create({
    data: {
      id: 'w_ar50',
      name: 'Fuzil AR-50 Valkyrie',
      type: 'Fuzil de Assalto',
      damage: 42,
      fireRate: 750,
      range: 450,
      rarity: 'COMMON',
      description: 'Fuzil de assalto tático militar padrão, equilibrando alto dano com excelente precisão.',
    },
  });

  const w_sr99 = await prisma.weapon.create({
    data: {
      id: 'w_sr99',
      name: 'Sniper SR-99 Reaper',
      type: 'Rifle de Precisão',
      damage: 98,
      fireRate: 50,
      range: 1200,
      rarity: 'RARE',
      description: 'Rifle de precisão por ferrolho. Disparos lentos porém letais a longas distâncias.',
    },
  });

  const w_cqc7 = await prisma.weapon.create({
    data: {
      id: 'w_cqc7',
      name: 'SMG CQC-7 Spectre',
      type: 'Submetralhadora',
      damage: 28,
      fireRate: 980,
      range: 150,
      rarity: 'UNCOMMON',
      description: 'Arma compacta para combates em ambientes fechados (CQB) com recuo facilmente controlável.',
    },
  });

  const w_g18 = await prisma.weapon.create({
    data: {
      id: 'w_g18',
      name: 'Pistola G-18 Reflex',
      type: 'Pistola Automática',
      damage: 22,
      fireRate: 850,
      range: 80,
      rarity: 'COMMON',
      description: 'Pistola automática de saque rápido, usada como armamento secundário de emergência.',
    },
  });

  console.log('Semeando equipamentos...');
  await prisma.equipment.create({
    data: {
      id: 'eq_head',
      name: 'Capacete Tático Vision',
      slot: 'HEAD',
      rarity: 'COMMON',
      description: 'Aumenta a percepção e defesa balística básica.',
      bonusConstitution: 1,
      bonusWisdom: 1,
    },
  });

  await prisma.equipment.create({
    data: {
      id: 'eq_torso',
      name: 'Colete de Kevlar M2',
      slot: 'TORSO',
      rarity: 'UNCOMMON',
      description: 'Colete reforçado com nanoliga metálica.',
      bonusConstitution: 3,
      bonusHp: 20,
    },
  });

  console.log('Semeando consumíveis...');
  const c_medkit = await prisma.consumable.create({
    data: {
      id: 'c_medkit',
      name: 'Kit Médico de Campo',
      effect: 'Cura 50 HP instantaneamente.',
      duration: 0,
      stackable: true,
      rarity: 'COMMON',
      description: 'Um kit básico de primeiros socorros de uso rápido no campo de batalha.',
    },
  });

  await prisma.consumable.create({
    data: {
      id: 'c_adren',
      name: 'Pílula de Adrenalina',
      effect: 'Aumenta destreza em +2 por 3 turnos.',
      duration: 3,
      stackable: true,
      rarity: 'UNCOMMON',
      description: 'Estimulante químico militar que acelera as conexões neurais.',
    },
  });

  console.log('Semeando veículos...');
  await prisma.vehicle.create({
    data: {
      id: 'v_apc',
      name: 'Blindado APC Mako',
      type: 'Transporte Terrestre',
      speed: 85,
      armor: 75,
      capacity: 6,
      description: 'Veículo blindado anfíbio para transporte seguro de tropas sob fogo direto.',
    },
  });

  await prisma.vehicle.create({
    data: {
      id: 'v_buggy',
      name: 'Buggy Recon Cheetah',
      type: 'Batedor Veloz',
      speed: 120,
      armor: 25,
      capacity: 2,
      description: 'Desenvolvido para patrulhas velozes em terrenos desérticos e acidentados.',
    },
  });

  await prisma.vehicle.create({
    data: {
      id: 'v_tank',
      name: 'Battle Tank Mammoth',
      type: 'Blindado Pesado',
      speed: 45,
      armor: 98,
      capacity: 4,
      description: 'Possui blindagem composta reforçada e um canhão eletromagnético de 120mm.',
    },
  });

  console.log('Semeando NPCs...');
  const npcVance = await prisma.npc.create({
    data: {
      id: 'n_vance',
      name: 'Capitão Arthur Vance',
      role: 'Comandante Geral',
      faction: 'Força de Defesa Global',
      description: 'Veterano de guerra tático. Coordena as operações militares diretamente do centro de comando.',
    },
  });

  await prisma.npcDialogue.createMany({
    data: [
      { npcId: npcVance.id, content: 'Bem-vindo ao centro de comando orbital, soldado.', order: 1 },
      { npcId: npcVance.id, content: 'Temos relatórios de infiltrações cibernéticas nos servidores de dados.', order: 2 },
    ],
  });

  const npcElena = await prisma.npc.create({
    data: {
      id: 'n_elena',
      name: 'Dra. Elena Rostov',
      role: 'Pesquisadora Chefe',
      faction: 'Divisão de Ciência E.D.G.',
      description: 'Especialista em nanotecnologia e engenharia de reatores a plasma.',
    },
  });

  await prisma.npcDialogue.create({
    data: { npcId: npcElena.id, content: 'A análise da assinatura de energia indica tecnologia alienígena reversa.', order: 1 },
  });

  console.log('Semeando mapas...');
  const mapTokyo = await prisma.gameMap.create({
    data: {
      id: 'm_tokyo',
      name: 'Neo Tokyo Grid',
      environment: 'Urbano Cyberpunk',
      size: 'Médio',
      description: 'Setores metropolitanos sob chuva constante com passagens verticais de neon.',
    },
  });

  await prisma.mapPOI.createMany({
    data: [
      { gameMapId: mapTokyo.id, name: 'Torre Corporativa Arasaka', description: 'QG fortificado com segurança cibernética extrema.' },
      { gameMapId: mapTokyo.id, name: 'Beco do Neon Baixo', description: 'Mercado negro onde itens contrabandeados são vendidos.' },
    ],
  });

  await prisma.gameMap.create({
    data: {
      id: 'm_cairo',
      name: 'Cairo Ruins',
      environment: 'Desértico',
      size: 'Grande',
      description: 'Ruínas industriais e instalações de pesquisa abandonadas sob o sol escaldante.',
    },
  });

  console.log('Semeando campanhas e capítulos...');
  const campaign = await prisma.campaign.create({
    data: {
      id: 'cp_coda',
      title: 'Protocolo Codak: Aliança das Sombras',
      synopsis: 'Ação tática de infiltração nos bancos de dados militares para deter a IA insurreta Core.',
      status: 'ACTIVE',
    },
  });

  const ch1 = await prisma.chapter.create({
    data: {
      campaignId: campaign.id,
      title: 'Operação Urso Branco',
      synopsis: 'Infiltração nos servidores criogênicos do ártico para extração dos registros encriptados da facção rebelde.',
      order: 1,
      status: 'COMPLETED',
      progress: 100,
    },
  });

  await prisma.objective.createMany({
    data: [
      { chapterId: ch1.id, text: 'Localizar reator de resfriamento', completed: true, order: 1 },
      { chapterId: ch1.id, text: 'Descriptografar disco rígido principal', completed: true, order: 2 },
      { chapterId: ch1.id, text: 'Extrair com a nave de fuga', completed: true, order: 3 },
    ],
  });

  const ch2 = await prisma.chapter.create({
    data: {
      campaignId: campaign.id,
      title: 'Infiltração no Cairo',
      synopsis: 'Busca de inteligência cibernética tática nas ruínas industriais e desérticas fora do perímetro seguro.',
      order: 2,
      status: 'ACTIVE',
      progress: 35,
    },
  });

  await prisma.objective.createMany({
    data: [
      { chapterId: ch2.id, text: 'Restaurar energia do radar desértico', completed: true, order: 1 },
      { chapterId: ch2.id, text: 'Hackear terminal central da base de escavação', completed: false, order: 2 },
    ],
  });

  const ch3 = await prisma.chapter.create({
    data: {
      campaignId: campaign.id,
      title: 'Protocolo Final',
      synopsis: 'Assalto coordenado à base de comando orbital. Requer descriptografia total dos bancos de dados.',
      order: 3,
      status: 'LOCKED',
      progress: 0,
    },
  });

  await prisma.objective.create({
    data: { chapterId: ch3.id, text: 'Neutralizar a IA corrompida Core', completed: false, order: 1 },
  });

  console.log('Semeando notas do mestre...');
  await prisma.note.create({
    data: {
      campaignId: campaign.id,
      title: 'AVISO GERAL: Encontro às 21:00',
      content: 'Atenção agentes! Nossa próxima sessão tática será hoje às 21:00. O Capitão Arthur Vance trará novas diretrizes para o capítulo do Cairo.',
      visibility: 'ALL',
    },
  });

  console.log('Associando jogador à campanha...');
  await prisma.campaignPlayer.create({
    data: {
      campaignId: campaign.id,
      userId: player.id,
    },
  });

  console.log('Semeando personagens para o jogador...');
  const charUrso = await prisma.character.create({
    data: {
      id: 'c_urso',
      ownerId: player.id,
      name: '[URSO-01]',
      classId: classAssalto.id,
      level: 12,
      xp: 4500,
      hpMax: 120,
      hpCurrent: 95,
      mana: 40,
      themeColor: '#cba052',
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 10,
      wisdom: 10,
      charisma: 11,
      modelUrl: null,
    },
  });

  const charFalcao = await prisma.character.create({
    data: {
      id: 'c_falcao',
      ownerId: player.id,
      name: '[FALCÃO-02]',
      classId: classRecon.id,
      level: 10,
      xp: 2800,
      hpMax: 90,
      hpCurrent: 90,
      mana: 60,
      themeColor: '#38bdf8',
      strength: 10,
      dexterity: 18,
      constitution: 11,
      intelligence: 14,
      wisdom: 13,
      charisma: 10,
      modelUrl: null,
    },
  });

  const charLobo = await prisma.character.create({
    data: {
      id: 'c_lobo',
      ownerId: player.id,
      name: '[LOBO-03]',
      classId: classSuporte.id,
      level: 11,
      xp: 3700,
      hpMax: 140,
      hpCurrent: 140,
      mana: 30,
      themeColor: '#10b981',
      strength: 14,
      dexterity: 10,
      constitution: 17,
      intelligence: 10,
      wisdom: 12,
      charisma: 12,
      modelUrl: null,
    },
  });

  console.log('Criando party e adicionando personagens...');
  const party = await prisma.party.create({
    data: {
      id: 'p_alpha',
      ownerId: player.id,
      name: 'Squad Tático Alpha',
    },
  });

  await prisma.partyMember.create({
    data: { partyId: party.id, characterId: charUrso.id, slot: 0 },
  });
  await prisma.partyMember.create({
    data: { partyId: party.id, characterId: charFalcao.id, slot: 1 },
  });
  await prisma.partyMember.create({
    data: { partyId: party.id, characterId: charLobo.id, slot: 2 },
  });

  console.log('Semeando inventário do jogador...');
  await prisma.inventoryItem.create({
    data: { userId: player.id, itemType: 'weapon', itemId: w_ar50.id, quantity: 1 },
  });
  await prisma.inventoryItem.create({
    data: { userId: player.id, itemType: 'weapon', itemId: w_sr99.id, quantity: 1 },
  });
  await prisma.inventoryItem.create({
    data: { userId: player.id, itemType: 'weapon', itemId: w_cqc7.id, quantity: 1 },
  });
  await prisma.inventoryItem.create({
    data: { userId: player.id, itemType: 'weapon', itemId: w_g18.id, quantity: 2 },
  });
  await prisma.inventoryItem.create({
    data: { userId: player.id, itemType: 'consumable', itemId: c_medkit.id, quantity: 3 },
  });

  console.log('Equipando itens nos personagens...');
  await prisma.equippedItem.create({
    data: { characterId: charUrso.id, slot: 'primary_weapon', itemType: 'weapon', itemId: w_ar50.id },
  });
  await prisma.equippedItem.create({
    data: { characterId: charUrso.id, slot: 'secondary_weapon', itemType: 'weapon', itemId: w_g18.id },
  });

  await prisma.equippedItem.create({
    data: { characterId: charFalcao.id, slot: 'primary_weapon', itemType: 'weapon', itemId: w_sr99.id },
  });
  await prisma.equippedItem.create({
    data: { characterId: charFalcao.id, slot: 'secondary_weapon', itemType: 'weapon', itemId: w_g18.id },
  });

  await prisma.equippedItem.create({
    data: { characterId: charLobo.id, slot: 'primary_weapon', itemType: 'weapon', itemId: w_cqc7.id },
  });

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
