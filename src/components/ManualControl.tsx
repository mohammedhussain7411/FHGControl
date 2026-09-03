import React, { useState } from 'react';
import { 
  Thermometer, 
  Fan, 
  Flame, 
  Snowflake, 
  Clock,
  Play,
  Square
} from 'lucide-react';
import type { ReactorState } from '../types/reactor';
import type { IReactorController } from '../services/IReactorController';
import { auditLogger } from '../services/AuditLogger';
import { TempKeypadModal } from './TempKeypadModal';

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

  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);
  const [overheadInput, setOverheadInput] = useState<string>(currentReactor.overheadTargetRPM.toString());
  const [magneticInput, setMagneticInput] = useState<string>(currentReactor.magneticTargetRPM.toString());

  // Update local input state when selected reactor changes
  React.useEffect(() => {
    setOverheadInput(currentReactor.overheadTargetRPM.toString());
    setMagneticInput(currentReactor.magneticTargetRPM.toString());
  }, [selectedReactorId, currentReactor.overheadTargetRPM, currentReactor.magneticTargetRPM]);

  const handleConfirmKeypadTemp = (reactorId: number, newTemp: number) => {
    controller.setTargetTemperature(reactorId, newTemp);
    auditLogger.logAction('Operator', 'OPERATOR', 'Manual Temperature Changed via Keypad', `Reactor ${reactorId} target temp set to ${newTemp}°C`, reactorId, `${currentReactor.targetTemp}°C`, `${newTemp}°C`);
    setIsKeypadOpen(false);
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

  const handleToggleThermalControl = (reactorId: number) => {
    const isThermalActive = currentReactor.heatingActive || currentReactor.coolingActive;
    if (isThermalActive) {
      controller.stopHeating(reactorId);
    } else {
      controller.startHeating(reactorId);
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
  const isThermalActive = currentReactor.heatingActive || currentReactor.coolingActive;
  const isHeatingActive = currentReactor.targetTemp >= currentReactor.currentTemp;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Temperature Keypad Modal */}
      {isKeypadOpen && (
        <TempKeypadModal
          isOpen={isKeypadOpen}
          reactorId={currentReactor.id}
          reactorName={currentReactor.name}
          initialTemp={currentReactor.targetTemp}
          onConfirm={handleConfirmKeypadTemp}
          onCancel={() => setIsKeypadOpen(false)}
        />
      )}

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
        
        {/* 1. AUTOMATIC TEMPERATURE SUBSYSTEM PANEL */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* PLAY / STOP SYMBOL BUTTON FOR TEMP CONTROL */}
              <button
                onClick={() => handleToggleThermalControl(currentReactor.id)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isThermalActive ? '#ef4444' : '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isThermalActive ? '0 0 12px rgba(239,68,68,0.6)' : '0 0 12px rgba(16,185,129,0.6)',
                  transition: 'all 0.2s'
                }}
                title={isThermalActive ? "Stop Temperature Control" : "Play / Start Temperature Control"}
              >
                {isThermalActive ? <Square size={14} fill="#ffffff" /> : <Play size={14} fill="#ffffff" style={{ marginLeft: '2px' }} />}
              </button>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={20} color={isHeatingActive ? "#f97316" : "#38bdf8"} /> TEMPERATURE CONTROL
              </h3>
            </div>

            <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>
              -20°C to +200°C Auto PID
            </span>
          </div>

          {/* Actual vs Target Temperature Display (CLICK TARGET TO OPEN KEYPAD MODAL) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTUAL TEMP (PT100)</div>
              <div className="font-mono" style={{ fontSize: '2.4rem', fontWeight: 700, color: isHeatingActive ? '#f97316' : '#38bdf8' }}>
                {currentReactor.pt100Fault ? 'FAULT' : `${currentReactor.currentTemp.toFixed(1)}°C`}
              </div>
            </div>

            <div 
              onClick={() => setIsKeypadOpen(true)}
              style={{
                cursor: 'pointer',
                background: 'rgba(30, 41, 59, 0.6)',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
              }}
              title="Click to open numeric keypad window to set temperature"
            >
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>TARGET SETPOINT (CLICK)</div>
              <div className="font-mono" style={{ fontSize: '2.4rem', fontWeight: 700, color: '#ffffff' }}>
                {currentReactor.targetTemp.toFixed(1)}°C
              </div>
            </div>
          </div>

          {/* Touch Keypad Button Trigger */}
          <button
            onClick={() => setIsKeypadOpen(true)}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '12px' }}
          >
            <Thermometer size={18} /> Open Numeric Touch Keypad Window
          </button>

          {/* Quick Temperature Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[-20, 0, 25, 50, 80, 120, 180, 200].map(t => (
              <button
                key={t}
                onClick={() => controller.setTargetTemperature(currentReactor.id, t)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              >
                {t}°C
              </button>
            ))}
          </div>

          {/* CLIMATE STATUS DISPLAY WITH ICON AND POWER OUTPUT (NO TEXT LABELS) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '12px',
            background: !isThermalActive ? 'rgba(148, 163, 184, 0.1)' : isHeatingActive ? 'rgba(249, 115, 22, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: !isThermalActive ? '1px solid rgba(148, 163, 184, 0.2)' : isHeatingActive ? '1px solid #f97316' : '1px solid #38bdf8',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!isThermalActive ? (
                <div style={{ background: 'rgba(148,163,184,0.2)', color: '#94a3b8', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Thermometer size={22} />
                </div>
              ) : isHeatingActive ? (
                <div style={{ background: '#f97316', color: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(249, 115, 22, 0.6)' }}>
                  <Flame size={22} className="pulse" />
                </div>
              ) : (
                <div style={{ background: '#38bdf8', color: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)' }}>
                  <Snowflake size={22} className="pulse" />
                </div>
              )}

              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: !isThermalActive ? '#94a3b8' : isHeatingActive ? '#f97316' : '#38bdf8' }}>
                  {!isThermalActive ? 'TEMP CONTROL OFF' : `POWER OUTPUT: ${Math.abs(currentReactor.thermalPowerPct)}%`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Click Play/Stop button above to start or stop thermal PID loop.
                </div>
              </div>
            </div>
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
