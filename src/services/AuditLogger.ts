import type { AuditLogEntry, UserRole } from '../types/reactor';

export class AuditLogger {
  private logs: AuditLogEntry[] = [
    {
      id: 'AUD-001',
      timestamp: new Date().toLocaleTimeString(),
      username: 'System Admin',
      userRole: 'ADMINISTRATOR',
      action: 'System Startup',
      details: 'FH G Control 1.0 initialized in Simulator Mode',
    }
  ];
  private subscribers: ((logs: AuditLogEntry[]) => void)[] = [];

  public logAction(
    username: string,
    role: UserRole,
    action: string,
    details: string,
    reactorId?: number,
    oldValue?: string,
    newValue?: string
  ): void {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      username,
      userRole: role,
      action,
      reactorId,
      details,
      oldValue,
      newValue,
    };

    this.logs.unshift(entry);
    this.notifySubscribers();
  }

  public getLogs(): AuditLogEntry[] {
    return this.logs;
  }

  public subscribe(callback: (logs: AuditLogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.logs);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  public exportCSV(): string {
    const headers = ['Timestamp', 'Username', 'Role', 'Reactor', 'Action', 'Details', 'Old Value', 'New Value'].join(',');
    const rows = this.logs.map(l => [
      l.timestamp,
      `"${l.username}"`,
      l.userRole,
      l.reactorId ? `R${l.reactorId}` : 'System',
      `"${l.action}"`,
      `"${l.details}"`,
      `"${l.oldValue || ''}"`,
      `"${l.newValue || ''}"`
    ].join(','));
    return [headers, ...rows].join('\n');
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.logs));
  }
}

export const auditLogger = new AuditLogger();
