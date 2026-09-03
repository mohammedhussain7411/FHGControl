import type { UserSession, UserRole } from '../types/reactor';
import { auditLogger } from './AuditLogger';

export interface UserAccount {
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string; // Simple mock hash
  avatarColor: string;
  createdAt: string;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    username: 'dr_hussain',
    fullName: 'Dr. Hussain',
    role: 'ADMINISTRATOR',
    passwordHash: 'admin123',
    avatarColor: '#0284c7',
    createdAt: '2026-09-01'
  },
  {
    username: 'sarah_chen',
    fullName: 'Sarah Chen',
    role: 'ENGINEER',
    passwordHash: 'eng123',
    avatarColor: '#a855f7',
    createdAt: '2026-09-02'
  },
  {
    username: 'alex_rivera',
    fullName: 'Alex Rivera',
    role: 'OPERATOR',
    passwordHash: 'op123',
    avatarColor: '#10b981',
    createdAt: '2026-09-03'
  }
];

export class AuthService {
  private accounts: UserAccount[] = [];
  private activeSession: UserSession | null = null;
  private subscribers: ((session: UserSession | null) => void)[] = [];

  constructor() {
    this.loadAccounts();
    this.loadActiveSession();
  }

  private loadAccounts(): void {
    const saved = localStorage.getItem('fhg_user_accounts');
    if (saved) {
      try {
        this.accounts = JSON.parse(saved);
      } catch {
        this.accounts = [...DEFAULT_ACCOUNTS];
      }
    } else {
      this.accounts = [...DEFAULT_ACCOUNTS];
      this.saveAccounts();
    }
  }

  private saveAccounts(): void {
    localStorage.setItem('fhg_user_accounts', JSON.stringify(this.accounts));
  }

  private loadActiveSession(): void {
    const saved = localStorage.getItem('fhg_active_session');
    if (saved) {
      try {
        this.activeSession = JSON.parse(saved);
      } catch {
        this.activeSession = null;
      }
    }
  }

  public getAccounts(): UserAccount[] {
    return this.accounts;
  }

  public login(username: string, passwordAttempt: string): { success: boolean; message: string; session?: UserSession } {
    const acc = this.accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (!acc) {
      return { success: false, message: 'User account not found' };
    }

    if (acc.passwordHash !== passwordAttempt) {
      return { success: false, message: 'Invalid password. Please try again.' };
    }

    const session: UserSession = {
      username: acc.fullName,
      role: acc.role,
      token: `jwt-${acc.username}-${Date.now()}`,
      loginTime: new Date().toLocaleTimeString()
    };

    this.activeSession = session;
    localStorage.setItem('fhg_active_session', JSON.stringify(session));

    auditLogger.logAction(acc.fullName, acc.role, 'User Login', `User "${acc.fullName}" logged into FH G Control`);

    this.notifySubscribers();
    return { success: true, message: 'Login successful', session };
  }

  public register(fullName: string, username: string, passwordAttempt: string, role: UserRole): { success: boolean; message: string } {
    if (!fullName.trim() || !username.trim() || !passwordAttempt.trim()) {
      return { success: false, message: 'All fields are required' };
    }

    const exists = this.accounts.some(a => a.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username already exists' };
    }

    const colors = ['#0284c7', '#a855f7', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newAcc: UserAccount = {
      username: username.toLowerCase().replace(/\s+/g, '_'),
      fullName,
      role,
      passwordHash: passwordAttempt,
      avatarColor,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    this.accounts.push(newAcc);
    this.saveAccounts();

    auditLogger.logAction('System', 'ADMINISTRATOR', 'User Account Registered', `New user account registered: "${fullName}" (${role})`);

    return { success: true, message: 'Account created successfully. You can now log in.' };
  }

  public logout(): void {
    if (this.activeSession) {
      auditLogger.logAction(this.activeSession.username, this.activeSession.role, 'User Logout', `User logged out of system`);
    }
    this.activeSession = null;
    localStorage.removeItem('fhg_active_session');
    this.notifySubscribers();
  }

  public getActiveSession(): UserSession | null {
    return this.activeSession;
  }

  public subscribe(callback: (session: UserSession | null) => void): () => void {
    this.subscribers.push(callback);
    callback(this.activeSession);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.activeSession));
  }
}

export const authService = new AuthService();
