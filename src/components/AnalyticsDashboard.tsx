/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SimulationRun, DifficultyLevel } from '../types/game';
import { calculateDifficultyStats, calculateKingStats, calculateGlobalKpis } from '../game/analyticsLogic';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Trophy,
  Swords,
  TrendingUp,
  Percent,
  Flame,
  FileSpreadsheet,
  Layers,
  Award,
  Zap
} from 'lucide-react';

interface AnalyticsDashboardProps {
  simulationRuns: SimulationRun[];
  onOpenExporter: () => void;
}

const KING_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#22c55e', // green
  '#eab308', // yellow
  '#ef4444', // red
  '#d946ef', // fuchsia
  '#78716c', // stone
  '#06b6d4', // cyan
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  simulationRuns,
  onOpenExporter,
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'kings'>('overview');

  const difficultyStats = calculateDifficultyStats(simulationRuns);
  const kingStats = calculateKingStats(simulationRuns);
  const kpis = calculateGlobalKpis(simulationRuns);

  // Custom Dark Tooltip Component
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-6 p-5 lg:p-7">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-100 flex items-center gap-2">
                Painel de Visualização: Histórico de Vitórias e Derrotas
              </h2>
              <p className="text-xs text-slate-400">
                Análise em tempo real do balanceamento por nível de dificuldade via Recharts
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Export Shortcut */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeView === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vitórias vs Derrotas
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeView === 'trends'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curva de Dificuldade
            </button>
            <button
              onClick={() => setActiveView('kings')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeView === 'kings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Monarca
            </button>
          </div>

          <button
            onClick={onOpenExporter}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 shrink-0"
            title="Exportar dados do gráfico para o Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Planilha</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Total Partidas */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total de Partidas</span>
            <Swords className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {kpis.totalRuns}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.totalVitorias}V · {kpis.totalDerrotas}D
          </div>
        </div>

        {/* Taxa Global de Vitória */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Taxa Global Vitória</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {kpis.taxaGlobalVitoria}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Em todas as dificuldades
          </div>
        </div>

        {/* Dano Máximo */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dano Máximo</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {kpis.danoMaximo.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Média: {kpis.danoMedioTotal.toLocaleString()}
          </div>
        </div>

        {/* Sinergia Média */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Sinergia Média</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            {kpis.sinergiaMediaTotal}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Calibração de baralhos
          </div>
        </div>

        {/* Nível Hard Master */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Hard Master Vitórias</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {difficultyStats.find(d => d.id === 'hard_master')?.taxaVitoria || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Nível máximo de desafio
          </div>
        </div>
      </div>

      {/* VIEW 1: MAIN BAR CHART - Vitórias vs Derrotas por Dificuldade */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Vitórias vs Derrotas por Nível de Dificuldade
                </h3>
                <p className="text-xs text-slate-400">
                  Comparação do número de partidas ganhas (verde) e perdidas (vermelho) em Fácil, Médio, Difícil e Hard Master
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-300">Vitórias</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500" />
                  <span className="text-slate-300">Derrotas</span>
                </div>
              </div>
            </div>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyStats} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="tag"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                  />
                  <Bar
                    dataKey="vitorias"
                    name="Vitórias"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  />
                  <Bar
                    dataKey="derrotas"
                    name="Derrotas"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Matrix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {difficultyStats.map(stat => (
              <div
                key={stat.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{stat.tag}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    stat.taxaVitoria >= 50 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {stat.taxaVitoria}% Win Rate
                  </span>
                </div>

                {/* Visual Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${stat.taxaVitoria}%` }}
                    title={`Vitórias: ${stat.vitorias}`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${100 - stat.taxaVitoria}%` }}
                    title={`Derrotas: ${stat.derrotas}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                  <div>Vitórias: <strong className="text-emerald-400">{stat.vitorias}</strong></div>
                  <div>Derrotas: <strong className="text-rose-400">{stat.derrotas}</strong></div>
                  <div>Dano Médio: <strong className="text-slate-200">{stat.danoMedio.toLocaleString()}</strong></div>
                  <div>Ondas Médias: <strong className="text-amber-300">{stat.ondasMedias}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: DIFFICULTY CURVE & SURVIVAL TRENDS */}
      {activeView === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Win Rate Line Curve */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">
              Curva de Taxa de Vitória (%)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Queda esperada da taxa de sobrevivência conforme a dificuldade aumenta
            </p>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={difficultyStats} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="tag" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="taxaVitoria"
                    name="Taxa de Vitória (%)"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Average Damage & Wave Area */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">
              Dano Médio Acumulado por Nível
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Escalonamento de dano necessário para enfrentar o cerco dos reis rivais
            </p>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={difficultyStats} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="damageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="tag" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="danoMedio"
                    name="Dano Médio"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#damageGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: BY KING ARCHETYPE */}
      {activeView === 'kings' && (
        <div className="space-y-6">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">
              Desempenho por Monarca Selecionado
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Vitórias e derrotas com cada um dos 9 Monarcas em todas as simulações
            </p>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kingStats} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} allowDecimals={false} />
                  <YAxis
                    dataKey="kingName"
                    type="category"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    width={130}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="vitorias" name="Vitórias" fill="#10b981" stackId="a" />
                  <Bar dataKey="derrotas" name="Derrotas" fill="#f43f5e" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
