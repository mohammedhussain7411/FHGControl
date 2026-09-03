import React from 'react';
import { 
  Thermometer, 
  Fan, 
  Flame, 
  Snowflake, 
  Sliders,
  Gauge,
  AlertTriangle,
  Play,
  Square,
  Plus,
  Minus
} from 'lucide-react';
import type { ReactorState } from '../types/reactor';
import type { IReactorController } from '../services/IReactorController';

interface DashboardProps {
  reactors: ReactorState[];
  controller: IReactorController;
  onSelectReactorForManual: (reactorId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  reactors,
  controller,
  onSelectReactorForManual
}) => {

  const handleToggleReactorStirring = (r: ReactorState) => {
    const isStirringActive = (r.overheadActive && r.overheadActualRPM > 0) || (r.magneticActive && r.magneticActualRPM > 0);
    if (isStirringActive) {
      controller.stopOverheadStirrer(r.id);
      controller.stopMagneticStirrer(r.id);
    } else {
      const targetOverhead = r.overheadTargetRPM > 0 ? r.overheadTargetRPM : 600;
      controller.setOverheadSpeed(r.id, targetOverhead);
      controller.startOverheadStirrer(r.id);
    }
  };

  const handleToggleThermalControl = (r: ReactorState) => {
    const isThermalActive = r.heatingActive || r.coolingActive;
    if (isThermalActive) {
      controller.stopHeating(r.id); // stops both heating and cooling
    } else {
      controller.startHeating(r.id); // starts temperature PID control
    }
  };

  const handleToggleOverhead = (r: ReactorState) => {
    const isOverheadRunning = r.overheadActive && r.overheadActualRPM > 0;
    if (isOverheadRunning) {
      controller.stopOverheadStirrer(r.id);
    } else {
      const target = r.overheadTargetRPM > 0 ? r.overheadTargetRPM : 600;
      controller.setOverheadSpeed(r.id, target);
      controller.startOverheadStirrer(r.id);
    }
  };

  const handleToggleMagnetic = (r: ReactorState) => {
    const isMagneticRunning = r.magneticActive && r.magneticActualRPM > 0;
    if (isMagneticRunning) {
      controller.stopMagneticStirrer(r.id);
    } else {
      const target = r.magneticTargetRPM > 0 ? r.magneticTargetRPM : 800;
      controller.setMagneticSpeed(r.id, target);
      controller.startMagneticStirrer(r.id);
    }
  };

  const handleAdjustTemp = (reactorId: number, currentTarget: number, delta: number) => {
    const next = Math.max(-20, Math.min(200, currentTarget + delta));
    controller.setTargetTemperature(reactorId, Number(next.toFixed(1)));
  };

  const handleAdjustOverheadRPM = (reactorId: number, currentTarget: number, delta: number) => {
    const next = Math.max(0, Math.min(1500, currentTarget + delta));
    controller.setOverheadSpeed(reactorId, next);
  };

  const handleAdjustMagneticRPM = (reactorId: number, currentTarget: number, delta: number) => {
    const next = Math.max(0, Math.min(2000, currentTarget + delta));
    controller.setMagneticSpeed(reactorId, next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '10px', color: '#38bdf8' }}>
            <Gauge size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVE REACTORS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {reactors.filter(r => r.status === 'RUNNING').length} / 4 Operational
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', color: '#ef4444' }}>
            <Flame size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HEATING LOAD</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {reactors.filter(r => r.heatingActive && r.thermalPowerPct > 0).length} Active Heaters
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: '10px', color: '#06b6d4' }}>
            <Snowflake size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>COOLING LOAD</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {reactors.filter(r => r.coolingActive && r.thermalPowerPct < 0).length} Active Cooling
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '10px', color: '#a855f7' }}>
            <Fan size={24} className={reactors.some(r => (r.overheadActive && r.overheadActualRPM > 0) || (r.magneticActive && r.magneticActualRPM > 0)) ? 'spin-fast' : ''} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVE STIRRERS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {reactors.filter(r => (r.overheadActive && r.overheadActualRPM > 0) || (r.magneticActive && r.magneticActualRPM > 0)).length} Motors Running
            </div>
          </div>
        </div>
      </div>

      {/* 4 Reactor Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {reactors.map(r => {
          const isAlarm = r.status === 'ALARM';
          const isStirringActive = (r.overheadActive && r.overheadActualRPM > 0) || (r.magneticActive && r.magneticActualRPM > 0);
          const isThermalActive = r.heatingActive || r.coolingActive;
          const isHeating = r.targetTemp >= r.currentTemp;
          const tempColor = r.pt100Fault
            ? '#ef4444'
            : isHeating
            ? '#f97316'
            : '#38bdf8';

          return (
            <div
              key={r.id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderColor: isAlarm ? '#ef4444' : 'var(--border-glass)',
                boxShadow: isAlarm ? '0 0 20px rgba(239, 68, 68, 0.3)' : undefined,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Heat/Cool Glow Overlay */}
              {isThermalActive && isHeating && <div className="heat-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4 }} />}
              {isThermalActive && !isHeating && <div className="cool-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4 }} />}

              {/* Card Top Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    fontWeight: 700,
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem'
                  }}>
                    R{r.id}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.name}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Standard Non-Jacketed Block</span>
                  </div>
                </div>

                {/* Top Right Action: Dynamic Stirring Fan Status Icon */}
                <div 
                  onClick={() => handleToggleReactorStirring(r)}
                  title={isStirringActive ? "Click Fan Icon to STOP Stirring" : "Click Fan Icon to START Stirring"}
                  style={{
                    padding: '7px',
                    borderRadius: '50%',
                    background: isAlarm ? 'rgba(239,68,68,0.2)' : isStirringActive ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.15)',
                    color: isAlarm ? '#ef4444' : isStirringActive ? '#10b981' : '#94a3b8',
                    border: `1px solid ${isAlarm ? '#ef4444' : isStirringActive ? '#10b981' : 'rgba(148,163,184,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isAlarm ? (
                    <AlertTriangle size={16} className="pulse" />
                  ) : (
                    <Fan size={16} className={isStirringActive ? 'spin-fast' : ''} />
                  )}
                </div>
              </div>

              {/* Temperature Readout Section (WITH DEDICATED PLAY/STOP BUTTON FOR TEMP CONTROL) */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                    {/* PLAY / STOP SYMBOL BUTTON FOR TEMPERATURE CONTROL */}
                    <button
                      onClick={() => handleToggleThermalControl(r)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        background: isThermalActive ? '#ef4444' : '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isThermalActive ? '0 0 10px rgba(239,68,68,0.6)' : '0 0 10px rgba(16,185,129,0.6)',
                        transition: 'all 0.2s'
                      }}
                      title={isThermalActive ? "STOP Temperature PID Control" : "PLAY / START Temperature PID Control"}
                    >
                      {isThermalActive ? <Square size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" style={{ marginLeft: '2px' }} />}
                    </button>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Thermometer size={14} color={tempColor} /> TEMP CONTROL
                    </span>
                  </div>

                  {/* HIGHLIGHTED FLAME / SNOWFLAKE ICON ONLY (NO TEXT) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isThermalActive ? (
                      isHeating ? (
                        <span 
                          title={`Heating Active (${Math.abs(r.thermalPowerPct)}%)`}
                          style={{
                            background: 'rgba(249, 115, 22, 0.25)',
                            border: '1px solid #f97316',
                            color: '#f97316',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 0 10px rgba(249,115,22,0.4)'
                          }}
                        >
                          <Flame size={16} className="pulse" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{Math.abs(r.thermalPowerPct)}%</span>
                        </span>
                      ) : (
                        <span 
                          title={`Cooling Active (${Math.abs(r.thermalPowerPct)}%)`}
                          style={{
                            background: 'rgba(56, 189, 248, 0.25)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 0 10px rgba(56,189,248,0.4)'
                          }}
                        >
                          <Snowflake size={16} className="pulse" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{Math.abs(r.thermalPowerPct)}%</span>
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                        OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Actual Temp & Interactive Target Setpoint Input */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ACTUAL</div>
                    <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 700, color: tempColor, letterSpacing: '-0.5px' }}>
                      {r.pt100Fault ? 'FAULT' : `${r.currentTemp.toFixed(1)}°C`}
                    </div>
                  </div>

                  {/* Direct Setpoint Controls (- / input / +) */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>SETPOINT (°C)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleAdjustTemp(r.id, r.targetTemp, -5)}
                        style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="-5°C"
                      >
                        <Minus size={12} />
                      </button>

                      <input
                        type="number"
                        min="-20"
                        max="200"
                        step="0.5"
                        className="font-mono"
                        value={r.targetTemp}
                        onChange={(e) => controller.setTargetTemperature(r.id, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '65px',
                          padding: '4px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid #38bdf8',
                          borderRadius: '6px',
                          color: '#38bdf8',
                          fontSize: '1rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}
                      />

                      <button
                        onClick={() => handleAdjustTemp(r.id, r.targetTemp, 5)}
                        style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="+5°C"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thermal Power Bar */}
                <div style={{ height: '4px', width: '100%', background: 'rgba(51, 65, 85, 0.5)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: r.thermalPowerPct < 0 ? `${50 + (r.thermalPowerPct / 2)}%` : '50%',
                    width: `${Math.abs(r.thermalPowerPct) / 2}%`,
                    background: r.thermalPowerPct > 0 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                    borderRadius: '2px'
                  }} />
                </div>
              </div>

              {/* Stirring Dual Drives Grid with Direct Dashboard RPM Editors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                
                {/* Overhead Drive Section */}
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#a855f7', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <button
                      onClick={() => handleToggleOverhead(r)}
                      title={r.overheadActive && r.overheadActualRPM > 0 ? "Click to Stop Overhead" : "Click to Start Overhead"}
                      style={{ background: 'none', border: 'none', color: '#a855f7', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Fan size={14} className={r.overheadActive && r.overheadActualRPM > 0 ? 'spin-fast' : ''} />
                      <span>OVERHEAD</span>
                    </button>
                  </div>

                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {r.overheadActualRPM} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RPM</span>
                  </div>

                  {/* Direct Dashboard RPM Setpoint Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <button
                      onClick={() => handleAdjustOverheadRPM(r.id, r.overheadTargetRPM, -100)}
                      style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Minus size={10} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max="1500"
                      step="50"
                      className="font-mono"
                      value={r.overheadTargetRPM}
                      onChange={(e) => controller.setOverheadSpeed(r.id, parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '4px',
                        color: '#a855f7',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />

                    <button
                      onClick={() => handleAdjustOverheadRPM(r.id, r.overheadTargetRPM, 100)}
                      style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Magnetic Drive Section */}
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#06b6d4', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <button
                      onClick={() => handleToggleMagnetic(r)}
                      title={r.magneticActive && r.magneticActualRPM > 0 ? "Click to Stop Magnetic" : "Click to Start Magnetic"}
                      style={{ background: 'none', border: 'none', color: '#06b6d4', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Fan size={14} className={r.magneticActive && r.magneticActualRPM > 0 ? 'spin-slow' : ''} />
                      <span>MAGNETIC</span>
                    </button>
                  </div>

                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {r.magneticActualRPM} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RPM</span>
                  </div>

                  {/* Direct Dashboard RPM Setpoint Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <button
                      onClick={() => handleAdjustMagneticRPM(r.id, r.magneticTargetRPM, -100)}
                      style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Minus size={10} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max="2000"
                      step="50"
                      className="font-mono"
                      value={r.magneticTargetRPM}
                      onChange={(e) => controller.setMagneticSpeed(r.id, parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        borderRadius: '4px',
                        color: '#06b6d4',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />

                    <button
                      onClick={() => handleAdjustMagneticRPM(r.id, r.magneticTargetRPM, 100)}
                      style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
                <button
                  onClick={() => onSelectReactorForManual(r.id)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}
                >
                  <Sliders size={14} /> Full Console R{r.id}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
