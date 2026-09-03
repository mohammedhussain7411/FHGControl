import React, { useState, useEffect } from 'react';
import { Check, X, Delete } from 'lucide-react';

export interface KeypadConfig {
  reactorId: number;
  type: 'TEMP' | 'OVERHEAD_RPM' | 'MAGNETIC_RPM';
  title: string;
  unit: string;
  minVal: number;
  maxVal: number;
  initialVal: number;
  allowDecimal?: boolean;
}

interface NumericKeypadModalProps {
  isOpen: boolean;
  config: KeypadConfig;
  onConfirm: (reactorId: number, type: 'TEMP' | 'OVERHEAD_RPM' | 'MAGNETIC_RPM', newVal: number) => void;
  onCancel: () => void;
}

export const TempKeypadModal: React.FC<NumericKeypadModalProps> = ({
  isOpen,
  config,
  onConfirm,
  onCancel
}) => {
  const [valStr, setValStr] = useState<string>(config ? config.initialVal.toString() : '0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setValStr(config.initialVal.toString());
      setErrorMsg(null);
    }
  }, [config, isOpen]);

  if (!isOpen || !config) return null;

  const { reactorId, type, title, unit, minVal, maxVal, allowDecimal } = config;

  const handleKeyPress = (char: string) => {
    setErrorMsg(null);
    if (char === '-') {
      if (minVal >= 0) return; // ignore negative if minVal is non-negative
      if (valStr.startsWith('-')) {
        setValStr(valStr.substring(1));
      } else {
        setValStr('-' + valStr);
      }
      return;
    }

    if (char === '.') {
      if (!allowDecimal) return; // ignore decimal if not allowed
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

  const handleConfirmSubmit = () => {
    const num = parseFloat(valStr);
    if (isNaN(num)) {
      setErrorMsg('Invalid number');
      return;
    }
    if (num < minVal || num > maxVal) {
      setErrorMsg(`${minVal} to ${maxVal}${unit}`);
      return;
    }
    const finalVal = allowDecimal ? Number(num.toFixed(1)) : Math.round(num);
    onConfirm(reactorId, type, finalVal);
  };

  return (
    <>
      {/* Invisible Click-outside Backdrop */}
      <div 
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)'
        }}
      />

      {/* Lightweight Keypad Popup Card */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: '300px',
          background: '#0f172a',
          padding: '16px',
          borderRadius: '16px',
          border: '2px solid #38bdf8',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Value Display Box */}
        <div style={{
          background: '#020617',
          borderRadius: '8px',
          padding: '10px 14px',
          border: errorMsg ? '1px solid #ef4444' : '1px solid #334155',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>R{reactorId} {title}</span>
            <span>{minVal} to {maxVal}{unit}</span>
          </div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 700, color: '#38bdf8' }}>
            {valStr}<span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>{unit}</span>
          </div>
          {errorMsg && (
            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Compact 3x4 Keypad Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => (
            <button
              key={k}
              onClick={() => handleKeyPress(k)}
              style={{
                padding: '12px 0',
                fontSize: '1.3rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                background: '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {k}
            </button>
          ))}

          <button
            onClick={() => handleKeyPress('-')}
            disabled={minVal >= 0}
            style={{
              padding: '12px 0',
              fontSize: '1.2rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: '#1e293b',
              color: minVal >= 0 ? '#475569' : '#38bdf8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: minVal >= 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ±
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            style={{
              padding: '12px 0',
              fontSize: '1.3rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: '#1e293b',
              color: '#ffffff',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            0
          </button>

          <button
            onClick={() => handleKeyPress('.')}
            disabled={!allowDecimal}
            style={{
              padding: '12px 0',
              fontSize: '1.3rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: '#1e293b',
              color: !allowDecimal ? '#475569' : '#38bdf8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: !allowDecimal ? 'not-allowed' : 'pointer'
            }}
          >
            .
          </button>
        </div>

        {/* Backspace & Action Buttons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            style={{
              padding: '12px 0',
              background: '#334155',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Backspace"
          >
            <Delete size={18} />
          </button>

          {/* Cancel (X) Button */}
          <button
            onClick={onCancel}
            style={{
              padding: '12px 0',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cancel (X)"
          >
            <X size={20} />
          </button>

          {/* Confirm (Tick mark) Button */}
          <button
            onClick={handleConfirmSubmit}
            style={{
              padding: '12px 0',
              background: '#10b981',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }}
            title="Confirm (Check mark)"
          >
            <Check size={22} />
          </button>
        </div>
      </div>
    </>
  );
};
