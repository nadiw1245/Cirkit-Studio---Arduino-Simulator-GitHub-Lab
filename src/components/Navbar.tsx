import React, { useState } from 'react';
import { BoardType } from '../types';
import { 
  Play, 
  Square, 
  Trash2, 
  Star, 
  Github, 
  Share2, 
  Layers, 
  Cpu, 
  FileCode, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeBoard: BoardType;
  onBoardChange: (board: BoardType) => void;
  viewMode: 'circuit' | 'schematic';
  onViewModeChange: (mode: 'circuit' | 'schematic') => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onClearCanvas: () => void;
  onOpenGitHubModal: () => void;
  onShareProject: () => void;
  gitHubStars: number;
  hasStarred: boolean;
  onStarRepo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeBoard,
  onBoardChange,
  viewMode,
  onViewModeChange,
  isSimulating,
  onToggleSimulation,
  onClearCanvas,
  onOpenGitHubModal,
  onShareProject,
  gitHubStars,
  hasStarred,
  onStarRepo
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareClick = () => {
    onShareProject();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <header className="h-14 bg-[#090e15]/90 backdrop-blur-md border-b border-[#1e2c40] flex items-center justify-between px-4 z-40 select-none">
      {/* Brand Group */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-white font-['Space_Grotesk'] text-base">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00878F] to-[#00b4d8] flex items-center justify-center font-black text-white text-sm shadow-[0_0_18px_rgba(0,135,143,0.5)]">
            Q
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white tracking-wider text-sm font-black flex items-center gap-1.5">
              CIRKIT STUDIO
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                EDU PRO
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              {activeBoard === 'uno_q' ? 'ARDUINO·UNO·Q' : 'ARDUINO·VENTUNO·Q'}
            </span>
          </div>
        </div>

        {/* Board Spec Chip */}
        <div className="hidden lg:flex items-center gap-2 bg-[#00878F]/10 border border-[#00878F]/30 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#38bdf8]">
          <Cpu className="w-3 h-3 text-[#38bdf8]" />
          <span>
            {activeBoard === 'uno_q' 
              ? 'QUALCOMM® QRB2210 + STM32U585' 
              : 'QUALCOMM® DRAGONWING™ QCS8275 + STM32H5'}
          </span>
        </div>
      </div>

      {/* Middle Controls: Board Switcher & View Switcher */}
      <div className="flex items-center gap-3">
        {/* Board Switcher */}
        <div className="flex bg-[#05080c] p-1 rounded-lg border border-[#1e2c40]">
          <button
            onClick={() => onBoardChange('uno_q')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeBoard === 'uno_q'
                ? 'bg-[#15202f] text-white shadow-sm font-bold text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UNO Q
          </button>
          <button
            onClick={() => onBoardChange('ventuno_q')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeBoard === 'ventuno_q'
                ? 'bg-[#15202f] text-white shadow-sm font-bold text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VENTUNO Q
          </button>
        </div>

        {/* Circuit vs Schematic */}
        <div className="hidden sm:flex bg-[#05080c] p-1 rounded-lg border border-[#1e2c40]">
          <button
            onClick={() => onViewModeChange('circuit')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'circuit'
                ? 'bg-[#15202f] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            Circuit
          </button>
          <button
            onClick={() => onViewModeChange('schematic')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'schematic'
                ? 'bg-[#15202f] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3 h-3 text-amber-400" />
            Schematic
          </button>
        </div>
      </div>

      {/* Right Controls: Sim, Clear, GitHub Star Booster */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* GitHub Stargazer Hub Button */}
        <button
          onClick={onOpenGitHubModal}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-800/60 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          title="GitHub Repo Star Hub & README Generator"
        >
          <Github className="w-3.5 h-3.5 text-purple-300" />
          <span className="hidden md:inline">GitHub Hub</span>
          <span className="flex items-center gap-1 bg-purple-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-mono">
            <Star className={`w-2.5 h-2.5 ${hasStarred ? 'fill-amber-400 text-amber-400' : 'text-amber-300'}`} />
            {gitHubStars}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShareClick}
          className="h-9 px-2.5 flex items-center gap-1.5 bg-[#15202f] hover:bg-[#1f2f45] border border-[#1e2c40] text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
          title="Share Project Snapshot Link"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xl:inline">{copiedShare ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Clear Canvas */}
        <button
          onClick={onClearCanvas}
          className="w-9 h-9 flex items-center justify-center bg-[#15202f] hover:bg-[#1f2f45] border border-[#1e2c40] text-slate-400 hover:text-rose-300 rounded-lg transition-colors"
          title="Clear Wires and Components"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Simulation Toggle Button */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg font-['Space_Grotesk'] text-xs sm:text-sm font-bold transition-all ${
            isSimulating
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_18px_rgba(225,29,72,0.45)] animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-[0_0_18px_rgba(16,185,129,0.45)] hover:scale-[1.02]'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Sim</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-emerald-950" />
              <span>Start Sim</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
