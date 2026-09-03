import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ManualControl } from './components/ManualControl';
import { RecipeManager } from './components/RecipeManager';
import { LiveTrends } from './components/LiveTrends';
import { AlarmView } from './components/AlarmView';
import { SimulatorPanel } from './components/SimulatorPanel';
import { AuditLogView } from './components/AuditLogView';
import { BatchReports } from './components/BatchReports';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';

import type { ReactorState, UserSession, AlarmItem } from './types/reactor';
import { simulatorController } from './services/SimulatorReactorController';
import type { IReactorController } from './services/IReactorController';
import { telemetryLogger } from './services/TelemetryLogger';
import { alarmManager } from './services/AlarmManager';
import { auditLogger } from './services/AuditLogger';
import { authService } from './services/AuthService';
import { userWorkspaceService, type UserWorkspaceSnapshot } from './services/UserWorkspaceService';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(authService.getActiveSession());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedReactorId, setSelectedReactorId] = useState<number>(1);
  const [controller] = useState<IReactorController>(simulatorController);
  const [reactors, setReactors] = useState<ReactorState[]>(simulatorController.getReactorStates());
  const [activeAlarms, setActiveAlarms] = useState<AlarmItem[]>(alarmManager.getActiveAlarms());
  const [lastSavedAt, setLastSavedAt] = useState<string>('');

  // 1. Subscribe to Auth Service Session
  useEffect(() => {
    const unsubAuth = authService.subscribe(session => {
      setCurrentUser(session);
      if (session) {
        // Load user's saved workspace snapshot!
        const snapshot = userWorkspaceService.loadWorkspace(session.username);
        setActiveTab(snapshot.lastActiveTab || 'dashboard');
        setSelectedReactorId(snapshot.selectedReactorId || 1);
        setLastSavedAt(snapshot.lastSavedAt);

        // Apply user's saved reactor setpoints to controller
        if (snapshot.reactorSetpoints) {
          Object.keys(snapshot.reactorSetpoints).forEach(idKey => {
            const rId = parseInt(idKey, 10);
            const sp = snapshot.reactorSetpoints[rId];
            if (sp) {
              controller.setTargetTemperature(rId, sp.targetTemp);
              controller.setOverheadSpeed(rId, sp.overheadRPM);
              controller.setMagneticSpeed(rId, sp.magneticRPM);
            }
          });
        }
      }
    });
    return unsubAuth;
  }, [controller]);

  // 2. Auto-save workspace snapshot whenever reactor setpoints or active tab change
  const saveCurrentWorkspace = () => {
    if (!currentUser) return;
    const currentStates = controller.getReactorStates();
    const setpointsMap: UserWorkspaceSnapshot['reactorSetpoints'] = {};

    currentStates.forEach(r => {
      setpointsMap[r.id] = {
        targetTemp: r.targetTemp,
        overheadRPM: r.overheadTargetRPM,
        magneticRPM: r.magneticTargetRPM,
        heating: r.heatingActive,
        cooling: r.coolingActive,
      };
    });

    const snapshot: UserWorkspaceSnapshot = {
      username: currentUser.username,
      lastActiveTab: activeTab,
      selectedReactorId,
      reactorSetpoints: setpointsMap,
      customNotes: 'Autosaved laboratory workspace state',
      lastSavedAt: new Date().toLocaleTimeString()
    };

    userWorkspaceService.saveWorkspace(snapshot);
    setLastSavedAt(snapshot.lastSavedAt);
  };

  // Auto-save debounced on state updates
  useEffect(() => {
    if (currentUser) {
      saveCurrentWorkspace();
    }
  }, [activeTab, selectedReactorId, reactors, currentUser]);

  // 3. Subscribe to controller state updates & telemetry sampling
  useEffect(() => {
    const unsubController = controller.onStateUpdate(states => {
      setReactors([...states]);
      alarmManager.checkReactorFaults(states);
    });

    const unsubAlarms = alarmManager.subscribe(active => {
      setActiveAlarms([...active]);
    });

    const telemetryInterval = window.setInterval(() => {
      const currentStates = controller.getReactorStates();
      telemetryLogger.addSample(currentStates);
    }, 1000);

    return () => {
      unsubController();
      unsubAlarms();
      window.clearInterval(telemetryInterval);
    };
  }, [controller]);

  const handleEmergencyStop = () => {
    controller.emergencyStopAll();
    const username = currentUser ? currentUser.username : 'Operator';
    const role = currentUser ? currentUser.role : 'OPERATOR';
    alarmManager.raiseAlarm(0, 'E_STOP_MASTER', 'Master Emergency Stop triggered by operator!', 'SAFETY');
    auditLogger.logAction(username, role, 'Emergency Stop', 'MASTER E-STOP PRESSED');
  };

  const handleSelectReactorForManual = (id: number) => {
    setSelectedReactorId(id);
    setActiveTab('manual');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Show Authentication Modal if no active session */}
      {!currentUser && (
        <LoginModal onLoginSuccess={() => {}} />
      )}

      {/* Main UI App Shell */}
      {currentUser && (
        <>
          {/* Top Header Bar */}
          <Header
            connectionStatus={controller.getConnectionStatus()}
            user={currentUser}
            activeAlarms={activeAlarms}
            lastSavedAt={lastSavedAt}
            onEmergencyStop={handleEmergencyStop}
            onSelectTab={setActiveTab}
          />

          {/* Main Workspace Layout (Sidebar + Content View) */}
          <div style={{ display: 'flex', flex: 1 }}>
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              activeAlarmCount={activeAlarms.filter(a => !a.acknowledged).length}
            />

            <main style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 65px)' }}>
              {activeTab === 'dashboard' && (
                <Dashboard
                  reactors={reactors}
                  controller={controller}
                  onSelectReactorForManual={handleSelectReactorForManual}
                />
              )}

              {activeTab === 'manual' && (
                <ManualControl
                  reactors={reactors}
                  selectedReactorId={selectedReactorId}
                  onSelectReactorId={setSelectedReactorId}
                  controller={controller}
                />
              )}

              {activeTab === 'recipes' && (
                <RecipeManager controller={controller} />
              )}

              {activeTab === 'trends' && (
                <LiveTrends />
              )}

              {activeTab === 'batches' && (
                <BatchReports />
              )}

              {activeTab === 'alarms' && (
                <AlarmView />
              )}

              {activeTab === 'simulator' && (
                <SimulatorPanel />
              )}

              {activeTab === 'audit' && (
                <AuditLogView />
              )}

              {activeTab === 'settings' && (
                <SettingsView />
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
