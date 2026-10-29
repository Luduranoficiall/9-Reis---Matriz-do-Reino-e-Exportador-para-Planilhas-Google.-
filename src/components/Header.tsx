/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from 'firebase/auth';
import { Crown, Terminal, LogOut, ExternalLink, CheckCircle2 } from 'lucide-react';
import { STEAM_GAME_INFO } from '../data/gameData';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenExporter: () => void;
  onOpenPythonScript: () => void;
  isLoggingIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  onOpenExporter,
  onOpenPythonScript,
  isLoggingIn,
}) => {
  return (
    <header className="w-full bg-slate-950/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black font-serif tracking-wider text-slate-100">
                9 KINGS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
                DataForge & Sheets
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sad Socket & Hooded Horse · Steam Hub & Google Drive Exporter
            </p>
          </div>
        </div>

        {/* Quick Steam Badges */}
        <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400 border-x border-slate-800/80 px-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Steam PT-BR:</span>
            <span className="text-emerald-400 font-semibold">{STEAM_GAME_INFO.reviewsSummary.ptBrStatus}</span>
          </div>
          <div className="text-slate-600">•</div>
          <div>
            Preço: <span className="text-amber-300 font-bold">R$ {STEAM_GAME_INFO.priceBRL.toFixed(2)}</span>
          </div>
          <div className="text-slate-600">•</div>
          <div>
            Lançamento 1.0: <span className="text-slate-200">{STEAM_GAME_INFO.earlyAccessExitDate}</span>
          </div>
        </div>

        {/* User Auth & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Python Automation Script Button */}
          <button
            onClick={onOpenPythonScript}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
            title="Ver Script de Automação em Python"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Script Python</span>
          </button>

          {/* Google Sign In or Connected State */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Google User'} className="w-full h-full object-cover" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Google Drive Conectado
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                title="Sair da conta Google"
                aria-label="Desconectar do Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-2 shadow transition"
              aria-label="Conectar conta do Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoggingIn ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>
          )}

          {/* Primary Sheets Export CTA */}
          <button
            onClick={onOpenExporter}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Planilha Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
