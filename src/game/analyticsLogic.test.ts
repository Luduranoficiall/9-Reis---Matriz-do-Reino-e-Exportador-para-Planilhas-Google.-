/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDifficultyStats, calculateKingStats, calculateGlobalKpis } from './analyticsLogic';
import { INITIAL_SIMULATION_RUNS } from '../data/gameData';

test('calculateDifficultyStats correctly groups runs across all 4 tiers', () => {
  const stats = calculateDifficultyStats(INITIAL_SIMULATION_RUNS);

  assert.equal(stats.length, 4);
  assert.equal(stats[0].id, 'facil');
  assert.equal(stats[1].id, 'medio');
  assert.equal(stats[2].id, 'dificil');
  assert.equal(stats[3].id, 'hard_master');

  const totalRunsCounted = stats.reduce((acc, curr) => acc + curr.total, 0);
  assert.equal(totalRunsCounted, INITIAL_SIMULATION_RUNS.length);

  for (const s of stats) {
    assert.equal(s.vitorias + s.derrotas, s.total);
    if (s.total > 0) {
      assert.ok(s.taxaVitoria >= 0 && s.taxaVitoria <= 100);
      assert.ok(s.danoMedio >= 0);
      assert.ok(s.ondasMedias >= 0);
    }
  }
});

test('calculateKingStats produces valid breakdown by king', () => {
  const kingStats = calculateKingStats(INITIAL_SIMULATION_RUNS);
  assert.ok(kingStats.length > 0);
  for (const k of kingStats) {
    assert.ok(k.kingName.length > 0);
    assert.equal(k.vitorias + k.derrotas, k.total);
  }
});

test('calculateGlobalKpis calculates aggregated totals accurately', () => {
  const kpis = calculateGlobalKpis(INITIAL_SIMULATION_RUNS);
  assert.equal(kpis.totalRuns, INITIAL_SIMULATION_RUNS.length);
  assert.equal(kpis.totalVitorias + kpis.totalDerrotas, kpis.totalRuns);
  assert.ok(kpis.taxaGlobalVitoria >= 0 && kpis.taxaGlobalVitoria <= 100);
  assert.ok(kpis.danoMaximo >= 0);
  assert.ok(kpis.danoMedioTotal >= 0);
});
