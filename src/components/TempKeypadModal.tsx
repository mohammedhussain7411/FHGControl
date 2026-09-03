import React, { useState, useEffect } from 'react';
import { Check, X, Delete, Thermometer } from 'lucide-react';

interface TempKeypadModalProps {
  isOpen: boolean;
  reactorId: number;
  reactorName: string;
  initialTemp: number;
  onConfirm: (reactorId: number, newTemp: number) => void;
  onCancel: () => void;
}

export const TempKeypadModal: React.FC<TempKeypadModalProps> = ({
  isOpen,
  reactorId,
  reactorName,
  initialTemp,
  onConfirm,
  onCancel
}) => {
  const [valStr, setValStr] = useState<string>(initialTemp.toString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setValStr(initialTemp.toString());
    setErrorMsg(null);
  }, [initialTemp, isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (char: string) => {
    setErrorMsg(null);
    if (char === '-') {
      if (valStr.startsWith('-')) {
        setValStr(valStr.substring(1));
      } else {
        setValStr('-' + valStr);
      }
      return;
    }

    if (char === '.') {
      if (!valStr.includes('.')) {
        setValStr(valStr + '.');
      }
      return;
    }

    if (valStr === '0') {
      setValStr(char);
    } else {
      setValStr(valStr + char);
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (valStr.length <= 1) {
      setValStr('0');
    } else {
      setValStr(valStr.substring(0, valStr.length - 1));
    }
  };

  const handleClear = () => {
    setErrorMsg(null);
    setValStr('0');
  };

  const handlePreset = (num: number) => {
    setErrorMsg(null);
    setValStr(num.toString());
  };

  const handleConfirmSubmit = () => {
    const num = parseFloat(valStr);
    if (isNaN(num)) {
      setErrorMsg('Invalid number entry');
      return;
    }
    if (num < -20 || num > 200) {
      setErrorMsg('Temperature must be between -20.0°C and 200.0°C');
      return;
    }
    onConfirm(reactorId, Number(num.toFixed(1)));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 0 40px rgba(2, 132, 199, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '8px', borderRadius: '10px' }}>
              <Thermometer size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Set Temp — R{reactorId}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{reactorName}</span>
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Cancel (X)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Temperature Value Display */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '12px',
          padding: '16px',
          border: errorMsg ? '1px solid #ef4444' : '1px solid #38bdf8',
          textAlign: 'right',
          boxShadow: 'inner'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            TARGET SETPOINT (-20°C TO +200°C)
          </div>
          <div className="font-mono" style={{ fontSize: '2.6rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '-1px' }}>
            {valStr}<span style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>°C</span>
          </div>
          {errorMsg && (
            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[-20, 0, 25, 50, 80, 120, 180, 200].map(p => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {p}°C
            </button>
          ))}
        </div>

        {/* Touchscreen Numeric Keypad Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => (
            <button
              key={k}
              onClick={() => handleKeyPress(k)}
              style={{
                padding: '16px',
                fontSize: '1.4rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                background: 'rgba(30, 41, 59, 0.7)',
                color: '#ffffff',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {k}
            </button>
          ))}

          <button
            onClick={() => handleKeyPress('-')}
            style={{
              padding: '16px',
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'rgba(30, 41, 59, 0.7)',
              color: '#38bdf8',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ±
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            style={{
              padding: '16px',
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'rgba(30, 41, 59, 0.7)',
              color: '#ffffff',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            0
          </button>

          <button
            onClick={() => handleKeyPress('.')}
            style={{
              padding: '16px',
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'rgba(30, 41, 59, 0.7)',
              color: '#38bdf8',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            .
          </button>
        </div>

        {/* Clear & Backspace row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handleClear}
            style={{
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            CLEAR (C)
          </button>

          <button
            onClick={handleBackspace}
            style={{
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Delete size={16} /> BACKSPACE
          </button>
        </div>

        {/* Bottom Confirm (Tick) & Cancel (X) Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)'
            }}
          >
            <X size={20} /> CANCEL
          </button>

          <button
            onClick={handleConfirmSubmit}
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Check size={22} /> CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};
