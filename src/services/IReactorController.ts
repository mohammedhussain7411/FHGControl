import type { ReactorState, ConnectionStatus } from '../types/reactor';

export interface IReactorController {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
  
  // High-level Reactor Commands
  setTargetTemperature(reactorId: number, tempCelsius: number): Promise<void>;
  setControlMode(reactorId: number, mode: 'REACTOR' | 'JACKET'): Promise<void>;
  setOverheadSpeed(reactorId: number, rpm: number): Promise<void>;
  setMagneticSpeed(reactorId: number, rpm: number): Promise<void>;
  
  startHeating(reactorId: number): Promise<void>;
  stopHeating(reactorId: number): Promise<void>;
  
  startCooling(reactorId: number): Promise<void>;
  stopCooling(reactorId: number): Promise<void>;
  
  startOverheadStirrer(reactorId: number): Promise<void>;
  stopOverheadStirrer(reactorId: number): Promise<void>;
  
  startMagneticStirrer(reactorId: number): Promise<void>;
  stopMagneticStirrer(reactorId: number): Promise<void>;
  
  emergencyStopAll(): Promise<void>;
  clearFaults(reactorId: number): Promise<void>;
  
  // Status Query
  getReactorStates(): ReactorState[];
  onStateUpdate(callback: (states: ReactorState[]) => void): () => void;
}
