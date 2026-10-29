/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STEAM_GAME_INFO, NINE_KINGS, GAME_CARDS, DIFFICULTY_CONFIGS } from '../data/gameData';
import { SimulationRun, DifficultyLevel } from '../types/game';
import {
  Crown,
  Layers,
  Swords,
  Shield,
  Sparkles,
  Flame,
  Clock,
  Skull,
  Coins,
  TreePine,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

interface DatabaseExplorerProps {
  simulationRuns: SimulationRun[];
  onOpenExporter: () => void;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  simulationRuns,
  onOpenExporter,
}) => {
  const [activeTab, setActiveTab] = useState<'steam' | 'kings' | 'cards' | 'difficulties' | 'runs'>('steam');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const filteredCards = GAME_CARDS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.kingAffinity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRuns = simulationRuns.filter(r => {
    const matchesDiff = filterDifficulty === 'all' || r.difficulty === filterDifficulty;
    const matchesSearch =
      r.chosenKing.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.opponentKing.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-slate-950 px-4 lg:px-6 pt-3 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('steam')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'steam'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Steam & Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('kings')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'kings'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Os 9 Reis ({NINE_KINGS.length})
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'cards'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Cartas & Unidades ({GAME_CARDS.length})
          </button>

          <button
            onClick={() => setActiveTab('difficulties')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'difficulties'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            4 Dificuldades
          </button>

          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'runs'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Partidas & Simulações ({simulationRuns.length})
          </button>
        </div>

        <button
          onClick={onOpenExporter}
          className="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          Exportar Tudo
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-5 lg:p-6">
        {/* TAB 1: STEAM OVERVIEW */}
        {activeTab === 'steam' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Game Main Details */}
              <div className="md:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-amber-400 tracking-wider">
                      Construtor de Reino Roguelike
                    </span>
                    <h3 className="text-2xl font-bold font-serif text-slate-100 mt-0.5">
                      9 Kings
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Desenvolvedor: <span className="text-slate-200 font-semibold">{STEAM_GAME_INFO.developer}</span> · 
                      Distribuidora: <span className="text-slate-200 font-semibold">{STEAM_GAME_INFO.publisher}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-amber-400">
                      R$ {STEAM_GAME_INFO.priceBRL.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">Sem alteração para a v1.0</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Um construtor de reino roguelike acelerado. Expanda seu império e lute em batalhas gigantescas contra poderosos reis rivais. Explore todas as vantagens com milhares de combinações impressionantes para se tornar o Rei dos Reis.
                </p>

                {/* Roadmaps & Early access notice */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Data Prevista de Lançamento Completo (v1.0):</strong> {STEAM_GAME_INFO.earlyAccessExitDate}.
                    <br />
                    A versão final contará com todos os 9 reis completos, modos de jogo extras e suporte expandido a heranças.
                  </div>
                </div>

                {/* Popular Tags */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Marcadores Populares Steam:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STEAM_GAME_INFO.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Reviews & Community */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Avaliações da Comunidade
                  </h4>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-xs text-slate-400">Análises em Português (Brasil):</div>
                      <div className="text-base font-bold text-emerald-400">
                        {STEAM_GAME_INFO.reviewsSummary.ptBrStatus}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {STEAM_GAME_INFO.reviewsSummary.ptBrCount.toLocaleString('pt-BR')} jogadores
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Análises Recentes Gerais:</div>
                      <div className="text-sm font-semibold text-blue-400">
                        {STEAM_GAME_INFO.reviewsSummary.overall}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ({STEAM_GAME_INFO.reviewsSummary.recentCount} reviews)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400">Idiomas:</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {STEAM_GAME_INFO.supportedLanguagesCount} idiomas suportados (Interface e legendas em PT-BR e EN)
                  </div>
                </div>
              </div>
            </div>

            {/* System Requirements */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Requisitos de Sistema Mínimos (PC Windows)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">SO:</span>
                  {STEAM_GAME_INFO.systemRequirements.os}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Processador:</span>
                  {STEAM_GAME_INFO.systemRequirements.processor}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Memória RAM:</span>
                  {STEAM_GAME_INFO.systemRequirements.memory}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Placa de Vídeo:</span>
                  {STEAM_GAME_INFO.systemRequirements.graphics}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">DirectX:</span>
                  {STEAM_GAME_INFO.systemRequirements.directX}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Armazenamento:</span>
                  {STEAM_GAME_INFO.systemRequirements.storage}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THE 9 KINGS */}
        {activeTab === 'kings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {NINE_KINGS.map(king => (
              <div
                key={king.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-3 h-3 rounded-full shadow"
                      style={{ backgroundColor: king.themeColor }}
                    />
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {king.realm}
                    </span>
                  </div>

                  <h4 className="text-base font-bold font-serif text-slate-100">
                    {king.name}
                  </h4>
                  <div className="text-xs text-amber-400 font-medium italic mb-2">
                    &quot;{king.epithet}&quot;
                  </div>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {king.description}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-purple-400 flex items-center justify-between">
                        <span>Habilidade: {king.royalAbility.name}</span>
                        <span className="font-mono text-slate-400">{king.royalAbility.cooldown}s cd</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        {king.royalAbility.description}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/50 text-[11px]">
                      <span className="text-amber-400 font-semibold">Passiva: </span>
                      <span className="text-slate-300">{king.passiveBuff}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
                  <span className="text-emerald-400">
                    Forte: {king.strengthsAgainst.replace('Rei ', '')}
                  </span>
                  <span className="text-rose-400">
                    Fraco: {king.counteredBy.replace('Rei ', '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CARDS & UNITS */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar carta por nome, rei ou tipo (ex: Cavaleiro, Mago, Feitiço)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCards.map(c => (
                <div
                  key={c.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 font-bold uppercase text-amber-400">
                        {c.type} · T{c.tier}
                      </span>
                      <span className="font-semibold text-amber-300">{c.cost} Ouro</span>
                    </div>

                    <h5 className="text-sm font-bold text-slate-100">{c.name}</h5>
                    <div className="text-[11px] text-slate-400 mb-2">{c.kingAffinity}</div>

                    <p className="text-xs text-slate-300 mb-3">{c.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span>HP: <strong className="text-emerald-400">{c.health}</strong></span>
                      <span>ATK: <strong className="text-rose-400">{c.attack}</strong></span>
                      <span>VEL: <strong className="text-blue-400">{c.attackSpeed}/s</strong></span>
                      <span>ALC: <strong className="text-purple-400">{c.range}</strong></span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 text-[10px] text-slate-400 leading-tight">
                      <span className="text-amber-400 font-semibold">Sinergia: </span>
                      {c.synergyEffect}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 4 DIFFICULTY TIERS */}
        {activeTab === 'difficulties' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['facil', 'medio', 'dificil', 'hard_master'] as DifficultyLevel[]).map(diffKey => {
              const d = DIFFICULTY_CONFIGS[diffKey];
              return (
                <div
                  key={d.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {d.tag}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{d.waveCount} ondas</span>
                    </div>

                    <h4 className="text-base font-bold font-serif text-slate-100 mb-2">
                      {d.name}
                    </h4>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                      {d.description}
                    </p>

                    <div className="space-y-2 text-xs font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vida Inimiga:</span>
                        <span className="text-slate-200">{(d.enemyHealthMultiplier * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dano Inimigo:</span>
                        <span className="text-rose-400">{(d.enemyDamageMultiplier * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ouro Inicial:</span>
                        <span className="text-amber-400">{d.startingGold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ondas de Chefes:</span>
                        <span className="text-purple-400">{d.bossRounds.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fator de Caos:</span>
                        <span className="text-cyan-400">{(d.chaosFactor * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Recompensas:</span>
                        <span className="text-emerald-400">{d.rewardsMultiplier.toFixed(1)}x</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    Balancete calibrado para exportação direta ao Google Sheets.
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: MATCH RUNS & SIMULATIONS */}
        {activeTab === 'runs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">Todas as Dificuldades</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                  <option value="hard_master">Hard Master</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Mostrando <strong className="text-slate-200">{filteredRuns.length}</strong> partidas registradas
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">ID / Data</th>
                    <th className="p-3">Dificuldade</th>
                    <th className="p-3">Rei do Jogador</th>
                    <th className="p-3">Ondas</th>
                    <th className="p-3">Resultado</th>
                    <th className="p-3">Dano</th>
                    <th className="p-3">Ouro</th>
                    <th className="p-3">Sinergia</th>
                    <th className="p-3">Relatório</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {filteredRuns.map(r => (
                    <tr key={r.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-300">{r.id}</div>
                        <div className="text-[10px] text-slate-500">{r.timestamp}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 border border-slate-800 text-amber-400">
                          {r.difficulty}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-200 font-medium">
                        {r.chosenKing}
                      </td>
                      <td className="p-3">
                        {r.wavesCleared}/{r.maxWaves}
                      </td>
                      <td className="p-3">
                        {r.victory ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            VITÓRIA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            DERROTA
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {r.totalDamageDealt.toLocaleString()}
                      </td>
                      <td className="p-3 text-amber-400">
                        {r.goldEarned}
                      </td>
                      <td className="p-3 text-purple-400">
                        {r.synergyRating}%
                      </td>
                      <td className="p-3 font-sans text-slate-400 text-[11px] max-w-xs truncate">
                        {r.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
