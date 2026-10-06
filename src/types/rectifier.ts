export type PhaseType = '1phase' | '3phase';

export type RectifierTopology =
  | '1p_half_diode'
  | '1p_half_thyristor'
  | '1p_full_center_tap'
  | '1p_full_bridge_diode'
  | '1p_full_bridge_thyristor'
  | '1p_semi_converter'
  | '3p_half_diode'
  | '3p_half_thyristor'
  | '3p_full_bridge_diode'
  | '3p_full_bridge_thyristor'
  | '3p_semi_converter';

export type LoadType = 'R' | 'RL' | 'RL_FD' | 'RC' | 'RLE';

export interface CircuitParameters {
  phaseType: PhaseType;
  topology: RectifierTopology;
  loadType: LoadType;
  vRms: number; // Input RMS voltage (Phase or line depending on topology, e.g. 230V)
  frequency: number; // 50Hz or 60Hz
  firingAngle: number; // alpha in degrees (0 to 180)
  resistance: number; // Ohms (e.g. 10 to 200)
  inductance: number; // mH (e.g. 0 to 200)
  capacitance: number; // uF (e.g. 10 to 2000)
  backEmf: number; // Volts (e.g. 0 to 100)
  diodeForwardDrop: number; // 0 for ideal, 0.7 for silicon
  freewheelingDiode: boolean;
}

export interface WaveformPoint {
  time: number; // seconds
  angleRad: number; // radians (0 to 4*PI)
  angleDeg: number; // degrees (0 to 720)
  vSourceA: number;
  vSourceB?: number;
  vSourceC?: number;
  vOutput: number;
  iOutput: number;
  vSwitch: number; // Peak switch voltage (e.g. D1 or T1)
  gatePulse: number; // 1 or 0
  activeSwitches: string[]; // List of conducting switch IDs, e.g. ['D1', 'D2']
}

export interface HarmonicItem {
  harmonic: number;
  order: string;
  frequency: number; // Hz
  magnitude: number; // Volts
  percentage: number; // % of fundamental or DC
}

export interface CircuitMetrics {
  vDcAvg: number; // Measured Average DC Voltage (V)
  vDcTheo: number; // Theoretical Average DC Voltage (V)
  vRmsAvg: number; // RMS Voltage (V)
  vRmsTheo: number; // Theoretical RMS Voltage (V)
  iDcAvg: number; // Average Load Current (A)
  iRmsAvg: number; // RMS Load Current (A)
  pDc: number; // DC Power (W)
  pAc: number; // Total Active Power (W)
  rippleVoltagePp: number; // Peak-to-peak ripple voltage (V)
  rippleFactor: number; // gamma
  efficiency: number; // eta (%)
  formFactor: number; // FF
  crestFactor: number; // CF
  thd: number; // Total Harmonic Distortion (%)
  piv: number; // Peak Inverse Voltage on switches (V)
  rippleFrequency: number; // Hz
  fundamentalFrequency: number; // Hz
}

export interface ObservationRecord {
  id: string;
  timestamp: string;
  topologyName: string;
  loadType: LoadType;
  firingAngle: number;
  vRms: number;
  vDcMeasured: number;
  vDcTheoretical: number;
  iDc: number;
  rippleFactor: number;
  rippleVoltagePp: number;
  capacitance?: number;
}
