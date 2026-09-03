import React, { useState, useEffect } from 'react';
import { LineChart as LineChartIcon, Download, RefreshCw, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { TelemetryPoint } from '../types/reactor';
import { telemetryLogger } from '../services/TelemetryLogger';

export const LiveTrends: React.FC = () => {
  const [data, setData] = useState<TelemetryPoint[]>(telemetryLogger.getHistory());

  // Visible Channel Toggles
  const [channels, setChannels] = useState({
    r1Temp: true,
    r2Temp: true,
    r3Temp: true,
    r4Temp: true,
    r1Overhead: false,
    r1Magnetic: false,
  });

  useEffect(() => {
    const unsub = telemetryLogger.subscribe(pts => {
      setData([...pts]);
    });
    return unsub;
  }, []);

  const handleExportCSV = () => {
    const csvContent = telemetryLogger.exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FH_G_1.0_Telemetry_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LineChartIcon size={22} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Live Reaction Telemetry</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time 1Hz multi-channel PT100 temperature and motor speed trends</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => telemetryLogger.clearHistory()} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Clear Buffer
          </button>
          <button onClick={handleExportCSV} className="btn-primary" style={{ fontSize: '0.8rem' }}>
            <Download size={14} /> Export CSV Data
          </button>
        </div>
      </div>

      {/* Channel Visibility Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={14} /> Toggle Channels:
        </span>

        {[
          { key: 'r1Temp', label: 'R1 Temp (°C)', color: '#38bdf8' },
          { key: 'r2Temp', label: 'R2 Temp (°C)', color: '#34d399' },
          { key: 'r3Temp', label: 'R3 Temp (°C)', color: '#f97316' },
          { key: 'r4Temp', label: 'R4 Temp (°C)', color: '#a855f7' },
          { key: 'r1Overhead', label: 'R1 Overhead (RPM)', color: '#818cf8' },
          { key: 'r1Magnetic', label: 'R1 Magnetic (RPM)', color: '#06b6d4' },
        ].map(ch => (
          <button
            key={ch.key}
            onClick={() => setChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key as keyof typeof channels] }))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${channels[ch.key as keyof typeof channels] ? ch.color : 'var(--border-glass)'}`,
              background: channels[ch.key as keyof typeof channels] ? `${ch.color}25` : 'rgba(15, 23, 42, 0.6)',
              color: channels[ch.key as keyof typeof channels] ? ch.color : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ● {ch.label}
          </button>
        ))}
      </div>

      {/* Main Chart Window */}
      <div className="glass-panel" style={{ padding: '20px', height: '480px' }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="timeFormatted" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} domain={[-25, 210]} label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#818cf8" fontSize={12} domain={[0, 2000]} label={{ value: 'Stirring Speed (RPM)', angle: 90, position: 'insideRight', fill: '#818cf8' }} />
              
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Legend />

              {channels.r1Temp && <Line yAxisId="left" type="monotone" dataKey="r1Temp" name="R1 Temp (°C)" stroke="#38bdf8" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
              {channels.r2Temp && <Line yAxisId="left" type="monotone" dataKey="r2Temp" name="R2 Temp (°C)" stroke="#34d399" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
              {channels.r3Temp && <Line yAxisId="left" type="monotone" dataKey="r3Temp" name="R3 Temp (°C)" stroke="#f97316" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
              {channels.r4Temp && <Line yAxisId="left" type="monotone" dataKey="r4Temp" name="R4 Temp (°C)" stroke="#a855f7" strokeWidth={2.5} dot={false} isAnimationActive={false} />}

              {channels.r1Overhead && <Line yAxisId="right" type="monotone" dataKey="r1OverheadRPM" name="R1 Overhead (RPM)" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
              {channels.r1Magnetic && <Line yAxisId="right" type="monotone" dataKey="r1MagneticRPM" name="R1 Magnetic (RPM)" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Waiting for telemetry data stream...
          </div>
        )}
      </div>
    </div>
  );
};
