import React from 'react';
import { RotateCcw, Download } from 'lucide-react';

interface TopBarProps {
  activeSection: 'lab' | 'experiments' | 'theory';
  onSelectSection: (section: 'lab' | 'experiments' | 'theory') => void;
  onResetToDefaults: () => void;
  onExportSnapshot: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onSelectSection,
  onResetToDefaults,
  onExportSnapshot,
}) => {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between select-none sticky top-0 z-50">
      {/* Zone 1: Brand Title (Single text element wordmark) */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectSection('lab');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors"
        >
          RectifierLab
        </a>
      </div>

      {/* Zone 2: 4-6 Clean Text Navigation Links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
        <button
          onClick={() => onSelectSection('lab')}
          className={`hover:text-cyan-400 transition-colors ${
            activeSection === 'lab' ? 'text-cyan-400 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Virtual Simulator
        </button>
        <button
          onClick={() => onSelectSection('experiments')}
          className={`hover:text-cyan-400 transition-colors ${
            activeSection === 'experiments' ? 'text-cyan-400 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Lab Experiments
        </button>
        <button
          onClick={() => onSelectSection('theory')}
          className={`hover:text-cyan-400 transition-colors ${
            activeSection === 'theory' ? 'text-cyan-400 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Theory & Derivations
        </button>
      </nav>

      {/* Zone 3: 1-2 Primary Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onResetToDefaults}
          title="Reset Circuit Parameters to Standard Defaults"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Lab</span>
        </button>
        <button
          onClick={onExportSnapshot}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Data</span>
        </button>
      </div>
    </header>
  );
};
