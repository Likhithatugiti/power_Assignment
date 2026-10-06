import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStep: (delta: number) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  currentIndex: number;
  totalPoints: number;
  onScrub: (index: number) => void;
  currentAngleDeg: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  onStep,
  speed,
  onChangeSpeed,
  currentIndex,
  totalPoints,
  onScrub,
  currentAngleDeg,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
      {/* Play/Pause & Stepping Deck */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Sim</span>
            </>
          )}
        </button>

        <button
          onClick={() => onStep(-10)}
          title="Step back 5 degrees"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onStep(10)}
          title="Step forward 5 degrees"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onReset}
          title="Reset to 0 degrees"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 ml-2 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
          {[0.25, 0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded transition-colors ${
                speed === s
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Angle Scrubber Slider */}
      <div className="flex-1 max-w-xl w-full flex items-center gap-3">
        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
          ωt:
        </span>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalPoints - 1)}
          value={currentIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="w-18 text-right font-mono text-xs text-cyan-300 tabular-nums font-semibold">
          {currentAngleDeg.toFixed(0)}°
        </div>
      </div>
    </div>
  );
};
