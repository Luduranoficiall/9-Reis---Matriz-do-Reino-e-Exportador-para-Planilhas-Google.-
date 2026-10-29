/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyLevel, SimulationRun } from '../types/game';
import { DIFFICULTY_CONFIGS } from '../data/gameData';

export interface DifficultyStats {
  id: DifficultyLevel;
  name: string;
  tag: string;
  vitorias: number;
  derrotas: number;
  total: number;
  taxaVitoria: number; // 0 to 100
  danoMedio: number;
  ondasMedias: number;
  ouroMedio: number;
}

export interface KingWinLossStats {
  kingName: string;
  vitorias: number;
  derrotas: number;
  total: number;
  taxaVitoria: number;
}

export interface GlobalDashboardKpis {
  totalRuns: number;
  totalVitorias: number;
  totalDerrotas: number;
  taxaGlobalVitoria: number;
  danoMaximo: number;
  danoMedioTotal: number;
  sinergiaMediaTotal: number;
}

/**
 * Calculates win/loss statistics and performance metrics grouped by difficulty level.
 */
export function calculateDifficultyStats(runs: SimulationRun[]): DifficultyStats[] {
  const tiers: DifficultyLevel[] = ['facil', 'medio', 'dificil', 'hard_master'];

  return tiers.map(tier => {
    const config = DIFFICULTY_CONFIGS[tier];
    const tierRuns = runs.filter(r => r.difficulty === tier);

    let vitorias = 0;
    let derrotas = 0;
    let somaDano = 0;
    let somaOndas = 0;
    let somaOuro = 0;

    for (const r of tierRuns) {
      if (r.victory) {
        vitorias++;
      } else {
        derrotas++;
      }
      somaDano += r.totalDamageDealt;
      somaOndas += r.wavesCleared;
      somaOuro += r.goldEarned;
    }

    const total = tierRuns.length;
    const taxaVitoria = total > 0 ? Math.round((vitorias / total) * 100) : 0;
    const danoMedio = total > 0 ? Math.round(somaDano / total) : 0;
    const ondasMedias = total > 0 ? Number((somaOndas / total).toFixed(1)) : 0;
    const ouroMedio = total > 0 ? Math.round(somaOuro / total) : 0;

    return {
      id: tier,
      name: config?.name || tier,
      tag: config?.tag || tier,
      vitorias,
      derrotas,
      total,
      taxaVitoria,
      danoMedio,
      ondasMedias,
      ouroMedio,
    };
  });
}

/**
 * Calculates win/loss statistics per King archetype.
 */
export function calculateKingStats(runs: SimulationRun[]): KingWinLossStats[] {
  const map: Record<string, { vitorias: number; derrotas: number }> = {};

  for (const r of runs) {
    if (!map[r.chosenKing]) {
      map[r.chosenKing] = { vitorias: 0, derrotas: 0 };
    }
    if (r.victory) {
      map[r.chosenKing].vitorias++;
    } else {
      map[r.chosenKing].derrotas++;
    }
  }

  return Object.entries(map).map(([kingName, stats]) => {
    const total = stats.vitorias + stats.derrotas;
    const taxaVitoria = total > 0 ? Math.round((stats.vitorias / total) * 100) : 0;
    return {
      kingName,
      vitorias: stats.vitorias,
      derrotas: stats.derrotas,
      total,
      taxaVitoria,
    };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Calculates high-level KPI metrics across all runs.
 */
export function calculateGlobalKpis(runs: SimulationRun[]): GlobalDashboardKpis {
  let vitorias = 0;
  let derrotas = 0;
  let danoMaximo = 0;
  let somaDano = 0;
  let somaSinergia = 0;

  for (const r of runs) {
    if (r.victory) vitorias++;
    else derrotas++;

    if (r.totalDamageDealt > danoMaximo) danoMaximo = r.totalDamageDealt;
    somaDano += r.totalDamageDealt;
    somaSinergia += r.synergyRating;
  }

  const total = runs.length;
  return {
    totalRuns: total,
    totalVitorias: vitorias,
    totalDerrotas: derrotas,
    taxaGlobalVitoria: total > 0 ? Math.round((vitorias / total) * 100) : 0,
    danoMaximo,
    danoMedioTotal: total > 0 ? Math.round(somaDano / total) : 0,
    sinergiaMediaTotal: total > 0 ? Math.round(somaSinergia / total) : 0,
  };
}
