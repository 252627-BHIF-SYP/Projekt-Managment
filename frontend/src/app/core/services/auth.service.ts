import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { User, Role, LoginCredentials, AuthResponse } from '../models';

/**
 * Authentication service
 * Currently uses mock authentication, prepared for Keycloak integration
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

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

  constructor(private router: Router) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
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
   * TODO: Replace with Keycloak integration
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
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
   * Login with Keycloak (future implementation)
   * This is where Keycloak integration will be added
   */
  loginWithKeycloak(): Observable<AuthResponse> {
    // TODO: Implement Keycloak login
    // return this.keycloakService.login();
    throw new Error('Keycloak integration not yet implemented');
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
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
