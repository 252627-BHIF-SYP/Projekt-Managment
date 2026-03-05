import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, Role } from '../models';

/**
 * Service wrapper for Keycloak authentication
 */
@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  
  constructor(private keycloak: KeycloakService) {}

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  /**
   * Login to Keycloak
   */
  login(redirectUri?: string): Observable<void> {
    return from(this.keycloak.login({ redirectUri }));
  }

  /**
   * Logout from Keycloak
   */
  logout(): Observable<void> {
    return from(this.keycloak.logout(window.location.origin));
  }

  /**
   * Get the current user's profile
   */
  getUserProfile(): Observable<KeycloakProfile | null> {
    return from(this.keycloak.loadUserProfile());
  }

  /**
   * Get user info converted to application User model
   */
  getCurrentUser(): Observable<User | null> {
    if (!this.isLoggedIn()) {
      return from([null]);
    }

    return this.getUserProfile().pipe(
      map(profile => {
        if (!profile) return null;

        const tokenParsed = this.keycloak.getKeycloakInstance().tokenParsed;
        const roles = this.extractRoles(tokenParsed);

        return {
          id: profile.id || profile.username || '',
          username: profile.username || '',
          email: profile.email || '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          roles: roles,
          profileImageUrl: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
      })
    );
  }

  /**
   * Get access token
   */
  getToken(): string {
    return this.keycloak.getKeycloakInstance().token || '';
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }

  /**
   * Extract roles from Keycloak token
   */
  private extractRoles(token: any): Role[] {
    const roles: Role[] = [];

    if (!token) return roles;

    // Extract realm roles
    const realmRoles = token.realm_access?.roles || [];
    
    // Extract client roles
    const clientRoles = token.resource_access?.['school-management-frontend']?.roles || [];

    // Combine all roles
    const allRoles = [...realmRoles, ...clientRoles];

    // Map Keycloak roles to application roles
    const roleMapping: { [key: string]: Role } = {
      'sys-admin': Role.SYS_ADMIN,
      'av': Role.AV,
      'professor': Role.PROFESSOR,
      'betreuer': Role.BETREUER,
      'student-searching': Role.STUDENT_SEARCHING,
      'student-project': Role.STUDENT_PROJECT
    };

    allRoles.forEach(role => {
      const mappedRole = roleMapping[role.toLowerCase()];
      if (mappedRole && !roles.includes(mappedRole)) {
        roles.push(mappedRole);
      }
    });

    return roles;
  }

  /**
   * Refresh the token
   */
  updateToken(): Observable<boolean> {
    return from(this.keycloak.updateToken(30));
  }
}
