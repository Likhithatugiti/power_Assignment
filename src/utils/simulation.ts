import {
  CircuitParameters,
  WaveformPoint,
  CircuitMetrics,
  HarmonicItem,
} from '../types/rectifier';

/**
 * Calculates waveform points across 2 full electrical cycles (720 degrees).
 */
export function simulateRectifier(params: CircuitParameters): {
  points: WaveformPoint[];
  metrics: CircuitMetrics;
  harmonics: HarmonicItem[];
} {
  const {
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

  const R = Math.max(0.5, resistance);
  const L = Math.max(0, inductance * 1e-3); // H
  const C = Math.max(1e-6, capacitance * 1e-6); // F
  const E = Math.max(0, backEmf);
  const omega = 2 * Math.PI * frequency;
  const T = 1 / frequency;
  const totalCycles = 2; // Simulate 2 full cycles (720 deg)
  const stepsPerCycle = 720; // 0.5 degree resolution
  const totalSteps = totalCycles * stepsPerCycle;
  const dt = (totalCycles * T) / totalSteps;
  const dThetaDeg = 360 / stepsPerCycle; // 0.5 deg
  const alphaRad = (firingAngle * Math.PI) / 180;

  // Source peak amplitudes
  const Vm = Math.SQRT2 * vRms; // Phase peak
  // For 3-phase line-to-line peak
  const VmLL = Math.sqrt(3) * Vm;

  const points: WaveformPoint[] = [];

  // State variables for dynamic differential equations (RL, RC)
  let current_i = 0;
  let capacitor_v = 0;

  // Determine ripple frequency multiplier
  let rippleMultiplier = 1;
  if (topology.startsWith('1p_half')) {
    rippleMultiplier = 1;
  } else if (topology.startsWith('1p_full') || topology === '1p_semi_converter') {
    rippleMultiplier = 2;
  } else if (topology.startsWith('3p_half')) {
    rippleMultiplier = 3;
  } else if (topology.startsWith('3p_full_bridge') || topology === '3p_semi_converter') {
    rippleMultiplier = 6;
  }

  // Pre-run one cycle to settle initial transients for filters / inductors
  for (let step = 0; step < totalSteps + stepsPerCycle; step++) {
    const isSettling = step < stepsPerCycle;
    const t = (step - stepsPerCycle) * dt;
    const thetaRad = omega * Math.max(0, t);
    const thetaCycleRad = thetaRad % (2 * Math.PI);
    const thetaCycleDeg = (thetaCycleRad * 180) / Math.PI;

    // AC Source Voltages
    const vSourceA = Vm * Math.sin(thetaCycleRad);
    const vSourceB = Vm * Math.sin(thetaCycleRad - (2 * Math.PI) / 3);
    const vSourceC = Vm * Math.sin(thetaCycleRad - (4 * Math.PI) / 3);

    let vRectified = 0;
    const activeSwitches: string[] = [];
    let isGated = 0;
    let vSwitch = 0; // Voltage across primary switch (D1 or T1)

    // Evaluate switch conduction based on topology
    switch (topology) {
      case '1p_half_diode': {
        const canConduct = vSourceA > (loadType === 'RLE' ? E : 0) + diodeForwardDrop;
        if (canConduct) {
          vRectified = vSourceA - diodeForwardDrop;
          activeSwitches.push('D1');
          vSwitch = diodeForwardDrop;
        } else {
          vRectified = 0;
          vSwitch = vSourceA;
        }
        break;
      }

      case '1p_half_thyristor': {
        // Gate pulse is high around alpha
        const pulseWindow = 10; // degrees
        if (
          thetaCycleDeg >= firingAngle &&
          thetaCycleDeg <= firingAngle + pulseWindow
        ) {
          isGated = 1;
        }

        const forwardBiased = vSourceA > (loadType === 'RLE' ? E : 0) + diodeForwardDrop;
        const passedAlpha = thetaCycleDeg >= firingAngle && thetaCycleDeg < 180;

        if (loadType === 'RL' && !freewheelingDiode) {
          // Can stay conducting even when vSourceA turns negative as long as current > 0
          if ((passedAlpha && forwardBiased) || (current_i > 0.01 && thetaCycleDeg < 240)) {
            vRectified = vSourceA - diodeForwardDrop;
            activeSwitches.push('T1');
            vSwitch = diodeForwardDrop;
          } else {
            vRectified = 0;
            vSwitch = vSourceA;
          }
        } else {
          // Resistive or with Freewheeling Diode
          if (passedAlpha && forwardBiased) {
            vRectified = vSourceA - diodeForwardDrop;
            activeSwitches.push('T1');
            vSwitch = diodeForwardDrop;
          } else {
            vRectified = 0;
            vSwitch = vSourceA;
          }
        }
        break;
      }

      case '1p_full_center_tap': {
        // Transformer center-tapped with D1 on positive half, D2 on negative half
        if (vSourceA > diodeForwardDrop) {
          vRectified = vSourceA - diodeForwardDrop;
          activeSwitches.push('D1');
          vSwitch = diodeForwardDrop;
        } else if (-vSourceA > diodeForwardDrop) {
          vRectified = -vSourceA - diodeForwardDrop;
          activeSwitches.push('D2');
          vSwitch = 2 * Vm * Math.sin(thetaCycleRad); // 2*Vm PIV
        } else {
          vRectified = 0;
          vSwitch = vSourceA;
        }
        break;
      }

      case '1p_full_bridge_diode': {
        // 4 diodes: D1, D2 during positive cycle; D3, D4 during negative cycle
        const minThresh = 2 * diodeForwardDrop;
        if (vSourceA > minThresh) {
          vRectified = vSourceA - minThresh;
          activeSwitches.push('D1', 'D2');
          vSwitch = diodeForwardDrop;
        } else if (-vSourceA > minThresh) {
          vRectified = -vSourceA - minThresh;
          activeSwitches.push('D3', 'D4');
          vSwitch = -vSourceA;
        } else {
          vRectified = 0;
          vSwitch = vSourceA;
        }
        break;
      }

      case '1p_full_bridge_thyristor': {
        // T1, T2 fired at alpha; T3, T4 fired at 180 + alpha
        const pulseWindow = 8;
        if (
          (thetaCycleDeg >= firingAngle && thetaCycleDeg <= firingAngle + pulseWindow) ||
          (thetaCycleDeg >= 180 + firingAngle && thetaCycleDeg <= 180 + firingAngle + pulseWindow)
        ) {
          isGated = 1;
        }

        const isPosHalf = thetaCycleDeg >= firingAngle && thetaCycleDeg < 180 + firingAngle;
        const continuous = (loadType === 'RL' || loadType === 'RLE') && L > 0.005;

        if (continuous && !freewheelingDiode) {
          // Fully controlled with continuous current
          if (thetaCycleDeg >= firingAngle && thetaCycleDeg < 180 + firingAngle) {
            vRectified = vSourceA - 2 * diodeForwardDrop;
            activeSwitches.push('T1', 'T2');
            vSwitch = diodeForwardDrop;
          } else {
            vRectified = -vSourceA - 2 * diodeForwardDrop;
            activeSwitches.push('T3', 'T4');
            vSwitch = -vSourceA;
          }
        } else {
          // Discontinuous / R load or freewheeling diode prevents negative excursion
          if (thetaCycleDeg >= firingAngle && thetaCycleDeg < 180) {
            vRectified = Math.max(0, vSourceA - 2 * diodeForwardDrop);
            activeSwitches.push('T1', 'T2');
            vSwitch = diodeForwardDrop;
          } else if (thetaCycleDeg >= 180 + firingAngle && thetaCycleDeg < 360) {
            vRectified = Math.max(0, -vSourceA - 2 * diodeForwardDrop);
            activeSwitches.push('T3', 'T4');
            vSwitch = -vSourceA;
          } else {
            vRectified = 0;
            vSwitch = vSourceA;
          }
        }
        break;
      }

      case '1p_semi_converter': {
        // 2 Thyristors (T1, T2) + 2 Diodes (D1, D2)
        // Freewheeling action naturally occurs via D1, D2 or FD
        const pulseWindow = 8;
        if (
          (thetaCycleDeg >= firingAngle && thetaCycleDeg <= firingAngle + pulseWindow) ||
          (thetaCycleDeg >= 180 + firingAngle && thetaCycleDeg <= 180 + firingAngle + pulseWindow)
        ) {
          isGated = 1;
        }

        if (thetaCycleDeg >= firingAngle && thetaCycleDeg < 180) {
          vRectified = Math.max(0, vSourceA - 2 * diodeForwardDrop);
          activeSwitches.push('T1', 'D1');
          vSwitch = diodeForwardDrop;
        } else if (thetaCycleDeg >= 180 && thetaCycleDeg < 180 + firingAngle) {
          // Freewheeling period
          vRectified = 0;
          activeSwitches.push('D1', 'D2');
          vSwitch = vSourceA;
        } else if (thetaCycleDeg >= 180 + firingAngle && thetaCycleDeg < 360) {
          vRectified = Math.max(0, -vSourceA - 2 * diodeForwardDrop);
          activeSwitches.push('T2', 'D2');
          vSwitch = -vSourceA;
        } else {
          // Freewheeling period before first alpha
          vRectified = 0;
          activeSwitches.push('D1', 'D2');
          vSwitch = vSourceA;
        }
        break;
      }

      case '3p_half_diode': {
        // Star 3-pulse: diodes conduct when their phase is highest
        // Commutation points at 30 deg, 150 deg, 270 deg
        if (vSourceA >= vSourceB && vSourceA >= vSourceC) {
          vRectified = vSourceA - diodeForwardDrop;
          activeSwitches.push('D1');
          vSwitch = diodeForwardDrop;
        } else if (vSourceB >= vSourceA && vSourceB >= vSourceC) {
          vRectified = vSourceB - diodeForwardDrop;
          activeSwitches.push('D2');
          vSwitch = vSourceA - vSourceB;
        } else {
          vRectified = vSourceC - diodeForwardDrop;
          activeSwitches.push('D3');
          vSwitch = vSourceA - vSourceC;
        }
        break;
      }

      case '3p_half_thyristor': {
        // Natural commutation starts at 30 deg for Phase A, 150 deg for Phase B, 270 deg for Phase C
        const refA = 30;
        const trigA = (refA + firingAngle) % 360;
        const trigB = (refA + 120 + firingAngle) % 360;
        const trigC = (refA + 240 + firingAngle) % 360;

        const pulseWindow = 8;
        if (
          Math.abs(thetaCycleDeg - trigA) < pulseWindow ||
          Math.abs(thetaCycleDeg - trigB) < pulseWindow ||
          Math.abs(thetaCycleDeg - trigC) < pulseWindow
        ) {
          isGated = 1;
        }

        // Active conduction windows (each 120 deg wide)
        let activePhase = 'A';
        const startA = (30 + firingAngle);
        const endA = startA + 120;
        const startB = (150 + firingAngle);
        const endB = startB + 120;

        // Check cycle wrapping
        const normAngle = thetaCycleDeg;
        if (
          (normAngle >= startA % 360 && normAngle < endA % 360 && startA % 360 < endA % 360) ||
          (startA % 360 > endA % 360 && (normAngle >= startA % 360 || normAngle < endA % 360))
        ) {
          activePhase = 'A';
          vRectified = vSourceA - diodeForwardDrop;
          activeSwitches.push('T1');
          vSwitch = diodeForwardDrop;
        } else if (
          (normAngle >= startB % 360 && normAngle < endB % 360 && startB % 360 < endB % 360) ||
          (startB % 360 > endB % 360 && (normAngle >= startB % 360 || normAngle < endB % 360))
        ) {
          activePhase = 'B';
          vRectified = vSourceB - diodeForwardDrop;
          activeSwitches.push('T2');
          vSwitch = vSourceA - vSourceB;
        } else {
          activePhase = 'C';
          vRectified = vSourceC - diodeForwardDrop;
          activeSwitches.push('T3');
          vSwitch = vSourceA - vSourceC;
        }

        // For R load with alpha > 30, voltage cannot go negative
        if (loadType === 'R' || freewheelingDiode) {
          if (vRectified < 0) {
            vRectified = 0;
            activeSwitches.length = 0;
            if (freewheelingDiode) activeSwitches.push('FD');
          }
        }
        break;
      }

      case '3p_full_bridge_diode': {
        // 6-Pulse Graetz Bridge
        // Top rail = max(va, vb, vc), Bottom rail = min(va, vb, vc)
        const phases = [
          { name: 'A', val: vSourceA, top: 'D1', bot: 'D4' },
          { name: 'B', val: vSourceB, top: 'D3', bot: 'D6' },
          { name: 'C', val: vSourceC, top: 'D5', bot: 'D2' },
        ];
        const maxPh = phases.reduce((prev, curr) => (curr.val > prev.val ? curr : prev));
        const minPh = phases.reduce((prev, curr) => (curr.val < prev.val ? curr : prev));

        vRectified = Math.max(0, maxPh.val - minPh.val - 2 * diodeForwardDrop);
        activeSwitches.push(maxPh.top, minPh.bot);
        vSwitch = maxPh.name === 'A' ? diodeForwardDrop : vSourceA - maxPh.val;
        break;
      }

      case '3p_full_bridge_thyristor': {
        // 6-Pulse Controlled Graetz Bridge
        // Commutation sequences every 60 degrees delayed by alpha
        // Sequence: (T1, T2), (T1, T6), (T3, T6), (T3, T4), (T5, T4), (T5, T2)
        // Offset reference: 60 deg + alpha
        const offset = 60 + firingAngle;
        const normTheta = (thetaCycleDeg - offset + 720) % 360;
        const interval = Math.floor(normTheta / 60);

        let pair = ['T1', 'T2'];
        let vInst = vSourceA - vSourceC; // Vac

        switch (interval) {
          case 0:
            pair = ['T1', 'T2'];
            vInst = vSourceA - vSourceC;
            break;
          case 1:
            pair = ['T1', 'T6'];
            vInst = vSourceA - vSourceB;
            break;
          case 2:
            pair = ['T3', 'T6'];
            vInst = vSourceB - vSourceA;
            break;
          case 3:
            pair = ['T3', 'T4'];
            vInst = vSourceB - vSourceC;
            break;
          case 4:
            pair = ['T5', 'T4'];
            vInst = vSourceC - vSourceB;
            break;
          case 5:
            pair = ['T5', 'T2'];
            vInst = vSourceC - vSourceA;
            break;
        }

        // Pulse trigger indicator
        if (normTheta % 60 < 8) {
          isGated = 1;
        }

        vRectified = vInst - 2 * diodeForwardDrop;
        if ((loadType === 'R' || freewheelingDiode) && vRectified < 0) {
          vRectified = 0;
          if (freewheelingDiode) activeSwitches.push('FD');
        } else {
          activeSwitches.push(...pair);
        }

        vSwitch = pair.includes('T1') ? diodeForwardDrop : vSourceA - vSourceB;
        break;
      }

      case '3p_semi_converter': {
        // 3 Thyristors (T1, T3, T5 on upper rail) + 3 Diodes (D2, D4, D6 on lower rail)
        // Freewheeling action naturally bounds output voltage >= 0
        const normTheta = (thetaCycleDeg + 720) % 360;
        const offset = 30 + firingAngle;
        const alphaShift = (normTheta - offset + 720) % 360;
        const interval = Math.floor(alphaShift / 60);

        // Approximate line-to-line envelope with half-control
        const phases = [
          { name: 'A', val: vSourceA, top: 'T1', bot: 'D4' },
          { name: 'B', val: vSourceB, top: 'T3', bot: 'D6' },
          { name: 'C', val: vSourceC, top: 'T5', bot: 'D2' },
        ];
        const minPh = phases.reduce((prev, curr) => (curr.val < prev.val ? curr : prev));

        let topSwitch = 'T1';
        let topVal = vSourceA;
        if (interval < 2) {
          topSwitch = 'T1';
          topVal = vSourceA;
        } else if (interval < 4) {
          topSwitch = 'T3';
          topVal = vSourceB;
        } else {
          topSwitch = 'T5';
          topVal = vSourceC;
        }

        const vDiff = topVal - minPh.val - 2 * diodeForwardDrop;
        vRectified = Math.max(0, vDiff);
        if (vRectified > 0) {
          activeSwitches.push(topSwitch, minPh.bot);
        } else {
          activeSwitches.push('FD', minPh.bot);
        }
        vSwitch = topSwitch === 'T1' ? diodeForwardDrop : vSourceA;
        break;
      }
    }

    // Now calculate Load Dynamics based on Load Type:
    let vOutputFinal = vRectified;
    let iOutputFinal = 0;

    if (loadType === 'R') {
      vOutputFinal = Math.max(0, vRectified);
      iOutputFinal = vOutputFinal / R;
    } else if (loadType === 'RC') {
      // Capacitor Filter
      if (vRectified > capacitor_v) {
        // Diode conducts, capacitor charges to rectified peak
        capacitor_v = vRectified;
        vOutputFinal = capacitor_v;
        iOutputFinal = capacitor_v / R;
      } else {
        // Diodes reverse biased, capacitor discharges into R: dv/dt = -v / (R*C)
        const decay = Math.exp(-dt / (R * C));
        capacitor_v = capacitor_v * decay;
        vOutputFinal = capacitor_v;
        iOutputFinal = capacitor_v / R;
        // switches are OFF during discharge!
        activeSwitches.length = 0;
      }
    } else if (loadType === 'RL' || loadType === 'RL_FD') {
      // RL dynamics: L * di/dt + R * i = v_app
      // If freewheeling diode is active and vRectified <= 0, v_app = 0
      let vApp = vRectified;
      if (freewheelingDiode || loadType === 'RL_FD') {
        if (vRectified <= 0) {
          vApp = 0;
          if (current_i > 0.05 && !activeSwitches.includes('FD')) {
            activeSwitches.push('FD');
          }
        }
      }

      // Euler / trapezoidal integration of inductor current
      const di = ((vApp - R * current_i) / Math.max(1e-4, L)) * dt;
      current_i = Math.max(0, current_i + di);

      vOutputFinal = (freewheelingDiode || loadType === 'RL_FD') && vRectified < 0 ? 0 : vRectified;
      iOutputFinal = current_i;
    } else if (loadType === 'RLE') {
      // Battery / DC motor with back-EMF E
      let vApp = vRectified;
      if (vRectified <= E && current_i <= 0.001) {
        // Below EMF threshold, switches cannot turn on
        vOutputFinal = E;
        current_i = 0;
        activeSwitches.length = 0;
      } else {
        // Current flows against back EMF
        const di = ((vApp - R * current_i - E) / Math.max(1e-4, L)) * dt;
        current_i = Math.max(0, current_i + di);
        vOutputFinal = current_i > 0 ? vRectified : E;
      }
      iOutputFinal = current_i;
    }

    // Only record points after settling initial cycle
    if (!isSettling) {
      points.push({
        time: t,
        angleRad: thetaRad,
        angleDeg: (t * omega * 180) / Math.PI,
        vSourceA,
        vSourceB,
        vSourceC,
        vOutput: vOutputFinal,
        iOutput: iOutputFinal,
        vSwitch,
        gatePulse: isGated,
        activeSwitches,
      });
    }
  }

  // Calculate Metrics from simulated waveform (last cycle for steady-state accuracy)
  const evalPoints = points.slice(stepsPerCycle, totalSteps);
  const N = evalPoints.length;

  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let maxVo = -Infinity;
  let minVo = Infinity;
  let maxIo = -Infinity;
  let minSwitch = 0;

  for (let i = 0; i < N; i++) {
    const pt = evalPoints[i];
    sumVo += pt.vOutput;
    sumVoSq += pt.vOutput * pt.vOutput;
    sumIo += pt.iOutput;
    sumIoSq += pt.iOutput * pt.iOutput;

    if (pt.vOutput > maxVo) maxVo = pt.vOutput;
    if (pt.vOutput < minVo) minVo = pt.vOutput;
    if (pt.iOutput > maxIo) maxIo = pt.iOutput;
    if (pt.vSwitch < minSwitch) minSwitch = pt.vSwitch;
  }

  const vDcAvg = sumVo / N;
  const vRmsAvg = Math.sqrt(sumVoSq / N);
  const iDcAvg = sumIo / N;
  const iRmsAvg = Math.sqrt(sumIoSq / N);
  const pDc = vDcAvg * iDcAvg;
  const pAc = vRmsAvg * iRmsAvg;

  const rippleVoltagePp = Math.max(0, maxVo - minVo);
  const rippleRatio = vDcAvg > 0.01 ? (vRmsAvg * vRmsAvg) / (vDcAvg * vDcAvg) - 1 : 0;
  const rippleFactor = rippleRatio > 0 ? Math.sqrt(rippleRatio) : 0;
  const efficiency = pAc > 0.001 ? Math.min(100, (pDc / pAc) * 100) : 0;
  const formFactor = vDcAvg > 0.01 ? vRmsAvg / vDcAvg : 1;
  const crestFactor = vRmsAvg > 0.01 ? maxVo / vRmsAvg : 1;
  const piv = Math.abs(minSwitch);

  // Compute Theoretical Values
  const { vDcTheo, vRmsTheo } = computeTheoreticalValues(
    topology,
    loadType,
    Vm,
    VmLL,
    alphaRad
  );

  // Harmonics via Discrete Fourier Transform (DFT)
  const harmonics = computeHarmonics(evalPoints, frequency, rippleMultiplier);

  // Calculate THD based on harmonics
  let harmonicEnergy = 0;
  harmonics.forEach((h) => {
    if (h.harmonic > 0) {
      harmonicEnergy += h.magnitude * h.magnitude;
    }
  });
  const fundamentalMag = harmonics.find((h) => h.harmonic === rippleMultiplier)?.magnitude || 1;
  const thd = fundamentalMag > 0.1 ? (Math.sqrt(harmonicEnergy) / fundamentalMag) * 100 : 0;

  const metrics: CircuitMetrics = {
    vDcAvg,
    vDcTheo,
    vRmsAvg,
    vRmsTheo,
    iDcAvg,
    iRmsAvg,
    pDc,
    pAc,
    rippleVoltagePp,
    rippleFactor,
    efficiency,
    formFactor,
    crestFactor,
    thd,
    piv,
    rippleFrequency: frequency * rippleMultiplier,
    fundamentalFrequency: frequency,
  };

  return { points, metrics, harmonics };
}

/**
 * Classical power electronics analytical formulas
 */
function computeTheoreticalValues(
  topology: string,
  loadType: string,
  Vm: number,
  VmLL: number,
  alphaRad: number
): { vDcTheo: number; vRmsTheo: number } {
  let vDcTheo = 0;
  let vRmsTheo = 0;

  switch (topology) {
    case '1p_half_diode':
      // Vdc = Vm / pi
      vDcTheo = Vm / Math.PI;
      vRmsTheo = Vm / 2;
      break;

    case '1p_half_thyristor':
      // Vdc = (Vm / 2pi) * (1 + cos(alpha))
      vDcTheo = (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      vRmsTheo =
        (Vm / 2) *
        Math.sqrt(
          (1 / Math.PI) * (Math.PI - alphaRad + Math.sin(2 * alphaRad) / 2)
        );
      break;

    case '1p_full_center_tap':
    case '1p_full_bridge_diode':
      // Vdc = 2 * Vm / pi
      vDcTheo = (2 * Vm) / Math.PI;
      vRmsTheo = Vm / Math.SQRT2;
      break;

    case '1p_full_bridge_thyristor':
      if (loadType === 'RL') {
        // Continuous conduction: 2 * Vm / pi * cos(alpha)
        vDcTheo = ((2 * Vm) / Math.PI) * Math.cos(alphaRad);
        vRmsTheo = Vm / Math.SQRT2;
      } else {
        // Resistive: (Vm / pi) * (1 + cos(alpha))
        vDcTheo = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
        vRmsTheo =
          Vm *
          Math.sqrt(
            (1 / (2 * Math.PI)) *
              (Math.PI - alphaRad + Math.sin(2 * alphaRad) / 2)
          );
      }
      break;

    case '1p_semi_converter':
      // Vdc = (Vm / pi) * (1 + cos(alpha))
      vDcTheo = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
      vRmsTheo =
        Vm *
        Math.sqrt(
          (1 / (2 * Math.PI)) *
            (Math.PI - alphaRad + Math.sin(2 * alphaRad) / 2)
        );
      break;

    case '3p_half_diode':
      // Vdc = 3 * sqrt(3) * Vm / (2 * pi)
      vDcTheo = (3 * Math.sqrt(3) * Vm) / (2 * Math.PI);
      vRmsTheo = Vm * Math.sqrt(0.5 + (3 * Math.sqrt(3)) / (8 * Math.PI));
      break;

    case '3p_half_thyristor':
      if (alphaRad <= Math.PI / 6) {
        vDcTheo = ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(alphaRad);
      } else {
        vDcTheo =
          ((3 * Vm) / (2 * Math.PI)) *
          (1 + Math.cos(alphaRad + Math.PI / 6));
      }
      vRmsTheo = (3 * Math.sqrt(3) * Vm) / (2 * Math.PI);
      break;

    case '3p_full_bridge_diode':
      // Vdc = 3 * VmLL / pi = 3 * sqrt(3) * Vm / pi
      vDcTheo = (3 * VmLL) / Math.PI;
      vRmsTheo = VmLL * Math.sqrt(0.5 + (3 * Math.sqrt(3)) / (4 * Math.PI));
      break;

    case '3p_full_bridge_thyristor':
      // Vdc = (3 * VmLL / pi) * cos(alpha)
      vDcTheo = ((3 * VmLL) / Math.PI) * Math.cos(alphaRad);
      vRmsTheo = (3 * VmLL) / Math.PI;
      break;

    case '3p_semi_converter':
      // Vdc = (3 * VmLL / 2pi) * (1 + cos(alpha))
      vDcTheo = ((3 * VmLL) / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      vRmsTheo = (3 * VmLL) / (2 * Math.PI);
      break;

    default:
      vDcTheo = Vm / Math.PI;
      vRmsTheo = Vm / 2;
  }

  return { vDcTheo, vRmsTheo };
}

/**
 * Computes the first 8 dominant harmonics using discrete Fourier analysis
 */
function computeHarmonics(
  points: WaveformPoint[],
  fundamentalFreq: number,
  rippleMultiplier: number
): HarmonicItem[] {
  const N = points.length;
  if (N === 0) return [];

  const harmonics: HarmonicItem[] = [];
  const maxOrder = 8;

  // DC component
  let sumVo = 0;
  for (let i = 0; i < N; i++) {
    sumVo += points[i].vOutput;
  }
  const dcVal = sumVo / N;

  harmonics.push({
    harmonic: 0,
    order: 'DC',
    frequency: 0,
    magnitude: Math.abs(dcVal),
    percentage: 100,
  });

  const baseOrders = [1, 2, 3, 4, 6, 8, 12];
  const ordersToShow = Array.from(
    new Set([1, rippleMultiplier, rippleMultiplier * 2, ...baseOrders])
  )
    .sort((a, b) => a - b)
    .slice(0, maxOrder);

  ordersToShow.forEach((k) => {
    let sumCos = 0;
    let sumSin = 0;
    for (let i = 0; i < N; i++) {
      const angle = (2 * Math.PI * k * i) / N;
      sumCos += points[i].vOutput * Math.cos(angle);
      sumSin += points[i].vOutput * Math.sin(angle);
    }
    const Ak = (2 / N) * sumCos;
    const Bk = (2 / N) * sumSin;
    const magnitude = Math.sqrt(Ak * Ak + Bk * Bk);
    const percentage = dcVal > 0.01 ? (magnitude / dcVal) * 100 : 0;

    harmonics.push({
      harmonic: k,
      order: `${k}f (${k * fundamentalFreq} Hz)`,
      frequency: k * fundamentalFreq,
      magnitude,
      percentage,
    });
  });

  return harmonics;
}
