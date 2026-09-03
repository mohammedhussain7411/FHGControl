export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED_SIMULATOR' | 'CONNECTED_HARDWARE' | 'ERROR';

export type UserRole = 'ADMINISTRATOR' | 'ENGINEER' | 'OPERATOR' | 'VIEWER';

export interface UserSession {
  username: string;
  role: UserRole;
  token: string;
  loginTime: string;
}

export type AlarmSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SAFETY';

export interface AlarmItem {
  id: string;
  timestamp: string;
  reactorId: number; // 1-4, or 0 for system
  code: string;
  message: string;
  severity: AlarmSeverity;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  cleared: boolean;
}

export interface ReactorState {
  id: number; // 1..4
  name: string;
  
  // Temperature (Dual Sensors: Internal Reactor & Circulating Fluid Jacket)
  currentTemp: number;        // °C (Active control temperature: reactorTemp or jacketTemp)
  reactorTemp: number;        // °C (Internal reaction solution PT100 sensor)
  jacketTemp: number;         // °C (Thermal fluid circulating jacket PT100 sensor)
  targetTemp: number;         // °C (-20°C to +200°C)
  controlMode: 'REACTOR' | 'JACKET'; // Which temperature sensor is being controlled by PID
  heatingActive: boolean;
  coolingActive: boolean;
  thermalPowerPct: number;    // -100% (max cooling) to +100% (max heating)
  
  // Stirring - Overhead
  overheadActualRPM: number;  // 0, 50 - 1500
  overheadTargetRPM: number;  // 50 - 1500
  overheadActive: boolean;
  overheadTorqueNm: number;   // Torque readout
  
  // Stirring - Magnetic
  magneticActualRPM: number;  // 0, 100 - 2000
  magneticTargetRPM: number;  // 100 - 2000
  magneticActive: boolean;
  
  // Operational State
  status: 'IDLE' | 'READY' | 'RUNNING' | 'PAUSED' | 'ALARM' | 'MAINTENANCE';
  mode: 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'SERVICE' | 'SIMULATION';
  
  // Timer & Batch
  stepTimerSeconds: number;
  activeBatchId?: string;
  activeRecipeName?: string;
  currentStepIndex?: number;
  totalSteps?: number;
  
  // Fault Flags
  pt100Fault: boolean;
  overTempFault: boolean;
  stirrerStallFault: boolean;
  chillerTripFault: boolean;
  commLossFault: boolean;
}

export interface TelemetryPoint {
  timestamp: number; // ms epoch
  timeFormatted: string;
  r1Temp: number;
  r1TargetTemp: number;
  r1OverheadRPM: number;
  r1MagneticRPM: number;
  r1Power: number;
  
  r2Temp: number;
  r2TargetTemp: number;
  r2OverheadRPM: number;
  r2MagneticRPM: number;
  r2Power: number;
  
  r3Temp: number;
  r3TargetTemp: number;
  r3OverheadRPM: number;
  r3MagneticRPM: number;
  r3Power: number;
  
  r4Temp: number;
  r4TargetTemp: number;
  r4OverheadRPM: number;
  r4MagneticRPM: number;
  r4Power: number;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  name: string;
  targetTemp: number;          // °C
  overheadRPM: number;         // RPM
  magneticRPM: number;         // RPM
  heating: boolean;
  cooling: boolean;
  durationSeconds: number;     // Hold duration once reached
  waitCondition: 'TIME' | 'TEMP_REACHED' | 'OPERATOR_CONFIRM' | 'NONE';
  operatorPrompt?: string;     // e.g. "Add 50mL reagent X"
}

export interface Recipe {
  id: string;
  name: string;
  version: number;
  author: string;
  description: string;
  targetReactorIds: number[];  // e.g. [1] or [1,2,3,4]
  steps: RecipeStep[];
  createdDate: string;
  modifiedDate: string;
}

export interface BatchRecord {
  id: string;
  recipeId: string;
  recipeName: string;
  reactorId: number;
  operator: string;
  startTime: string;
  endTime?: string;
  status: 'COMPLETED' | 'ABORTED' | 'RUNNING';
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  maxOverheadRPM: number;
  maxMagneticRPM: number;
  alarmsCount: number;
  telemetryData: TelemetryPoint[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  userRole: UserRole;
  action: string;
  reactorId?: number;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface SimulatorFaultConfig {
  pt100Open: [boolean, boolean, boolean, boolean];
  overTemp: [boolean, boolean, boolean, boolean];
  stirrerStall: [boolean, boolean, boolean, boolean];
  chillerFailure: boolean;
  commLoss: boolean;
  thermalLagSpeed: number; // 1x, 5x, 10x simulation speed multiplier
}
