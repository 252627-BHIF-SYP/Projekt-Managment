import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { AuthResponse, LoginCredentials, Role, User } from '../models';
import { KeycloakAuthService } from './keycloak.service';

/**
 * Authentication service.
 * Supports Keycloak (default) and a fall-back mock login for development.
 * Keycloak integration is unchanged from the original implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly keycloakAuthService = inject(KeycloakAuthService);

  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly USE_KEYCLOAK = true;

  /** Current user as a signal (POSE-style state). */
  readonly currentUser = signal<User | null>(null);

  /** Convenience Observable for legacy subscribers. */
  readonly currentUser$: Observable<User | null> = toObservable(this.currentUser);

  /** Convenience boolean signal — does not poll Keycloak. */
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  private readonly mockUsers: User[] = [
    {
      id: '1', username: 'admin', email: 'admin@school.at',
      firstName: 'Admin', lastName: 'User',
      roles: [Role.SYS_ADMIN],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: '2', username: 'av', email: 'av@school.at',
      firstName: 'Abteilungsvorstand', lastName: 'Schmidt',
      roles: [Role.AV],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: '3', username: 'professor', email: 'professor@school.at',
      firstName: 'Max', lastName: 'Müller',
      roles: [Role.PROFESSOR],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: '4', username: 'student1', email: 'student1@school.at',
      firstName: 'Anna', lastName: 'Weber',
      roles: [Role.STUDENT],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: '5', username: 'student2', email: 'student2@school.at',
      firstName: 'Tom', lastName: 'Fischer',
      roles: [Role.STUDENT],
      createdAt: new Date(), updatedAt: new Date()
    }
  ];

  constructor() {
    if (this.USE_KEYCLOAK) {
      this.clearStoredSession();
      try {
        if (this.keycloakAuthService.isLoggedIn()) {
          this.syncKeycloakUser().subscribe();
        }
      } catch {
        // Keycloak adapter is not initialized yet — ignore during bootstrap.
      }
    } else {
      this.currentUser.set(this.getStoredUser());
    }
  }

  /** Legacy getter — prefer the currentUser() signal. */
  get currentUserValue(): User | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    if (this.USE_KEYCLOAK) {
      try {
        return this.keycloakAuthService.isLoggedIn();
      } catch {
        return false;
      }
    }
    return this.currentUser() !== null && !!this.getToken();
  }

  hasRole(role: Role): boolean {
    const user = this.currentUser();
    if (user && this.hasRoleInList(user.roles, role)) {
      return true;
    }
    return this.hasKeycloakRole(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    const user = this.currentUser();
    if (user && roles.some(role => this.hasRoleInList(user.roles, role))) {
      return true;
    }
    return roles.some(role => this.hasKeycloakRole(role));
  }

  /**
   * Mock login (only used when USE_KEYCLOAK is false).
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (this.USE_KEYCLOAK) {
      throw new Error('Use loginWithKeycloak() when Keycloak is enabled');
    }

    const user = this.mockUsers.find(u => u.username === credentials.username);
    if (user && credentials.password === 'password') {
      const token = this.generateMockToken();
      const authResponse: AuthResponse = { token, user, expiresIn: 3600 };

      return of(authResponse).pipe(
        delay(500),
        tap(response => this.setSession(response))
      );
    }

    return of(null).pipe(
      delay(500),
      map(() => { throw new Error('Invalid username or password'); })
    );
  }

  loginWithKeycloak(): Observable<void> {
    this.clearStoredSession();
    this.currentUser.set(null);
    return this.keycloakAuthService.login(`${window.location.origin}/projects`);
  }

  syncKeycloakUser(): Observable<User | null> {
    if (!this.USE_KEYCLOAK || !this.keycloakAuthService.isLoggedIn()) {
      this.currentUser.set(null);
      return of(null);
    }

    return this.keycloakAuthService.getCurrentUser().pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): void {
    if (this.USE_KEYCLOAK) {
      this.keycloakAuthService.logout().subscribe(() => {
        this.clearStoredSession();
        this.currentUser.set(null);
      });
    } else {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this.currentUser.set(null);
      this.router.navigate(['/login']);
    }
  }

  refreshToken(): Observable<AuthResponse> {
    // TODO: token refresh
    return throwError(() => new Error('Token refresh not implemented'));
  }

  getToken(): string | null {
    if (this.USE_KEYCLOAK) {
      return this.keycloakAuthService.getToken();
    }
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.AUTH_TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    this.currentUser.set(authResponse.user);
  }

  private clearStoredSession(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  private hasRoleInList(userRoles: Role[], role: Role): boolean {
    if (userRoles.includes(role)) {
      return true;
    }
    if (role === Role.SYS_ADMIN) {
      return userRoles.includes(Role.SYS_ADMIN);
    }
    return false;
  }

  private hasKeycloakRole(role: Role): boolean {
    if (!this.USE_KEYCLOAK) {
      return false;
    }
    try {
      if (!this.keycloakAuthService.isLoggedIn()) {
        return false;
      }
      return this.getKeycloakRoleNames(role)
        .some(keycloakRole => this.keycloakAuthService.hasRole(keycloakRole));
    } catch {
      return false;
    }
  }

  private getKeycloakRoleNames(role: Role): string[] {
    switch (role) {
      case Role.SYS_ADMIN: return ['admin', 'sys-admin'];
      case Role.AV: return ['av'];
      case Role.PROFESSOR: return ['professor', 'lehrer'];
      case Role.STUDENT: return ['student', 'schueler', 'schüler'];
      default: return [];
    }
  }

  private generateMockToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'Mock User', iat: Date.now() }));
    return `${header}.${payload}.mock-signature`;
  }
}
