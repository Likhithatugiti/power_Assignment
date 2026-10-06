import React from 'react';
import { CircuitMetrics } from '../../types/rectifier';
import { Gauge, Zap, TrendingUp, CheckCircle } from 'lucide-react';

interface MeasurementsTableProps {
  metrics: CircuitMetrics;
  onLogObservation?: () => void;
}

export const MeasurementsTable: React.FC<MeasurementsTableProps> = ({
  metrics,
  onLogObservation,
}) => {
  // Error percentage between measured & theoretical
  const errorPercent =
    metrics.vDcTheo > 0.1
      ? Math.abs((metrics.vDcAvg - metrics.vDcTheo) / metrics.vDcTheo) * 100
      : 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Digital Multimeter & Power Quality Analyzer
          </span>
        </div>

        {onLogObservation && (
          <button
            onClick={onLogObservation}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Record Observation
          </button>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Vdc */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Average DC Voltage (Vdc)</span>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
              {metrics.vDcAvg.toFixed(2)}
            </span>
            <span className="text-xs text-cyan-500 ml-1">V</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Theory: {metrics.vDcTheo.toFixed(2)} V
          </span>
        </div>

        {/* Vrms */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">RMS Output Voltage (Vrms)</span>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-slate-200 tabular-nums">
              {metrics.vRmsAvg.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1">V</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            FF: {metrics.formFactor.toFixed(3)}
          </span>
        </div>

        {/* Idc */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Average Load Current (Idc)</span>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {metrics.iDcAvg.toFixed(2)}
            </span>
            <span className="text-xs text-emerald-500 ml-1">A</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Irms: {metrics.iRmsAvg.toFixed(2)} A
          </span>
        </div>

        {/* Ripple Factor */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Ripple Factor (γ)</span>
          <div className="my-1">
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                metrics.rippleFactor < 0.1
                  ? 'text-emerald-400'
                  : metrics.rippleFactor < 0.5
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.rippleFactor.toFixed(3)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            V_pp: {metrics.rippleVoltagePp.toFixed(1)} V
          </span>
        </div>
      </div>

      {/* Detailed Electrical Metrics Table */}
      <div className="bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden text-xs">
        <table className="w-full text-left font-mono">
          <tbody className="divide-y divide-slate-800/60">
            <tr className="hover:bg-slate-900/50">
              <td className="px-3 py-2 text-slate-400 font-sans">Rectification Efficiency (η)</td>
              <td className="px-3 py-2 text-right text-cyan-300 font-bold tabular-nums">
                {metrics.efficiency.toFixed(1)} %
              </td>
              <td className="px-3 py-2 text-slate-400 font-sans border-l border-slate-800/60">
                Peak Inverse Voltage (PIV)
              </td>
              <td className="px-3 py-2 text-right text-purple-300 font-bold tabular-nums">
                {metrics.piv.toFixed(1)} V
              </td>
            </tr>

            <tr className="hover:bg-slate-900/50">
              <td className="px-3 py-2 text-slate-400 font-sans">Ripple Frequency</td>
              <td className="px-3 py-2 text-right text-amber-300 font-bold tabular-nums">
                {metrics.rippleFrequency} Hz
              </td>
              <td className="px-3 py-2 text-slate-400 font-sans border-l border-slate-800/60">
                Total Harmonic Distortion (THD)
              </td>
              <td className="px-3 py-2 text-right text-rose-300 font-bold tabular-nums">
                {metrics.thd.toFixed(1)} %
              </td>
            </tr>

            <tr className="hover:bg-slate-900/50">
              <td className="px-3 py-2 text-slate-400 font-sans">Active DC Output Power (Pdc)</td>
              <td className="px-3 py-2 text-right text-emerald-300 font-bold tabular-nums">
                {metrics.pDc.toFixed(1)} W
              </td>
              <td className="px-3 py-2 text-slate-400 font-sans border-l border-slate-800/60">
                Total RMS Power (Pac)
              </td>
              <td className="px-3 py-2 text-right text-slate-300 font-bold tabular-nums">
                {metrics.pAc.toFixed(1)} W
              </td>
            </tr>

            <tr className="hover:bg-slate-900/50">
              <td className="px-3 py-2 text-slate-400 font-sans">Theoretical DC Error</td>
              <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                {errorPercent < 5 ? (
                  <span className="text-emerald-400">±{errorPercent.toFixed(1)}% (Matched)</span>
                ) : (
                  <span className="text-amber-400">{errorPercent.toFixed(1)}% (Drop/Filter)</span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-400 font-sans border-l border-slate-800/60">
                Crest Factor (CF)
              </td>
              <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                {metrics.crestFactor.toFixed(3)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
