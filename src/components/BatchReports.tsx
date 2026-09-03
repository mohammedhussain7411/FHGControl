import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import type { BatchRecord } from '../types/reactor';

export const BatchReports: React.FC = () => {
  const [batches] = useState<BatchRecord[]>([
    {
      id: 'BATCH-20260903-001',
      recipeId: 'REC-001',
      recipeName: 'SYNTHESIS_001 (Exothermic Reflux)',
      reactorId: 1,
      operator: 'Dr. Hussain',
      startTime: '10:30:00 AM',
      endTime: '12:45:00 PM',
      status: 'COMPLETED',
      minTemp: 19.8,
      maxTemp: 82.1,
      avgTemp: 64.3,
      maxOverheadRPM: 350,
      maxMagneticRPM: 600,
      alarmsCount: 0,
      telemetryData: []
    },
    {
      id: 'BATCH-20260902-004',
      recipeId: 'REC-002',
      recipeName: 'CRYSTALLIZATION_FAST',
      reactorId: 2,
      operator: 'Process Eng',
      startTime: '02:15:00 PM',
      endTime: '04:00:00 PM',
      status: 'COMPLETED',
      minTemp: 14.5,
      maxTemp: 50.2,
      avgTemp: 32.1,
      maxOverheadRPM: 400,
      maxMagneticRPM: 600,
      alarmsCount: 0,
      telemetryData: []
    }
  ]);

  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(batches[0]);

  const handleGeneratePDF = (batch: BatchRecord) => {
    // Printable HTML / PDF view summary
    const content = `
=====================================================
               FH G 1.0 — BATCH REPORT
=====================================================
Batch ID:       ${batch.id}
Recipe:         ${batch.recipeName}
Reactor:        Reactor ${batch.reactorId}
Operator:       ${batch.operator}
Start Time:     ${batch.startTime}
End Time:       ${batch.endTime}
Status:         ${batch.status}

TEMPERATURE METRICS
-----------------------------------------------------
Minimum Temperature: ${batch.minTemp}°C
Maximum Temperature: ${batch.maxTemp}°C
Average Temperature: ${batch.avgTemp}°C

STIRRING METRICS
-----------------------------------------------------
Max Overhead Speed:  ${batch.maxOverheadRPM} RPM
Max Magnetic Speed:  ${batch.maxMagneticRPM} RPM

SAFETY & ALARMS
-----------------------------------------------------
Total Alarm Events: ${batch.alarmsCount}
Validation Status:  PASS (GMP Compliant)
=====================================================
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${batch.id}_Report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={24} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Batch Execution Reports</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatic post-run analytical summaries, quality metrics, and report generation.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        
        {/* Batches List */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
            Completed Batches
          </h3>

          {batches.map(b => (
            <div
              key={b.id}
              onClick={() => setSelectedBatch(b)}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                borderColor: selectedBatch?.id === b.id ? '#38bdf8' : 'var(--border-glass)',
                background: selectedBatch?.id === b.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{b.recipeName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                ID: {b.id} • Reactor {b.reactorId}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Batch Details */}
        {selectedBatch && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>{selectedBatch.recipeName}</h3>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedBatch.id}</span>
              </div>

              <button onClick={() => handleGeneratePDF(selectedBatch)} className="btn-primary">
                <Download size={16} /> Download Batch Report
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MAX TEMPERATURE</div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f97316' }}>{selectedBatch.maxTemp}°C</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MIN TEMPERATURE</div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8' }}>{selectedBatch.minTemp}°C</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVG TEMPERATURE</div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>{selectedBatch.avgTemp}°C</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MAX OVERHEAD STIR SPEED</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7' }}>{selectedBatch.maxOverheadRPM} RPM</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MAX MAGNETIC STIR SPEED</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#06b6d4' }}>{selectedBatch.maxMagneticRPM} RPM</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
