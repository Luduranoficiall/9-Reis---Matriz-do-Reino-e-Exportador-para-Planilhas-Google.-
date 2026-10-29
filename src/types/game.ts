/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DifficultyLevel = 'facil' | 'medio' | 'dificil' | 'hard_master';

export interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  tag: string;
  badgeColor: string;
  description: string;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  waveCount: number;
  startingGold: number;
  bossRounds: number[];
  chaosFactor: number; // modifier unpredictability
  rewardsMultiplier: number;
}

export type CardType = 'unit' | 'building' | 'spell' | 'relic';

export interface GameCard {
  id: string;
  name: string;
  kingAffinity: string; // which king archetype
  type: CardType;
  cost: number;
  tier: 1 | 2 | 3 | 4;
  health: number;
  attack: number;
  attackSpeed: number; // attacks per second
  range: number; // 1 = melee, > 1 = ranged
  description: string;
  synergyEffect: string;
  icon: string;
}

export interface KingArchetype {
  id: string;
  name: string;
  epithet: string;
  realm: string;
  themeColor: string;
  icon: string;
  crestIcon: string;
  description: string;
  royalAbility: {
    name: string;
    description: string;
    cooldown: number;
  };
  startingDeck: string[]; // card names
  passiveBuff: string;
  counteredBy: string;
  strengthsAgainst: string;
}

export interface SimulationRun {
  id: string;
  timestamp: string;
  difficulty: DifficultyLevel;
  chosenKing: string;
  opponentKing: string;
  wavesCleared: number;
  maxWaves: number;
  victory: boolean;
  totalDamageDealt: number;
  totalDamageTaken: number;
  goldEarned: number;
  cardsPlayed: number;
  durationSeconds: number;
  synergyRating: number; // 0 - 100
  notes: string;
}

export interface SteamGameMetadata {
  title: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  earlyAccessExitDate: string;
  priceBRL: number;
  discountPercentage: number;
  discountPriceBRL: number;
  reviewsSummary: {
    overall: string;
    recentCount: number;
    ptBrCount: number;
    ptBrStatus: string;
  };
  genres: string[];
  tags: string[];
  supportedLanguagesCount: number;
  steamStoreUrl: string;
  systemRequirements: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    directX: string;
    storage: string;
  };
}
