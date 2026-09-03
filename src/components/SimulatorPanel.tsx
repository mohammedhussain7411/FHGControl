import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { simulatorController } from '../services/SimulatorReactorController';
import { alarmManager } from '../services/AlarmManager';
import { auditLogger } from '../services/AuditLogger';

export const SimulatorPanel: React.FC = () => {
  const [faults, setFaults] = useState(simulatorController.faultConfig);
  const [speed, setSpeed] = useState(simulatorController.getSimSpeedMultiplier());

  const handleTogglePt100 = (idx: number) => {
    const next = [...faults.pt100Open] as [boolean, boolean, boolean, boolean];
    next[idx] = !next[idx];
    simulatorController.faultConfig.pt100Open = next;
    setFaults({ ...simulatorController.faultConfig });
    
    if (next[idx]) {
      alarmManager.raiseAlarm(idx + 1, `PT100_FAULT_R${idx+1}`, `Simulated PT100 sensor fault on Reactor ${idx+1}`, 'CRITICAL');
      auditLogger.logAction('Engineer', 'ENGINEER', 'Fault Injected', `Simulated PT100 fault on R${idx+1}`, idx + 1);
    }
  };

  const handleToggleOverTemp = (idx: number) => {
    const next = [...faults.overTemp] as [boolean, boolean, boolean, boolean];
    next[idx] = !next[idx];
    simulatorController.faultConfig.overTemp = next;
    setFaults({ ...simulatorController.faultConfig });

    if (next[idx]) {
      alarmManager.raiseAlarm(idx + 1, `OVER_TEMP_R${idx+1}`, `Simulated over-temperature cutoff limit on Reactor ${idx+1}`, 'SAFETY');
      auditLogger.logAction('Engineer', 'ENGINEER', 'Fault Injected', `Simulated Over-temp fault on R${idx+1}`, idx + 1);
    }
  };

  const handleToggleStall = (idx: number) => {
    const next = [...faults.stirrerStall] as [boolean, boolean, boolean, boolean];
    next[idx] = !next[idx];
    simulatorController.faultConfig.stirrerStall = next;
    setFaults({ ...simulatorController.faultConfig });

    if (next[idx]) {
      alarmManager.raiseAlarm(idx + 1, `STIRRER_STALL_R${idx+1}`, `Simulated BLDC motor stall on Reactor ${idx+1}`, 'ERROR');
      auditLogger.logAction('Engineer', 'ENGINEER', 'Fault Injected', `Simulated Motor stall fault on R${idx+1}`, idx + 1);
    }
  };

  const handleToggleChillerFailure = () => {
    const next = !faults.chillerFailure;
    simulatorController.faultConfig.chillerFailure = next;
    setFaults({ ...simulatorController.faultConfig });

    if (next) {
      alarmManager.raiseAlarm(0, 'CHILLER_TRIP', 'Simulated compressor chiller trip fault', 'ERROR');
      auditLogger.logAction('Engineer', 'ENGINEER', 'Fault Injected', 'Simulated Chiller trip');
    }
  };

  const handleToggleCommLoss = () => {
    const next = !faults.commLoss;
    simulatorController.faultConfig.commLoss = next;
    setFaults({ ...simulatorController.faultConfig });

    if (next) {
      alarmManager.raiseAlarm(0, 'COMM_LOSS', 'Simulated Ethernet / Modbus TCP communication drop', 'SAFETY');
      auditLogger.logAction('Engineer', 'ENGINEER', 'Fault Injected', 'Simulated Comm drop');
    }
  };

  const handleSetSpeed = (s: number) => {
    simulatorController.setSimSpeedMultiplier(s);
    setSpeed(s);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={24} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Hardware Physics Simulator & Diagnostic Fault Injection
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Simulate closed-loop thermal thermodynamics, motor acceleration, and inject hardware failure modes to test safety interlocks.
            </p>
          </div>
        </div>

        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Simulation Speed:</span>
          {[1, 2, 5, 10, 20].map(s => (
            <button
              key={s}
              onClick={() => handleSetSpeed(s)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: speed === s ? '#0284c7' : 'transparent',
                color: speed === s ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Fault Injection Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              Reactor {i + 1} Fault Injection
            </h3>

            <button
              onClick={() => handleTogglePt100(i)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: faults.pt100Open[i] ? '1px solid #ef4444' : '1px solid var(--border-glass)',
                background: faults.pt100Open[i] ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                color: faults.pt100Open[i] ? '#ef4444' : 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              ⚡ PT100 Sensor Open Circuit: {faults.pt100Open[i] ? 'INJECTED (FAULT)' : 'Normal'}
            </button>

            <button
              onClick={() => handleToggleOverTemp(i)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: faults.overTemp[i] ? '1px solid #ef4444' : '1px solid var(--border-glass)',
                background: faults.overTemp[i] ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                color: faults.overTemp[i] ? '#ef4444' : 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              🔥 Over-Temp Cutoff (&gt;200°C): {faults.overTemp[i] ? 'INJECTED (FAULT)' : 'Normal'}
            </button>

            <button
              onClick={() => handleToggleStall(i)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: faults.stirrerStall[i] ? '1px solid #f59e0b' : '1px solid var(--border-glass)',
                background: faults.stirrerStall[i] ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                color: faults.stirrerStall[i] ? '#f59e0b' : 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              ⚙ Motor Overload / Stall: {faults.stirrerStall[i] ? 'INJECTED (STALL)' : 'Normal'}
            </button>
          </div>
        ))}
      </div>

      {/* Global System Level Faults */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Global Subsystem Fault Triggers
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button
            onClick={handleToggleChillerFailure}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: faults.chillerFailure ? '1px solid #ef4444' : '1px solid var(--border-glass)',
              background: faults.chillerFailure ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.6)',
              color: faults.chillerFailure ? '#ef4444' : 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ❄ Compressor Chiller Failure Trip: {faults.chillerFailure ? 'TRIPPED' : 'Normal'}
          </button>

          <button
            onClick={handleToggleCommLoss}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: faults.commLoss ? '1px solid #ef4444' : '1px solid var(--border-glass)',
              background: faults.commLoss ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.6)',
              color: faults.commLoss ? '#ef4444' : 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔌 Ethernet / Modbus TCP Connection Drop: {faults.commLoss ? 'DISCONNECTED' : 'Normal'}
          </button>
        </div>
      </div>

    </div>
  );
};
