/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Play, FileCode, ExternalLink } from 'lucide-react';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'cli'>('cli');

  if (!isOpen) return null;

  const cliSnippet = `# 1. Executar simulação de 25 partidas no nível Hard Master e exportar CSVs:
python3 export_to_sheets.py --simular 25 --dificuldade hard_master --exportar-csv

# 2. Exportar diretamente para o Google Sheets via API com seu Access Token:
python3 export_to_sheets.py --token "SEU_GOOGLE_ACCESS_TOKEN" --simular 50 --dificuldade dificil

# 3. Ver todas as opções do comando:
python3 export_to_sheets.py --help`;

  const scriptPreview = `#!/usr/bin/env python3
"""
9 Kings - Script de Automação de Exportação para o Google Sheets
Desenvolvido para automatizar a extração completa do jogo 9 Kings (Sad Socket / Hooded Horse)
diretamente para o Google Drive e Google Sheets.
"""
import sys, os, json, csv, argparse, random, urllib.request

# Suporta:
# - 4 Níveis: Fácil, Médio, Difícil e Hard Master
# - 9 Reis, Habilidades Reais, Decks e Sinergias
# - 17+ Cartas e Unidades
# - Simulador de Batalhas em Lote ('muitas vezes')
# - Envio direto ao Google Sheets via API v4 REST (standard library sem pip!)
`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-serif">
                Automação em Python: export_to_sheets.py
              </h3>
              <p className="text-xs text-slate-400">
                Script independente em Python 3 para automação no Google Sheets & Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cli')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'cli'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Comandos Rápidos no Terminal
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'script'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Estrutura do Código Python
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'cli' ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group font-mono text-xs">
                <button
                  onClick={() => handleCopy(cliSnippet)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 text-[11px] font-sans transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Comandos'}
                </button>
                <pre className="text-amber-200 whitespace-pre-wrap">{cliSnippet}</pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <h5 className="font-bold text-amber-400 mb-1">Zero Dependências Externas</h5>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    O script roda em qualquer máquina com Python 3 instalado, sem necessidade de `pip install`. Utiliza `urllib.request` e `json` nativos.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <h5 className="font-bold text-amber-400 mb-1">Simulações &quot;Muitas Vezes&quot;</h5>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Você pode rodar centenas de partidas em lote nos 4 níveis de dificuldade e gerar telemetria de vitórias, dano e balanceamento.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs max-h-96 overflow-y-auto">
                <pre className="text-slate-300 whitespace-pre-wrap">{scriptPreview}</pre>
                <div className="text-slate-500 mt-2">
                  [O arquivo completo export_to_sheets.py com 350+ linhas está pronto na raiz do projeto]
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Arquivo localizado em: <code className="text-amber-300">/export_to_sheets.py</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
