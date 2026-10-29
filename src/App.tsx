/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './services/auth';
import { downloadWorkbookFile } from './services/excelExport';
import { STEAM_GAME_INFO, NINE_KINGS, GAME_CARDS, DIFFICULTY_CONFIGS, INITIAL_SIMULATION_RUNS } from './data/gameData';
import { SimulationRun } from './types/game';
import { Header } from './components/Header';
import { InteractiveGameArena } from './components/InteractiveGameArena';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { SheetsExportModal } from './components/SheetsExportModal';
import { PythonScriptModal } from './components/PythonScriptModal';
import { FileSpreadsheet, Terminal, Info, CheckCircle2, Download, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [simulationRuns, setSimulationRuns] = useState<SimulationRun[]>(INITIAL_SIMULATION_RUNS);
  
  // Modals
  const [isExporterOpen, setIsExporterOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(`Conectado como ${result.user.email}`);
      }
    } catch (err) {
      console.error('Erro ao conectar ao Google:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    showToast('Desconectado do Google.');
  };

  const handleSimulationFinished = (run: SimulationRun) => {
    setSimulationRuns(prev => [run, ...prev]);
    showToast(`Partida registrada: ${run.victory ? 'Vitória' : 'Derrota'} no nível ${run.difficulty}`);
  };

  const handleBatchFinished = (newRuns: SimulationRun[]) => {
    setSimulationRuns(prev => [...newRuns, ...prev]);
    showToast(`${newRuns.length} partidas simuladas com sucesso e registradas na base!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenExporter={() => setIsExporterOpen(true)}
        onOpenPythonScript={() => setIsPythonModalOpen(true)}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        {/* Top Callout Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-blue-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-serif">
                Exportação Automática para Google Sheets no Google Drive
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Todas as 6 bases de dados do jogo 9 Kings (Steam, 9 Reis, Cartas, Balanço nas 4 Dificuldades e Partidas) prontas para envio imediato.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                downloadWorkbookFile(STEAM_GAME_INFO, NINE_KINGS, GAME_CARDS, DIFFICULTY_CONFIGS, simulationRuns);
                showToast('Planilha completa 9 Kings (.xlsx) baixada com sucesso!');
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
              title="Baixar planilha pronta para o Google Drive (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Planilha (.xlsx)</span>
            </button>
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Script Python</span>
            </button>
            <button
              onClick={() => setIsExporterOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sincronizar no Google Drive</span>
            </button>
          </div>
        </div>

        {/* Section 1: Playable Arena & Batch Simulator */}
        <section aria-labelledby="arena-section-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="arena-section-heading" className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Arena Jogável & Simulador em Lote (&quot;Muitas Vezes&quot;)
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Níveis: Fácil · Médio · Difícil · Hard Master
            </span>
          </div>

          <InteractiveGameArena
            onSimulationFinished={handleSimulationFinished}
            onBatchFinished={handleBatchFinished}
            onOpenExporter={() => setIsExporterOpen(true)}
          />
        </section>

        {/* Section 2: Recharts Analytics Dashboard */}
        <section aria-labelledby="analytics-section-heading">
          <AnalyticsDashboard
            simulationRuns={simulationRuns}
            onOpenExporter={() => setIsExporterOpen(true)}
          />
        </section>

        {/* Section 3: Complete Game Database Explorer */}
        <section aria-labelledby="database-section-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="database-section-heading" className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Base de Dados Completa & Dados do Steam
            </h2>
            <span className="text-xs text-slate-400">
              Sad Socket · Hooded Horse · 9 Reis
            </span>
          </div>

          <DatabaseExplorer
            simulationRuns={simulationRuns}
            onOpenExporter={() => setIsExporterOpen(true)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>9 Kings DataForge</strong> · Exportação Oficial para Google Sheets & Google Drive
          </div>
          <div className="flex items-center gap-3">
            <span>Desenvolvido para sad socket / hooded horse game data</span>
            <span>•</span>
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <Terminal className="w-3 h-3" />
              export_to_sheets.py
            </button>
          </div>
        </div>
      </footer>

      {/* Sheets Exporter Modal */}
      <SheetsExportModal
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        user={user}
        onUserLoggedIn={(u, _token) => setUser(u)}
        simulationRuns={simulationRuns}
      />

      {/* Python Script Modal */}
      <PythonScriptModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
