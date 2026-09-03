import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, CheckCircle, Filter } from 'lucide-react';
import type { AlarmItem, AlarmSeverity } from '../types/reactor';
import { alarmManager } from '../services/AlarmManager';

export const AlarmView: React.FC = () => {
  const [activeAlarms, setActiveAlarms] = useState<AlarmItem[]>(alarmManager.getActiveAlarms());
  const [alarmHistory, setAlarmHistory] = useState<AlarmItem[]>(alarmManager.getAlarmHistory());
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsub = alarmManager.subscribe((active, history) => {
      setActiveAlarms([...active]);
      setAlarmHistory([...history]);
    });
    return unsub;
  }, []);

  const handleAcknowledge = (id: string) => {
    alarmManager.acknowledgeAlarm(id, 'Operator');
  };

  const handleAcknowledgeAll = () => {
    alarmManager.acknowledgeAll('Operator');
  };

  const filteredHistory = alarmHistory.filter(a => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  const getSeverityBadge = (sev: AlarmSeverity) => {
    const styles: { [key in AlarmSeverity]: { bg: string; color: string; border: string } } = {
      SAFETY: { bg: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', border: '#ef4444' },
      CRITICAL: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.5)' },
      ERROR: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.5)' },
      WARNING: { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.4)' },
      INFO: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' },
    };
    const s = styles[sev] || styles.INFO;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        {sev}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Active Alarms Section */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} color={activeAlarms.length > 0 ? '#ef4444' : '#10b981'} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Active System Alarms ({activeAlarms.length})
            </h2>
          </div>

          {activeAlarms.length > 0 && (
            <button onClick={handleAcknowledgeAll} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
              <CheckCircle size={14} /> Acknowledge All Alarms
            </button>
          )}
        </div>

        {activeAlarms.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={20} /> All parameters operating within normal safety limits. No active alarms.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeAlarms.map(a => (
              <div
                key={a.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: `1px solid ${a.severity === 'CRITICAL' || a.severity === 'SAFETY' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: a.severity === 'CRITICAL' ? '0 0 15px rgba(239, 68, 68, 0.25)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {getSeverityBadge(a.severity)}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                      {a.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Time: {a.timestamp} • Code: {a.code} • Target: {a.reactorId > 0 ? `Reactor ${a.reactorId}` : 'Main System'}
                    </div>
                  </div>
                </div>

                {a.acknowledged ? (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ Acked by {a.acknowledgedBy}
                  </span>
                ) : (
                  <button onClick={() => handleAcknowledge(a.id)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alarm History Table */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#38bdf8" /> Alarm Audit History
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Severities</option>
              <option value="SAFETY">SAFETY</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px' }}>Timestamp</th>
                <th style={{ padding: '8px' }}>Severity</th>
                <th style={{ padding: '8px' }}>Target</th>
                <th style={{ padding: '8px' }}>Code</th>
                <th style={{ padding: '8px' }}>Message</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px' }} className="font-mono">{h.timestamp}</td>
                  <td style={{ padding: '8px' }}>{getSeverityBadge(h.severity)}</td>
                  <td style={{ padding: '8px' }}>{h.reactorId > 0 ? `Reactor ${h.reactorId}` : 'System'}</td>
                  <td style={{ padding: '8px' }} className="font-mono">{h.code}</td>
                  <td style={{ padding: '8px', color: '#ffffff' }}>{h.message}</td>
                  <td style={{ padding: '8px' }}>
                    {h.acknowledged ? (
                      <span style={{ color: '#10b981' }}>Acked ({h.acknowledgedBy})</span>
                    ) : (
                      <span style={{ color: '#ef4444' }}>Unacknowledged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
