import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { User, Role, LoginCredentials, AuthResponse } from '../models';
import { KeycloakAuthService } from './keycloak.service';

/**
 * Authentication service
 * Supports both Keycloak and mock authentication
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly USE_KEYCLOAK = true; // Set to false for mock authentication

  // Mock users for development
  private mockUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@school.at',
      firstName: 'Admin',
      lastName: 'User',
      roles: [Role.SYS_ADMIN],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      username: 'av',
      email: 'av@school.at',
      firstName: 'Abteilungsvorstand',
      lastName: 'Schmidt',
      roles: [Role.AV],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      username: 'professor',
      email: 'professor@school.at',
      firstName: 'Max',
      lastName: 'Müller',
      roles: [Role.PROFESSOR],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      username: 'student1',
      email: 'student1@school.at',
      firstName: 'Anna',
      lastName: 'Weber',
      roles: [Role.STUDENT_SEARCHING],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      username: 'student2',
      email: 'student2@school.at',
      firstName: 'Tom',
      lastName: 'Fischer',
      roles: [Role.STUDENT_PROJECT],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  constructor(
    private router: Router,
    private keycloakAuthService: KeycloakAuthService
  ) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Initialize user from Keycloak if logged in
    if (this.USE_KEYCLOAK) {
      try {
        if (this.keycloakAuthService.isLoggedIn()) {
          this.keycloakAuthService.getCurrentUser().subscribe(user => {
            if (user) {
              this.currentUserSubject.next(user);
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            }
          });
        }
      } catch {
        // Keycloak not initialized yet -> ignore during app startup
      }
    }
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (this.USE_KEYCLOAK) {
      try {
        return this.keycloakAuthService.isLoggedIn();
      } catch {
        return false;
      }
    }
    return !!this.currentUserValue && !!this.getToken();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: Role): boolean {
    const user = this.currentUserValue;
    return user ? user.roles.includes(role) : false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: Role[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.some(role => user.roles.includes(role)) : false;
  }

  /**
   * Login with credentials (mocked)
   * Only used when USE_KEYCLOAK is false
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (this.USE_KEYCLOAK) {
      throw new Error('Use loginWithKeycloak() when Keycloak is enabled');
    }

    // Mock authentication logic
    const user = this.mockUsers.find(u => u.username === credentials.username);

    if (user && credentials.password === 'password') {
      const token = this.generateMockToken();
      const authResponse: AuthResponse = {
        token,
        user,
        expiresIn: 3600
      };

      // Simulate API delay
      return of(authResponse).pipe(
        delay(500),
        tap(response => {
          this.setSession(response);
        })
      );
    }

    return of(null).pipe(
      delay(500),
      map(() => {
        throw new Error('Invalid username or password');
      })
    );
  }

  /**
   * Login with Keycloak
   */
  loginWithKeycloak(): Observable<void> {
    // If already logged in via Keycloak, load user and navigate to dashboard
    if (this.keycloakAuthService.isLoggedIn()) {
      return this.keycloakAuthService.getCurrentUser().pipe(
        tap(user => {
          if (user) {
            this.currentUserSubject.next(user);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          }
        }),
        map(() => {
          // Navigate to dashboard after loading user
          this.router.navigate(['/dashboard']);
          return undefined;
        })
      );
    }

    // Not logged in yet, trigger Keycloak login (this will redirect to Keycloak)
    return this.keycloakAuthService.login(`${window.location.origin}/login`);
  }

  /**
   * Logout user
   */
  logout(): void {
    if (this.USE_KEYCLOAK) {
      this.keycloakAuthService.logout().subscribe(() => {
        localStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
      });
    } else {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Refresh token (future implementation)
   */
  refreshToken(): Observable<AuthResponse> {
    // TODO: Implement token refresh logic
    return throwError(() => new Error('Token refresh not implemented'));
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    if (this.USE_KEYCLOAK) {
      return this.keycloakAuthService.getToken();
    }
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  /**
   * Set authentication session
   */
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.AUTH_TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    this.currentUserSubject.next(authResponse.user);
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Generate mock JWT token
   */
  private generateMockToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: '1234567890', 
      name: 'Mock User',
      iat: Date.now() 
    }));
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }
}
