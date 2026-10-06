import React, { useRef, useEffect, useState, useMemo } from 'react';
import { WaveformPoint, CircuitMetrics, HarmonicItem } from '../../types/rectifier';
import { HarmonicSpectrum } from './HarmonicSpectrum';
import { Activity, BarChart2, Maximize2, RefreshCw } from 'lucide-react';

interface OscilloscopeProps {
  points: WaveformPoint[];
  metrics: CircuitMetrics;
  harmonics: HarmonicItem[];
  currentIndex: number;
  onScrubAngle: (index: number) => void;
  isThreePhase: boolean;
  isThyristor: boolean;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  points,
  metrics,
  harmonics,
  currentIndex,
  onScrubAngle,
  isThreePhase,
  isThyristor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tab switch: DSO Waveform vs FFT Harmonics
  const [activeTab, setActiveTab] = useState<'dso' | 'fft'>('dso');

  // Channel toggles
  const [showVo, setShowVo] = useState<boolean>(true);
  const [showVs, setShowVs] = useState<boolean>(true);
  const [showIo, setShowIo] = useState<boolean>(true);
  const [showVswitch, setShowVswitch] = useState<boolean>(false);
  const [showGate, setShowGate] = useState<boolean>(isThyristor);
  const [showVdcLine, setShowVdcLine] = useState<boolean>(true);

  // Scale settings
  const [voltScaleMultiplier, setVoltScaleMultiplier] = useState<number>(1);
  const [currScaleMultiplier, setCurrScaleMultiplier] = useState<number>(1);

  // Interactive mouse cursor
  const [hoverPoint, setHoverPoint] = useState<{
    x: number;
    y: number;
    point: WaveformPoint;
  } | null>(null);

  // Auto-calculated scales
  const maxAbsVolt = useMemo(() => {
    let maxV = 100;
    points.forEach((p) => {
      maxV = Math.max(maxV, Math.abs(p.vOutput), Math.abs(p.vSourceA), Math.abs(p.vSwitch));
    });
    return Math.ceil((maxV * 1.25) / 50) * 50;
  }, [points]);

  const maxAbsCurr = useMemo(() => {
    let maxI = 2;
    points.forEach((p) => {
      maxI = Math.max(maxI, Math.abs(p.iOutput));
    });
    return Math.ceil(maxI * 1.3 * 10) / 10;
  }, [points]);

  // Canvas drawing loop
  useEffect(() => {
    if (activeTab !== 'dso') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background - Lab oscilloscope phosphor dark slate
    ctx.fillStyle = '#080E1A';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padX = 40;
    const padY = 24;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const centerY = padY + plotH / 2;

    // Grid Divisions: 10 horizontal, 8 vertical
    const divX = 10;
    const divY = 8;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;

    for (let i = 0; i <= divX; i++) {
      const x = padX + (plotW / divX) * i;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + plotH);
      ctx.stroke();

      // Tick marks on center horizontal axis
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(x, centerY - 4);
      ctx.lineTo(x, centerY + 4);
      ctx.stroke();
      ctx.strokeStyle = '#1E293B';
    }

    for (let j = 0; j <= divY; j++) {
      const y = padY + (plotH / divY) * j;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + plotW, y);
      ctx.stroke();

      // Tick marks on center vertical axis
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(padX + plotW / 2 - 4, y);
      ctx.lineTo(padX + plotW / 2 + 4, y);
      ctx.stroke();
      ctx.strokeStyle = '#1E293B';
    }

    // Zero Voltage Axis (Center Line)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, centerY);
    ctx.lineTo(padX + plotW, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis Labels (Degree markers: 0°, 180°, 360°, 540°, 720°)
    ctx.fillStyle = '#64748B';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const angleMarks = [0, 90, 180, 270, 360, 450, 540, 630, 720];
    angleMarks.forEach((deg) => {
      const x = padX + (plotW / 720) * deg;
      ctx.fillText(`${deg}°`, x, height - 8);
    });

    // Voltage scale on left
    ctx.textAlign = 'right';
    const voltDivVal = (maxAbsVolt * voltScaleMultiplier) / 4;
    ctx.fillText(`+${(voltDivVal * 4).toFixed(0)}V`, padX - 6, padY + 10);
    ctx.fillText(`+${(voltDivVal * 2).toFixed(0)}V`, padX - 6, centerY - plotH / 4 + 4);
    ctx.fillText('0V', padX - 6, centerY + 4);
    ctx.fillText(`-${(voltDivVal * 2).toFixed(0)}V`, padX - 6, centerY + plotH / 4 + 4);
    ctx.fillText(`-${(voltDivVal * 4).toFixed(0)}V`, padX - 6, padY + plotH - 2);

    if (points.length === 0) {
      ctx.restore();
      return;
    }

    // Mapping helper functions
    const voltToY = (v: number) => {
      const norm = v / (maxAbsVolt * voltScaleMultiplier);
      return centerY - norm * (plotH / 2);
    };

    const currToY = (i: number) => {
      const norm = i / (maxAbsCurr * currScaleMultiplier);
      return centerY - norm * (plotH / 2);
    };

    const ptToX = (ptIndex: number) => {
      return padX + (ptIndex / (points.length - 1)) * plotW;
    };

    // 1. Draw Three-Phase Input Voltages (VsA, VsB, VsC) if enabled
    if (showVs) {
      // Phase A (Amber)
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = ptToX(idx);
        const y = voltToY(p.vSourceA);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // If 3-phase, also draw Phase B and Phase C
      if (isThreePhase && points[0]?.vSourceB !== undefined) {
        // Phase B (Yellow)
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        points.forEach((p, idx) => {
          const x = ptToX(idx);
          const y = voltToY(p.vSourceB || 0);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Phase C (Blue)
        ctx.strokeStyle = '#38BDF8';
        ctx.beginPath();
        points.forEach((p, idx) => {
          const x = ptToX(idx);
          const y = voltToY(p.vSourceC || 0);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 2. Draw Switch Voltage (Purple)
    if (showVswitch) {
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = ptToX(idx);
        const y = voltToY(p.vSwitch);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 3. Draw Gate Trigger Pulses (Orange step)
    if (showGate && isThyristor) {
      ctx.strokeStyle = '#FB923C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = ptToX(idx);
        const y = centerY - (p.gatePulse * 0.35 * plotH);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 4. Draw Load Current Io (Emerald)
    if (showIo) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = ptToX(idx);
        const y = currToY(p.iOutput);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 5. Draw Output Rectified Voltage Vo (Cyan with phosphor glow)
    if (showVo) {
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = ptToX(idx);
        const y = voltToY(p.vOutput);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 6. Draw Vdc Average Horizontal Level
    if (showVdcLine && metrics.vDcAvg > 0) {
      const yVdc = voltToY(metrics.vDcAvg);
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, yVdc);
      ctx.lineTo(padX + plotW, yVdc);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22D3EE';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Vdc = ${metrics.vDcAvg.toFixed(1)}V`, padX + plotW - 6, yVdc - 4);
    }

    // 7. Time / Phase Cursor Needle (Active simulation point)
    if (currentIndex >= 0 && currentIndex < points.length) {
      const cursorX = ptToX(currentIndex);
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cursorX, padY);
      ctx.lineTo(cursorX, padY + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlight active dots on current point
      const curPt = points[currentIndex];
      if (showVo) {
        ctx.fillStyle = '#06B6D4';
        ctx.beginPath();
        ctx.arc(cursorX, voltToY(curPt.vOutput), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (showIo) {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(cursorX, currToY(curPt.iOutput), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Hover Crosshair Inspection
    if (hoverPoint) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverPoint.x, padY);
      ctx.lineTo(hoverPoint.x, padY + plotH);
      ctx.moveTo(padX, hoverPoint.y);
      ctx.lineTo(padX + plotW, hoverPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    activeTab,
    points,
    metrics,
    currentIndex,
    showVo,
    showVs,
    showIo,
    showVswitch,
    showGate,
    showVdcLine,
    voltScaleMultiplier,
    currScaleMultiplier,
    hoverPoint,
    maxAbsVolt,
    maxAbsCurr,
    isThreePhase,
    isThyristor,
  ]);

  // Mouse move handler for inspection / scrubbing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padX = 40;
    const plotW = canvas.clientWidth - padX * 2;
    if (x >= padX && x <= padX + plotW) {
      const ratio = (x - padX) / plotW;
      const index = Math.round(ratio * (points.length - 1));
      const pt = points[index];
      if (pt) {
        setHoverPoint({ x, y, point: pt });
        // If clicking / dragging, scrub angle
        if (e.buttons === 1) {
          onScrubAngle(index);
        }
      }
    } else {
      setHoverPoint(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padX = 40;
    const plotW = canvas.clientWidth - padX * 2;
    if (x >= padX && x <= padX + plotW) {
      const ratio = (x - padX) / plotW;
      const index = Math.round(ratio * (points.length - 1));
      onScrubAngle(index);
    }
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-inner"
    >
      {/* Oscilloscope Header Control Deck */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('dso')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'dso'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Oscilloscope (DSO)
            </button>
            <button
              onClick={() => setActiveTab('fft')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'fft'
                  ? 'bg-slate-800 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              Harmonics (FFT)
            </button>
          </div>

          <span className="text-slate-600 text-xs">|</span>

          {/* Interactive Channel Trace Toggles */}
          {activeTab === 'dso' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowVo(!showVo)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 border ${
                  showVo
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                CH1: Vo
              </button>

              <button
                onClick={() => setShowVs(!showVs)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 border ${
                  showVs
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                CH2: Vs
              </button>

              <button
                onClick={() => setShowIo(!showIo)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 border ${
                  showIo
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                CH3: Io
              </button>

              <button
                onClick={() => setShowVswitch(!showVswitch)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 border ${
                  showVswitch
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                CH4: V_sw
              </button>

              {isThyristor && (
                <button
                  onClick={() => setShowGate(!showGate)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 border ${
                    showGate
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  CH5: Gate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scale Multiplier Controls */}
        {activeTab === 'dso' && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>V-Scale:</span>
              <button
                onClick={() =>
                  setVoltScaleMultiplier((prev) => (prev === 0.5 ? 1 : prev === 1 ? 2 : 0.5))
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px]"
              >
                {voltScaleMultiplier}x
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span>I-Scale:</span>
              <button
                onClick={() =>
                  setCurrScaleMultiplier((prev) => (prev === 0.5 ? 1 : prev === 1 ? 2 : 0.5))
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px]"
              >
                {currScaleMultiplier}x
              </button>
            </div>

            <button
              onClick={() => setShowVdcLine(!showVdcLine)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                showVdcLine
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Vdc Ref
            </button>
          </div>
        )}
      </div>

      {/* Main Display Canvas */}
      <div className="relative w-full h-[360px] bg-slate-950">
        {activeTab === 'dso' ? (
          <>
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full cursor-crosshair"
            />

            {/* Instantaneous Reading Tooltip overlay */}
            {hoverPoint && (
              <div
                style={{
                  left: Math.min(hoverPoint.x + 12, canvasRef.current ? canvasRef.current.clientWidth - 220 : 0),
                  top: Math.max(12, hoverPoint.y - 70),
                }}
                className="absolute pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-[11px] font-mono shadow-xl backdrop-blur-sm z-20 space-y-1 text-slate-200"
              >
                <div className="text-slate-400 font-semibold border-b border-slate-800 pb-1 flex justify-between gap-4">
                  <span>θ = {hoverPoint.point.angleDeg.toFixed(1)}°</span>
                  <span>t = {(hoverPoint.point.time * 1000).toFixed(2)} ms</span>
                </div>
                <div className="flex justify-between gap-4 text-cyan-400">
                  <span>Vo (Load):</span>
                  <span>{hoverPoint.point.vOutput.toFixed(1)} V</span>
                </div>
                <div className="flex justify-between gap-4 text-amber-400">
                  <span>Vs (Source):</span>
                  <span>{hoverPoint.point.vSourceA.toFixed(1)} V</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-400">
                  <span>Io (Current):</span>
                  <span>{hoverPoint.point.iOutput.toFixed(2)} A</span>
                </div>
                {showVswitch && (
                  <div className="flex justify-between gap-4 text-purple-400">
                    <span>V_switch:</span>
                    <span>{hoverPoint.point.vSwitch.toFixed(1)} V</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <HarmonicSpectrum
            harmonics={harmonics}
            rippleFrequency={metrics.rippleFrequency}
          />
        )}
      </div>

      {/* Scope Footer Status Readout */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/70 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Current θ:{' '}
            <strong className="text-cyan-400 tabular-nums">
              {points[currentIndex]?.angleDeg.toFixed(1) || '0.0'}°
            </strong>
          </span>
          <span>·</span>
          <span>
            Instantaneous Vo:{' '}
            <strong className="text-cyan-400 tabular-nums">
              {points[currentIndex]?.vOutput.toFixed(1) || '0.0'} V
            </strong>
          </span>
          <span>·</span>
          <span>
            Instantaneous Io:{' '}
            <strong className="text-emerald-400 tabular-nums">
              {points[currentIndex]?.iOutput.toFixed(2) || '0.00'} A
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span>Drag or click canvas to scrub phase angle</span>
        </div>
      </div>
    </div>
  );
};
