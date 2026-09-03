import React, { useState } from 'react';
import { FlaskConical, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../services/AuthService';
import type { UserRole } from '../types/reactor';

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const accounts = authService.getAccounts();

  // Login form state
  const [selectedUsername, setSelectedUsername] = useState<string>(accounts[0]?.username || 'dr_hussain');
  const [password, setPassword] = useState<string>('admin123');

  // Register form state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('OPERATOR');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = authService.login(selectedUsername, password);
    if (res.success) {
      onLoginSuccess();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const res = authService.register(regFullName, regUsername, regPassword, regRole);
    if (res.success) {
      setSuccessMessage(res.message);
      setIsRegisterMode(false);
      setSelectedUsername(regUsername.toLowerCase());
      setPassword(regPassword);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(9, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        
        {/* Top Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)' }}>
            <FlaskConical size={32} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>
              FH G CONTROL 1.0
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Laboratory Automation & Multi-User Reaction System
            </p>
          </div>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: !isRegisterMode ? '#0284c7' : 'transparent',
              color: !isRegisterMode ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: isRegisterMode ? '#0284c7' : 'transparent',
              color: isRegisterMode ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Register Account
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> {successMessage}
          </div>
        )}

        {/* LOGIN FORM */}
        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Select User Account
              </label>
              
              {/* Account Quick Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {accounts.map(acc => {
                  const isSelected = selectedUsername === acc.username;
                  return (
                    <div
                      key={acc.username}
                      onClick={() => {
                        setSelectedUsername(acc.username);
                        if (acc.username === 'dr_hussain') setPassword('admin123');
                        else if (acc.username === 'sarah_chen') setPassword('eng123');
                        else if (acc.username === 'alex_rivera') setPassword('op123');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: isSelected ? `1px solid ${acc.avatarColor}` : '1px solid var(--border-glass)',
                        background: isSelected ? `${acc.avatarColor}20` : 'rgba(15, 23, 42, 0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: acc.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                          {acc.fullName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{acc.fullName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{acc.username}</div>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: acc.avatarColor, background: `${acc.avatarColor}25`, padding: '2px 8px', borderRadius: '6px' }}>
                        {acc.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: '8px' }}
            >
              Log In to Workspace
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Full Name</label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                required
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="e.g. jsmith"
                required
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role Permission</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', marginTop: '4px' }}
              >
                <option value="OPERATOR">OPERATOR (Manual & Recipes)</option>
                <option value="ENGINEER">ENGINEER (Diagnostics & Calibration)</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR (Full Rights)</option>
                <option value="VIEWER">VIEWER (Read-only Monitoring)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create password..."
                required
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', marginTop: '4px' }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: '8px' }}
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
