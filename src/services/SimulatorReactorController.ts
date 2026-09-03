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
    const isHeating = targetTemp >= currentTemp;
    return {
      id,
      name,
      currentTemp,
      reactorTemp: currentTemp,
      jacketTemp: currentTemp + (isHeating ? 2.5 : -2.5),
      targetTemp,
      controlMode: 'REACTOR',
      heatingActive: isHeating,
      coolingActive: !isHeating,
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

  public async setControlMode(reactorId: number, mode: 'REACTOR' | 'JACKET'): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].controlMode = mode;
      this.integralErr[idx] = 0; // reset PID integral on control mode switch
      this.notifySubscribers();
    }
  }

  public async setTargetTemperature(reactorId: number, tempCelsius: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      const clamped = Math.max(-20, Math.min(200, tempCelsius));
      this.states[idx].targetTemp = clamped;
      this.integralErr[idx] = 0; // reset integral on new setpoint

      const activeTemp = this.states[idx].controlMode === 'REACTOR' ? this.states[idx].reactorTemp : this.states[idx].jacketTemp;
      if (this.states[idx].heatingActive || this.states[idx].coolingActive) {
        if (clamped >= activeTemp) {
          this.states[idx].heatingActive = true;
          this.states[idx].coolingActive = false;
        } else {
          this.states[idx].coolingActive = true;
          this.states[idx].heatingActive = false;
        }
      }

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
      const state = this.states[idx];
      const activeTemp = state.controlMode === 'REACTOR' ? state.reactorTemp : state.jacketTemp;
      if (state.targetTemp >= activeTemp) {
        state.heatingActive = true;
        state.coolingActive = false;
      } else {
        state.coolingActive = true;
        state.heatingActive = false;
      }
      this.notifySubscribers();
    }
  }

  public async stopHeating(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].heatingActive = false;
      this.states[idx].coolingActive = false;
      this.states[idx].thermalPowerPct = 0;
      this.notifySubscribers();
    }
  }

  public async startCooling(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      const state = this.states[idx];
      const activeTemp = state.controlMode === 'REACTOR' ? state.reactorTemp : state.jacketTemp;
      if (state.targetTemp < activeTemp) {
        state.coolingActive = true;
        state.heatingActive = false;
      } else {
        state.heatingActive = true;
        state.coolingActive = false;
      }
      this.notifySubscribers();
    }
  }

  public async stopCooling(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
      this.states[idx].heatingActive = false;
      this.states[idx].coolingActive = false;
      this.states[idx].thermalPowerPct = 0;
      this.notifySubscribers();
    }
  }

  public async startOverheadStirrer(reactorId: number): Promise<void> {
    const idx = reactorId - 1;
    if (idx >= 0 && idx < 4) {
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
      r.thermalPowerPct = 0;
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

  // --- Physics & Dual-Jacket Thermodynamics Simulation Loop ---

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

      const activeTemp = state.controlMode === 'REACTOR' ? state.reactorTemp : state.jacketTemp;

      // AUTOMATIC CLIMATE CONTROL SWITCHING (only if thermal control is active):
      if (state.heatingActive || state.coolingActive) {
        if (state.targetTemp > activeTemp + 0.1) {
          state.heatingActive = true;
          state.coolingActive = false;
        } else if (state.targetTemp < activeTemp - 0.1) {
          state.coolingActive = true;
          state.heatingActive = false;
        }
      }

      // Check Fault Injections
      state.pt100Fault = this.faultConfig.pt100Open[i];
      state.overTempFault = this.faultConfig.overTemp[i] || state.reactorTemp > 210 || state.jacketTemp > 210;
      state.stirrerStallFault = this.faultConfig.stirrerStall[i];
      state.chillerTripFault = this.faultConfig.chillerFailure;
      state.commLossFault = this.faultConfig.commLoss;

      if (state.pt100Fault || state.overTempFault || state.stirrerStallFault || state.commLossFault) {
        state.status = 'ALARM';
        state.heatingActive = false;
        state.coolingActive = false;
        state.thermalPowerPct = 0;
      }

      // 1. Dual-Jacket Thermodynamics & PID Simulation
      if (state.pt100Fault) {
        state.reactorTemp = -999;
        state.jacketTemp = -999;
        state.currentTemp = -999;
      } else {
        const isThermalActive = state.heatingActive || state.coolingActive;

        if (!isThermalActive) {
          // Thermal control is STOPPED by Play/Stop button -> zero thermal power, cools naturally to ambient
          state.thermalPowerPct = 0;
          const kLossJacket = 0.010;
          const kLossReactor = 0.005;
          const kJacketToReactor = 0.035;

          state.jacketTemp -= kLossJacket * (state.jacketTemp - ambientTemp) * dt;
          state.reactorTemp += kJacketToReactor * (state.jacketTemp - state.reactorTemp) * dt;
          state.reactorTemp -= kLossReactor * (state.reactorTemp - ambientTemp) * dt;
        } else {
          const err = state.targetTemp - activeTemp;
          
          // PID gains
          const Kp = 6.5;
          const Ki = 0.06;
          const Kd = 1.3;

          this.integralErr[i] += err * dt;
          this.integralErr[i] = Math.max(-100, Math.min(100, this.integralErr[i]));
          const derivErr = (err - this.lastErr[i]) / dt;
          this.lastErr[i] = err;

          let pidOutput = Kp * err + Ki * this.integralErr[i] + Kd * derivErr;

          if (!state.heatingActive && pidOutput > 0) pidOutput = 0;
          if (!state.coolingActive && pidOutput < 0) pidOutput = 0;

          pidOutput = Math.max(-100, Math.min(100, pidOutput));
          state.thermalPowerPct = Number(pidOutput.toFixed(1));

          // Heat transfer equations for Jacket & Reactor fluid:
          const kJacketLoss = 0.008;
          const kJacketToReactor = 0.040;
          const kReactorLoss = 0.003;

          const heaterRate = pidOutput > 0 ? pidOutput * 0.050 : 0;
          const chillerRate = pidOutput < 0 ? pidOutput * 0.045 : 0;

          // Jacket responds directly to thermal unit:
          const dJacket = (heaterRate + chillerRate - kJacketLoss * (state.jacketTemp - ambientTemp) - kJacketToReactor * (state.jacketTemp - state.reactorTemp)) * dt;
          state.jacketTemp += dJacket;

          // Reactor fluid receives heat transfer from jacket:
          const dReactor = (kJacketToReactor * (state.jacketTemp - state.reactorTemp) - kReactorLoss * (state.reactorTemp - ambientTemp)) * dt;
          state.reactorTemp += dReactor;
        }

        state.reactorTemp = Number(state.reactorTemp.toFixed(2));
        state.jacketTemp = Number(state.jacketTemp.toFixed(2));
        state.currentTemp = state.controlMode === 'REACTOR' ? state.reactorTemp : state.jacketTemp;
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
