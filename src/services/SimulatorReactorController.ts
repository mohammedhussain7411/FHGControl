import type { IReactorController } from './IReactorController';
import type { ReactorState, ConnectionStatus, SimulatorFaultConfig } from '../types/reactor';

export class SimulatorReactorController implements IReactorController {
  private status: ConnectionStatus = 'CONNECTED_SIMULATOR';
  private subscribers: ((states: ReactorState[]) => void)[] = [];
  private timerId: number | null = null;
  private simSpeedMultiplier: number = 1.0; // 1x by default

  // Fault Configuration
  public faultConfig: SimulatorFaultConfig = {
    pt100Open: [false, false, false, false],
    overTemp: [false, false, false, false],
    stirrerStall: [false, false, false, false],
    chillerFailure: false,
    commLoss: false,
    thermalLagSpeed: 1.0
  };

  private states: ReactorState[] = [
    this.createInitialState(1, "Reactor 1 (500mL Glass)", 25.0, 80.0, 600, 0),
    this.createInitialState(2, "Reactor 2 (250mL Glass)", 22.5, 25.0, 0, 0),
    this.createInitialState(3, "Reactor 3 (1000mL Glass)", 24.0, 120.0, 900, 0),
    this.createInitialState(4, "Reactor 4 (100mL Glass)", 23.0, 50.0, 0, 500),
  ];

  // PID Integral accumulators
  private integralErr: number[] = [0, 0, 0, 0];
  private lastErr: number[] = [0, 0, 0, 0];

  constructor() {
    this.startSimulationLoop();
  }

  private createInitialState(
    id: number,
    name: string,
    currentTemp: number,
    targetTemp: number,
    overheadRPM: number,
    magneticRPM: number
  ): ReactorState {
    return {
      id,
      name,
      currentTemp,
      targetTemp,
      heatingActive: true,
      coolingActive: false,
      thermalPowerPct: 0,
      overheadActualRPM: overheadRPM,
      overheadTargetRPM: overheadRPM,
      overheadActive: overheadRPM > 0,
      overheadTorqueNm: overheadRPM > 0 ? 0.12 : 0,
      magneticActualRPM: magneticRPM,
      magneticTargetRPM: magneticRPM,
      magneticActive: magneticRPM > 0,
      status: 'RUNNING',
      mode: 'MANUAL',
      stepTimerSeconds: 0,
      pt100Fault: false,
      overTempFault: false,
      stirrerStallFault: false,
      chillerTripFault: false,
      commLossFault: false
    };
  }

  public async connect(): Promise<boolean> {
    this.status = 'CONNECTED_SIMULATOR';
    if (!this.timerId) {
      this.startSimulationLoop();
    }
    return true;
  }

  public async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifySubscribers();
  }

  public getConnectionStatus(): ConnectionStatus {
    if (this.faultConfig.commLoss) return 'ERROR';
    return this.status;
  }

  public setSimSpeedMultiplier(multiplier: number): void {
    this.simSpeedMultiplier = Math.max(0.1, Math.min(20, multiplier));
    this.faultConfig.thermalLagSpeed = this.simSpeedMultiplier;
  }

  public getSimSpeedMultiplier(): number {
    return this.simSpeedMultiplier;
  }

  // --- Command Implementations ---

  public async setTargetTemperature(reactorId: number, tempCelsius: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      const clamped = Math.max(-20, Math.min(200, tempCelsius));
      this.states[idx].targetTemp = clamped;
      this.integralErr[idx] = 0; // reset integral on new setpoint
      this.notifySubscribers();
    }
  }

  public async setOverheadSpeed(reactorId: number, rpm: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      const clamped = rpm <= 0 ? 0 : Math.max(50, Math.min(1500, rpm));
      this.states[idx].overheadTargetRPM = clamped;
      if (clamped === 0) {
        this.states[idx].overheadActive = false;
        this.states[idx].overheadActualRPM = 0;
      } else {
        // MUTUALLY EXCLUSIVE STIRRING INTERLOCK: Stop Magnetic if setting Overhead!
        this.states[idx].magneticActive = false;
        this.states[idx].magneticActualRPM = 0;
        this.states[idx].overheadActive = true;
        this.states[idx].overheadActualRPM = clamped;
      }
      this.notifySubscribers();
    }
  }

  public async setMagneticSpeed(reactorId: number, rpm: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      const clamped = rpm <= 0 ? 0 : Math.max(100, Math.min(2000, rpm));
      this.states[idx].magneticTargetRPM = clamped;
      if (clamped === 0) {
        this.states[idx].magneticActive = false;
        this.states[idx].magneticActualRPM = 0;
      } else {
        // MUTUALLY EXCLUSIVE STIRRING INTERLOCK: Stop Overhead if setting Magnetic!
        this.states[idx].overheadActive = false;
        this.states[idx].overheadActualRPM = 0;
        this.states[idx].magneticActive = true;
        this.states[idx].magneticActualRPM = clamped;
      }
      this.notifySubscribers();
    }
  }

  public async startHeating(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].heatingActive = true;
      this.states[idx].coolingActive = false;
      this.notifySubscribers();
    }
  }

  public async stopHeating(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].heatingActive = false;
      this.notifySubscribers();
    }
  }

  public async startCooling(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].coolingActive = true;
      this.states[idx].heatingActive = false;
      this.notifySubscribers();
    }
  }

  public async stopCooling(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].coolingActive = false;
      this.notifySubscribers();
    }
  }

  public async startOverheadStirrer(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      // MUTUALLY EXCLUSIVE STIRRING INTERLOCK: Stop Magnetic drive automatically!
      this.states[idx].magneticActive = false;
      this.states[idx].magneticActualRPM = 0;

      this.states[idx].overheadActive = true;
      if (this.states[idx].overheadTargetRPM === 0) {
        this.states[idx].overheadTargetRPM = 600;
      }
      this.states[idx].overheadActualRPM = this.states[idx].overheadTargetRPM;
      this.notifySubscribers();
    }
  }

  public async stopOverheadStirrer(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].overheadActive = false;
      this.states[idx].overheadActualRPM = 0;
      this.notifySubscribers();
    }
  }

  public async startMagneticStirrer(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      // MUTUALLY EXCLUSIVE STIRRING INTERLOCK: Stop Overhead drive automatically!
      this.states[idx].overheadActive = false;
      this.states[idx].overheadActualRPM = 0;

      this.states[idx].magneticActive = true;
      if (this.states[idx].magneticTargetRPM === 0) {
        this.states[idx].magneticTargetRPM = 800;
      }
      this.states[idx].magneticActualRPM = this.states[idx].magneticTargetRPM;
      this.notifySubscribers();
    }
  }

  public async stopMagneticStirrer(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].magneticActive = false;
      this.states[idx].magneticActualRPM = 0;
      this.notifySubscribers();
    }
  }

  public async emergencyStopAll(): Promise<void> {
    this.states.forEach(r => {
      r.heatingActive = false;
      r.coolingActive = false;
      r.overheadActive = false;
      r.magneticActive = false;
      r.overheadActualRPM = 0;
      r.magneticActualRPM = 0;
      r.status = 'PAUSED';
    });
    this.notifySubscribers();
  }

  public async clearFaults(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.faultConfig.pt100Open[idx] = false;
      this.faultConfig.overTemp[idx] = false;
      this.faultConfig.stirrerStall[idx] = false;
      this.states[idx].pt100Fault = false;
      this.states[idx].overTempFault = false;
      this.states[idx].stirrerStallFault = false;
      if (this.states[idx].status === 'ALARM') {
        this.states[idx].status = 'READY';
      }
      this.notifySubscribers();
    }
  }

  public getReactorStates(): ReactorState[] {
    return this.states;
  }

  public onStateUpdate(callback: (states: ReactorState[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.states);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  // --- Physics & Physics Simulation Loop ---

  private startSimulationLoop(): void {
    const dtSeconds = 0.2; // 200ms per tick
    this.timerId = window.setInterval(() => {
      this.updatePhysics(dtSeconds * this.simSpeedMultiplier);
      this.notifySubscribers();
    }, 200);
  }

  private updatePhysics(dt: number): void {
    const ambientTemp = 22.5; // Ambient lab temperature

    for (let i = 0; i < 4; i++) {
      const state = this.states[i];

      // Update Step Timer if running
      if (state.status === 'RUNNING') {
        state.stepTimerSeconds += dt;
      }

      // Check Fault Injections
      state.pt100Fault = this.faultConfig.pt100Open[i];
      state.overTempFault = this.faultConfig.overTemp[i] || state.currentTemp > 210;
      state.stirrerStallFault = this.faultConfig.stirrerStall[i];
      state.chillerTripFault = this.faultConfig.chillerFailure;
      state.commLossFault = this.faultConfig.commLoss;

      if (state.pt100Fault || state.overTempFault || state.stirrerStallFault || state.commLossFault) {
        state.status = 'ALARM';
        // Emergency hardware shutdown on fault
        state.heatingActive = false;
        state.thermalPowerPct = 0;
      }

      // 1. Thermal Block Thermodynamics & PID Simulation
      if (state.pt100Fault) {
        // PT100 fault sensor returns invalid reading
        state.currentTemp = -999;
      } else {
        const err = state.targetTemp - state.currentTemp;
        
        // PID gains (tuned for aluminum block + glass reaction volume)
        const Kp = 6.0;
        const Ki = 0.05;
        const Kd = 1.2;

        this.integralErr[i] += err * dt;
        // Anti-windup
        this.integralErr[i] = Math.max(-100, Math.min(100, this.integralErr[i]));
        const derivErr = (err - this.lastErr[i]) / dt;
        this.lastErr[i] = err;

        let pidOutput = Kp * err + Ki * this.integralErr[i] + Kd * derivErr;

        // Force enable/disable if heating/cooling mode toggled
        if (!state.heatingActive && pidOutput > 0) pidOutput = 0;
        if (!state.coolingActive && pidOutput < 0) pidOutput = 0;

        // Saturation (-100% cooling to +100% heating)
        pidOutput = Math.max(-100, Math.min(100, pidOutput));
        state.thermalPowerPct = Number(pidOutput.toFixed(1));

        // Heat transfer equation:
        const kLoss = 0.008; // natural heat loss coefficient
        const heaterHeatingRate = pidOutput > 0 ? pidOutput * 0.045 : 0;
        const chillerCoolingRate = pidOutput < 0 ? pidOutput * 0.040 : 0;
        const ambientLoss = kLoss * (state.currentTemp - ambientTemp);

        const dT = (heaterHeatingRate + chillerCoolingRate - ambientLoss) * dt;
        state.currentTemp += dT;
        state.currentTemp = Number(state.currentTemp.toFixed(2));
      }

      // 2. Overhead Stirrer Execution
      if (!state.overheadActive || state.stirrerStallFault) {
        state.overheadActualRPM = 0;
      } else {
        state.overheadActualRPM = state.overheadTargetRPM;
      }
      if (state.overheadActualRPM > 0) {
        state.overheadTorqueNm = Number((0.05 + (state.overheadActualRPM / 1500) * 0.25).toFixed(2));
      } else {
        state.overheadTorqueNm = 0;
      }

      // 3. Magnetic Stirrer Execution
      if (!state.magneticActive || state.stirrerStallFault) {
        state.magneticActualRPM = 0;
      } else {
        state.magneticActualRPM = state.magneticTargetRPM;
      }
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.states));
  }
}

export const simulatorController = new SimulatorReactorController();
