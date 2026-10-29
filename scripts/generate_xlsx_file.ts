import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { STEAM_GAME_INFO, NINE_KINGS, GAME_CARDS, DIFFICULTY_CONFIGS, INITIAL_SIMULATION_RUNS } from '../src/data/gameData';

const wb = XLSX.utils.book_new();

// 1. Resumo do Jogo
const tab1Data = [
  ['CAMPO', 'INFORMAÇÃO DETALHADA', 'OBSERVAÇÕES DO CLIENTE / STEAM'],
  ['Título Oficial', STEAM_GAME_INFO.title, 'Sad Socket'],
  ['Desenvolvedor', STEAM_GAME_INFO.developer, 'Sad Socket'],
  ['Distribuidora', STEAM_GAME_INFO.publisher, 'Hooded Horse, Sidekick Publishing'],
  ['Data de Lançamento (EA)', STEAM_GAME_INFO.releaseDate, '23 de maio de 2025'],
  ['Lançamento Versão 1.0', STEAM_GAME_INFO.earlyAccessExitDate, 'Previsão de saída do Acesso Antecipado'],
  ['Preço Base (BRL)', `R$ ${STEAM_GAME_INFO.priceBRL.toFixed(2)}`, 'Sem aumento planejado para a 1.0'],
  ['Avaliações Gerais', STEAM_GAME_INFO.reviewsSummary.overall, `${STEAM_GAME_INFO.reviewsSummary.recentCount} análises recentes`],
  ['Avaliações em PT-BR', STEAM_GAME_INFO.reviewsSummary.ptBrStatus, `${STEAM_GAME_INFO.reviewsSummary.ptBrCount.toLocaleString('pt-BR')} análises de jogadores brasileiros`],
  ['Gêneros Principais', STEAM_GAME_INFO.genres.join(', '), 'RPG, Estratégia, Construção de Cidades'],
  ['Marcadores Steam', STEAM_GAME_INFO.tags.join(', '), 'Roguelike, Batalha Automática, Cartas'],
  ['Idiomas Suportados', `${STEAM_GAME_INFO.supportedLanguagesCount} idiomas`, 'Interface e legendas completas em PT-BR e EN'],
  ['Link da Loja Steam', STEAM_GAME_INFO.steamStoreUrl, 'Página oficial de compra e novidades'],
  ['Sistema Operacional Mínimo', STEAM_GAME_INFO.systemRequirements.os, '64-bit'],
  ['Processador Mínimo', STEAM_GAME_INFO.systemRequirements.processor, 'Quad-core'],
  ['Memória RAM Mínima', STEAM_GAME_INFO.systemRequirements.memory, 'Espaço leve e otimizado'],
  ['Placa de Vídeo Mínima', STEAM_GAME_INFO.systemRequirements.graphics, 'DirectX 11'],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tab1Data), 'Resumo do Jogo');

// 2. Os 9 Reis
const tab2Data = [
  ['REI / MONARCA', 'EPÍTETO', 'REINO / SEDE', 'DESCRIÇÃO & ESTILO DE JOGO', 'HABILIDADE REAL', 'RECARGA (S)', 'DESCRIÇÃO DA HABILIDADE', 'BÔNUS PASSIVO DA COROA', 'BARALHO INICIAL', 'PONTO FORTE', 'PONTO FRACO'],
  ...NINE_KINGS.map(k => [k.name, k.epithet, k.realm, k.description, k.royalAbility.name, k.royalAbility.cooldown, k.royalAbility.description, k.passiveBuff, k.startingDeck.join('; '), k.strengthsAgainst, k.counteredBy])
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tab2Data), 'Os 9 Reis & Facções');

// 3. Cartas & Unidades
const tab3Data = [
  ['ID DA CARTA', 'NOME', 'FACÇÃO / REI', 'TIPO', 'TIER', 'CUSTO (OURO)', 'VIDA (HP)', 'PODER DE ATAQUE', 'VEL. ATAQUE (ATK/S)', 'ALCANCE', 'DESCRIÇÃO', 'EFEITO DE SINERGIA'],
  ...GAME_CARDS.map(c => [c.id, c.name, c.kingAffinity, c.type.toUpperCase(), `Tier ${c.tier}`, c.cost, c.health, c.attack, c.attackSpeed, c.range === 1 ? 'Corpo-a-corpo (1)' : `Longo Alcance (${c.range})`, c.description, c.synergyEffect])
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tab3Data), 'Cartas & Unidades');

// 4. Dificuldades & Balanço
const tab4Data = [
  ['CÓDIGO', 'NÍVEL DE DIFICULDADE', 'DESCRIÇÃO DE BALANCEAMENTO', 'MULTIPLICADOR HP INIMIGO', 'MULTIPLICADOR DANO INIMIGO', 'TOTAL DE ONDAS', 'OURO INICIAL', 'ONDAS DE CHEFES (BOSSES)', 'FATOR DE CAOS (%)', 'MULTIPLICADOR DE RECOMPENSAS'],
  ...Object.values(DIFFICULTY_CONFIGS).map(d => [d.id, d.name, d.description, `${(d.enemyHealthMultiplier * 100).toFixed(0)}%`, `${(d.enemyDamageMultiplier * 100).toFixed(0)}%`, d.waveCount, d.startingGold, d.bossRounds.join(', '), `${(d.chaosFactor * 100).toFixed(0)}%`, `${d.rewardsMultiplier.toFixed(1)}x`])
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tab4Data), 'Dificuldades & Balanço');

// 5. Registro de Partidas
const tab5Data = [
  ['ID DA SIMULAÇÃO', 'DATA / HORA', 'NÍVEL DIFICULDADE', 'REI DO JOGADOR', 'REI ADVERSÁRIO', 'ONDAS CONCLUÍDAS', 'TOTAL ONDAS', 'RESULTADO', 'DANO CAUSADO', 'DANO SOFRIDO', 'OURO COLETADO', 'CARTAS JOGADAS', 'DURAÇÃO (S)', 'TAXA DE SINERGIA (%)', 'RELATÓRIO / OBSERVAÇÕES'],
  ...INITIAL_SIMULATION_RUNS.map(r => [r.id, r.timestamp, DIFFICULTY_CONFIGS[r.difficulty]?.tag || r.difficulty, r.chosenKing, r.opponentKing, r.wavesCleared, r.maxWaves, r.victory ? 'VITÓRIA' : 'DERROTA', r.totalDamageDealt, r.totalDamageTaken, r.goldEarned, r.cardsPlayed, r.durationSeconds, `${r.synergyRating}%`, r.notes])
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tab5Data), 'Registro de Partidas');

// 6. Combos & Sinergias
const tab6Data = [
  ['NOME DO COMBO', 'REIS COMBINADOS', 'CARTAS CHAVE', 'POTENCIAL DE DANO', 'GUIA TÁTICO'],
  ['Muralha Explosiva', 'Rei dos Cavaleiros + Rei do Fogo', 'Muralha de Ferro, Bombardeiro Goblin, Quartel', 'Crítico Alto', 'Coloca cavaleiros para segurar a linha enquanto morteiros e bombardeiros destroem grupos inteiros.'],
  ['Esporos Arcanos', 'Rei da Floresta + Rei da Feitiçaria', 'Cogumelo Consciente, Mago Arcano, Torre Prismática', 'Dano Contínuo Massivo', 'O veneno desacelera o avanço inimigo dando tempo para os magos canalizarem tempestades.'],
  ['Enxame Sem Fim', 'Rei dos Mortos + Rei do Caos', 'Esqueleto Lanceiro, Diabrete Desvairado, Mausoléu', 'Velocidade Extrema', 'Custos baixíssimos e duplicações automáticas sobrecarregam torres rivais antes que possam reagir.'],
  ['Mercenários de Pedra', 'Rei da Cobiça + Rei da Pedra', 'Mercenário da Companhia, Lançador de Rocha, Cofre', 'Econômico / Controle', 'A balista e muralhas seguram enquanto o cofre acumula juros para contratar mercenários nível 3.'],
  ['Colapso no Tempo', 'Rei do Tempo + Rei da Feitiçaria', 'Crononavegante, Ampulheta, Chuva de Meteoros', 'Dano em Rajada', 'Acelera a recarga de feitiços destrutivos para limpar chefes em menos de 5 segundos.']
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tab6Data), 'Combos & Sinergias');

const outputPath = path.resolve(process.cwd(), '9_Kings_Matriz_Oficial_Google_Drive.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Planilha Excel gerada com sucesso em:', outputPath);
