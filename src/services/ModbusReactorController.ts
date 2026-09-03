import type { IReactorController } from './IReactorController';
import type { ReactorState, ConnectionStatus } from '../types/reactor';

export class ModbusReactorController implements IReactorController {
  private ipAddress: string;
  private port: number;
  private status: ConnectionStatus = 'DISCONNECTED';
  private subscribers: ((states: ReactorState[]) => void)[] = [];
  private states: ReactorState[] = [];

  constructor(ipAddress: string = '192.168.1.100', port: number = 502) {
    this.ipAddress = ipAddress;
    this.port = port;
  }

  public async connect(): Promise<boolean> {
    this.status = 'CONNECTING';
    this.notifySubscribers();
    try {
      console.log(`Connecting Modbus TCP to ${this.ipAddress}:${this.port}...`);
      this.status = 'CONNECTED_HARDWARE';
      this.notifySubscribers();
      return true;
    } catch (err) {
      console.error("Modbus connection failed:", err);
      this.status = 'ERROR';
      this.notifySubscribers();
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    this.notifySubscribers();
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  public async setControlMode(reactorId: number, mode: 'REACTOR' | 'JACKET'): Promise<void> {
    console.log(`[Modbus TCP] Write HoldingReg R${reactorId}_ControlMode = ${mode}`);
  }

  public async setTargetTemperature(reactorId: number, tempCelsius: number): Promise<void> {
    console.log(`[Modbus TCP] Write HoldingReg R${reactorId}_Temp = ${tempCelsius}°C`);
  }

  public async setOverheadSpeed(reactorId: number, rpm: number): Promise<void> {
    console.log(`[Modbus TCP] Write HoldingReg R${reactorId}_OverheadRPM = ${rpm}`);
  }

  public async setMagneticSpeed(reactorId: number, rpm: number): Promise<void> {
    console.log(`[Modbus TCP] Write HoldingReg R${reactorId}_MagneticRPM = ${rpm}`);
  }

  public async startHeating(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_HeatStart`);
  }

  public async stopHeating(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_HeatStop`);
  }

  public async startCooling(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_CoolStart`);
  }

  public async stopCooling(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_CoolStop`);
  }

  public async startOverheadStirrer(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_OverheadStart`);
  }

  public async stopOverheadStirrer(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_OverheadStop`);
  }

  public async startMagneticStirrer(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_MagneticStart`);
  }

  public async stopMagneticStirrer(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Write CmdBit R${reactorId}_MagneticStop`);
  }

  public async emergencyStopAll(): Promise<void> {
    console.log(`[Modbus TCP] Write Global emergency stop coil 00001 = HIGH`);
  }

  public async clearFaults(reactorId: number): Promise<void> {
    console.log(`[Modbus TCP] Reset Fault Coil R${reactorId}`);
  }

  public getReactorStates(): ReactorState[] {
    return this.states;
  }

  public onStateUpdate(callback: (states: ReactorState[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.states));
  }
}
