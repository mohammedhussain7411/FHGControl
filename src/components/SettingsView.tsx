import React, { useState } from 'react';
import { Settings, Network, Shield, Save } from 'lucide-react';
import { auditLogger } from '../services/AuditLogger';

export const SettingsView: React.FC = () => {
  const [modbusIp, setModbusIp] = useState('192.168.1.100');
  const [modbusPort, setModbusPort] = useState('502');
  const [maxTempLimit, setMaxTempLimit] = useState('200');
  const [minTempLimit, setMinTempLimit] = useState('-20');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    auditLogger.logAction('System Admin', 'ADMINISTRATOR', 'Settings Updated', `Updated Modbus IP ${modbusIp}:${modbusPort}, Temp Limits [${minTempLimit}°C to ${maxTempLimit}°C]`);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={24} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>System Settings & Calibration</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure Modbus TCP parameters, safety bounds, and PT100 sensor calibration offsets.</p>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary">
          <Save size={16} /> Save Configuration
        </button>
      </div>

      {savedSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '8px', fontWeight: 600 }}>
          ✓ Configuration saved and applied to system controller.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Modbus Communication Config */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} /> Modbus TCP / Ethernet Setup
          </h3>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Main Controller IP Address</label>
            <input
              type="text"
              className="font-mono"
              value={modbusIp}
              onChange={(e) => setModbusIp(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modbus TCP Port</label>
            <input
              type="text"
              className="font-mono"
              value={modbusPort}
              onChange={(e) => setModbusPort(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
            />
          </div>
        </div>

        {/* Safety Boundary Limits */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} /> Thermal Safety Hard Boundaries
          </h3>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Maximum Allowed Temperature Limit (°C)</label>
            <input
              type="number"
              className="font-mono"
              value={maxTempLimit}
              onChange={(e) => setMaxTempLimit(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#ef4444', marginTop: '4px', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Minimum Allowed Temperature Limit (°C)</label>
            <input
              type="number"
              className="font-mono"
              value={minTempLimit}
              onChange={(e) => setMinTempLimit(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#38bdf8', marginTop: '4px', fontWeight: 700 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
