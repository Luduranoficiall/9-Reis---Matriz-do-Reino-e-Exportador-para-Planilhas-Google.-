/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { SteamGameMetadata, KingArchetype, GameCard, DifficultyConfig, SimulationRun } from '../types/game';

export function generateFullWorkbook(
  gameInfo: SteamGameMetadata,
  kings: KingArchetype[],
  cards: GameCard[],
  difficulties: Record<string, DifficultyConfig>,
  simulationRuns: SimulationRun[]
): Blob {
  const wb = XLSX.utils.book_new();

  // 1. Resumo do Jogo
  const tab1Data = [
    ['CAMPO', 'INFORMAÇÃO DETALHADA', 'OBSERVAÇÕES DO CLIENTE / STEAM'],
    ['Título Oficial', gameInfo.title, 'Sad Socket'],
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
  const ws1 = XLSX.utils.aoa_to_sheet(tab1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo do Jogo');

  // 2. Os 9 Reis
  const tab2Data = [
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
  const ws2 = XLSX.utils.aoa_to_sheet(tab2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Os 9 Reis & Facções');

  // 3. Cartas & Unidades
  const tab3Data = [
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
  const ws3 = XLSX.utils.aoa_to_sheet(tab3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Cartas & Unidades');

  // 4. Dificuldades & Balanço
  const tab4Data = [
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
  const ws4 = XLSX.utils.aoa_to_sheet(tab4Data);
  XLSX.utils.book_append_sheet(wb, ws4, 'Dificuldades & Balanço');

  // 5. Registro de Partidas
  const tab5Data = [
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
  const ws5 = XLSX.utils.aoa_to_sheet(tab5Data);
  XLSX.utils.book_append_sheet(wb, ws5, 'Registro de Partidas');

  // 6. Combos & Sinergias
  const tab6Data = [
    ['NOME DO COMBO', 'REIS COMBINADOS', 'CARTAS CHAVE', 'POTENCIAL DE DANO', 'GUIA TÁTICO'],
    ['Muralha Explosiva', 'Rei dos Cavaleiros + Rei do Fogo', 'Muralha de Ferro, Bombardeiro Goblin, Quartel', 'Crítico Alto', 'Coloca cavaleiros para segurar a linha enquanto morteiros e bombardeiros destroem grupos inteiros.'],
    ['Esporos Arcanos', 'Rei da Floresta + Rei da Feitiçaria', 'Cogumelo Consciente, Mago Arcano, Torre Prismática', 'Dano Contínuo Massivo', 'O veneno desacelera o avanço inimigo dando tempo para os magos canalizarem tempestades.'],
    ['Enxame Sem Fim', 'Rei dos Mortos + Rei do Caos', 'Esqueleto Lanceiro, Diabrete Desvairado, Mausoléu', 'Velocidade Extrema', 'Custos baixíssimos e duplicações automáticas sobrecarregam torres rivais antes que possam reagir.'],
    ['Mercenários de Pedra', 'Rei da Cobiça + Rei da Pedra', 'Mercenário da Companhia, Lançador de Rocha, Cofre', 'Econômico / Controle', 'A balista e muralhas seguram enquanto o cofre acumula juros para contratar mercenários nível 3.'],
    ['Colapso no Tempo', 'Rei do Tempo + Rei da Feitiçaria', 'Crononavegante, Ampulheta, Chuva de Meteoros', 'Dano em Rajada', 'Acelera a recarga de feitiços destrutivos para limpar chefes em menos de 5 segundos.']
  ];
  const ws6 = XLSX.utils.aoa_to_sheet(tab6Data);
  XLSX.utils.book_append_sheet(wb, ws6, 'Combos & Sinergias');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadWorkbookFile(
  gameInfo: SteamGameMetadata,
  kings: KingArchetype[],
  cards: GameCard[],
  difficulties: Record<string, DifficultyConfig>,
  simulationRuns: SimulationRun[],
  filename = '9_Kings_Planilha_Completa_Google_Drive.xlsx'
) {
  const blob = generateFullWorkbook(gameInfo, kings, cards, difficulties, simulationRuns);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
