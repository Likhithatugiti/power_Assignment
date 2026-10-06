import React from 'react';
import { HarmonicItem } from '../../types/rectifier';

interface HarmonicSpectrumProps {
  harmonics: HarmonicItem[];
  rippleFrequency: number;
}

export const HarmonicSpectrum: React.FC<HarmonicSpectrumProps> = ({
  harmonics,
  rippleFrequency,
}) => {
  const maxMag = Math.max(...harmonics.map((h) => h.magnitude), 1);

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">
            Harmonic Magnitude Spectrum (FFT Analysis)
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-xs text-amber-400 font-mono">
            Lowest AC Ripple Harmonic: {rippleFrequency} Hz
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Normalized to DC Output Magnitude
        </span>
      </div>

      {/* Bar Chart Area */}
      <div className="relative flex-1 w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-end justify-between gap-3 overflow-x-auto">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 opacity-15">
          <div className="border-b border-cyan-400 w-full"></div>
          <div className="border-b border-cyan-400 w-full"></div>
          <div className="border-b border-cyan-400 w-full"></div>
          <div className="border-b border-cyan-400 w-full"></div>
        </div>

        {harmonics.map((item, idx) => {
          const heightPercent = Math.min(100, Math.max(4, (item.magnitude / maxMag) * 100));
          const isDc = item.harmonic === 0;
          const isDominantRipple = item.frequency === rippleFrequency;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group min-w-[42px]"
            >
              {/* Tooltip on hover */}
              <div className="text-[10px] text-slate-400 mb-1 opacity-80 group-hover:opacity-100 font-mono tabular-nums text-center transition-opacity">
                {item.magnitude.toFixed(1)}V
              </div>

              {/* Bar */}
              <div className="w-full max-w-[32px] bg-slate-800 rounded-t overflow-hidden flex items-end h-[75%]">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full transition-all duration-300 rounded-t ${
                    isDc
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : isDominantRipple
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : 'bg-gradient-to-t from-slate-600 to-slate-400'
                  }`}
                />
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <div
                  className={`text-[11px] font-semibold font-mono ${
                    isDc
                      ? 'text-cyan-400'
                      : isDominantRipple
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isDc ? 'DC' : `${item.harmonic}f`}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  {item.frequency}Hz
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
            <span>DC Component (0 Hz)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
            <span>Dominant Ripple Harmonic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-400"></span>
            <span>Higher Order Harmonics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
