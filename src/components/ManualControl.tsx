import React, { useState } from 'react';
import { 
  Thermometer, 
  Fan, 
  Flame, 
  Snowflake, 
  Clock
} from 'lucide-react';
import type { ReactorState } from '../types/reactor';
import type { IReactorController } from '../services/IReactorController';
import { auditLogger } from '../services/AuditLogger';

interface ManualControlProps {
  reactors: ReactorState[];
  selectedReactorId: number;
  onSelectReactorId: (id: number) => void;
  controller: IReactorController;
}

export const ManualControl: React.FC<ManualControlProps> = ({
  reactors,
  selectedReactorId,
  onSelectReactorId,
  controller
}) => {
  const currentReactor = reactors.find(r => r.id === selectedReactorId) || reactors[0];

  const [tempInput, setTempInput] = useState<string>(currentReactor.targetTemp.toString());
  const [overheadInput, setOverheadInput] = useState<string>(currentReactor.overheadTargetRPM.toString());
  const [magneticInput, setMagneticInput] = useState<string>(currentReactor.magneticTargetRPM.toString());

  // Update local input state when selected reactor changes
  React.useEffect(() => {
    setTempInput(currentReactor.targetTemp.toString());
    setOverheadInput(currentReactor.overheadTargetRPM.toString());
    setMagneticInput(currentReactor.magneticTargetRPM.toString());
  }, [selectedReactorId, currentReactor.targetTemp, currentReactor.overheadTargetRPM, currentReactor.magneticTargetRPM]);

  const handleApplyTemp = (val: number) => {
    const clamped = Math.max(-20, Math.min(200, val));
    setTempInput(clamped.toString());
    controller.setTargetTemperature(currentReactor.id, clamped);
    auditLogger.logAction('Operator', 'OPERATOR', 'Manual Temperature Changed', `Reactor ${currentReactor.id} target temp set to ${clamped}°C`, currentReactor.id, `${currentReactor.targetTemp}°C`, `${clamped}°C`);
  };

  const handleApplyOverhead = (val: number) => {
    const clamped = val <= 0 ? 0 : Math.max(50, Math.min(1500, val));
    setOverheadInput(clamped.toString());
    controller.setOverheadSpeed(currentReactor.id, clamped);
  };

  const handleApplyMagnetic = (val: number) => {
    const clamped = val <= 0 ? 0 : Math.max(100, Math.min(2000, val));
    setMagneticInput(clamped.toString());
    controller.setMagneticSpeed(currentReactor.id, clamped);
  };

  const handleToggleTabStirring = (e: React.MouseEvent, r: ReactorState) => {
    e.stopPropagation();
    const isStirring = (r.overheadActive && r.overheadActualRPM > 0) || (r.magneticActive && r.magneticActualRPM > 0);
    if (isStirring) {
      controller.stopOverheadStirrer(r.id);
      controller.stopMagneticStirrer(r.id);
    } else {
      const targetOverhead = r.overheadTargetRPM > 0 ? r.overheadTargetRPM : 600;
      controller.setOverheadSpeed(r.id, targetOverhead);
      controller.startOverheadStirrer(r.id);
    }
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCurrentOverheadRunning = currentReactor.overheadActive && currentReactor.overheadActualRPM > 0;
  const isCurrentMagneticRunning = currentReactor.magneticActive && currentReactor.magneticActualRPM > 0;
  const isCurrentStirringActive = isCurrentOverheadRunning || isCurrentMagneticRunning;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Reactor Selector Tabs */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {reactors.map(r => {
          const isSelected = r.id === selectedReactorId;
          const isStirringActive = (r.overheadActive && r.overheadActualRPM > 0) || (r.magneticActive && r.magneticActualRPM > 0);
          return (
            <button
              key={r.id}
              onClick={() => onSelectReactorId(r.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-glass)',
                background: isSelected ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)' : 'rgba(18, 24, 38, 0.6)',
                color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{
                background: isSelected ? '#0284c7' : 'rgba(148, 163, 184, 0.2)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem'
              }}>
                R{r.id}
              </span>
              <span>{r.name}</span>
              
              {/* Clickable Fan Icon on Tab Header */}
              <span 
                onClick={(e) => handleToggleTabStirring(e, r)}
                title={isStirringActive ? "Click Fan to Stop Stirring" : "Click Fan to Start Stirring"}
                style={{ padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Fan size={16} className={isStirringActive ? 'spin-fast' : ''} color={isStirringActive ? '#10b981' : '#64748b'} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Control Console for Selected Reactor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* 1. TEMPERATURE SUBSYSTEM PANEL */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={20} color="#f97316" /> TEMPERATURE CONTROL
            </h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>
              Range: -20°C to +200°C
            </span>
          </div>

          {/* Actual vs Target Temperature Display */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTUAL TEMP (PT100)</div>
              <div className="font-mono" style={{ fontSize: '2.4rem', fontWeight: 700, color: currentReactor.currentTemp > 75 ? '#f97316' : '#38bdf8' }}>
                {currentReactor.pt100Fault ? 'FAULT' : `${currentReactor.currentTemp.toFixed(1)}°C`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TARGET SETPOINT</div>
              <div className="font-mono" style={{ fontSize: '2.4rem', fontWeight: 700, color: '#ffffff' }}>
                {currentReactor.targetTemp.toFixed(1)}°C
              </div>
            </div>
          </div>

          {/* Slider & Precision Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Set Target Temperature (°C)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="-20"
                max="200"
                step="0.5"
                value={tempInput}
                onChange={(e) => handleApplyTemp(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
              />
              <input
                type="number"
                min="-20"
                max="200"
                step="0.1"
                className="font-mono"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                onBlur={() => handleApplyTemp(parseFloat(tempInput))}
                style={{
                  width: '90px',
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              />
            </div>
          </div>

          {/* Quick Temperature Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[-20, 0, 25, 50, 80, 120, 180, 200].map(t => (
              <button
                key={t}
                onClick={() => handleApplyTemp(t)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {t}°C
              </button>
            ))}
          </div>

          {/* Heating / Cooling Action Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={() => currentReactor.heatingActive ? controller.stopHeating(currentReactor.id) : controller.startHeating(currentReactor.id)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: currentReactor.heatingActive ? '1px solid #f97316' : '1px solid var(--border-glass)',
                background: currentReactor.heatingActive ? 'rgba(249, 115, 22, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                color: currentReactor.heatingActive ? '#f97316' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Flame size={18} /> {currentReactor.heatingActive ? 'HEATER ON' : 'START HEATING'}
            </button>

            <button
              onClick={() => currentReactor.coolingActive ? controller.stopCooling(currentReactor.id) : controller.startCooling(currentReactor.id)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: currentReactor.coolingActive ? '1px solid #38bdf8' : '1px solid var(--border-glass)',
                background: currentReactor.coolingActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                color: currentReactor.coolingActive ? '#38bdf8' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Snowflake size={18} /> {currentReactor.coolingActive ? 'CHILLER ON' : 'START COOLING'}
            </button>
          </div>
        </div>

        {/* 2. DUAL STIRRING SUBSYSTEM PANEL */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                onClick={(e) => handleToggleTabStirring(e, currentReactor)}
                title={isCurrentStirringActive ? "Click Fan to Stop All Stirring" : "Click Fan to Start All Stirring"}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Fan size={22} color="#a855f7" className={isCurrentStirringActive ? 'spin-fast' : ''} />
              </span>
              <span>STIRRING CONTROL</span>
            </h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>
              Click Fan to Start / Stop
            </span>
          </div>

          {/* OVERHEAD STIRRER */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span 
                  onClick={() => isCurrentOverheadRunning ? controller.stopOverheadStirrer(currentReactor.id) : (controller.setOverheadSpeed(currentReactor.id, currentReactor.overheadTargetRPM || 600), controller.startOverheadStirrer(currentReactor.id))}
                  title={isCurrentOverheadRunning ? "Click to Stop Overhead Drive" : "Click to Start Overhead Drive"}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Fan size={18} className={isCurrentOverheadRunning ? 'spin-fast' : ''} />
                </span>
                OVERHEAD BLDC (50 - 1500 RPM)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Torque: {currentReactor.overheadTorqueNm} Nm
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', minWidth: '100px' }}>
                {currentReactor.overheadActualRPM} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RPM</span>
              </div>

              <input
                type="range"
                min="0"
                max="1500"
                step="25"
                value={overheadInput}
                onChange={(e) => handleApplyOverhead(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: '#a855f7', cursor: 'pointer' }}
              />

              <button
                onClick={() => isCurrentOverheadRunning ? controller.stopOverheadStirrer(currentReactor.id) : controller.startOverheadStirrer(currentReactor.id)}
                className={isCurrentOverheadRunning ? 'btn-danger' : 'btn-primary'}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {isCurrentOverheadRunning ? 'STOP' : 'START'}
              </button>
            </div>
          </div>

          {/* MAGNETIC STIRRER */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span 
                  onClick={() => isCurrentMagneticRunning ? controller.stopMagneticStirrer(currentReactor.id) : (controller.setMagneticSpeed(currentReactor.id, currentReactor.magneticTargetRPM || 800), controller.startMagneticStirrer(currentReactor.id))}
                  title={isCurrentMagneticRunning ? "Click to Stop Magnetic Drive" : "Click to Start Magnetic Drive"}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Fan size={18} className={isCurrentMagneticRunning ? 'spin-slow' : ''} />
                </span>
                MAGNETIC DRIVE (100 - 2000 RPM)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', minWidth: '100px' }}>
                {currentReactor.magneticActualRPM} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RPM</span>
              </div>

              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={magneticInput}
                onChange={(e) => handleApplyMagnetic(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: '#06b6d4', cursor: 'pointer' }}
              />

              <button
                onClick={() => isCurrentMagneticRunning ? controller.stopMagneticStirrer(currentReactor.id) : controller.startMagneticStirrer(currentReactor.id)}
                className={isCurrentMagneticRunning ? 'btn-danger' : 'btn-primary'}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {isCurrentMagneticRunning ? 'STOP' : 'START'}
              </button>
            </div>
          </div>

          {/* REACTOR STEP TIMER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REACTION STEP TIMER</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                  {formatTimer(currentReactor.stepTimerSeconds)}
                </div>
              </div>
            </div>

            <button
              onClick={() => controller.clearFaults(currentReactor.id)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              Reset Faults
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
