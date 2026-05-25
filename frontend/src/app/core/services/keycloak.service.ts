import { Injectable, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, Role } from '../models';

/**
 * Wrapper around the Keycloak adapter.
 * Logic is unchanged from the original implementation — only the
 * dependency-injection style was updated to the Angular 20 inject() pattern.
 */
@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  private readonly keycloak = inject(KeycloakService);

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  login(redirectUri?: string): Observable<void> {
    return from(this.keycloak.login({ redirectUri }));
  }

  logout(): Observable<void> {
    return from(this.keycloak.logout(window.location.origin));
  }

  getUserProfile(): Observable<KeycloakProfile | null> {
    return from(this.keycloak.loadUserProfile());
  }

  getCurrentUser(): Observable<User | null> {
    if (!this.isLoggedIn()) {
      return from([null]);
    }

    const fromToken = this.getUserFromToken();
    if (fromToken) {
      return from([fromToken]);
    }

    return this.getUserProfile().pipe(
      map(profile => {
        if (!profile) {
          return null;
        }

        const tokenParsed = this.keycloak.getKeycloakInstance().tokenParsed;
        const roles = this.extractRoles(tokenParsed);

        return {
          id: profile.id || profile.username || '',
          username: profile.username || '',
          email: profile.email || '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          roles,
          profileImageUrl: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
      })
    );
  }

  getUserFromToken(): User | null {
    if (!this.isLoggedIn()) {
      return null;
    }
    const token = this.keycloak.getKeycloakInstance().tokenParsed;
    if (!token) {
      return null;
    }
    const roles = this.extractRoles(token);
    return {
      id: token['sub'] || '',
      username: token['preferred_username'] || '',
      email: token['email'] || '',
      firstName: token['given_name'] || '',
      lastName: token['family_name'] || '',
      roles,
      profileImageUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  getToken(): string {
    return this.keycloak.getKeycloakInstance().token || '';
  }

  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }

  updateToken(): Observable<boolean> {
    return from(this.keycloak.updateToken(30));
  }

  private extractRoles(token: any): Role[] {
    const roles: Role[] = [];
    if (!token) {
      return roles;
    }

    const realmRoles: string[] = token.realm_access?.roles || [];
    const clientRoles: string[] = token.resource_access?.['school-management-frontend']?.roles || [];
    const allRoles = [...realmRoles, ...clientRoles];

    const roleMapping: Record<string, Role> = {
      'admin': Role.SYS_ADMIN,
      'sys-admin': Role.SYS_ADMIN,
      'av': Role.AV,
      'professor': Role.PROFESSOR,
      'lehrer': Role.PROFESSOR,
      'student': Role.STUDENT,
      'schueler': Role.STUDENT,
      'schüler': Role.STUDENT
    };

    for (const role of allRoles) {
      const mapped = roleMapping[role.toLowerCase()];
      if (mapped && !roles.includes(mapped)) {
        roles.push(mapped);
      }
    }

    return roles;
  }
}
