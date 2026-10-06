import React from 'react';
import { CircuitParameters, WaveformPoint } from '../../types/rectifier';

interface SchematicViewerProps {
  params: CircuitParameters;
  currentPoint: WaveformPoint | null;
  activeProbe: string;
  onSelectProbe: (probe: string) => void;
  isPlaying: boolean;
}

export const SchematicViewer: React.FC<SchematicViewerProps> = ({
  params,
  currentPoint,
  activeProbe,
  onSelectProbe,
  isPlaying,
}) => {
  const { topology, loadType, freewheelingDiode, firingAngle } = params;
  const activeSwitches = currentPoint?.activeSwitches || [];
  const isGated = currentPoint?.gatePulse === 1;

  const isSwitchActive = (id: string) => activeSwitches.includes(id);

  // Common wire colors
  const wireColor = '#64748B'; // slate-500
  const activeColor = '#06B6D4'; // cyan-500
  const gateActiveColor = '#F59E0B'; // amber-500

  return (
    <div className="relative w-full h-[380px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-inner">
      {/* Schematic Top Bar / Metadata */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
            Circuit Schematic & Real-Time Conduction Flow
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-xs text-cyan-400 font-mono">
            {activeSwitches.length > 0
              ? `Conducting: ${activeSwitches.join(' + ')}`
              : 'All Switches Off'}
          </span>
        </div>

        {/* Probes Quick Switch */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Probes:</span>
          <button
            onClick={() => onSelectProbe('vOutput')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeProbe === 'vOutput'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            V_load (Vo)
          </button>
          <button
            onClick={() => onSelectProbe('vSourceA')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeProbe === 'vSourceA'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            V_source (Vs)
          </button>
          <button
            onClick={() => onSelectProbe('iOutput')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeProbe === 'iOutput'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            I_load (Io)
          </button>
          <button
            onClick={() => onSelectProbe('vSwitch')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeProbe === 'vSwitch'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            V_switch (PIV)
          </button>
        </div>
      </div>

      {/* Main SVG Schematic Canvas */}
      <div className="relative flex-1 w-full h-full p-2">
        <svg
          viewBox="0 0 800 320"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Animated Flow Patterns */}
            <linearGradient id="flowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid Background Lines for Schematics */}
          <g opacity="0.07" stroke="#38BDF8" strokeWidth="0.5">
            {Array.from({ length: 40 }).map((_, i) => (
              <line key={`vg-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="320" />
            ))}
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`hg-${i}`} x1="0" y1={i * 20} x2="800" y2={i * 20} />
            ))}
          </g>

          {/* Render Specific Topology Schematics */}
          {topology.startsWith('1p_half') && (
            <SinglePhaseHalfWave
              isThyristor={topology === '1p_half_thyristor'}
              isSwitchActive={isSwitchActive('D1') || isSwitchActive('T1')}
              isGated={isGated}
              loadType={loadType}
              freewheelingDiode={freewheelingDiode}
              isFdActive={isSwitchActive('FD')}
              isPlaying={isPlaying}
            />
          )}

          {topology === '1p_full_center_tap' && (
            <SinglePhaseCenterTap
              isD1Active={isSwitchActive('D1')}
              isD2Active={isSwitchActive('D2')}
              loadType={loadType}
              freewheelingDiode={freewheelingDiode}
              isPlaying={isPlaying}
            />
          )}

          {(topology === '1p_full_bridge_diode' ||
            topology === '1p_full_bridge_thyristor' ||
            topology === '1p_semi_converter') && (
            <SinglePhaseBridge
              topology={topology}
              isSwitchActive={isSwitchActive}
              isGated={isGated}
              loadType={loadType}
              freewheelingDiode={freewheelingDiode}
              isPlaying={isPlaying}
            />
          )}

          {topology.startsWith('3p_half') && (
            <ThreePhaseHalfWave
              isThyristor={topology === '3p_half_thyristor'}
              isSwitchActive={isSwitchActive}
              isGated={isGated}
              loadType={loadType}
              freewheelingDiode={freewheelingDiode}
              isPlaying={isPlaying}
            />
          )}

          {(topology === '3p_full_bridge_diode' ||
            topology === '3p_full_bridge_thyristor' ||
            topology === '3p_semi_converter') && (
            <ThreePhaseBridge
              topology={topology}
              isSwitchActive={isSwitchActive}
              isGated={isGated}
              loadType={loadType}
              freewheelingDiode={freewheelingDiode}
              isPlaying={isPlaying}
            />
          )}
        </svg>
      </div>

      {/* Schematic Footer Legend & Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></span>
            <span>Conduction Path (Current Active)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            <span>Reverse Biased / Off</span>
          </div>
          {topology.includes('thyristor') && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
              <span>Gate Trigger (α = {firingAngle}°)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Click on circuit components to inspect voltage/current</span>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 1. Single-Phase Half-Wave Schematic
 * -----------------------------------------------------------*/
const SinglePhaseHalfWave: React.FC<{
  isThyristor: boolean;
  isSwitchActive: boolean;
  isGated: boolean;
  loadType: string;
  freewheelingDiode: boolean;
  isFdActive: boolean;
  isPlaying: boolean;
}> = ({
  isThyristor,
  isSwitchActive,
  isGated,
  loadType,
  freewheelingDiode,
  isFdActive,
  isPlaying,
}) => {
  return (
    <g>
      {/* AC Source */}
      <ACSourceSymbol x={100} y={160} label="Vs (AC)" />

      {/* Wires */}
      {/* Top wire from source to switch */}
      <Wire
        x1={100}
        y1={130}
        x2={280}
        y2={130}
        active={isSwitchActive}
        flowing={isPlaying && isSwitchActive}
      />
      {/* Switch component at (320, 130) */}
      {isThyristor ? (
        <ThyristorSymbol
          x={320}
          y={130}
          label="T1"
          active={isSwitchActive}
          gated={isGated}
        />
      ) : (
        <DiodeSymbol x={320} y={130} label="D1" active={isSwitchActive} />
      )}

      {/* Wire from switch to Load */}
      <Wire
        x1={360}
        y1={130}
        x2={560}
        y2={130}
        active={isSwitchActive}
        flowing={isPlaying && isSwitchActive}
      />

      {/* Freewheeling Diode Branch if enabled */}
      {(freewheelingDiode || loadType === 'RL_FD') && (
        <g>
          <Wire
            x1={460}
            y1={130}
            x2={460}
            y2={160}
            active={isFdActive}
            flowing={isPlaying && isFdActive}
          />
          {/* Diode pointing UP for freewheeling */}
          <DiodeSymbol
            x={460}
            y={175}
            label="FD"
            active={isFdActive}
            direction="up"
          />
          <Wire
            x1={460}
            y1={200}
            x2={460}
            y2={250}
            active={isFdActive}
            flowing={isPlaying && isFdActive}
          />
          <text
            x={475}
            y={180}
            fill={isFdActive ? '#38bdf8' : '#64748b'}
            fontSize="10"
            fontFamily="monospace"
          >
            Freewheel
          </text>
        </g>
      )}

      {/* Load Block */}
      <LoadComponent x={560} y={130} loadType={loadType} active={isSwitchActive || isFdActive} />

      {/* Bottom return wire */}
      <Wire
        x1={560}
        y1={250}
        x2={100}
        y2={250}
        active={isSwitchActive}
        flowing={isPlaying && isSwitchActive}
        reverse
      />
      <Wire
        x1={100}
        y1={250}
        x2={100}
        y2={190}
        active={isSwitchActive}
        flowing={isPlaying && isSwitchActive}
        reverse
      />

      {/* Ammeter in series */}
      <circle cx={420} cy={130} r={12} fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
      <text x={420} y={134} textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="bold">
        A
      </text>

      {/* Voltmeter across load */}
      <VoltmeterSymbol x={650} y={190} label="Vo (DC)" />
      <Wire x1={560} y1={130} x2={650} y2={130} active={isSwitchActive} />
      <Wire x1={650} y1={130} x2={650} y2={175} active={isSwitchActive} />
      <Wire x1={560} y1={250} x2={650} y2={250} active={isSwitchActive} />
      <Wire x1={650} y1={250} x2={650} y2={205} active={isSwitchActive} />
    </g>
  );
};

/* -------------------------------------------------------------
 * 2. Single-Phase Full-Wave Center-Tapped Schematic
 * -----------------------------------------------------------*/
const SinglePhaseCenterTap: React.FC<{
  isD1Active: boolean;
  isD2Active: boolean;
  loadType: string;
  freewheelingDiode: boolean;
  isPlaying: boolean;
}> = ({ isD1Active, isD2Active, loadType, isPlaying }) => {
  return (
    <g>
      {/* Center Tapped Transformer */}
      <TransformerSymbol x={120} y={160} centerTap />

      {/* Top diode D1 path */}
      <Wire
        x1={180}
        y1={100}
        x2={280}
        y2={100}
        active={isD1Active}
        flowing={isPlaying && isD1Active}
      />
      <DiodeSymbol x={310} y={100} label="D1" active={isD1Active} />
      <Wire
        x1={340}
        y1={100}
        x2={460}
        y2={100}
        active={isD1Active}
        flowing={isPlaying && isD1Active}
      />
      <Wire
        x1={460}
        y1={100}
        x2={460}
        y2={150}
        active={isD1Active}
        flowing={isPlaying && isD1Active}
      />

      {/* Bottom diode D2 path */}
      <Wire
        x1={180}
        y1={240}
        x2={280}
        y2={240}
        active={isD2Active}
        flowing={isPlaying && isD2Active}
      />
      <DiodeSymbol x={310} y={240} label="D2" active={isD2Active} />
      <Wire
        x1={340}
        y1={240}
        x2={460}
        y2={240}
        active={isD2Active}
        flowing={isPlaying && isD2Active}
      />
      <Wire
        x1={460}
        y1={240}
        x2={460}
        y2={190}
        active={isD2Active}
        flowing={isPlaying && isD2Active}
      />

      {/* Joint point to load */}
      <Wire
        x1={460}
        y1={170}
        x2={560}
        y2={170}
        active={isD1Active || isD2Active}
        flowing={isPlaying && (isD1Active || isD2Active)}
      />

      {/* Center Tap Return */}
      <Wire
        x1={180}
        y1={170}
        x2={220}
        y2={170}
        active={isD1Active || isD2Active}
      />
      <Wire
        x1={220}
        y1={170}
        x2={220}
        y2={280}
        active={isD1Active || isD2Active}
      />
      <Wire
        x1={220}
        y1={280}
        x2={600}
        y2={280}
        active={isD1Active || isD2Active}
      />
      <Wire
        x1={600}
        y1={280}
        x2={600}
        y2={240}
        active={isD1Active || isD2Active}
      />

      {/* Load Block */}
      <LoadComponent
        x={600}
        y={170}
        loadType={loadType}
        active={isD1Active || isD2Active}
      />
      <VoltmeterSymbol x={680} y={200} label="Vo (DC)" />
    </g>
  );
};

/* -------------------------------------------------------------
 * 3. Single-Phase Bridge Schematic (Diode, Thyristor, Semi)
 * -----------------------------------------------------------*/
const SinglePhaseBridge: React.FC<{
  topology: string;
  isSwitchActive: (id: string) => boolean;
  isGated: boolean;
  loadType: string;
  freewheelingDiode: boolean;
  isPlaying: boolean;
}> = ({ topology, isSwitchActive, isGated, loadType, freewheelingDiode, isPlaying }) => {
  const isThyristorBridge = topology === '1p_full_bridge_thyristor';
  const isSemiConverter = topology === '1p_semi_converter';

  const s1Active = isSwitchActive('D1') || isSwitchActive('T1');
  const s2Active = isSwitchActive('D2') || isSwitchActive('T2');
  const s3Active = isSwitchActive('D3') || isSwitchActive('T3');
  const s4Active = isSwitchActive('D4') || isSwitchActive('T4');

  const anyActive = s1Active || s2Active || s3Active || s4Active;

  return (
    <g>
      {/* AC Source */}
      <ACSourceSymbol x={80} y={160} label="Vs (AC)" />

      {/* AC lines feeding into Bridge */}
      <Wire
        x1={80}
        y1={130}
        x2={180}
        y2={130}
        active={s1Active && s2Active}
        flowing={isPlaying && s1Active && s2Active}
      />
      <Wire
        x1={180}
        y1={130}
        x2={240}
        y2={160}
        active={s1Active && s2Active}
      />

      <Wire
        x1={80}
        y1={190}
        x2={180}
        y2={190}
        active={s3Active && s4Active}
        flowing={isPlaying && s3Active && s4Active}
        reverse
      />
      <Wire
        x1={180}
        y1={190}
        x2={360}
        y2={160}
        active={s3Active && s4Active}
      />

      {/* Bridge Diamond or H-bridge Layout */}
      {/* Top Rail DC+ */}
      <Wire
        x1={240}
        y1={70}
        x2={480}
        y2={70}
        active={anyActive}
        flowing={isPlaying && anyActive}
      />
      {/* Bottom Rail DC- */}
      <Wire
        x1={240}
        y1={250}
        x2={480}
        y2={250}
        active={anyActive}
        flowing={isPlaying && anyActive}
        reverse
      />

      {/* Left Branch: T1/D1 (top) and T4/D4 (bottom) */}
      <Wire x1={240} y1={70} x2={240} y2={100} active={s1Active} />
      {isThyristorBridge || isSemiConverter ? (
        <ThyristorSymbol
          x={240}
          y={115}
          label="T1"
          direction="down"
          active={s1Active}
          gated={isGated}
        />
      ) : (
        <DiodeSymbol
          x={240}
          y={115}
          label="D1"
          direction="down"
          active={s1Active}
        />
      )}
      <Wire x1={240} y1={130} x2={240} y2={160} active={s1Active} />

      {/* D4 / T4 */}
      <Wire x1={240} y1={160} x2={240} y2={190} active={s4Active} />
      {isThyristorBridge ? (
        <ThyristorSymbol
          x={240}
          y={205}
          label="T4"
          direction="down"
          active={s4Active}
          gated={isGated}
        />
      ) : (
        <DiodeSymbol
          x={240}
          y={205}
          label="D4"
          direction="down"
          active={s4Active}
        />
      )}
      <Wire x1={240} y1={220} x2={240} y2={250} active={s4Active} />

      {/* Right Branch: T3/D3 (top) and T2/D2 (bottom) */}
      <Wire x1={360} y1={70} x2={360} y2={100} active={s3Active} />
      {isThyristorBridge ? (
        <ThyristorSymbol
          x={360}
          y={115}
          label="T3"
          direction="down"
          active={s3Active}
          gated={isGated}
        />
      ) : (
        <DiodeSymbol
          x={360}
          y={115}
          label="D3"
          direction="down"
          active={s3Active}
        />
      )}
      <Wire x1={360} y1={130} x2={360} y2={160} active={s3Active} />

      {/* D2 / T2 */}
      <Wire x1={360} y1={160} x2={360} y2={190} active={s2Active} />
      {isThyristorBridge || isSemiConverter ? (
        <ThyristorSymbol
          x={360}
          y={205}
          label={isSemiConverter ? 'D2' : 'T2'}
          direction="down"
          active={s2Active}
          gated={isGated && !isSemiConverter}
        />
      ) : (
        <DiodeSymbol
          x={360}
          y={205}
          label="D2"
          direction="down"
          active={s2Active}
        />
      )}
      <Wire x1={360} y1={220} x2={360} y2={250} active={s2Active} />

      {/* Load Connection */}
      <Wire
        x1={480}
        y1={70}
        x2={560}
        y2={70}
        active={anyActive}
        flowing={isPlaying && anyActive}
      />
      <LoadComponent x={560} y={70} loadType={loadType} active={anyActive} />
      <Wire
        x1={560}
        y1={250}
        x2={480}
        y2={250}
        active={anyActive}
        flowing={isPlaying && anyActive}
        reverse
      />

      {/* Voltmeter */}
      <VoltmeterSymbol x={660} y={160} label="Vo (DC)" />
      <Wire x1={560} y1={70} x2={660} y2={70} active={anyActive} />
      <Wire x1={660} y1={70} x2={660} y2={145} active={anyActive} />
      <Wire x1={560} y1={250} x2={660} y2={250} active={anyActive} />
      <Wire x1={660} y1={250} x2={660} y2={175} active={anyActive} />
    </g>
  );
};

/* -------------------------------------------------------------
 * 4. Three-Phase Half-Wave Schematic
 * -----------------------------------------------------------*/
const ThreePhaseHalfWave: React.FC<{
  isThyristor: boolean;
  isSwitchActive: (id: string) => boolean;
  isGated: boolean;
  loadType: string;
  freewheelingDiode: boolean;
  isPlaying: boolean;
}> = ({ isThyristor, isSwitchActive, isGated, loadType, isPlaying }) => {
  const s1 = isSwitchActive('D1') || isSwitchActive('T1');
  const s2 = isSwitchActive('D2') || isSwitchActive('T2');
  const s3 = isSwitchActive('D3') || isSwitchActive('T3');
  const anyActive = s1 || s2 || s3;

  return (
    <g>
      {/* 3-Phase AC Source (Star connected) */}
      <g transform="translate(80, 160)">
        <circle cx={0} cy={-50} r={16} fill="#0F172A" stroke="#EF4444" strokeWidth="1.5" />
        <text x={0} y={-46} textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="bold">
          Va
        </text>

        <circle cx={0} cy={0} r={16} fill="#0F172A" stroke="#EAB308" strokeWidth="1.5" />
        <text x={0} y={4} textAnchor="middle" fill="#EAB308" fontSize="11" fontWeight="bold">
          Vb
        </text>

        <circle cx={0} cy={50} r={16} fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
        <text x={0} y={54} textAnchor="middle" fill="#3B82F6" fontSize="11" fontWeight="bold">
          Vc
        </text>

        {/* Star Neutral */}
        <line x1={-16} y1={-50} x2={-30} y2={0} stroke="#64748B" strokeWidth="1.5" />
        <line x1={-16} y1={0} x2={-30} y2={0} stroke="#64748B" strokeWidth="1.5" />
        <line x1={-16} y1={50} x2={-30} y2={0} stroke="#64748B" strokeWidth="1.5" />
        <circle cx={-30} cy={0} r={3} fill="#64748B" />
        <text x={-45} y={4} fill="#94A3B8" fontSize="10">
          N
        </text>
      </g>

      {/* Phase A Line */}
      <Wire x1={96} y1={110} x2={260} y2={110} active={s1} flowing={isPlaying && s1} />
      {isThyristor ? (
        <ThyristorSymbol x={280} y={110} label="T1" active={s1} gated={isGated && s1} />
      ) : (
        <DiodeSymbol x={280} y={110} label="D1" active={s1} />
      )}
      <Wire x1={310} y1={110} x2={420} y2={110} active={s1} />

      {/* Phase B Line */}
      <Wire x1={96} y1={160} x2={260} y2={160} active={s2} flowing={isPlaying && s2} />
      {isThyristor ? (
        <ThyristorSymbol x={280} y={160} label="T2" active={s2} gated={isGated && s2} />
      ) : (
        <DiodeSymbol x={280} y={160} label="D2" active={s2} />
      )}
      <Wire x1={310} y1={160} x2={420} y2={160} active={s2} />

      {/* Phase C Line */}
      <Wire x1={96} y1={210} x2={260} y2={210} active={s3} flowing={isPlaying && s3} />
      {isThyristor ? (
        <ThyristorSymbol x={280} y={210} label="T3" active={s3} gated={isGated && s3} />
      ) : (
        <DiodeSymbol x={280} y={210} label="D3" active={s3} />
      )}
      <Wire x1={310} y1={210} x2={420} y2={210} active={s3} />

      {/* Common DC Bus */}
      <Wire x1={420} y1={110} x2={420} y2={210} active={anyActive} />
      <Wire x1={420} y1={160} x2={520} y2={160} active={anyActive} flowing={isPlaying && anyActive} />

      {/* Load Component */}
      <LoadComponent x={520} y={160} loadType={loadType} active={anyActive} />

      {/* Neutral Return Path to Load */}
      <Wire x1={50} y1={160} x2={50} y2={270} active={anyActive} />
      <Wire x1={50} y1={270} x2={520} y2={270} active={anyActive} reverse />
      <Wire x1={520} y1={270} x2={520} y2={240} active={anyActive} reverse />

      {/* Voltmeter */}
      <VoltmeterSymbol x={620} y={200} label="Vo (DC)" />
    </g>
  );
};

/* -------------------------------------------------------------
 * 5. Three-Phase Full-Wave Bridge (6 Switches)
 * -----------------------------------------------------------*/
const ThreePhaseBridge: React.FC<{
  topology: string;
  isSwitchActive: (id: string) => boolean;
  isGated: boolean;
  loadType: string;
  freewheelingDiode: boolean;
  isPlaying: boolean;
}> = ({ topology, isSwitchActive, isGated, loadType, isPlaying }) => {
  const isThyristor = topology === '3p_full_bridge_thyristor';
  const isSemi = topology === '3p_semi_converter';

  // 6 switches: T1..T6 or D1..D6
  const s1 = isSwitchActive('D1') || isSwitchActive('T1');
  const s2 = isSwitchActive('D2') || isSwitchActive('T2');
  const s3 = isSwitchActive('D3') || isSwitchActive('T3');
  const s4 = isSwitchActive('D4') || isSwitchActive('T4');
  const s5 = isSwitchActive('D5') || isSwitchActive('T5');
  const s6 = isSwitchActive('D6') || isSwitchActive('T6');

  const anyActive = s1 || s2 || s3 || s4 || s5 || s6;

  return (
    <g>
      {/* 3-Phase Sources Va, Vb, Vc */}
      <g transform="translate(60, 160)">
        <circle cx={0} cy={-50} r={14} fill="#0F172A" stroke="#EF4444" strokeWidth="1.5" />
        <text x={0} y={-46} textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="bold">
          Va
        </text>

        <circle cx={0} cy={0} r={14} fill="#0F172A" stroke="#EAB308" strokeWidth="1.5" />
        <text x={0} y={4} textAnchor="middle" fill="#EAB308" fontSize="10" fontWeight="bold">
          Vb
        </text>

        <circle cx={0} cy={50} r={14} fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
        <text x={0} y={54} textAnchor="middle" fill="#3B82F6" fontSize="10" fontWeight="bold">
          Vc
        </text>
      </g>

      {/* DC+ Bus & DC- Bus */}
      <Wire x1={180} y1={50} x2={460} y2={50} active={anyActive} flowing={isPlaying && anyActive} />
      <Wire x1={180} y1={260} x2={460} y2={260} active={anyActive} flowing={isPlaying && anyActive} reverse />

      {/* Leg 1: Phase A -> Top D1/T1, Bottom D4/T4 */}
      <Wire x1={74} y1={110} x2={200} y2={110} active={s1 || s4} />
      <Wire x1={200} y1={110} x2={200} y2={160} active={s1 || s4} />
      {/* Top 1 */}
      <Wire x1={200} y1={50} x2={200} y2={70} active={s1} />
      {isThyristor || isSemi ? (
        <ThyristorSymbol x={200} y={85} label="T1" direction="down" active={s1} gated={isGated && s1} />
      ) : (
        <DiodeSymbol x={200} y={85} label="D1" direction="down" active={s1} />
      )}
      <Wire x1={200} y1={100} x2={200} y2={160} active={s1} />
      {/* Bot 4 */}
      <Wire x1={200} y1={160} x2={200} y2={200} active={s4} />
      {isThyristor ? (
        <ThyristorSymbol x={200} y={215} label="T4" direction="down" active={s4} gated={isGated && s4} />
      ) : (
        <DiodeSymbol x={200} y={215} label="D4" direction="down" active={s4} />
      )}
      <Wire x1={200} y1={230} x2={200} y2={260} active={s4} />

      {/* Leg 2: Phase B -> Top D3/T3, Bottom D6/T6 */}
      <Wire x1={74} y1={160} x2={300} y2={160} active={s3 || s6} />
      {/* Top 3 */}
      <Wire x1={300} y1={50} x2={300} y2={70} active={s3} />
      {isThyristor || isSemi ? (
        <ThyristorSymbol x={300} y={85} label="T3" direction="down" active={s3} gated={isGated && s3} />
      ) : (
        <DiodeSymbol x={300} y={85} label="D3" direction="down" active={s3} />
      )}
      <Wire x1={300} y1={100} x2={300} y2={160} active={s3} />
      {/* Bot 6 */}
      <Wire x1={300} y1={160} x2={300} y2={200} active={s6} />
      {isThyristor ? (
        <ThyristorSymbol x={300} y={215} label="T6" direction="down" active={s6} gated={isGated && s6} />
      ) : (
        <DiodeSymbol x={300} y={215} label="D6" direction="down" active={s6} />
      )}
      <Wire x1={300} y1={230} x2={300} y2={260} active={s6} />

      {/* Leg 3: Phase C -> Top D5/T5, Bottom D2/T2 */}
      <Wire x1={74} y1={210} x2={400} y2={210} active={s5 || s2} />
      <Wire x1={400} y1={210} x2={400} y2={160} active={s5 || s2} />
      {/* Top 5 */}
      <Wire x1={400} y1={50} x2={400} y2={70} active={s5} />
      {isThyristor || isSemi ? (
        <ThyristorSymbol x={400} y={85} label="T5" direction="down" active={s5} gated={isGated && s5} />
      ) : (
        <DiodeSymbol x={400} y={85} label="D5" direction="down" active={s5} />
      )}
      <Wire x1={400} y1={100} x2={400} y2={160} active={s5} />
      {/* Bot 2 */}
      <Wire x1={400} y1={160} x2={400} y2={200} active={s2} />
      {isThyristor ? (
        <ThyristorSymbol x={400} y={215} label="T2" direction="down" active={s2} gated={isGated && s2} />
      ) : (
        <DiodeSymbol x={400} y={215} label="D2" direction="down" active={s2} />
      )}
      <Wire x1={400} y1={230} x2={400} y2={260} active={s2} />

      {/* Load Connection */}
      <Wire x1={460} y1={50} x2={540} y2={50} active={anyActive} flowing={isPlaying && anyActive} />
      <LoadComponent x={540} y={50} loadType={loadType} active={anyActive} />
      <Wire x1={540} y1={260} x2={460} y2={260} active={anyActive} flowing={isPlaying && anyActive} reverse />

      {/* Voltmeter */}
      <VoltmeterSymbol x={650} y={155} label="Vo (6-Pulse)" />
      <Wire x1={540} y1={50} x2={650} y2={50} active={anyActive} />
      <Wire x1={650} y1={50} x2={650} y2={140} active={anyActive} />
      <Wire x1={540} y1={260} x2={650} y2={260} active={anyActive} />
      <Wire x1={650} y1={260} x2={650} y2={170} active={anyActive} />
    </g>
  );
};

/* -------------------------------------------------------------
 * Primitives: Wires, Symbols, Diodes, Thyristors, Loads
 * -----------------------------------------------------------*/
const Wire: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
  flowing?: boolean;
  reverse?: boolean;
}> = ({ x1, y1, x2, y2, active = false, flowing = false, reverse = false }) => {
  return (
    <g>
      {/* Base copper wire */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={active ? '#06B6D4' : '#475569'}
        strokeWidth={active ? 2.5 : 1.5}
        strokeLinecap="round"
      />
      {/* Active current pulse flow animation */}
      {flowing && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#A5F3FC"
          strokeWidth={3}
          strokeDasharray="6 8"
          className={reverse ? 'animate-flow-reverse' : 'animate-flow'}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

const DiodeSymbol: React.FC<{
  x: number;
  y: number;
  label: string;
  direction?: 'right' | 'down' | 'up';
  active?: boolean;
}> = ({ x, y, label, direction = 'right', active = false }) => {
  let rotation = 0;
  if (direction === 'down') rotation = 90;
  if (direction === 'up') rotation = -90;

  const color = active ? '#38BDF8' : '#94A3B8';
  const fillColor = active ? 'rgba(56, 189, 248, 0.25)' : 'none';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g transform={`rotate(${rotation})`}>
        {/* Anode to Cathode Triangle */}
        <polygon
          points="-12,-9 10,0 -12,9"
          fill={fillColor}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Cathode Bar */}
        <line x1={10} y1={-10} x2={10} y2={10} stroke={color} strokeWidth="2.5" />
      </g>
      <text
        x={direction === 'down' ? 14 : 0}
        y={direction === 'down' ? 4 : -14}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {label}
      </text>
      {active && (
        <circle
          cx={0}
          cy={0}
          r={16}
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />
      )}
    </g>
  );
};

const ThyristorSymbol: React.FC<{
  x: number;
  y: number;
  label: string;
  direction?: 'right' | 'down';
  active?: boolean;
  gated?: boolean;
}> = ({ x, y, label, direction = 'right', active = false, gated = false }) => {
  const rotation = direction === 'down' ? 90 : 0;
  const color = active ? '#38BDF8' : '#94A3B8';
  const gateColor = gated ? '#F59E0B' : '#64748B';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g transform={`rotate(${rotation})`}>
        {/* Triangle */}
        <polygon
          points="-12,-9 10,0 -12,9"
          fill={active ? 'rgba(56, 189, 248, 0.25)' : 'none'}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Cathode Bar */}
        <line x1={10} y1={-10} x2={10} y2={10} stroke={color} strokeWidth="2.5" />
        {/* Gate Electrode */}
        <line x1={4} y1={-5} x2={-2} y2={-14} stroke={gateColor} strokeWidth="1.5" />
        <line x1={-2} y1={-14} x2={-8} y2={-14} stroke={gateColor} strokeWidth="1.5" />
        <circle cx={-8} cy={-14} r={2} fill={gateColor} />
      </g>
      <text
        x={direction === 'down' ? 16 : 0}
        y={direction === 'down' ? 4 : -16}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {label}
      </text>
      {gated && (
        <text
          x={direction === 'down' ? -22 : -18}
          y={-14}
          fill="#F59E0B"
          fontSize="9"
          fontWeight="bold"
        >
          TRIG!
        </text>
      )}
    </g>
  );
};

const ACSourceSymbol: React.FC<{ x: number; y: number; label: string }> = ({
  x,
  y,
  label,
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx={0} cy={0} r={18} fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
    <path
      d="M -9 0 Q -4.5 -9 0 0 Q 4.5 9 9 0"
      fill="none"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <text
      x={0}
      y={32}
      textAnchor="middle"
      fill="#94A3B8"
      fontSize="11"
      fontWeight="500"
    >
      {label}
    </text>
  </g>
);

const TransformerSymbol: React.FC<{
  x: number;
  y: number;
  centerTap?: boolean;
}> = ({ x, y, centerTap }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Core Bars */}
    <line x1={-5} y1={-60} x2={-5} y2={60} stroke="#64748B" strokeWidth="2" />
    <line x1={5} y1={-60} x2={5} y2={60} stroke="#64748B" strokeWidth="2" />
    {/* Primary Coils */}
    <path
      d="M -25 -50 A 10 10 0 0 1 -25 -30 A 10 10 0 0 1 -25 -10 A 10 10 0 0 1 -25 10 A 10 10 0 0 1 -25 30 A 10 10 0 0 1 -25 50"
      fill="none"
      stroke="#38BDF8"
      strokeWidth="2"
    />
    {/* Secondary Coils */}
    <path
      d="M 25 -50 A 10 10 0 0 0 25 -30 A 10 10 0 0 0 25 -10 A 10 10 0 0 0 25 10 A 10 10 0 0 0 25 30 A 10 10 0 0 0 25 50"
      fill="none"
      stroke="#38BDF8"
      strokeWidth="2"
    />
    {centerTap && (
      <g>
        <circle cx={25} cy={0} r={3} fill="#38BDF8" />
        <text x={40} y={4} fill="#94A3B8" fontSize="10">
          CT (0V)
        </text>
      </g>
    )}
    <text x={-45} y={-55} fill="#64748B" fontSize="10">
      Pri
    </text>
    <text x={35} y={-55} fill="#64748B" fontSize="10">
      Sec
    </text>
  </g>
);

const LoadComponent: React.FC<{
  x: number;
  y: number;
  loadType: string;
  active: boolean;
}> = ({ x, y, loadType, active }) => {
  const strokeColor = active ? '#38BDF8' : '#94A3B8';

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Resistor (always present) */}
      <rect
        x={-14}
        y={20}
        width={28}
        height={60}
        fill="#0F172A"
        stroke={strokeColor}
        strokeWidth="2"
        rx="3"
      />
      <text
        x={0}
        y={54}
        textAnchor="middle"
        fill={strokeColor}
        fontSize="11"
        fontWeight="bold"
      >
        R
      </text>

      {/* Inductor if RL or RLE */}
      {(loadType === 'RL' || loadType === 'RL_FD' || loadType === 'RLE') && (
        <g transform="translate(0, 85)">
          <path
            d="M 0 0 A 7 7 0 0 1 0 14 A 7 7 0 0 1 0 28 A 7 7 0 0 1 0 42"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          <text x={18} y={24} fill={strokeColor} fontSize="11" fontWeight="bold">
            L
          </text>
        </g>
      )}

      {/* Capacitor if RC */}
      {loadType === 'RC' && (
        <g transform="translate(36, 30)">
          <line x1={-20} y1={0} x2={0} y2={0} stroke={strokeColor} strokeWidth="1.5" />
          <line x1={0} y1={-12} x2={0} y2={12} stroke={strokeColor} strokeWidth="2.5" />
          <line x1={8} y1={-12} x2={8} y2={12} stroke={strokeColor} strokeWidth="2.5" />
          <line x1={8} y1={0} x2={20} y2={0} stroke={strokeColor} strokeWidth="1.5" />
          <text x={12} y={-16} fill={strokeColor} fontSize="11" fontWeight="bold">
            C (Filter)
          </text>
        </g>
      )}

      {/* Battery / Back-EMF if RLE */}
      {loadType === 'RLE' && (
        <g transform="translate(0, 140)">
          <line x1={-14} y1={5} x2={14} y2={5} stroke={strokeColor} strokeWidth="2.5" />
          <line x1={-8} y1={15} x2={8} y2={15} stroke={strokeColor} strokeWidth="2.5" />
          <text x={18} y={13} fill={strokeColor} fontSize="11" fontWeight="bold">
            + E -
          </text>
        </g>
      )}

      {/* Label */}
      <text
        x={0}
        y={-10}
        textAnchor="middle"
        fill="#CBD5E1"
        fontSize="11"
        fontWeight="600"
      >
        Load ({loadType})
      </text>
    </g>
  );
};

const VoltmeterSymbol: React.FC<{ x: number; y: number; label: string }> = ({
  x,
  y,
  label,
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx={0} cy={0} r={16} fill="#0F172A" stroke="#A855F7" strokeWidth="2" />
    <text x={0} y={4} textAnchor="middle" fill="#C084FC" fontSize="11" fontWeight="bold">
      V
    </text>
    <text x={24} y={4} fill="#A855F7" fontSize="10" fontWeight="500">
      {label}
    </text>
  </g>
);
