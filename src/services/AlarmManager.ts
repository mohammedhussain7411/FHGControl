import type { AlarmItem, AlarmSeverity, ReactorState } from '../types/reactor';

export class AlarmManager {
  private activeAlarms: AlarmItem[] = [];
  private alarmHistory: AlarmItem[] = [];
  private subscribers: ((active: AlarmItem[], history: AlarmItem[]) => void)[] = [];
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initial sample alarm for demonstration if needed, or empty
  }

  public checkReactorFaults(states: ReactorState[]): void {
    states.forEach(r => {
      if (r.pt100Fault) {
        this.raiseAlarm(r.id, `PT100_FAULT_R${r.id}`, `Reactor ${r.id}: PT100 temperature sensor open/short circuit!`, 'CRITICAL');
      }
      if (r.overTempFault) {
        this.raiseAlarm(r.id, `OVER_TEMP_R${r.id}`, `Reactor ${r.id}: Temperature exceeded safety upper limit (200°C)!`, 'SAFETY');
      }
      if (r.stirrerStallFault) {
        this.raiseAlarm(r.id, `STIRRER_STALL_R${r.id}`, `Reactor ${r.id}: Stirrer motor overload/stall detected!`, 'ERROR');
      }
      if (r.chillerTripFault) {
        this.raiseAlarm(0, `CHILLER_TRIP`, `System: Internal compressor chiller fault trip!`, 'ERROR');
      }
      if (r.commLossFault) {
        this.raiseAlarm(0, `COMM_LOSS`, `System: Communication loss with STM32H743 main controller!`, 'SAFETY');
      }
    });
  }

  public raiseAlarm(
    reactorId: number,
    code: string,
    message: string,
    severity: AlarmSeverity
  ): void {
    // Check if already active
    const existing = this.activeAlarms.find(a => a.code === code && a.reactorId === reactorId);
    if (existing) return;

    const alarm: AlarmItem = {
      id: `ALM-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      reactorId,
      code,
      message,
      severity,
      acknowledged: false,
      cleared: false,
    };

    this.activeAlarms.unshift(alarm);
    this.alarmHistory.unshift(alarm);

    if (severity === 'CRITICAL' || severity === 'SAFETY') {
      this.playAlarmSound();
    }

    this.notifySubscribers();
  }

  public acknowledgeAlarm(id: string, username: string = 'Operator'): void {
    const active = this.activeAlarms.find(a => a.id === id);
    if (active) {
      active.acknowledged = true;
      active.acknowledgedBy = username;
      active.acknowledgedAt = new Date().toLocaleTimeString();
    }

    const hist = this.alarmHistory.find(a => a.id === id);
    if (hist) {
      hist.acknowledged = true;
      hist.acknowledgedBy = username;
      hist.acknowledgedAt = new Date().toLocaleTimeString();
    }

    this.notifySubscribers();
  }

  public acknowledgeAll(username: string = 'Operator'): void {
    const timeStr = new Date().toLocaleTimeString();
    this.activeAlarms.forEach(a => {
      a.acknowledged = true;
      a.acknowledgedBy = username;
      a.acknowledgedAt = timeStr;
    });
    this.alarmHistory.forEach(a => {
      if (!a.acknowledged) {
        a.acknowledged = true;
        a.acknowledgedBy = username;
        a.acknowledgedAt = timeStr;
      }
    });
    this.notifySubscribers();
  }

  public clearAlarm(id: string): void {
    this.activeAlarms = this.activeAlarms.filter(a => a.id !== id);
    const hist = this.alarmHistory.find(a => a.id === id);
    if (hist) hist.cleared = true;
    this.notifySubscribers();
  }

  public getActiveAlarms(): AlarmItem[] {
    return this.activeAlarms;
  }

  public getAlarmHistory(): AlarmItem[] {
    return this.alarmHistory;
  }

  public subscribe(callback: (active: AlarmItem[], history: AlarmItem[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.activeAlarms, this.alarmHistory);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private playAlarmSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.activeAlarms, this.alarmHistory));
  }
}

export const alarmManager = new AlarmManager();
