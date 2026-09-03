import type { TelemetryPoint, ReactorState, BatchRecord } from '../types/reactor';

export class TelemetryLogger {
  private history: TelemetryPoint[] = [];
  private maxHistoryLength: number = 600; // 10 minutes at 1 point/sec
  private subscribers: ((data: TelemetryPoint[]) => void)[] = [];

  public addSample(states: ReactorState[]): void {
    if (states.length < 4) return;

    const r1 = states[0];
    const r2 = states[1];
    const r3 = states[2];
    const r4 = states[3];

    const now = Date.now();
    const dateObj = new Date(now);
    const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

    const point: TelemetryPoint = {
      timestamp: now,
      timeFormatted: timeStr,
      r1Temp: r1.pt100Fault ? NaN : r1.currentTemp,
      r1TargetTemp: r1.targetTemp,
      r1OverheadRPM: r1.overheadActualRPM,
      r1MagneticRPM: r1.magneticActualRPM,
      r1Power: r1.thermalPowerPct,

      r2Temp: r2.pt100Fault ? NaN : r2.currentTemp,
      r2TargetTemp: r2.targetTemp,
      r2OverheadRPM: r2.overheadActualRPM,
      r2MagneticRPM: r2.magneticActualRPM,
      r2Power: r2.thermalPowerPct,

      r3Temp: r3.pt100Fault ? NaN : r3.currentTemp,
      r3TargetTemp: r3.targetTemp,
      r3OverheadRPM: r3.overheadActualRPM,
      r3MagneticRPM: r3.magneticActualRPM,
      r3Power: r3.thermalPowerPct,

      r4Temp: r4.pt100Fault ? NaN : r4.currentTemp,
      r4TargetTemp: r4.targetTemp,
      r4OverheadRPM: r4.overheadActualRPM,
      r4MagneticRPM: r4.magneticActualRPM,
      r4Power: r4.thermalPowerPct,
    };

    this.history.push(point);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    this.notifySubscribers();
  }

  public getHistory(): TelemetryPoint[] {
    return this.history;
  }

  public subscribe(callback: (data: TelemetryPoint[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.history);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  public clearHistory(): void {
    this.history = [];
    this.notifySubscribers();
  }

  public exportCSV(): string {
    const headers = [
      'Timestamp',
      'Time',
      'R1_Temp_C', 'R1_Target_C', 'R1_Overhead_RPM', 'R1_Magnetic_RPM', 'R1_Power_Pct',
      'R2_Temp_C', 'R2_Target_C', 'R2_Overhead_RPM', 'R2_Magnetic_RPM', 'R2_Power_Pct',
      'R3_Temp_C', 'R3_Target_C', 'R3_Overhead_RPM', 'R3_Magnetic_RPM', 'R3_Power_Pct',
      'R4_Temp_C', 'R4_Target_C', 'R4_Overhead_RPM', 'R4_Magnetic_RPM', 'R4_Power_Pct',
    ].join(',');

    const rows = this.history.map(p => [
      p.timestamp,
      p.timeFormatted,
      p.r1Temp, p.r1TargetTemp, p.r1OverheadRPM, p.r1MagneticRPM, p.r1Power,
      p.r2Temp, p.r2TargetTemp, p.r2OverheadRPM, p.r2MagneticRPM, p.r2Power,
      p.r3Temp, p.r3TargetTemp, p.r3OverheadRPM, p.r3MagneticRPM, p.r3Power,
      p.r4Temp, p.r4TargetTemp, p.r4OverheadRPM, p.r4MagneticRPM, p.r4Power,
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  public generateBatchSummary(
    batchId: string,
    recipeId: string,
    recipeName: string,
    reactorId: number,
    operator: string,
    startTime: string
  ): BatchRecord {
    const rKey = `r${reactorId}Temp` as keyof TelemetryPoint;
    const ovKey = `r${reactorId}OverheadRPM` as keyof TelemetryPoint;
    const magKey = `r${reactorId}MagneticRPM` as keyof TelemetryPoint;

    const temps = this.history.map(p => Number(p[rKey])).filter(t => !isNaN(t));
    const overheads = this.history.map(p => Number(p[ovKey])).filter(v => !isNaN(v));
    const magnetics = this.history.map(p => Number(p[magKey])).filter(v => !isNaN(v));

    const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
    const avgTemp = temps.length > 0 ? Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)) : 0;

    const maxOverheadRPM = overheads.length > 0 ? Math.max(...overheads) : 0;
    const maxMagneticRPM = magnetics.length > 0 ? Math.max(...magnetics) : 0;

    return {
      id: batchId,
      recipeId,
      recipeName,
      reactorId,
      operator,
      startTime,
      endTime: new Date().toISOString(),
      status: 'COMPLETED',
      minTemp,
      maxTemp,
      avgTemp,
      maxOverheadRPM,
      maxMagneticRPM,
      alarmsCount: 0,
      telemetryData: [...this.history],
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.history));
  }
}

export const telemetryLogger = new TelemetryLogger();
