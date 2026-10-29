/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { getAccessToken, googleSignIn } from '../services/auth';
import { exportGameDataToGoogleSheets, ExportProgress, ExportResult } from '../services/sheetsExport';
import { downloadWorkbookFile } from '../services/excelExport';
import { STEAM_GAME_INFO, NINE_KINGS, GAME_CARDS, DIFFICULTY_CONFIGS } from '../data/gameData';
import { SimulationRun } from '../types/game';
import { X, CheckCircle2, AlertCircle, ExternalLink, Download, FileSpreadsheet, Loader2, Sparkles } from 'lucide-react';

interface SheetsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserLoggedIn: (user: User, token: string) => void;
  simulationRuns: SimulationRun[];
}

export const SheetsExportModal: React.FC<SheetsExportModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserLoggedIn,
  simulationRuns,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setResult(null);

    try {
      let token = await getAccessToken();

      // If token not in memory, trigger Google Sign In popup
      if (!token) {
        setProgress({ step: 'Autenticando com o Google Drive...', percent: 5 });
        const authResult = await googleSignIn();
        if (authResult) {
          token = authResult.accessToken;
          onUserLoggedIn(authResult.user, authResult.accessToken);
        } else {
          throw new Error('Autenticação com o Google não foi concluída.');
        }
      }

      const res = await exportGameDataToGoogleSheets(
        token,
        STEAM_GAME_INFO,
        NINE_KINGS,
        GAME_CARDS,
        DIFFICULTY_CONFIGS,
        simulationRuns,
        p => setProgress(p)
      );

      setResult(res);
    } catch (err: unknown) {
      console.error('Falha na exportação:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao exportar para o Google Sheets.';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCsvZip = () => {
    // Generate combined CSV text
    const csvContent = [
      'sep=,',
      'TABELA: RESUMO DO JOGO 9 KINGS',
      `Titulo,${STEAM_GAME_INFO.title}`,
      `Desenvolvedor,${STEAM_GAME_INFO.developer}`,
      `Distribuidora,${STEAM_GAME_INFO.publisher}`,
      `Avaliacoes PT-BR,${STEAM_GAME_INFO.reviewsSummary.ptBrStatus} (${STEAM_GAME_INFO.reviewsSummary.ptBrCount})`,
      `Lancamento 1.0,${STEAM_GAME_INFO.earlyAccessExitDate}`,
      '',
      'TABELA: DIFICULDADES',
      'Codigo,Nome,Ondas,Mult HP,Mult Dano,Ouro Inicial',
      ...Object.values(DIFFICULTY_CONFIGS).map(
        d => `${d.id},${d.name},${d.waveCount},${d.enemyHealthMultiplier},${d.enemyDamageMultiplier},${d.startingGold}`
      ),
      '',
      'TABELA: REGISTRO DE PARTIDAS E SIMULACOES',
      'ID,Data,Dificuldade,Rei,Adversario,Ondas,Resultado,Dano,Ouro,Sinergia',
      ...simulationRuns.map(
        r => `${r.id},${r.timestamp},${r.difficulty},${r.chosenKing},${r.opponentKing},${r.wavesCleared}/${r.maxWaves},${r.victory ? 'VITORIA' : 'DERROTA'},${r.totalDamageDealt},${r.goldEarned},${r.synergyRating}%`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `9kings_dados_completos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-serif">
                Exportar para Google Sheets no Google Drive
              </h3>
              <p className="text-xs text-slate-400">
                Gera planilha oficial com 6 abas completas do jogo 9 Kings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Confirmation Description Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Estrutura da Planilha a ser Criada no seu Google Drive:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">1. Resumo do Jogo (Steam)</strong>
                  Sad Socket, Hooded Horse, Avaliações PT-BR, requisitos e versão 1.0.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">2. Os 9 Reis & Facções</strong>
                  Habilidades reais, passivas, fraquezas e arquétipos dos 9 monarcas.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">3. Cartas & Unidades</strong>
                  {GAME_CARDS.length} cartas com HP, dano, velocidade, custo e sinergias.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">4. Dificuldades & Balanço</strong>
                  Fácil, Médio, Difícil e Hard Master com multiplicadores de inimigos.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">5. Registro de Partidas</strong>
                  {simulationRuns.length} partidas simuladas com dano, ondas e resultado.
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">6. Combos & Sinergias</strong>
                  Guias táticos de sinergia entre reinos rivais e bosses de cerco.
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
            <span className="text-slate-400">Conta Google vinculada:</span>
            <span className="font-medium text-slate-200">
              {user ? user.email : 'Será solicitada autorização ao clicar no botão'}
            </span>
          </div>

          {/* Progress Bar */}
          {isExporting && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  {progress.step}
                </span>
                <span className="font-mono text-emerald-400 font-bold">{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message & Direct Drive Link */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Planilha criada com sucesso no seu Google Drive!
              </div>
              <p className="text-xs text-slate-300">
                Título: <strong>{result.title}</strong>
                <br />
                Todas as 6 abas foram formatadas e preenchidas com dados e métricas de balanceamento.
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href={result.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Planilha no Google Sheets
                </a>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Falha na exportação:</strong>
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadWorkbookFile(STEAM_GAME_INFO, NINE_KINGS, GAME_CARDS, DIFFICULTY_CONFIGS, simulationRuns)}
              className="px-3.5 py-2 text-xs font-bold text-amber-300 hover:text-slate-950 bg-amber-500/10 hover:bg-amber-400 border border-amber-500/40 rounded-xl flex items-center gap-1.5 transition shadow"
              title="Baixar Planilha Multi-abas oficial em formato Excel (.xlsx) que abre nativamente no Google Drive"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Baixar Planilha (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadCsvZip}
              className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition"
              title="Baixar cópia local em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exportando para o Drive...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Confirmar e Exportar para Google Drive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
