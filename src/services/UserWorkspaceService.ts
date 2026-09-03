export interface UserWorkspaceSnapshot {
  username: string;
  lastActiveTab: string;
  selectedReactorId: number;
  reactorSetpoints: {
    [reactorId: number]: {
      targetTemp: number;
      overheadRPM: number;
      magneticRPM: number;
      heating: boolean;
      cooling: boolean;
    };
  };
  customNotes: string;
  lastSavedAt: string;
}

export class UserWorkspaceService {
  private currentSnapshot: UserWorkspaceSnapshot | null = null;

  public loadWorkspace(username: string): UserWorkspaceSnapshot {
    const key = `fhg_workspace_${username.toLowerCase().replace(/\s+/g, '_')}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentSnapshot = parsed;
        return parsed;
      } catch {
        // Fallback default
      }
    }

    const defaultSnapshot: UserWorkspaceSnapshot = {
      username,
      lastActiveTab: 'dashboard',
      selectedReactorId: 1,
      reactorSetpoints: {
        1: { targetTemp: 80, overheadRPM: 600, magneticRPM: 800, heating: true, cooling: false },
        2: { targetTemp: 25, overheadRPM: 0, magneticRPM: 0, heating: false, cooling: false },
        3: { targetTemp: 120, overheadRPM: 900, magneticRPM: 1000, heating: true, cooling: false },
        4: { targetTemp: 50, overheadRPM: 500, magneticRPM: 500, heating: true, cooling: false }
      },
      customNotes: 'Default laboratory reaction run parameters.',
      lastSavedAt: new Date().toLocaleTimeString()
    };

    this.currentSnapshot = defaultSnapshot;
    return defaultSnapshot;
  }

  public saveWorkspace(snapshot: UserWorkspaceSnapshot): void {
    const key = `fhg_workspace_${snapshot.username.toLowerCase().replace(/\s+/g, '_')}`;
    snapshot.lastSavedAt = new Date().toLocaleTimeString();
    this.currentSnapshot = snapshot;
    localStorage.setItem(key, JSON.stringify(snapshot));
  }

  public getCurrentSnapshot(): UserWorkspaceSnapshot | null {
    return this.currentSnapshot;
  }
}

export const userWorkspaceService = new UserWorkspaceService();
