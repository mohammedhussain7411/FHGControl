import React from 'react';
import { 
  LayoutDashboard, 
  Sliders, 
  PlayCircle, 
  LineChart, 
  FileText, 
  Bell, 
  Cpu, 
  ShieldCheck, 
  Settings,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeAlarmCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlarmCount
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manual', label: 'Manual Control', icon: Sliders },
    { id: 'recipes', label: 'Automatic & Recipes', icon: PlayCircle },
    { id: 'trends', label: 'Live Trends', icon: LineChart },
    { id: 'batches', label: 'Batch Reports', icon: FileText },
    { id: 'alarms', label: 'Alarm Manager', icon: Bell, badge: activeAlarmCount },
    { id: 'simulator', label: 'Simulator & Diagnostics', icon: Cpu },
    { id: 'audit', label: 'Security Audit Log', icon: ShieldCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="glass-panel" style={{ width: '240px', minWidth: '240px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 'calc(100vh - 65px)' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 12px' }}>
        System Navigation
      </div>

      {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              background: isActive ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.5) 100%)' : 'transparent',
              color: isActive ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            className={!isActive ? 'glass-panel-hover' : ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={18} color={isActive ? '#38bdf8' : '#94a3b8'} />
              <span>{item.label}</span>
            </div>

            {item.badge && item.badge > 0 ? (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '8px',
              }}>
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>
          <Activity size={14} /> System Health: 100%
        </div>
        CAN FD bus 500kbps • 4/4 MCUs
      </div>
    </aside>
  );
};
