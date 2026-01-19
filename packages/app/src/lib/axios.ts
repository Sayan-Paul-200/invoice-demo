import axios, { AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { jwtDecode } from 'jwt-decode';
import { appStateManager } from './appState';

type TokenAPIResponse = {
  accessToken: string;
  accessTokenExpiry: string;
};

type JWTPayload = {
  sub: string;
  role: 'admin' | 'staff' | 'accountant';
  projectId?: string;
  permissions?: string[];
  exp: number;
  account?: {
    role: string;
    projectId: string;
  }
};

type Credentials = {
  accessToken: string;
  accessTokenExpiry: Date;
};

const CONFIG = {
  IAM_TOKEN_ENDPOINT: '/iam/v1/authenticate/token',
  CACHE_TTL: 1000 * 10,
  TOKEN_STORAGE_KEY: 'auth_tokens',
  SESSION_HINT_KEY: 'has_active_session', // <--- NEW CONSTANT
} as const;

// Token Storage
class TokenStorage {
  private static instance: TokenStorage;

  private credentials: Credentials = {
    accessToken: '',
    accessTokenExpiry: new Date(0),
  };

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(CONFIG.TOKEN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.credentials = {
          accessToken: parsed.accessToken,
          accessTokenExpiry: new Date(parsed.accessTokenExpiry),
        };
      }
    } catch { /* Ignore */ }
  }

  private saveToStorage(): void {
    try {
      sessionStorage.setItem(CONFIG.TOKEN_STORAGE_KEY, JSON.stringify(this.credentials));
    } catch { /* Ignore */ }
  }

  public getCredentials(): Credentials {
    return { ...this.credentials };
  }

  public setCredentials(credentials: Partial<Credentials>): void {
    this.credentials = { ...this.credentials, ...credentials };
    this.saveToStorage();
  }

  public isTokenValid(): boolean {
    return this.credentials.accessToken !== '' && this.credentials.accessTokenExpiry > new Date();
  }

  public clear(): void {
    this.credentials = {
      accessToken: '',
      accessTokenExpiry: new Date(0),
    };
    sessionStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
    // --- FIX 1: Remove the hint when clearing session ---
    localStorage.removeItem(CONFIG.SESSION_HINT_KEY); 
    appStateManager.clearState();
  }
}

// Token Manager
class TokenManager {
  private static instance: TokenManager;
  private storage = TokenStorage.getInstance();
  private refreshPromise: Promise<string> | null = null;

  private constructor(private internalClient: AxiosInstance) {}

  public static getInstance(internalClient: AxiosInstance): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager(internalClient);
    }
    return TokenManager.instance;
  }

  public async retrieveCurrentToken(): Promise<string> {
    if (this.storage.isTokenValid()) {
      return this.storage.getCredentials().accessToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshAccessToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  public async refreshAccessToken(): Promise<string> {
    try {
      const response = await this.internalClient.post<TokenAPIResponse>(CONFIG.IAM_TOKEN_ENDPOINT);
      const { accessToken, accessTokenExpiry } = response.data;

      const decoded = jwtDecode<JWTPayload>(accessToken);
      
      const role = decoded.role || decoded.account?.role || 'other';
      const projectId = decoded.projectId || decoded.account?.projectId || '';

      this.storage.setCredentials({
        accessToken,
        accessTokenExpiry: new Date(accessTokenExpiry),
      });

      // --- FIX 2: Set the hint on success ---
      localStorage.setItem(CONFIG.SESSION_HINT_KEY, 'true');

      appStateManager.setState({
        userId: decoded.sub,
        role: role as any,
        projectId: projectId,
        projectName: 'My Project', 
        permissions: decoded.permissions || [],
      });

      return accessToken;
    } catch (error) {
      this.storage.clear(); // This removes the hint

      if (isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)) {
        // Suppress log
      } else {
        console.error("❌ Token Refresh Failed:", error);
      }
      
      throw new Error('Failed to refresh token');
    }
  }

  public clearTokens(): void {
    this.storage.clear();
  }
  
  public getCurrentRole(): string | undefined {
    return appStateManager.getState().role;
  }
}

const internalClient = axios.create({ withCredentials: true }); 
const standardClient = axios.create({ withCredentials: true });
const cachedClient = axios.create({ withCredentials: true });

const createAuthInterceptor = (tokenManager: TokenManager) => {
  return async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (!request.url?.startsWith('/api')) {
      return request;
    }

    try {
      const accessToken = await tokenManager.retrieveCurrentToken();
      request.headers['Authorization'] = `Bearer ${accessToken}`;
      return request;
    } catch {
      const controller = new AbortController();
      controller.abort();
      return { ...request, signal: controller.signal };
    }
  };
};

const tokenManager = TokenManager.getInstance(internalClient);

standardClient.interceptors.request.use(createAuthInterceptor(tokenManager));
cachedClient.interceptors.request.use(createAuthInterceptor(tokenManager));

const axiosCached = setupCache(cachedClient, { ttl: CONFIG.CACHE_TTL });

export { standardClient as axios };
export { axiosCached };
export { tokenManager };
export { isAxiosError } from 'axios';
export type { TokenAPIResponse, Credentials };