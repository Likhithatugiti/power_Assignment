import React from 'react';
import {
  CircuitParameters,
  PhaseType,
  RectifierTopology,
  LoadType,
} from '../../types/rectifier';
import { Sliders, Zap, Shield, Cpu } from 'lucide-react';

interface ParameterControlsProps {
  params: CircuitParameters;
  onChange: (updated: Partial<CircuitParameters>) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChange,
}) => {
  const {
    phaseType,
    topology,
    loadType,
    vRms,
    frequency,
    firingAngle,
    resistance,
    inductance,
    capacitance,
    backEmf,
    diodeForwardDrop,
    freewheelingDiode,
  } = params;

  const isThyristor = topology.includes('thyristor') || topology.includes('semi');

  // Handle phase change
  const handlePhaseChange = (phase: PhaseType) => {
    if (phase === '1phase') {
      onChange({
        phaseType: '1phase',
        topology: '1p_full_bridge_diode',
        vRms: 230,
      });
    } else {
      onChange({
        phaseType: '3phase',
        topology: '3p_full_bridge_diode',
        vRms: 415,
      });
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-5 shadow-lg">
      {/* 1. Topology & Phase Architecture Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Converter Configuration
          </label>

          {/* Phase Segmented Control */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => handlePhaseChange('1phase')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                phaseType === '1phase'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single-Phase (1Φ)
            </button>
            <button
              onClick={() => handlePhaseChange('3phase')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                phaseType === '3phase'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Three-Phase (3Φ)
            </button>
          </div>
        </div>

        {/* Rectifier Topology Dropdown */}
        <div className="relative">
          <select
            value={topology}
            onChange={(e) =>
              onChange({ topology: e.target.value as RectifierTopology })
            }
            className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500 text-slate-100 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          >
            {phaseType === '1phase' ? (
              <>
                <option value="1p_full_bridge_diode">
                  1Φ Full-Wave Diode Bridge Rectifier (4 Diodes)
                </option>
                <option value="1p_full_bridge_thyristor">
                  1Φ Fully Controlled Thyristor Bridge (4 SCRs)
                </option>
                <option value="1p_semi_converter">
                  1Φ Semi-Converter Bridge (2 SCRs + 2 Diodes)
                </option>
                <option value="1p_full_center_tap">
                  1Φ Full-Wave Center-Tapped Rectifier (2 Diodes)
                </option>
                <option value="1p_half_diode">
                  1Φ Half-Wave Diode Rectifier (Uncontrolled)
                </option>
                <option value="1p_half_thyristor">
                  1Φ Half-Wave Thyristor Rectifier (Controlled)
                </option>
              </>
            ) : (
              <>
                <option value="3p_full_bridge_diode">
                  3Φ Full-Wave Diode Bridge (6-Pulse Graetz)
                </option>
                <option value="3p_full_bridge_thyristor">
                  3Φ Fully Controlled Thyristor Bridge (6 SCRs)
                </option>
                <option value="3p_semi_converter">
                  3Φ Semi-Converter Bridge (3 SCRs + 3 Diodes)
                </option>
                <option value="3p_half_diode">
                  3Φ Half-Wave Diode Rectifier (3-Pulse Star)
                </option>
                <option value="3p_half_thyristor">
                  3Φ Half-Wave Thyristor Rectifier (3-Pulse Controlled)
                </option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 2. Thyristor Firing Angle Control (Visible when controlled converter is active) */}
      {isThyristor && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Firing Angle (Delay Angle α)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                {firingAngle}°
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={firingAngle}
              onChange={(e) => onChange({ firingAngle: Number(e.target.value) })}
              className="w-full accent-amber-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 mr-1">Presets:</span>
            {[0, 30, 45, 60, 90, 120, 150].map((deg) => (
              <button
                key={deg}
                onClick={() => onChange({ firingAngle: deg })}
                className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${
                  firingAngle === deg
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Load Type & Electrical Parameters */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Load Configuration
        </label>

        {/* Load Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {[
            { id: 'R', label: 'Resistive (R)' },
            { id: 'RL', label: 'Inductive (R-L)' },
            { id: 'RL_FD', label: 'R-L + Freewheel' },
            { id: 'RC', label: 'Capacitor Filter' },
            { id: 'RLE', label: 'Battery / EMF (R-L-E)' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => onChange({ loadType: type.id as LoadType })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center transition-all ${
                loadType === type.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Dynamic Parameter Sliders based on load */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Resistance R */}
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Load Resistance (R):</span>
              <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                {resistance} Ω
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="200"
              step="1"
              value={resistance}
              onChange={(e) => onChange({ resistance: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Inductance L (if RL or RLE) */}
          {(loadType === 'RL' || loadType === 'RL_FD' || loadType === 'RLE') && (
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Load Inductance (L):</span>
                <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                  {inductance} mH
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={inductance}
                onChange={(e) => onChange({ inductance: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Capacitance C (if RC filter) */}
          {loadType === 'RC' && (
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Filter Capacitor (C):</span>
                <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                  {capacitance} μF
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="20"
                value={capacitance}
                onChange={(e) => onChange({ capacitance: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Back EMF E (if RLE) */}
          {loadType === 'RLE' && (
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">DC Back-EMF (E):</span>
                <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                  {backEmf} V
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="2"
                value={backEmf}
                onChange={(e) => onChange({ backEmf: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. AC Supply & Diode Model Settings */}
      <div className="border-t border-slate-800/80 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Source RMS */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Input Voltage (RMS):</span>
            <span className="font-mono text-slate-200 font-semibold tabular-nums">
              {vRms} V
            </span>
          </div>
          <input
            type="range"
            min="12"
            max="440"
            step="1"
            value={vRms}
            onChange={(e) => onChange({ vRms: Number(e.target.value) })}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Supply Frequency */}
        <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-400">Line Frequency:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange({ frequency: 50 })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                frequency === 50
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              50 Hz
            </button>
            <button
              onClick={() => onChange({ frequency: 60 })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                frequency === 60
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60 Hz
            </button>
          </div>
        </div>

        {/* Diode Forward Drop Model */}
        <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-400">Diode Model:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange({ diodeForwardDrop: 0 })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                diodeForwardDrop === 0
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ideal (0V)
            </button>
            <button
              onClick={() => onChange({ diodeForwardDrop: 0.7 })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                diodeForwardDrop === 0.7
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Silicon (0.7V)
            </button>
          </div>
        </div>

        {/* Freewheeling Diode Switch */}
        <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-400">Freewheeling Diode:</span>
          <button
            onClick={() => onChange({ freewheelingDiode: !freewheelingDiode })}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
              freewheelingDiode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {freewheelingDiode ? 'Connected (ON)' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
};
