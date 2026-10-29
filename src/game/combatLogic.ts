/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyLevel, GameCard, KingArchetype, SimulationRun } from '../types/game';
import { DIFFICULTY_CONFIGS, GAME_CARDS, NINE_KINGS } from '../data/gameData';

export interface CombatSimulationParams {
  difficulty: DifficultyLevel;
  playerKingId: string;
  opponentKingId?: string;
  cardDeckIds?: string[];
  iterations?: number;
}

export interface SimulationResult {
  run: SimulationRun;
  waveDetails: {
    wave: number;
    playerHpRemaining: number;
    enemyHpRemaining: number;
    damageDealt: number;
    damageTaken: number;
    cleared: boolean;
  }[];
}

/**
 * Calculates base deck combat power and synergy score.
 */
export function calculateDeckSynergy(cards: GameCard[], king: KingArchetype): { synergyRating: number; totalDps: number; totalHp: number } {
  if (!cards.length) {
    return { synergyRating: 50, totalDps: 0, totalHp: 0 };
  }

  let matchingAffinityCount = 0;
  let totalDps = 0;
  let totalHp = 0;
  let hasUnit = false;
  let hasBuilding = false;
  let hasSpell = false;

  for (const c of cards) {
    totalHp += c.health;
    totalDps += (c.attack * (c.attackSpeed || 1));
    if (c.kingAffinity === king.name) {
      matchingAffinityCount++;
    }
    if (c.type === 'unit') hasUnit = true;
    if (c.type === 'building') hasBuilding = true;
    if (c.type === 'spell' || c.type === 'relic') hasSpell = true;
  }

  // Base synergy 60, up to 100 with king affinity & diversity
  let synergy = 60;
  synergy += Math.min(25, (matchingAffinityCount / cards.length) * 30);
  if (hasUnit && hasBuilding && hasSpell) {
    synergy += 15;
  } else if (hasUnit && (hasBuilding || hasSpell)) {
    synergy += 8;
  }

  return {
    synergyRating: Math.min(100, Math.round(synergy)),
    totalDps: Math.round(totalDps),
    totalHp: Math.round(totalHp),
  };
}

/**
 * Executes a full deterministic battle simulation for a single run
 */
export function runSingleSimulation(params: CombatSimulationParams): SimulationResult {
  const config = DIFFICULTY_CONFIGS[params.difficulty] || DIFFICULTY_CONFIGS.medio;
  const playerKing = NINE_KINGS.find(k => k.id === params.playerKingId) || NINE_KINGS[0];
  
  // Pick opponent
  let opponentKing = NINE_KINGS.find(k => k.id === params.opponentKingId);
  if (!opponentKing) {
    const others = NINE_KINGS.filter(k => k.id !== playerKing.id);
    opponentKing = others[Math.floor(Math.random() * others.length)] || NINE_KINGS[1];
  }

  // Select deck
  let deck: GameCard[] = [];
  if (params.cardDeckIds && params.cardDeckIds.length > 0) {
    deck = GAME_CARDS.filter(c => params.cardDeckIds!.includes(c.id));
  }
  if (!deck.length) {
    // Default starting deck
    deck = GAME_CARDS.filter(c => c.kingAffinity === playerKing.name).slice(0, 4);
  }

  const { synergyRating, totalDps, totalHp } = calculateDeckSynergy(deck, playerKing);

  // Capital HP starts at 1000
  let playerCapitalHp = 1000 + (totalHp * 0.4);
  const maxPlayerCapitalHp = playerCapitalHp;
  let wavesCleared = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let goldEarned = config.startingGold;
  let cardsPlayed = 0;

  const waveDetails = [];

  for (let wave = 1; wave <= config.waveCount; wave++) {
    const isBoss = config.bossRounds.includes(wave);
    const waveMultiplier = 1 + (wave * 0.12);
    
    // Enemy power scaling based on difficulty
    const baseEnemyHp = 400 * waveMultiplier * config.enemyHealthMultiplier * (isBoss ? 2.5 : 1);
    const baseEnemyDps = 35 * waveMultiplier * config.enemyDamageMultiplier * (isBoss ? 2.0 : 1);

    // Dynamic combat interaction
    const effectivePlayerDps = (totalDps + 50) * (synergyRating / 100) * (1 + (wave * 0.08));
    const effectivePlayerDef = (playerKing.id === 'king_knights' ? 1.25 : 1.0);

    const secondsToClear = baseEnemyHp / Math.max(1, effectivePlayerDps);
    const waveDamageTaken = Math.round((baseEnemyDps / effectivePlayerDef) * secondsToClear * (1 + (Math.random() * config.chaosFactor * 0.4)));
    const waveDamageDealt = Math.round(baseEnemyHp);

    playerCapitalHp -= waveDamageTaken;
    totalDamageDealt += waveDamageDealt;
    totalDamageTaken += waveDamageTaken;
    cardsPlayed += Math.floor(2 + (wave * 0.5));
    goldEarned += Math.round((50 + wave * 15) * config.rewardsMultiplier);

    if (playerCapitalHp > 0) {
      wavesCleared++;
      // Passive heal between waves (Forest king has extra regen)
      const healPercent = playerKing.id === 'king_nature' ? 0.25 : 0.10;
      playerCapitalHp = Math.min(maxPlayerCapitalHp, playerCapitalHp + (maxPlayerCapitalHp * healPercent));
      
      waveDetails.push({
        wave,
        playerHpRemaining: Math.round(playerCapitalHp),
        enemyHpRemaining: 0,
        damageDealt: waveDamageDealt,
        damageTaken: waveDamageTaken,
        cleared: true,
      });
    } else {
      waveDetails.push({
        wave,
        playerHpRemaining: 0,
        enemyHpRemaining: Math.round(baseEnemyHp * 0.3),
        damageDealt: waveDamageDealt,
        damageTaken: waveDamageTaken,
        cleared: false,
      });
      break; // Run ended
    }
  }

  const victory = wavesCleared === config.waveCount;
  const durationSeconds = wavesCleared * 18 + Math.floor(Math.random() * 15);

  const run: SimulationRun = {
    id: `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    difficulty: config.id,
    chosenKing: playerKing.name,
    opponentKing: opponentKing.name,
    wavesCleared,
    maxWaves: config.waveCount,
    victory,
    totalDamageDealt,
    totalDamageTaken,
    goldEarned,
    cardsPlayed,
    durationSeconds,
    synergyRating,
    notes: victory
      ? `Vitória Conquistada! Sobreviveu a todas as ${config.waveCount} ondas no nível ${config.tag}.`
      : `Derrotado na onda ${wavesCleared + 1} de ${config.waveCount} no nível ${config.tag}.`,
  };

  return { run, waveDetails };
}

/**
 * Runs batch simulations to test balance across difficulties ("muitas vezes")
 */
export function runBatchSimulations(
  difficulty: DifficultyLevel,
  count: number = 10,
  playerKingId: string = 'king_knights'
): { runs: SimulationRun[]; winRate: number; avgWavesCleared: number; avgDamageDealt: number } {
  const runs: SimulationRun[] = [];
  let totalWins = 0;
  let sumWaves = 0;
  let sumDamage = 0;

  for (let i = 0; i < count; i++) {
    const result = runSingleSimulation({
      difficulty,
      playerKingId,
    });
    runs.push(result.run);
    if (result.run.victory) totalWins++;
    sumWaves += result.run.wavesCleared;
    sumDamage += result.run.totalDamageDealt;
  }

  return {
    runs,
    winRate: Math.round((totalWins / count) * 100),
    avgWavesCleared: Number((sumWaves / count).toFixed(1)),
    avgDamageDealt: Math.round(sumDamage / count),
  };
}
