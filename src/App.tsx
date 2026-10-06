/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CircuitParameters,
  ObservationRecord,
  RectifierTopology,
} from './types/rectifier';
import { simulateRectifier } from './utils/simulation';
import { TopBar } from './components/Navigation/TopBar';
import { SchematicViewer } from './components/Schematics/SchematicViewer';
import { Oscilloscope } from './components/Oscilloscope/Oscilloscope';
import { PlaybackControls } from './components/Controls/PlaybackControls';
import { ParameterControls } from './components/Controls/ParameterControls';
import { MeasurementsTable } from './components/Metrics/MeasurementsTable';
import { VirtualLabExperiments } from './components/Experiments/VirtualLabExperiments';
import { TheorySection } from './components/Theory/TheorySection';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const DEFAULT_PARAMS: CircuitParameters = {
  phaseType: '1phase',
  topology: '1p_full_bridge_diode',
  loadType: 'R',
  vRms: 230,
  frequency: 50,
  firingAngle: 45,
  resistance: 50,
  inductance: 50,
  capacitance: 220,
  backEmf: 24,
  diodeForwardDrop: 0.7,
  freewheelingDiode: false,
};

export default function App() {
  const [params, setParams] = useState<CircuitParameters>(DEFAULT_PARAMS);
  const [activeSection, setActiveSection] = useState<'lab' | 'experiments' | 'theory'>('lab');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeProbe, setActiveProbe] = useState<string>('vOutput');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Observations list for Virtual Lab reporting
  const [observations, setObservations] = useState<ObservationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('rectifier_lab_observations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save observations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rectifier_lab_observations', JSON.stringify(observations));
    } catch {
      // storage unavailable
    }
  }, [observations]);

  // Compute simulation points, metrics, and harmonics in real time
  const { points, metrics, harmonics } = useMemo(() => {
    return simulateRectifier(params);
  }, [params]);

  // Animation Loop for real-time running simulation
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;

    const animate = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPlaying && points.length > 0) {
        // Frequency-scaled speed: advance proportional to frequency and speed
        const pointsPerSecond = points.length * (params.frequency / 2) * playbackSpeed * 0.15;
        const advance = pointsPerSecond * dt;
        setCurrentIndex((prev) => (prev + advance) % points.length);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, points.length, params.frequency, playbackSpeed]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStep = (deltaPoints: number) => {
    setIsPlaying(false);
    setCurrentIndex((prev) => {
      const next = Math.round(prev + deltaPoints);
      return (next + points.length) % points.length;
    });
  };

  const handleResetAngle = () => {
    setCurrentIndex(0);
  };

  const handleScrub = (idx: number) => {
    setIsPlaying(false);
    setCurrentIndex(idx);
  };

  const handleParamsChange = (updated: Partial<CircuitParameters>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleResetDefaults = () => {
    setParams(DEFAULT_PARAMS);
    setCurrentIndex(0);
    showToast('Circuit reset to default parameters');
  };

  // Record an observation row into the virtual lab table
  const handleLogObservation = () => {
    const topologyNames: Record<RectifierTopology, string> = {
      '1p_half_diode': '1Φ Half-Wave Diode',
      '1p_half_thyristor': '1Φ Half-Wave Thyristor',
      '1p_full_center_tap': '1Φ Full-Wave Center-Tap',
      '1p_full_bridge_diode': '1Φ Full-Wave Diode Bridge',
      '1p_full_bridge_thyristor': '1Φ Controlled Bridge (SCR)',
      '1p_semi_converter': '1Φ Semi-Converter',
      '3p_half_diode': '3Φ Half-Wave Diode (3-Pulse)',
      '3p_half_thyristor': '3Φ Half-Wave Thyristor (3-Pulse)',
      '3p_full_bridge_diode': '3Φ Diode Bridge (6-Pulse)',
      '3p_full_bridge_thyristor': '3Φ Controlled Bridge (6-Pulse)',
      '3p_semi_converter': '3Φ Semi-Converter (6-Pulse)',
    };

    const newRecord: ObservationRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      topologyName: topologyNames[params.topology] || params.topology,
      loadType: params.loadType,
      firingAngle: params.firingAngle,
      vRms: params.vRms,
      vDcMeasured: metrics.vDcAvg,
      vDcTheoretical: metrics.vDcTheo,
      iDc: metrics.iDcAvg,
      rippleFactor: metrics.rippleFactor,
      rippleVoltagePp: metrics.rippleVoltagePp,
      capacitance: params.capacitance,
    };

    setObservations((prev) => [newRecord, ...prev]);
    showToast(`Logged Vdc = ${metrics.vDcAvg.toFixed(1)}V (α = ${params.firingAngle}°) to Observation Table`);
  };

  const handleClearObservations = () => {
    setObservations([]);
    showToast('Observation records cleared');
  };

  const handleApplyExperimentPreset = (preset: Partial<CircuitParameters>) => {
    setParams((prev) => ({ ...prev, ...preset }));
    setCurrentIndex(0);
    setActiveSection('lab');
    showToast('Experiment circuit setup loaded successfully');
  };

  const handleExportSnapshot = () => {
    const snapshotData = {
      timestamp: new Date().toISOString(),
      parameters: params,
      measurements: metrics,
      harmonics: harmonics.slice(0, 5),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshotData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rectifier_lab_state_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Saved lab parameters and measurements JSON snapshot');
  };

  const currentPoint = points[Math.floor(currentIndex)] || points[0] || null;
  const currentAngleDeg = currentPoint?.angleDeg || 0;
  const isThreePhase = params.phaseType === '3phase';
  const isThyristor = params.topology.includes('thyristor') || params.topology.includes('semi');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 3-Zone Top Bar Header */}
      <TopBar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onResetToDefaults={handleResetDefaults}
        onExportSnapshot={handleExportSnapshot}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Sub-header Bar with Quick Switch Topologies */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Topologies:
            </span>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '1phase',
                  topology: '1p_full_bridge_diode',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '1p_full_bridge_diode'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              1Φ Diode Bridge
            </button>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '1phase',
                  topology: '1p_full_bridge_thyristor',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '1p_full_bridge_thyristor'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              1Φ Controlled Bridge
            </button>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '1phase',
                  topology: '1p_half_diode',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '1p_half_diode'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              1Φ Half-Wave
            </button>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '1phase',
                  topology: '1p_full_center_tap',
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '1p_full_center_tap'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              1Φ Center-Tap
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '3phase',
                  topology: '3p_full_bridge_diode',
                  vRms: 415,
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '3p_full_bridge_diode'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              3Φ Diode Bridge (6-Pulse)
            </button>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '3phase',
                  topology: '3p_full_bridge_thyristor',
                  vRms: 415,
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '3p_full_bridge_thyristor'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              3Φ Controlled Bridge
            </button>
            <button
              onClick={() =>
                handleParamsChange({
                  phaseType: '3phase',
                  topology: '3p_half_diode',
                  vRms: 230,
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                params.topology === '3p_half_diode'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              3Φ Half-Wave (3-Pulse)
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              Mode:{' '}
              <strong className="text-slate-200">
                {params.phaseType === '1phase' ? 'Single-Phase (1Φ)' : 'Three-Phase (3Φ)'}
              </strong>
            </span>
            <span>·</span>
            <span>
              Load: <strong className="text-slate-200">{params.loadType}</strong>
            </span>
          </div>
        </div>

        {/* Tab 1: Virtual Simulator Stage & Control Deck */}
        {activeSection === 'lab' && (
          <div className="flex flex-col gap-6">
            {/* Visual Stage: Two-Zone Interactive Sandbox */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Zone: Circuit Schematic & Conduction Flow */}
              <div className="flex flex-col gap-3">
                <SchematicViewer
                  params={params}
                  currentPoint={currentPoint}
                  activeProbe={activeProbe}
                  onSelectProbe={setActiveProbe}
                  isPlaying={isPlaying}
                />
              </div>

              {/* Right Zone: Multi-Channel Digital Storage Oscilloscope (DSO) */}
              <div className="flex flex-col gap-3">
                <Oscilloscope
                  points={points}
                  metrics={metrics}
                  harmonics={harmonics}
                  currentIndex={Math.floor(currentIndex)}
                  onScrubAngle={handleScrub}
                  isThreePhase={isThreePhase}
                  isThyristor={isThyristor}
                />
              </div>
            </div>

            {/* Playback & Angle Scrubber Deck */}
            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onReset={handleResetAngle}
              onStep={handleStep}
              speed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              currentIndex={Math.floor(currentIndex)}
              totalPoints={points.length}
              onScrub={handleScrub}
              currentAngleDeg={currentAngleDeg}
            />

            {/* Control & Measurement Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Converter Configuration & Parameter Tuner */}
              <ParameterControls
                params={params}
                onChange={handleParamsChange}
              />

              {/* Digital Multimeter & Power Quality Analyzer */}
              <MeasurementsTable
                metrics={metrics}
                onLogObservation={handleLogObservation}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Guided Virtual Lab Experiments */}
        {activeSection === 'experiments' && (
          <VirtualLabExperiments
            observations={observations}
            onClearObservations={handleClearObservations}
            onApplyExperimentPreset={handleApplyExperimentPreset}
            currentParams={params}
            currentMetrics={metrics}
          />
        )}

        {/* Tab 3: Rectifier Theory & Derivations */}
        {activeSection === 'theory' && <TheorySection />}
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 px-6 py-4 mt-8 text-center text-xs text-slate-500">
        <p>
          Power Electronics Virtual Laboratory · Reference: Dr. Arpan Hota (IIT Kharagpur) Rectifier-Lab Curriculum
        </p>
      </footer>
    </div>
  );
}
