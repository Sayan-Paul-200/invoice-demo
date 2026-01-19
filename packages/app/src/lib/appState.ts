type AppState = {
  userId: string;
  fullName: string;
  profilePhotoUrl: string | null;
  projectId: string;     // Matches 'Invoice System' domain
  projectName: string;
  role: 'admin' | 'staff' | 'accountant' | 'other';
  permissions: string[];
};

class AppStateManager {
  private static instance: AppStateManager;

  private state: AppState = {
    userId: '',
    fullName: '',
    profilePhotoUrl: null,
    projectId: '',
    projectName: '',
    role: 'other',
    permissions: [],
  };

  constructor() {
    const savedState = sessionStorage.getItem('appState');
    if (savedState) {
      this.state = JSON.parse(savedState);
    }
  }

  public static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }

  public setState(newState: Partial<AppState>): void {
    this.state = { ...this.state, ...newState };
    sessionStorage.setItem('appState', JSON.stringify(this.state));
  }

  public getState(): AppState {
    return { ...this.state };
  }

  // --- NEW: Required for Logout/Token Expiry ---
  public clearState(): void {
    this.state = {
      userId: '',
      fullName: '',
      profilePhotoUrl: null,
      projectId: '',
      projectName: '',
      role: 'other',
      permissions: [],
    };
    sessionStorage.removeItem('appState');
  }
}

const appStateManager = AppStateManager.getInstance();

export { appStateManager };