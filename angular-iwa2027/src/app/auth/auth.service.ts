import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthSession, LoginResponse, RegisterRequest, RegisterResponse } from '../core/models';

interface StoredAuthState {
  schemaVersion: 3;
  token: string | null;
  tokenType: string;
  identifier: string | null;
  fullName: string | null;
  blocked: boolean;
  roles: string[];
}

const authStateSchemaVersion = 3;
const storageKey = 'iwa.shared-subscriptions.auth';
const legacyStorageKeys = [
  'accessToken',
  'auth',
  'authToken',
  'currentUser',
  'iwa.auth',
  'iwa.shared-subscriptions.token',
  'jwt',
  'token',
  'user',
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = 'http://localhost:8080/auth';

  private readonly authState = signal<StoredAuthState>(this.readStoredState());

  readonly isLoggedIn = computed(() => Boolean(this.authState().token));
  readonly identifier = computed(() => this.authState().identifier);
  readonly fullName = computed(() => this.authState().fullName);
  readonly blocked = computed(() => this.authState().blocked);
  readonly roles = computed(() => this.authState().roles);
  readonly session = computed<AuthSession>(() => {
    const state = this.authState();
    return {
      token: state.token ?? '',
      tokenType: state.tokenType,
      identifier: state.identifier ?? '',
      fullName: state.fullName ?? '',
      blocked: state.blocked,
      roles: state.roles,
    };
  });

  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/signin`, { identifier, password }).pipe(
      tap((response) => this.storeLoginResponse(response))
    );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.authUrl}/signup`, request);
  }

  logout(): void {
    this.removeState();
    this.authState.set(this.emptyState());
  }

  authorizationHeader(): string | null {
    const state = this.authState();
    return state.token ? `${state.tokenType} ${state.token}` : null;
  }

  hasRole(role: string): boolean {
    return this.authState().roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    if (roles.length === 0) {
      return true;
    }

    return roles.some((role) => this.hasRole(role));
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  private storeLoginResponse(response: LoginResponse): void {
    const state: StoredAuthState = {
      schemaVersion: authStateSchemaVersion,
      token: response.token,
      tokenType: response.type || 'Bearer',
      identifier: response.identifier,
      fullName: response.fullName,
      blocked: Boolean(response.blocked),
      roles: this.normalizeRoles(response.roles ?? response.authorities ?? []),
    };

    this.writeState(state);
    this.authState.set(state);
  }

  private readStoredState(): StoredAuthState {
    this.removeLegacyAuthArtifacts();

    const stored = this.readState();
    if (!stored) {
      return this.emptyState();
    }

    try {
      const parsed = JSON.parse(stored) as Partial<StoredAuthState>;
      if (parsed.schemaVersion !== authStateSchemaVersion || !parsed.token) {
        this.removeState();
        return this.emptyState();
      }

      return {
        schemaVersion: authStateSchemaVersion,
        token: parsed.token || null,
        tokenType: parsed.tokenType || 'Bearer',
        identifier: parsed.identifier || null,
        fullName: parsed.fullName || null,
        blocked: Boolean(parsed.blocked),
        roles: Array.isArray(parsed.roles) ? parsed.roles : [],
      };
    } catch {
      this.removeState();
      return this.emptyState();
    }
  }

  private normalizeRoles(value: LoginResponse['roles'] | LoginResponse['authorities']): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => typeof item === 'string' ? item : item.authority || item.role)
        .filter((role): role is string => Boolean(role));
    }

    if (typeof value === 'string') {
      return value
        .split(/[,\s]+/)
        .map((role) => role.trim())
        .filter(Boolean);
    }

    return [];
  }

  private emptyState(): StoredAuthState {
    return {
      schemaVersion: authStateSchemaVersion,
      token: null,
      tokenType: 'Bearer',
      identifier: null,
      fullName: null,
      blocked: false,
      roles: [],
    };
  }

  private readState(): string | null {
    const sessionValue = sessionStorage.getItem(storageKey);
    if (sessionValue) {
      return sessionValue;
    }

    const localValue = localStorage.getItem(storageKey);
    if (localValue) {
      return localValue;
    }

    return null;
  }

  private writeState(state: StoredAuthState): void {
    const payload = JSON.stringify(state);
    sessionStorage.setItem(storageKey, payload);
    localStorage.setItem(storageKey, payload);
  }

  private removeState(): void {
    sessionStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey);
    this.removeLegacyAuthArtifacts();
  }

  private removeLegacyAuthArtifacts(): void {
    for (const key of legacyStorageKeys) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  }
}
