/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeckSynergy, runSingleSimulation, runBatchSimulations } from './combatLogic';
import { DIFFICULTY_CONFIGS, GAME_CARDS, NINE_KINGS } from '../data/gameData';

test('Difficulty configurations contain all 4 required tiers', () => {
  const tiers = ['facil', 'medio', 'dificil', 'hard_master'];
  for (const tier of tiers) {
    assert.ok(DIFFICULTY_CONFIGS[tier], `Tier ${tier} must be defined`);
    assert.ok(DIFFICULTY_CONFIGS[tier].waveCount > 0);
    assert.ok(DIFFICULTY_CONFIGS[tier].enemyHealthMultiplier > 0);
  }

  // Hard Master should be harder than Fácil
  assert.ok(
    DIFFICULTY_CONFIGS.hard_master.enemyHealthMultiplier > DIFFICULTY_CONFIGS.facil.enemyHealthMultiplier,
    'Hard Master enemy HP multiplier must be greater than Fácil'
  );
  assert.ok(
    DIFFICULTY_CONFIGS.hard_master.waveCount > DIFFICULTY_CONFIGS.facil.waveCount,
    'Hard Master wave count must be higher than Fácil'
  );
});

test('calculateDeckSynergy produces scores between 60 and 100', () => {
  const king = NINE_KINGS[0];
  const matchingCards = GAME_CARDS.filter(c => c.kingAffinity === king.name);
  const result = calculateDeckSynergy(matchingCards, king);

  assert.ok(result.synergyRating >= 60 && result.synergyRating <= 100);
  assert.ok(result.totalHp > 0);
  assert.ok(result.totalDps > 0);
});

test('runSingleSimulation returns valid run record and wave details', () => {
  const simulation = runSingleSimulation({
    difficulty: 'facil',
    playerKingId: 'king_knights',
  });

  assert.ok(simulation.run.id.startsWith('run-'));
  assert.equal(simulation.run.difficulty, 'facil');
  assert.ok(simulation.run.wavesCleared >= 0);
  assert.ok(simulation.run.totalDamageDealt >= 0);
  assert.ok(simulation.waveDetails.length > 0);
});

test('runBatchSimulations generates correct count and valid stats across runs', () => {
  const batch = runBatchSimulations('medio', 5, 'king_knights');

  assert.equal(batch.runs.length, 5);
  assert.ok(batch.winRate >= 0 && batch.winRate <= 100);
  assert.ok(batch.avgWavesCleared >= 0);
  assert.ok(batch.avgDamageDealt >= 0);
});
