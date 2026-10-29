/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SteamGameMetadata, KingArchetype, GameCard, DifficultyConfig, SimulationRun } from '../types/game';

export interface ExportProgress {
  step: string;
  percent: number;
}

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  createdSheets: string[];
}

/**
 * Creates and formats a Google Spreadsheet in the user's Google Drive containing
 * all 9 Kings game data, cards, difficulty tiers, and battle simulation history.
 */
export async function exportGameDataToGoogleSheets(
  accessToken: string,
  gameInfo: SteamGameMetadata,
  kings: KingArchetype[],
  cards: GameCard[],
  difficulties: Record<string, DifficultyConfig>,
  simulationRuns: SimulationRun[],
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  onProgress?.({ step: 'Iniciando criação da planilha no Google Drive...', percent: 10 });

  const title = `9 Kings - Base de Dados & Simulações (${new Date().toLocaleDateString('pt-BR')})`;

  // Step 1: Create spreadsheet with initial tabs
  const sheetTitles = [
    'Resumo do Jogo (9 Kings)',
    'Os 9 Reis & Facções',
    'Cartas & Unidades',
    'Dificuldades & Balanço',
    'Registro de Partidas',
    'Combos & Sinergias',
  ];

  const createBody = {
    properties: {
      title,
      locale: 'pt_BR',
      autoRecalc: 'ON_CHANGE',
    },
    sheets: sheetTitles.map((tabTitle, idx) => ({
      properties: {
        sheetId: idx,
        title: tabTitle,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
    })),
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Erro ao criar planilha no Google Sheets (Status ${createRes.status})`
    );
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  onProgress?.({ step: 'Estruturando dados e preenchendo abas...', percent: 35 });

  // Step 2: Build row values for each tab
  // Tab 1: Resumo do Jogo
  const tab1Values = [
    ['CAMPO', 'INFORMAÇÃO DETALHADA', 'OBSERVAÇÕES DO CLIENTE / STEAM'],
    ['Título Oficial', gameInfo.title, 'Nome do jogo no Steam'],
    ['Desenvolvedor', gameInfo.developer, 'Sad Socket'],
    ['Distribuidora', gameInfo.publisher, 'Hooded Horse, Sidekick Publishing'],
    ['Data de Lançamento (EA)', gameInfo.releaseDate, '23 de maio de 2025'],
    ['Lançamento Versão 1.0', gameInfo.earlyAccessExitDate, 'Previsão de saída do Acesso Antecipado'],
    ['Preço Base (BRL)', `R$ ${gameInfo.priceBRL.toFixed(2)}`, 'Sem aumento planejado para a 1.0'],
    ['Avaliações Gerais', gameInfo.reviewsSummary.overall, `${gameInfo.reviewsSummary.recentCount} análises recentes`],
    ['Avaliações em PT-BR', gameInfo.reviewsSummary.ptBrStatus, `${gameInfo.reviewsSummary.ptBrCount.toLocaleString('pt-BR')} análises de jogadores brasileiros`],
    ['Gêneros Principais', gameInfo.genres.join(', '), 'RPG, Estratégia, Construção de Cidades'],
    ['Marcadores Steam', gameInfo.tags.join(', '), 'Roguelike, Batalha Automática, Cartas'],
    ['Idiomas Suportados', `${gameInfo.supportedLanguagesCount} idiomas`, 'Interface e legendas completas em PT-BR e EN'],
    ['Link da Loja Steam', gameInfo.steamStoreUrl, 'Página oficial de compra e novidades'],
    ['Sistema Operacional Mínimo', gameInfo.systemRequirements.os, '64-bit'],
    ['Processador Mínimo', gameInfo.systemRequirements.processor, 'Quad-core'],
    ['Memória RAM Mínima', gameInfo.systemRequirements.memory, 'Espaço leve e otimizado'],
    ['Placa de Vídeo Mínima', gameInfo.systemRequirements.graphics, 'DirectX 11'],
  ];

  // Tab 2: Os 9 Reis
  const tab2Values = [
    [
      'REI / MONARCA',
      'EPÍTETO',
      'REINO / SEDE',
      'DESCRIÇÃO & ESTILO DE JOGO',
      'HABILIDADE REAL',
      'RECARGA (S)',
      'DESCRIÇÃO DA HABILIDADE',
      'BÔNUS PASSIVO DA COROA',
      'BARALHO INICIAL',
      'PONTO FORTE',
      'PONTO FRACO'
    ],
    ...kings.map(k => [
      k.name,
      k.epithet,
      k.realm,
      k.description,
      k.royalAbility.name,
      k.royalAbility.cooldown,
      k.royalAbility.description,
      k.passiveBuff,
      k.startingDeck.join('; '),
      k.strengthsAgainst,
      k.counteredBy
    ])
  ];

  // Tab 3: Cartas & Unidades
  const tab3Values = [
    [
      'ID DA CARTA',
      'NOME',
      'FACÇÃO / REI',
      'TIPO',
      'TIER',
      'CUSTO (OURO)',
      'VIDA (HP)',
      'PODER DE ATAQUE',
      'VEL. ATAQUE (ATK/S)',
      'ALCANCE',
      'DESCRIÇÃO',
      'EFEITO DE SINERGIA'
    ],
    ...cards.map(c => [
      c.id,
      c.name,
      c.kingAffinity,
      c.type.toUpperCase(),
      `Tier ${c.tier}`,
      c.cost,
      c.health,
      c.attack,
      c.attackSpeed,
      c.range === 1 ? 'Corpo-a-corpo (1)' : `Longo Alcance (${c.range})`,
      c.description,
      c.synergyEffect
    ])
  ];

  // Tab 4: Dificuldades & Balanço
  const tab4Values = [
    [
      'CÓDIGO',
      'NÍVEL DE DIFICULDADE',
      'DESCRIÇÃO DE BALANCEAMENTO',
      'MULTIPLICADOR HP INIMIGO',
      'MULTIPLICADOR DANO INIMIGO',
      'TOTAL DE ONDAS',
      'OURO INICIAL',
      'ONDAS DE CHEFES (BOSSES)',
      'FATOR DE CAOS (%)',
      'MULTIPLICADOR DE RECOMPENSAS'
    ],
    ...Object.values(difficulties).map(d => [
      d.id,
      d.name,
      d.description,
      `${(d.enemyHealthMultiplier * 100).toFixed(0)}%`,
      `${(d.enemyDamageMultiplier * 100).toFixed(0)}%`,
      d.waveCount,
      d.startingGold,
      d.bossRounds.join(', '),
      `${(d.chaosFactor * 100).toFixed(0)}%`,
      `${d.rewardsMultiplier.toFixed(1)}x`
    ])
  ];

  // Tab 5: Registro de Partidas & Simulações
  const tab5Values = [
    [
      'ID DA SIMULAÇÃO',
      'DATA / HORA',
      'NÍVEL DIFICULDADE',
      'REI DO JOGADOR',
      'REI ADVERSÁRIO',
      'ONDAS CONCLUÍDAS',
      'TOTAL ONDAS',
      'RESULTADO',
      'DANO CAUSADO',
      'DANO SOFRIDO',
      'OURO COLETADO',
      'CARTAS JOGADAS',
      'DURAÇÃO (S)',
      'TAXA DE SINERGIA (%)',
      'RELATÓRIO / OBSERVAÇÕES'
    ],
    ...simulationRuns.map(r => [
      r.id,
      r.timestamp,
      difficulties[r.difficulty]?.tag || r.difficulty,
      r.chosenKing,
      r.opponentKing,
      r.wavesCleared,
      r.maxWaves,
      r.victory ? 'VITÓRIA' : 'DERROTA',
      r.totalDamageDealt,
      r.totalDamageTaken,
      r.goldEarned,
      r.cardsPlayed,
      r.durationSeconds,
      `${r.synergyRating}%`,
      r.notes
    ])
  ];

  // Tab 6: Combos & Sinergias
  const tab6Values = [
    ['NOME DO COMBO', 'REIS COMBINADOS', 'CARTAS CHAVE', 'POTENCIAL DE DANO', 'GUIA TÁTICO'],
    ['Muralha Explosiva', 'Rei dos Cavaleiros + Rei do Fogo', 'Muralha de Ferro, Bombardeiro Goblin, Quartel', 'Crítico Alto', 'Coloca cavaleiros para segurar a linha enquanto morteiros e bombardeiros destroem grupos inteiros.'],
    ['Esporos Arcanos', 'Rei da Floresta + Rei da Feitiçaria', 'Cogumelo Consciente, Mago Arcano, Torre Prismática', 'Dano Contínuo Massivo', 'O veneno desacelera o avanço inimigo dando tempo para os magos canalizarem tempestades.'],
    ['Enxame Sem Fim', 'Rei dos Mortos + Rei do Caos', 'Esqueleto Lanceiro, Diabrete Desvairado, Mausoléu', 'Velocidade Extrema', 'Custos baixíssimos e duplicações automáticas sobrecarregam torres rivais antes que possam reagir.'],
    ['Mercenários de Pedra', 'Rei da Cobiça + Rei da Pedra', 'Mercenário da Companhia, Lançador de Rocha, Cofre', 'Econômico / Controle', 'A balista e muralhas seguram enquanto o cofre acumula juros para contratar mercenários nível 3.'],
    ['Colapso no Tempo', 'Rei do Tempo + Rei da Feitiçaria', 'Crononavegante, Ampulheta, Chuva de Meteoros', 'Dano em Rajada', 'Acelera a recarga de feitiços destrutivos para limpar chefes em menos de 5 segundos.']
  ];

  const dataPayload = [
    { range: `'${sheetTitles[0]}'!A1`, values: tab1Values },
    { range: `'${sheetTitles[1]}'!A1`, values: tab2Values },
    { range: `'${sheetTitles[2]}'!A1`, values: tab3Values },
    { range: `'${sheetTitles[3]}'!A1`, values: tab4Values },
    { range: `'${sheetTitles[4]}'!A1`, values: tab5Values },
    { range: `'${sheetTitles[5]}'!A1`, values: tab6Values },
  ];

  onProgress?.({ step: 'Enviando tabelas e métricas para a planilha...', percent: 65 });

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload,
      }),
    }
  );

  if (!appendRes.ok) {
    const errorData = await appendRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Erro ao preencher dados na planilha (Status ${appendRes.status})`
    );
  }

  onProgress?.({ step: 'Aplicando design real e formatação de cabeçalhos...', percent: 85 });

  // Step 3: Format headers, colors and column widths
  const formatRequests = sheetTitles.map((_, idx) => ({
    repeatCell: {
      range: {
        sheetId: idx,
        startRowIndex: 0,
        endRowIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: {
            red: 0.12,
            green: 0.16,
            blue: 0.24,
          },
          textFormat: {
            foregroundColor: {
              red: 0.95,
              green: 0.77,
              blue: 0.26,
            },
            fontSize: 11,
            bold: true,
          },
          horizontalAlignment: 'CENTER',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
    },
  }));

  // Auto-resize columns across tabs
  const autoResizeRequests = sheetTitles.map((_, idx) => ({
    autoResizeDimensions: {
      dimensions: {
        sheetId: idx,
        dimension: 'COLUMNS',
        startIndex: 0,
        endIndex: 15,
      },
    },
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [...formatRequests, ...autoResizeRequests],
    }),
  }).catch(() => {
    // Non-fatal if styling fails
  });

  onProgress?.({ step: 'Planilha exportada com sucesso para o seu Google Drive!', percent: 100 });

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    createdSheets: sheetTitles,
  };
}
