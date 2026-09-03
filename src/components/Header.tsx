import React, { useState } from 'react';
import { 
  FlaskConical, 
  Bell, 
  Zap, 
  CheckCircle2,
  AlertOctagon,
  LogOut,
  ChevronDown,
  Save
} from 'lucide-react';
import type { ConnectionStatus, UserSession, AlarmItem } from '../types/reactor';
import { simulatorController } from '../services/SimulatorReactorController';
import { authService } from '../services/AuthService';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  user: UserSession;
  activeAlarms: AlarmItem[];
  lastSavedAt?: string;
  onEmergencyStop: () => void;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  user,
  activeAlarms,
  lastSavedAt,
  onEmergencyStop,
  onSelectTab
}) => {
  const [showEstopConfirm, setShowEstopConfirm] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const simSpeed = simulatorController.getSimSpeedMultiplier();

  const handleEstopClick = () => {
    onEmergencyStop();
    setShowEstopConfirm(false);
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    authService.logout();
  };

  const criticalAlarmCount = activeAlarms.filter(a => !a.acknowledged).length;

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
      {/* Brand & Machine Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)' }}>
          <FlaskConical size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px', background: 'linear-gradient(90deg, #f8fafc, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FH G CONTROL
            </h1>
            <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}>
              v1.0.0
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            4-Reactor Automated Laboratory Reaction System
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Connection Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)' }}>
          {connectionStatus === 'CONNECTED_SIMULATOR' && (
            <>
              <span className="led-indicator pulse" style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} /> SIMULATOR MODE ({simSpeed}x)
              </span>
            </>
          )}
          {connectionStatus === 'CONNECTED_HARDWARE' && (
            <>
              <span className="led-indicator pulse" style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> STM32 MODBUS ONLINE
              </span>
            </>
          )}
          {connectionStatus === 'DISCONNECTED' && (
            <>
              <span className="led-indicator" style={{ color: '#64748b' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>OFFLINE</span>
            </>
          )}
        </div>

        {/* Simulation Speed Selector Quick Switch */}
        {connectionStatus === 'CONNECTED_SIMULATOR' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '6px' }}>Sim Speed:</span>
            {[1, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => simulatorController.setSimSpeedMultiplier(s)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: simSpeed === s ? '#0284c7' : 'transparent',
                  color: simSpeed === s ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {/* Alarm Bell Button */}
        <button
          onClick={() => onSelectTab('alarms')}
          style={{
            position: 'relative',
            background: criticalAlarmCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.6)',
            border: criticalAlarmCount > 0 ? '1px solid #ef4444' : '1px solid var(--border-glass)',
            color: criticalAlarmCount > 0 ? '#ef4444' : 'var(--text-main)',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Bell size={18} className={criticalAlarmCount > 0 ? 'pulse' : ''} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Alarms</span>
          {criticalAlarmCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(239,68,68,0.8)'
            }}>
              {criticalAlarmCount}
            </span>
          )}
        </button>
      </div>

      {/* Right User & Emergency Stop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* User Account Dropdown Container */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '10px',
              border: '1px solid var(--border-glass)',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
              {user.username.charAt(0)}
            </div>
            <div style={{ fontSize: '0.8rem', textAlign: 'left' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{user.username}</span>
              <span style={{ fontSize: '0.68rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 600 }}>
                [{user.role}]
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* User Account Dropdown Menu */}
          {showUserDropdown && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '240px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 200,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <div>Logged in as: <strong style={{ color: '#fff' }}>{user.username}</strong></div>
                {lastSavedAt && (
                  <div style={{ marginTop: '2px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Save size={12} /> Auto-saved: {lastSavedAt}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} /> Switch Account / Logout
              </button>
            </div>
          )}
        </div>

        {/* Master Emergency Stop Button */}
        {showEstopConfirm ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleEstopClick}
              className="btn-danger"
              style={{ animation: 'pulse-glow 0.8s infinite alternate', fontSize: '0.85rem' }}
            >
              <AlertOctagon size={18} /> CONFIRM E-STOP!
            </button>
            <button
              onClick={() => setShowEstopConfirm(false)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowEstopConfirm(true)}
            className="btn-danger"
            style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}
          >
            <AlertOctagon size={18} /> E-STOP
          </button>
        )}
      </div>
    </header>
  );
};
