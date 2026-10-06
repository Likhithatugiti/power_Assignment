import React from 'react';
import { BookOpen, Check, Layers, Cpu, Zap, Activity } from 'lucide-react';

export const TheorySection: React.FC = () => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-6 shadow-xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Power Electronics Rectifier Theory & Mathematical Formulations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Analytical derivations of output DC voltage, RMS voltage, ripple factor, and conduction mechanisms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: 1-Phase Half Wave */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
          <h3 className="text-sm font-bold text-cyan-300">
            1. Single-Phase Half-Wave Rectifiers
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Consists of a single diode or thyristor. Conducts only during the positive half cycle of the AC supply.
          </p>
          <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 space-y-1">
            <div className="text-amber-400 font-semibold">Diode (Uncontrolled):</div>
            <div>Vdc = Vm / π ≈ 0.318 · Vm</div>
            <div>Vrms = Vm / 2 = 0.500 · Vm</div>
            <div>Ripple Factor γ = √[(Vrms/Vdc)² - 1] = 1.21</div>
            <div>PIV = Vm</div>

            <div className="text-amber-400 font-semibold pt-2">Thyristor (Controlled, Firing Angle α):</div>
            <div>Vdc = (Vm / 2π) · (1 + cos α)</div>
            <div>Vrms = (Vm / 2) · √[(1/π) · (π - α + sin(2α)/2)]</div>
          </div>
        </div>

        {/* Card 2: 1-Phase Full-Wave Bridge & Center Tap */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
          <h3 className="text-sm font-bold text-cyan-300">
            2. Single-Phase Full-Wave Rectifiers (Bridge & Center-Tap)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Conducts during both positive and negative half-cycles. Center-tapped uses 2 diodes with 2·Vm PIV. Bridge uses 4 diodes with Vm PIV.
          </p>
          <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 space-y-1">
            <div className="text-amber-400 font-semibold">Diode Bridge (Uncontrolled):</div>
            <div>Vdc = (2 · Vm) / π ≈ 0.637 · Vm</div>
            <div>Vrms = Vm / √2 ≈ 0.707 · Vm</div>
            <div>Ripple Factor γ = √[(π / (2√2))² - 1] = 0.482</div>
            <div>Ripple Frequency = 2 · f (100 Hz at 50 Hz line)</div>

            <div className="text-amber-400 font-semibold pt-2">Controlled Bridge (4 SCRs, Continuous RL):</div>
            <div>Vdc = (2 · Vm / π) · cos α</div>
            <div>For α &gt; 90°, converter operates in Inversion Mode (delivers DC energy back to AC line)!</div>
          </div>
        </div>

        {/* Card 3: 3-Phase Half-Wave (3-Pulse) */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
          <h3 className="text-sm font-bold text-cyan-300">
            3. Three-Phase Half-Wave Rectifiers (3-Pulse)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Star-connected transformer secondary. Each switch conducts for 120° (2π/3 radians) when its phase voltage is most positive.
          </p>
          <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 space-y-1">
            <div className="text-amber-400 font-semibold">Diode (3-Pulse Star):</div>
            <div>Vdc = (3√3 · Vm,ph) / (2π) ≈ 0.827 · Vm,ph</div>
            <div>Ripple Frequency = 3 · f (150 Hz at 50 Hz line)</div>
            <div>Ripple Factor γ = 0.170</div>

            <div className="text-amber-400 font-semibold pt-2">Thyristor (3 SCRs):</div>
            <div>Vdc = [(3√3 · Vm,ph) / (2π)] · cos α  (for α ≤ 30°)</div>
            <div>Vdc = [3 · Vm,ph / 2π] · [1 + cos(α + 30°)]  (for α &gt; 30°, R load)</div>
          </div>
        </div>

        {/* Card 4: 3-Phase Full-Wave Bridge (6-Pulse Graetz) */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
          <h3 className="text-sm font-bold text-cyan-300">
            4. Three-Phase Full-Wave Bridge Rectifier (6-Pulse Graetz)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The industry standard for high-power DC drives, HVDC transmission, and electro-metallurgy. 6 pulses per fundamental AC cycle.
          </p>
          <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 space-y-1">
            <div className="text-amber-400 font-semibold">Diode 6-Pulse Bridge:</div>
            <div>Vdc = (3 · Vm,LL) / π = (3√3 · Vm,ph) / π ≈ 1.654 · Vm,ph</div>
            <div>Vdc ≈ 1.35 · Vrms,LL</div>
            <div>Ripple Factor γ ≈ 0.040 (Only 4.0% ripple!)</div>
            <div>Ripple Frequency = 6 · f (300 Hz at 50 Hz line)</div>

            <div className="text-amber-400 font-semibold pt-2">Fully Controlled 6-Pulse SCR Bridge:</div>
            <div>Vdc = (3 · Vm,LL / π) · cos α = (3√3 · Vm,ph / π) · cos α</div>
          </div>
        </div>
      </div>

      {/* Freewheeling Diode & Filter Mechanisms */}
      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          5. Freewheeling Diode (FD) and Filter Mechanisms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-semibold text-cyan-300">Freewheeling Diode Function in R-L Loads:</h4>
            <p>
              When supplying inductive loads, current cannot change instantaneously. In controlled rectifiers,
              the stored energy in the inductor L forces the thyristor to conduct into the negative AC cycle, causing negative voltage spikes and lowering average DC voltage.
              A freewheeling diode connected in anti-parallel across the load turns ON as soon as the terminal voltage attempts to drop below zero, clamping the load voltage to 0V and recirculating load current safely!
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-cyan-300">Capacitor Filter (R-C) Smoothing:</h4>
            <p>
              The filter capacitor charges to the peak supply voltage during conduction. When the input voltage falls below the capacitor voltage, diodes reverse bias and turn off.
              The capacitor then discharges exponentially through the load resistance R with time constant τ = R·C.
              The peak-to-peak ripple voltage is approximately:
            </p>
            <div className="font-mono text-amber-300 bg-slate-900 p-1.5 rounded">
              Vpp ≈ Vm / (2 · f · R · C)  (for Full-Wave)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
