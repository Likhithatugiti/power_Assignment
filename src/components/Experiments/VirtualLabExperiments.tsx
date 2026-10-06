import React, { useState } from 'react';
import {
  ObservationRecord,
  CircuitParameters,
  CircuitMetrics,
} from '../../types/rectifier';
import {
  BookOpen,
  Download,
  Trash2,
  Table,
  CheckCircle2,
  Play,
  HelpCircle,
} from 'lucide-react';

interface VirtualLabExperimentsProps {
  observations: ObservationRecord[];
  onClearObservations: () => void;
  onApplyExperimentPreset: (preset: Partial<CircuitParameters>) => void;
  currentParams: CircuitParameters;
  currentMetrics: CircuitMetrics;
}

export const VirtualLabExperiments: React.FC<VirtualLabExperimentsProps> = ({
  observations,
  onClearObservations,
  onApplyExperimentPreset,
  currentParams,
  currentMetrics,
}) => {
  const [selectedExperiment, setSelectedExperiment] = useState<number>(1);

  // Experiment Presets
  const experiments = [
    {
      id: 1,
      title: 'Experiment 1: Firing Angle (α) Control in 1Φ Full-Wave Controlled Converter',
      objective:
        'To observe the effect of thyristor firing angle α on output DC voltage and verify the theoretical formula Vdc = (Vm/π)(1 + cos α) for R load and (2Vm/π)cos α for RL continuous load.',
      procedure: [
        'Select 1-Phase Fully Controlled Thyristor Bridge Rectifier.',
        'Set AC supply voltage to 230V RMS, 50 Hz, with Resistive (R) load of 50 Ω.',
        'Vary the firing angle α from 0° to 180° in steps of 30°.',
        'At each step, record the measured Vdc and compare with theoretical value.',
        'Observe how the output voltage waveform is chopped until trigger pulse.',
      ],
      setupPreset: {
        phaseType: '1phase' as const,
        topology: '1p_full_bridge_thyristor' as const,
        loadType: 'R' as const,
        vRms: 230,
        frequency: 50,
        firingAngle: 30,
        resistance: 50,
      },
    },
    {
      id: 2,
      title: 'Experiment 2: Ripple Reduction in 3-Phase vs 1-Phase Diode Bridge Rectifiers',
      objective:
        'To compare 1-phase 2-pulse full-wave bridge with 3-phase 6-pulse bridge, investigating ripple frequency (100 Hz vs 300 Hz) and ripple factor (0.482 vs 0.040).',
      procedure: [
        'First load the 1-Phase Full-Wave Diode Bridge and note ripple factor and 100 Hz ripple in FFT.',
        'Switch to 3-Phase Full-Wave Diode Bridge (Graetz circuit).',
        'Observe the output DC waveform which consists of 6 pulses per AC cycle.',
        'Observe that the ripple factor drops drastically to approximately 4.2% without external filters.',
      ],
      setupPreset: {
        phaseType: '3phase' as const,
        topology: '3p_full_bridge_diode' as const,
        loadType: 'R' as const,
        vRms: 415,
        frequency: 50,
        resistance: 40,
      },
    },
    {
      id: 3,
      title: 'Experiment 3: Filter Capacitor Sizing and Ripple Smoothing',
      objective:
        'To analyze the exponential discharge mechanism of a capacitor filter across resistive load and examine how increasing capacitance C reduces peak-to-peak ripple voltage.',
      procedure: [
        'Select 1-Phase Diode Bridge Rectifier with Capacitor Filter (R-C load).',
        'Start with a low filter capacitance C = 50 μF.',
        'Observe the sharp charging pulses and steep exponential decay.',
        'Increase capacitance to 200 μF, 500 μF, and 1000 μF, recording peak-to-peak ripple Vpp.',
        'Verify the inverse relationship Vpp ≈ Vm / (2 * f * R * C).',
      ],
      setupPreset: {
        phaseType: '1phase' as const,
        topology: '1p_full_bridge_diode' as const,
        loadType: 'RC' as const,
        vRms: 230,
        frequency: 50,
        resistance: 50,
        capacitance: 200,
      },
    },
    {
      id: 4,
      title: 'Experiment 4: Inductive Load (R-L) & Freewheeling Diode (FD) Dynamics',
      objective:
        'To investigate the effect of stored magnetic energy in inductive loads, observing negative voltage excursions in controlled rectifiers and their elimination via a Freewheeling Diode.',
      procedure: [
        'Select 1-Phase Half-Wave or Full-Wave Controlled Converter with R-L Load without FD.',
        'Set firing angle α = 60° and observe that the output voltage goes negative during inductive discharge.',
        'Toggle the Freewheeling Diode (FD) to ON.',
        'Notice how the load voltage is clamped to 0V at the zero-crossing, preventing negative voltage and continuing load current flow.',
      ],
      setupPreset: {
        phaseType: '1phase' as const,
        topology: '1p_half_thyristor' as const,
        loadType: 'RL' as const,
        vRms: 230,
        frequency: 50,
        firingAngle: 60,
        resistance: 20,
        inductance: 100,
        freewheelingDiode: false,
      },
    },
  ];

  const currentExp = experiments.find((e) => e.id === selectedExperiment) || experiments[0];

  // Export CSV
  const handleExportCsv = () => {
    if (observations.length === 0) return;
    const headers = [
      'Record #',
      'Timestamp',
      'Topology',
      'Load Type',
      'Firing Angle (deg)',
      'RMS Input (V)',
      'Measured Vdc (V)',
      'Theoretical Vdc (V)',
      'Idc (A)',
      'Ripple Factor',
      'Ripple Vpp (V)',
    ];

    const rows = observations.map((o, idx) => [
      idx + 1,
      o.timestamp,
      `"${o.topologyName}"`,
      o.loadType,
      o.firingAngle,
      o.vRms,
      o.vDcMeasured.toFixed(2),
      o.vDcTheoretical.toFixed(2),
      o.iDc.toFixed(2),
      o.rippleFactor.toFixed(3),
      o.rippleVoltagePp.toFixed(1),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rectifier_lab_observations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-6 shadow-xl">
      {/* Experiment Selector Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              IIT-KGP Style Virtual Laboratory Experiments
            </h2>
            <p className="text-xs text-slate-400">
              Guided experimental curriculum with automated data recording & observation table
            </p>
          </div>
        </div>

        {/* Experiment Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 rounded-lg border border-slate-800">
          {experiments.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setSelectedExperiment(exp.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                selectedExperiment === exp.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Exp {exp.id}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Experiment Manual */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
          <h3 className="text-sm font-bold text-cyan-300">{currentExp.title}</h3>
          <button
            onClick={() => onApplyExperimentPreset(currentExp.setupPreset)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Load Experiment Circuit
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">
            Aim & Objective
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">{currentExp.objective}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
            Step-by-Step Procedure
          </h4>
          <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 leading-relaxed">
            {currentExp.procedure.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Observation Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Observation Table ({observations.length} points recorded)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {observations.length > 0 && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={onClearObservations}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {observations.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
            No observations recorded yet. Adjust the firing angle α or parameters above, then click{' '}
            <strong className="text-cyan-400">"Record Observation"</strong> in the multimeter panel to log data points.
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Topology</th>
                  <th className="px-3 py-2.5">Load</th>
                  <th className="px-3 py-2.5 text-right">α (deg)</th>
                  <th className="px-3 py-2.5 text-right">Vs (RMS)</th>
                  <th className="px-3 py-2.5 text-right text-cyan-300">Vdc Meas (V)</th>
                  <th className="px-3 py-2.5 text-right text-slate-400">Vdc Theo (V)</th>
                  <th className="px-3 py-2.5 text-right text-emerald-300">Idc (A)</th>
                  <th className="px-3 py-2.5 text-right">Ripple γ</th>
                  <th className="px-3 py-2.5 text-right">Vpp (V)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 tabular-nums">
                {observations.map((obs, idx) => (
                  <tr key={obs.id} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2 text-slate-300 font-sans">{obs.topologyName}</td>
                    <td className="px-3 py-2 text-slate-400">{obs.loadType}</td>
                    <td className="px-3 py-2 text-right text-amber-300 font-bold">{obs.firingAngle}°</td>
                    <td className="px-3 py-2 text-right text-slate-300">{obs.vRms} V</td>
                    <td className="px-3 py-2 text-right text-cyan-300 font-bold">
                      {obs.vDcMeasured.toFixed(2)} V
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">
                      {obs.vDcTheoretical.toFixed(2)} V
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-300">
                      {obs.iDc.toFixed(2)} A
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {obs.rippleFactor.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">
                      {obs.rippleVoltagePp.toFixed(1)} V
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
