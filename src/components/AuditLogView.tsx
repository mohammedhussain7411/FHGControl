import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Search } from 'lucide-react';
import type { AuditLogEntry } from '../types/reactor';
import { auditLogger } from '../services/AuditLogger';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(auditLogger.getLogs());
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const unsub = auditLogger.subscribe(updated => {
      setLogs([...updated]);
    });
    return unsub;
  }, []);

  const handleExportCSV = () => {
    const csvContent = auditLogger.exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FH_G_1.0_AuditTrail_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (
      l.username.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term) ||
      l.userRole.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="#10b981" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Security & Regulatory Compliance Audit Log
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tamper-evident audit log tracking every user login, setpoint change, recipe execution, and alarm event.
            </p>
          </div>
        </div>

        <button onClick={handleExportCSV} className="btn-primary" style={{ fontSize: '0.8rem' }}>
          <Download size={14} /> Export Audit CSV
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search audit actions, users, or setpoint details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px' }}>Timestamp</th>
              <th style={{ padding: '10px' }}>User</th>
              <th style={{ padding: '10px' }}>Role</th>
              <th style={{ padding: '10px' }}>Target</th>
              <th style={{ padding: '10px' }}>Action</th>
              <th style={{ padding: '10px' }}>Details</th>
              <th style={{ padding: '10px' }}>Old Value</th>
              <th style={{ padding: '10px' }}>New Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '10px' }} className="font-mono">{log.timestamp}</td>
                <td style={{ padding: '10px', color: '#ffffff', fontWeight: 600 }}>{log.username}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600 }}>[{log.userRole}]</span>
                </td>
                <td style={{ padding: '10px' }}>{log.reactorId ? `Reactor ${log.reactorId}` : 'System'}</td>
                <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 600 }}>{log.action}</td>
                <td style={{ padding: '10px' }}>{log.details}</td>
                <td style={{ padding: '10px', color: 'var(--text-dim)' }} className="font-mono">{log.oldValue || '-'}</td>
                <td style={{ padding: '10px', color: '#10b981' }} className="font-mono">{log.newValue || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
