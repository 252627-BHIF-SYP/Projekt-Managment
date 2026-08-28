import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Role } from '../models';
import { AuthService } from './auth.service';
import { KeycloakAuthService } from './keycloak.service';

/**
 * Central API service for all HTTP requests.
 * Adds the Keycloak bearer token to every outgoing request.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly keycloakAuthService = inject(KeycloakAuthService);

  private readonly baseUrl = environment.apiUrl;

  get<T>(endpoint: string, params?: Record<string, unknown>): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<T>(url, {
        params: this.buildParams(params),
        headers
      }))
    );
  }

  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post<T>(`${this.baseUrl}${endpoint}`, data, { headers }))
    );
  }

  put<T>(endpoint: string, data: unknown): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.put<T>(`${this.baseUrl}${endpoint}`, data, { headers }))
    );
  }

  patch<T>(endpoint: string, data: unknown): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.patch<T>(`${this.baseUrl}${endpoint}`, data, { headers }))
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.delete<T>(`${this.baseUrl}${endpoint}`, { headers }))
    );
  }

  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    // Do not set Content-Type for FormData — the browser adds it with the boundary.
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, { headers }))
    );
  }

  getBlob(endpoint: string, params?: Record<string, unknown>): Observable<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get(url, {
        params: this.buildParams(params),
        headers,
        responseType: 'blob'
      }))
    );
  }

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value !== null && value !== undefined) {
        httpParams = httpParams.append(key, String(value));
      }
    }
    return httpParams;
  }

  private getHeaders(): Observable<HttpHeaders> {
    if (this.authService.isKeycloakEnabled() && this.keycloakAuthService.isLoggedIn()) {
      return this.keycloakAuthService.updateToken().pipe(
        map(() => this.createAuthHeaders()),
        catchError(() => of(this.createMockHeaders()))
      );
    }

    return of(this.createMockHeaders());
  }

  private getToken(): string | null {
    try {
      return this.keycloakAuthService.getToken();
    } catch {
      return localStorage.getItem('auth_token');
    }
  }

  private createAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
  }

  private createMockHeaders(): HttpHeaders {
    const user = this.authService.currentUserValue;
    if (!user) {
      return new HttpHeaders();
    }

    return new HttpHeaders()
      .set('X-Mock-Username', user.username)
      .set('X-Mock-Roles', user.roles.map(role => this.toBackendRole(role)).join(','));
  }

  private toBackendRole(role: Role): string {
    switch (role) {
      case Role.SYS_ADMIN: return 'sys-admin';
      case Role.AV: return 'av';
      case Role.PROFESSOR: return 'professor';
      case Role.STUDENT: return 'student';
      default: return '';
    }
  }
}
