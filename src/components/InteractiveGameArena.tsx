/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DifficultyLevel, KingArchetype, SimulationRun } from '../types/game';
import { DIFFICULTY_CONFIGS, NINE_KINGS } from '../data/gameData';
import { playSound, toggleMute, getMuted } from '../utils/audio';
import { runBatchSimulations } from '../game/combatLogic';
import { Shield, Sparkles, Flame, Volume2, VolumeX, Play, RotateCcw, Swords, Award, AlertTriangle, Layers, ChevronRight } from 'lucide-react';

interface GameArenaProps {
  onSimulationFinished: (run: SimulationRun) => void;
  onBatchFinished: (runs: SimulationRun[]) => void;
  onOpenExporter: () => void;
}

interface BattleUnit {
  id: string;
  isPlayer: boolean;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  color: string;
  cooldownTimer: number;
  range: number;
}

interface VisualEffect {
  id: string;
  x: number;
  y: number;
  text?: string;
  color: string;
  life: number;
  radius?: number;
}

export const InteractiveGameArena: React.FC<GameArenaProps> = ({
  onSimulationFinished,
  onBatchFinished,
  onOpenExporter,
}) => {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'victory' | 'defeat'>('title');
  const [selectedKing, setSelectedKing] = useState<KingArchetype>(NINE_KINGS[0]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medio');
  const [currentWave, setCurrentWave] = useState(1);
  const [playerCapitalHp, setPlayerCapitalHp] = useState(1200);
  const [_enemyCapitalHp, setEnemyCapitalHp] = useState(1200);
  const [gold, setGold] = useState(175);
  const [mana, setMana] = useState(100);
  const [royalAbilityCooldown, setRoyalAbilityCooldown] = useState(0);
  const [muted, setMuted] = useState(getMuted());
  const [screenShake, setScreenShake] = useState(0);
  
  // Batch simulation status
  const [batchCount, setBatchCount] = useState<number>(25);
  const [batchStats, setBatchStats] = useState<{ winRate: number; avgWaves: number; totalRuns: number } | null>(null);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState(false);

  // References for 60fps canvas loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const unitsRef = useRef<BattleUnit[]>([]);
  const effectsRef = useRef<VisualEffect[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const waveTimerRef = useRef<number>(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Safely trigger onSimulationFinished without triggering React state updates during render
  const safeFinishSimulation = useCallback((run: SimulationRun) => {
    queueMicrotask(() => {
      onSimulationFinished(run);
    });
  }, [onSimulationFinished]);

  // Start active game
  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentWave(1);
    setPlayerCapitalHp(1200);
    setEnemyCapitalHp(1200 * diffConfig.enemyHealthMultiplier);
    setGold(diffConfig.startingGold);
    setMana(100);
    setRoyalAbilityCooldown(0);
    unitsRef.current = [];
    effectsRef.current = [];
    playSound('horn');

    // Spawn 2 initial defenders
    unitsRef.current.push({
      id: 'p-init-1',
      isPlayer: true,
      name: 'Guarda da Capital',
      x: 110,
      y: 150,
      hp: 400,
      maxHp: 400,
      attack: 28,
      attackSpeed: 1.0,
      color: selectedKing.themeColor,
      cooldownTimer: 0,
      range: 25,
    });
    unitsRef.current.push({
      id: 'p-init-2',
      isPlayer: true,
      name: 'Arqueiro da Torre',
      x: 90,
      y: 210,
      hp: 250,
      maxHp: 250,
      attack: 34,
      attackSpeed: 1.1,
      color: '#60a5fa',
      cooldownTimer: 0,
      range: 120,
    });
  }, [diffConfig, selectedKing]);

  // Check URL autostart
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        startGame();
      }
    }
  }, [startGame]);

  // Spawn player unit
  const spawnPlayerUnit = useCallback((unitType: 'knight' | 'mage' | 'imp') => {
    let cost = 35;
    let hp = 320;
    let atk = 30;
    let range = 25;
    let color = selectedKing.themeColor;
    let name = 'Guerreiro Real';

    if (unitType === 'knight') {
      cost = 45;
      hp = 480;
      atk = 32;
      range = 25;
      name = 'Cavaleiro de Ferro';
    } else if (unitType === 'mage') {
      cost = 65;
      hp = 220;
      atk = 58;
      range = 140;
      color = '#a855f7';
      name = 'Mago Arcano';
    } else if (unitType === 'imp') {
      cost = 25;
      hp = 160;
      atk = 26;
      range = 20;
      color = '#ec4899';
      name = 'Diabrete Rápido';
    }

    if (gold < cost) return;

    setGold(prev => prev - cost);
    playSound('slash');

    const newUnit: BattleUnit = {
      id: `p-${Date.now()}-${Math.random()}`,
      isPlayer: true,
      name,
      x: 100 + Math.random() * 40,
      y: 120 + Math.random() * 140,
      hp,
      maxHp: hp,
      attack: atk,
      attackSpeed: 1.0,
      color,
      cooldownTimer: 0,
      range,
    };

    unitsRef.current.push(newUnit);
  }, [gold, selectedKing]);

  // Use Royal Ability
  const triggerRoyalAbility = useCallback(() => {
    if (royalAbilityCooldown > 0 || mana < 40) return;
    setMana(m => Math.max(0, m - 40));
    setRoyalAbilityCooldown(selectedKing.royalAbility.cooldown);
    playSound('magic');
    setScreenShake(12);

    unitsRef.current.forEach(u => {
      if (!u.isPlayer) {
        u.hp -= 220;
        effectsRef.current.push({
          id: `eff-${Math.random()}`,
          x: u.x,
          y: u.y,
          text: '-220 COROA!',
          color: '#fbbf24',
          life: 1.0,
        });
      } else {
        u.hp = Math.min(u.maxHp, u.hp + 120);
        effectsRef.current.push({
          id: `eff-${Math.random()}`,
          x: u.x,
          y: u.y,
          text: '+120 CURA',
          color: '#34d399',
          life: 1.0,
        });
      }
    });
  }, [royalAbilityCooldown, mana, selectedKing]);

  // Spawn enemy wave
  const spawnEnemyWave = useCallback((waveNum: number) => {
    const isBoss = diffConfig.bossRounds.includes(waveNum);
    const count = 3 + Math.floor(waveNum * 0.8) + (difficulty === 'hard_master' ? 3 : 0);

    for (let i = 0; i < count; i++) {
      const hp = (220 + waveNum * 35) * diffConfig.enemyHealthMultiplier;
      const atk = (24 + waveNum * 4) * diffConfig.enemyDamageMultiplier;
      unitsRef.current.push({
        id: `e-${waveNum}-${i}-${Math.random()}`,
        isPlayer: false,
        name: isBoss && i === 0 ? '👑 CHEFE RIVAL' : 'Soldado Inimigo',
        x: 680 + Math.random() * 50,
        y: 110 + Math.random() * 160,
        hp: isBoss && i === 0 ? hp * 2.5 : hp,
        maxHp: isBoss && i === 0 ? hp * 2.5 : hp,
        attack: isBoss && i === 0 ? atk * 1.8 : atk,
        attackSpeed: 0.9,
        color: isBoss && i === 0 ? '#ef4444' : '#f97316',
        cooldownTimer: 0,
        range: isBoss && i === 0 ? 40 : 25,
      });
    }
  }, [diffConfig, difficulty]);

  // Main 60fps Game Loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    lastTimeRef.current = performance.now();
    waveTimerRef.current = 0;

    // Spawn first wave
    spawnEnemyWave(1);

    const loop = (time: number) => {
      if (!isRunning) return;

      const rawDt = (time - lastTimeRef.current) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTimeRef.current = time;

      // Passive mana & gold gain
      setMana(m => Math.min(100, m + dt * 5));
      setGold(g => g + Math.floor(dt * 8));
      setRoyalAbilityCooldown(cd => Math.max(0, cd - dt));
      setScreenShake(s => Math.max(0, s - dt * 25));

      // Wave timer
      waveTimerRef.current += dt;
      if (waveTimerRef.current > 18) {
        waveTimerRef.current = 0;
        setCurrentWave(prev => {
          const nextWave = prev + 1;
          if (nextWave > diffConfig.waveCount) {
            setGameState('victory');
            playSound('victory');
            safeFinishSimulation({
              id: `RUN-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              difficulty,
              chosenKing: selectedKing.name,
              opponentKing: 'Rei Rival da Campanha',
              wavesCleared: diffConfig.waveCount,
              maxWaves: diffConfig.waveCount,
              victory: true,
              totalDamageDealt: Math.round(18000 * diffConfig.enemyHealthMultiplier),
              totalDamageTaken: 2400,
              goldEarned: Math.round(950 * diffConfig.rewardsMultiplier),
              cardsPlayed: 28,
              durationSeconds: Math.round(diffConfig.waveCount * 18),
              synergyRating: 95,
              notes: `Vitória ao vivo na arena jogável em ${diffConfig.name}.`,
            });
            return prev;
          }
          playSound('horn');
          spawnEnemyWave(nextWave);
          return nextWave;
        });
      }

      // Update units
      const units = unitsRef.current;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        u.cooldownTimer -= dt;

        let closestDist = Infinity;
        let target: BattleUnit | null = null;

        for (let j = 0; j < units.length; j++) {
          const other = units[j];
          if (other.isPlayer !== u.isPlayer && other.hp > 0) {
            const dx = other.x - u.x;
            const dy = other.y - u.y;
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
              closestDist = dist;
              target = other;
            }
          }
        }

        if (target && closestDist <= u.range) {
          if (u.cooldownTimer <= 0) {
            u.cooldownTimer = 1.0 / u.attackSpeed;
            target.hp -= u.attack;
            playSound(u.isPlayer ? 'slash' : 'magic');

            effectsRef.current.push({
              id: `hit-${Math.random()}`,
              x: target.x,
              y: target.y - 12,
              text: `-${Math.round(u.attack)}`,
              color: u.isPlayer ? '#38bdf8' : '#f87171',
              life: 1.0,
            });
          }
        } else if (target) {
          const dx = target.x - u.x;
          const dy = target.y - u.y;
          const dist = Math.hypot(dx, dy);
          const speed = u.isPlayer ? 55 : 45;
          u.x += (dx / dist) * speed * dt;
          u.y += (dy / dist) * speed * dt;
        } else {
          const targetX = u.isPlayer ? 740 : 60;
          const dx = targetX - u.x;
          u.x += (dx > 0 ? 1 : -1) * 45 * dt;

          if (u.isPlayer && u.x >= 730) {
            setEnemyCapitalHp(hp => Math.max(0, hp - u.attack * 2 * dt));
          } else if (!u.isPlayer && u.x <= 70) {
            setPlayerCapitalHp(hp => {
              const next = hp - u.attack * 2.5 * dt;
              if (next <= 0) {
                setGameState('defeat');
                playSound('defeat');
                safeFinishSimulation({
                  id: `RUN-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  difficulty,
                  chosenKing: selectedKing.name,
                  opponentKing: 'Rei Rival da Campanha',
                  wavesCleared: Math.max(0, currentWave - 1),
                  maxWaves: diffConfig.waveCount,
                  victory: false,
                  totalDamageDealt: Math.round(9200 * diffConfig.enemyHealthMultiplier),
                  totalDamageTaken: 1200,
                  goldEarned: 400,
                  cardsPlayed: 16,
                  durationSeconds: Math.round(currentWave * 18),
                  synergyRating: 78,
                  notes: `Capital destruída na onda ${currentWave} no nível ${diffConfig.name}.`,
                });
                return 0;
              }
              return next;
            });
          }
        }
      }

      // Filter dead units
      unitsRef.current = units.filter(u => u.hp > 0);

      // Render Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 100; y <= 300; y += 50) {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(750, y);
        ctx.stroke();
      }

      // Player Base (Left)
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(15, 80, 50, 240);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(20, 85, 40, 230);
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillText('CAPITAL', 16, 70);

      // Enemy Base (Right)
      ctx.fillStyle = '#831843';
      ctx.fillRect(735, 80, 50, 240);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(740, 85, 40, 230);
      ctx.fillStyle = '#fda4af';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillText('RIVAL', 742, 70);

      // Draw Units
      for (const u of unitsRef.current) {
        ctx.save();
        ctx.fillStyle = u.color;
        ctx.beginPath();
        ctx.arc(u.x, u.y, u.name.includes('CHEFE') ? 14 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const barWidth = 26;
        const barHeight = 4;
        const hpPercent = Math.max(0, u.hp / u.maxHp);
        ctx.fillStyle = '#334155';
        ctx.fillRect(u.x - barWidth / 2, u.y - 16, barWidth, barHeight);
        ctx.fillStyle = u.isPlayer ? '#22c55e' : '#ef4444';
        ctx.fillRect(u.x - barWidth / 2, u.y - 16, barWidth * hpPercent, barHeight);

        ctx.restore();
      }

      // Draw Visual Effects
      for (let e = effectsRef.current.length - 1; e >= 0; e--) {
        const eff = effectsRef.current[e];
        eff.life -= dt * 1.5;
        eff.y -= dt * 25;

        if (eff.text) {
          ctx.save();
          ctx.fillStyle = eff.color;
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.globalAlpha = Math.max(0, eff.life);
          ctx.fillText(eff.text, eff.x - 12, eff.y);
          ctx.restore();
        }

        if (eff.life <= 0) {
          effectsRef.current.splice(e, 1);
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, diffConfig, currentWave, difficulty, selectedKing, spawnEnemyWave, screenShake, safeFinishSimulation]);

  // Execute Batch Simulation ("muitas vezes")
  const handleRunBatch = () => {
    setIsSimulatingBatch(true);
    setTimeout(() => {
      const result = runBatchSimulations(difficulty, batchCount, selectedKing.id);
      setBatchStats({
        winRate: result.winRate,
        avgWaves: result.avgWavesCleared,
        totalRuns: batchCount,
      });
      onBatchFinished(result.runs);
      setIsSimulatingBatch(false);
      playSound('coin');
    }, 300);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Arena Header Bar */}
      <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
              Arena Roguelike 9 Kings
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {diffConfig.tag}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Simulador em tempo real com regras dos 9 Reis e telemetria de balanceamento
            </p>
          </div>
        </div>

        {/* Action buttons & Audio mute toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const m = toggleMute();
              setMuted(m);
            }}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition"
            title={muted ? 'Desmutar áudio' : 'Mutar áudio'}
            aria-label="Controle de áudio da arena"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onOpenExporter}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            Exportar para Google Sheets
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport or Title Screen */}
      <div className="relative w-full h-[400px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {gameState === 'title' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-radial from-slate-900/90 to-slate-950/95 text-center">
            <div className="mb-4 inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium uppercase tracking-widest">
              <span>9 Kings · Sad Socket & Hooded Horse</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black font-serif tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow mb-3">
              BATALHA DOS 9 REIS
            </h1>
            <p className="max-w-md text-sm text-slate-300 mb-6">
              Assuma a coroa de um dos 9 Monarcas, teste seu baralho em 4 níveis de dificuldade e exporte todos os relatórios de combate para a planilha do seu Google Drive.
            </p>

            {/* Quick King Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl">
              {NINE_KINGS.map(king => (
                <button
                  key={king.id}
                  onClick={() => setSelectedKing(king)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border flex items-center gap-1.5 ${
                    selectedKing.id === king.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: king.themeColor }} />
                  {king.name}
                </button>
              ))}
            </div>

            {/* Start CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={startGame}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide rounded-xl shadow-xl shadow-amber-500/20 flex items-center gap-2 transform hover:-translate-y-0.5 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                INICIAR BATALHA NA ARENA
              </button>
            </div>

            <p className="mt-4 text-xs font-mono text-slate-500">
              Espaço / Clique para Iniciar · Suporte aos 4 Níveis de Dificuldade
            </p>
          </div>
        )}

        {/* 60fps Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          className="w-full h-full object-contain"
        />

        {/* In-Game Heads-Up Display (HUD) */}
        {gameState === 'playing' && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            {/* Top Stat Bar */}
            <div className="flex items-center justify-between">
              {/* Player HP */}
              <div className="bg-slate-900/90 border border-blue-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow">
                <Shield className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sua Capital</div>
                  <div className="text-sm font-bold font-mono text-blue-300 tabular-nums">
                    {Math.round(playerCapitalHp)} HP
                  </div>
                </div>
              </div>

              {/* Wave Banner */}
              <div className="bg-slate-900/90 border border-amber-500/30 px-4 py-1.5 rounded-lg text-center shadow">
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Onda {currentWave} / {diffConfig.waveCount}
                </div>
                <div className="text-xs font-medium text-slate-200">
                  {selectedKing.name} vs Invasores
                </div>
              </div>

              {/* Resources */}
              <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-3 shadow">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400">Ouro</div>
                  <div className="text-sm font-bold font-mono text-amber-300 tabular-nums">{gold}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-purple-400">Mana</div>
                  <div className="text-sm font-bold font-mono text-purple-300 tabular-nums">{Math.round(mana)}%</div>
                </div>
              </div>
            </div>

            {/* Bottom Controls / Deploy Cards */}
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => spawnPlayerUnit('knight')}
                disabled={gold < 45}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 border border-blue-500/40 rounded-xl text-xs font-semibold text-blue-200 flex items-center gap-2 transition active:scale-95 shadow"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Cavaleiro de Ferro</span>
                <span className="font-mono text-[10px] text-amber-400">45 Ouro</span>
              </button>

              <button
                onClick={() => spawnPlayerUnit('mage')}
                disabled={gold < 65}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 border border-purple-500/40 rounded-xl text-xs font-semibold text-purple-200 flex items-center gap-2 transition active:scale-95 shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Mago Prismático</span>
                <span className="font-mono text-[10px] text-amber-400">65 Ouro</span>
              </button>

              <button
                onClick={() => spawnPlayerUnit('imp')}
                disabled={gold < 25}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 border border-pink-500/40 rounded-xl text-xs font-semibold text-pink-200 flex items-center gap-2 transition active:scale-95 shadow"
              >
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>Diabrete Rápido</span>
                <span className="font-mono text-[10px] text-amber-400">25 Ouro</span>
              </button>

              {/* Royal Ability Button */}
              <button
                onClick={triggerRoyalAbility}
                disabled={royalAbilityCooldown > 0 || mana < 40}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-500/20"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{selectedKing.royalAbility.name}</span>
                {royalAbilityCooldown > 0 ? (
                  <span className="font-mono text-[10px]">({Math.ceil(royalAbilityCooldown)}s)</span>
                ) : (
                  <span className="font-mono text-[10px]">(40 Mana)</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Victory Modal Overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold font-serif text-emerald-300 mb-2">
              VITÓRIA REAL ALCANÇADA!
            </h2>
            <p className="text-sm text-slate-300 max-w-md mb-6">
              Você defendeu o reino com honra em todas as {diffConfig.waveCount} ondas no nível{' '}
              <strong className="text-amber-300">{diffConfig.tag}</strong>. O registro desta batalha já está pronto para ir à sua planilha.
            </p>
            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Jogar Novamente
              </button>
              <button
                onClick={onOpenExporter}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                Exportar para Google Drive
              </button>
            </div>
          </div>
        )}

        {/* Defeat Modal Overlay */}
        {gameState === 'defeat' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold font-serif text-rose-300 mb-2">
              CAPITAL DESTRUÍDA
            </h2>
            <p className="text-sm text-slate-300 max-w-md mb-6">
              Os exércitos rivais romperam as defesas na onda {currentWave} no nível{' '}
              <strong className="text-amber-300">{diffConfig.tag}</strong>. Ajuste suas sinergias e tente novamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Tentar Novamente
              </button>
              <button
                onClick={onOpenExporter}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                Exportar Histórico
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Arena Dashboard: Difficulty Selector & Batch Simulator ("Muitas vezes") */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: 4 Difficulty Tiers */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Nível de Dificuldade da Simulação:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['facil', 'medio', 'dificil', 'hard_master'] as DifficultyLevel[]).map(lvl => {
              const cfg = DIFFICULTY_CONFIGS[lvl];
              const isSelected = difficulty === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`p-2 rounded-xl text-left border transition ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{cfg.tag}</div>
                  <div className="text-[10px] text-slate-500">{cfg.waveCount} ondas</div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            {diffConfig.description}
          </p>
        </div>

        {/* Right: Batch Testing ("Muitas vezes" - Telemetria de Balanceamento) */}
        <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Simular em Lote (&quot;Muitas Vezes&quot;)
            </span>
            <div className="flex gap-1">
              {[10, 25, 50].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setBatchCount(cnt)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    batchCount === cnt ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cnt}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleRunBatch}
              disabled={isSimulatingBatch}
              className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow"
            >
              {isSimulatingBatch ? (
                <span>Simulando {batchCount} partidas...</span>
              ) : (
                <>
                  <span>Executar {batchCount} Partidas Agora</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {batchStats && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Amostra: <strong className="text-slate-200">{batchStats.totalRuns} partidas</strong>
              </div>
              <div className="text-slate-400">
                Taxa de Vitória: <strong className={batchStats.winRate > 50 ? 'text-emerald-400' : 'text-rose-400'}>{batchStats.winRate}%</strong>
              </div>
              <div className="text-slate-400">
                Média Ondas: <strong className="text-amber-300">{batchStats.avgWaves}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
