import React from 'react';
import { 
  Thermometer, 
  Fan, 
  Flame, 
  Snowflake, 
  Play, 
  Square, 
  Sliders,
  Gauge,
  AlertTriangle
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
    const isStirring = r.overheadActive || r.magneticActive;
    if (isStirring) {
      controller.stopOverheadStirrer(r.id);
      controller.stopMagneticStirrer(r.id);
    } else {
      if (r.overheadTargetRPM === 0) controller.setOverheadSpeed(r.id, 600);
      if (r.magneticTargetRPM === 0) controller.setMagneticSpeed(r.id, 800);
      controller.startOverheadStirrer(r.id);
      controller.startMagneticStirrer(r.id);
    }
  };

  const handleToggleOverhead = (r: ReactorState) => {
    if (r.overheadActive) {
      controller.stopOverheadStirrer(r.id);
    } else {
      if (r.overheadTargetRPM === 0) controller.setOverheadSpeed(r.id, 600);
      controller.startOverheadStirrer(r.id);
    }
  };

  const handleToggleMagnetic = (r: ReactorState) => {
    if (r.magneticActive) {
      controller.stopMagneticStirrer(r.id);
    } else {
      if (r.magneticTargetRPM === 0) controller.setMagneticSpeed(r.id, 800);
      controller.startMagneticStirrer(r.id);
    }
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
              {reactors.filter(r => r.heatingActive).length} Active Heaters
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
              {reactors.filter(r => r.coolingActive).length} Active Cooling
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '10px', color: '#a855f7' }}>
            <Fan size={24} className={reactors.some(r => r.overheadActive || r.magneticActive) ? 'spin-fast' : ''} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVE STIRRERS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {reactors.filter(r => r.overheadActive || r.magneticActive).length} Motors Running
            </div>
          </div>
        </div>
      </div>

      {/* 4 Reactor Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {reactors.map(r => {
          const isAlarm = r.status === 'ALARM';
          const isRunning = r.status === 'RUNNING' || r.overheadActualRPM > 0 || r.magneticActualRPM > 0;
          const tempColor = r.pt100Fault
            ? '#ef4444'
            : r.currentTemp > 75
            ? '#f97316'
            : r.currentTemp < 20
            ? '#38bdf8'
            : '#34d399';

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
              {r.heatingActive && <div className="heat-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4 }} />}
              {r.coolingActive && <div className="cool-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4 }} />}

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

                {/* Status Indicator: CLICK FAN ICON TO START / STOP STIRRING */}
                <div 
                  onClick={() => handleToggleReactorStirring(r)}
                  title={isRunning ? "Click Fan Icon to STOP Stirring" : "Click Fan Icon to START Stirring"}
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: isAlarm ? 'rgba(239,68,68,0.2)' : isRunning ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.15)',
                    color: isAlarm ? '#ef4444' : isRunning ? '#10b981' : '#94a3b8',
                    border: `1px solid ${isAlarm ? '#ef4444' : isRunning ? '#10b981' : 'rgba(148,163,184,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isRunning ? '0 0 15px rgba(16,185,129,0.5)' : undefined,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, background 0.2s'
                  }}
                >
                  {isAlarm ? (
                    <AlertTriangle size={18} className="pulse" />
                  ) : (
                    <Fan size={18} className={isRunning ? 'spin-fast' : ''} />
                  )}
                </div>
              </div>

              {/* Temperature Readout Section */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Thermometer size={14} color={tempColor} /> TEMPERATURE (PT100)
                  </span>
                  {r.heatingActive && (
                    <span style={{ fontSize: '0.7rem', color: '#f97316', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Flame size={12} /> HEATING ({r.thermalPowerPct}%)
                    </span>
                  )}
                  {r.coolingActive && (
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Snowflake size={12} /> COOLING ({r.thermalPowerPct}%)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div className="font-mono" style={{ fontSize: '2.2rem', fontWeight: 700, color: tempColor, letterSpacing: '-1px' }}>
                    {r.pt100Fault ? 'FAULT' : `${r.currentTemp.toFixed(1)}°C`}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>SETPOINT</div>
                    <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#38bdf8' }}>
                      {r.targetTemp.toFixed(1)}°C
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

              {/* Stirring Dual Drives Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Overhead Drive */}
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <button
                      onClick={() => handleToggleOverhead(r)}
                      title={r.overheadActive ? "Click Fan to Stop Overhead Stirrer" : "Click Fan to Start Overhead Stirrer"}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a855f7',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Fan size={16} className={r.overheadActualRPM > 0 ? 'spin-fast' : ''} />
                    </button>
                    <span>OVERHEAD</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {r.overheadActualRPM} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>RPM</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Target: {r.overheadTargetRPM} RPM • {r.overheadTorqueNm} Nm
                  </div>
                </div>

                {/* Magnetic Drive */}
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <button
                      onClick={() => handleToggleMagnetic(r)}
                      title={r.magneticActive ? "Click Fan to Stop Magnetic Stirrer" : "Click Fan to Start Magnetic Stirrer"}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#06b6d4',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Fan size={16} className={r.magneticActualRPM > 0 ? 'spin-slow' : ''} />
                    </button>
                    <span>MAGNETIC</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {r.magneticActualRPM} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>RPM</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Target: {r.magneticTargetRPM} RPM
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => onSelectReactorForManual(r.id)}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                >
                  <Sliders size={14} /> Control R{r.id}
                </button>

                {r.heatingActive ? (
                  <button
                    onClick={() => controller.stopHeating(r.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px 12px', color: '#f97316' }}
                    title="Stop Heating"
                  >
                    <Square size={14} /> Stop Heat
                  </button>
                ) : (
                  <button
                    onClick={() => controller.startHeating(r.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                    title="Start Heating"
                  >
                    <Play size={14} /> Heat
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
