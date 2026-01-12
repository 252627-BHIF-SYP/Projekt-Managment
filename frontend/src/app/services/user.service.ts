import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, Role } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * User service for managing users (professors, supervisors, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock data
  private mockUsers: User[] = [
    {
      id: '3',
      username: 'professor',
      email: 'max.mueller@school.at',
      firstName: 'Max',
      lastName: 'Müller',
      roles: [Role.PROFESSOR],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '8',
      username: 'betreuer1',
      email: 'peter.wagner@company.at',
      firstName: 'Peter',
      lastName: 'Wagner',
      roles: [Role.BETREUER],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '9',
      username: 'professor2',
      email: 'maria.schmidt@school.at',
      firstName: 'Maria',
      lastName: 'Schmidt',
      roles: [Role.PROFESSOR],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Get all users
   */
  getUsers(): Observable<User[]> {
    // TODO: Replace with API call
    // return this.apiService.get<User[]>('/users');
    return of(this.mockUsers).pipe(delay(200));
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: Role): Observable<User[]> {
    // TODO: Replace with API call
    // return this.apiService.get<User[]>(`/users?role=${role}`);
    return of(this.mockUsers.filter(u => u.roles.includes(role))).pipe(delay(200));
  }

  /**
   * Get professors/supervisors
   */
  getSupervisors(): Observable<User[]> {
    // TODO: Replace with API call
    // return this.apiService.get<User[]>('/users/supervisors');
    return of(this.mockUsers.filter(u => 
      u.roles.includes(Role.PROFESSOR) || 
      u.roles.includes(Role.BETREUER) ||
      u.roles.includes(Role.AV)
    )).pipe(delay(200));
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User> {
    // TODO: Replace with API call
    // return this.apiService.get<User>(`/users/${id}`);
    const user = this.mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return of(user).pipe(delay(200));
  }

  /**
   * Update user
   */
  updateUser(id: string, user: Partial<User>): Observable<User> {
    // TODO: Replace with API call
    // return this.apiService.put<User>(`/users/${id}`, user);
    const existing = this.mockUsers.find(u => u.id === id);
    if (!existing) {
      throw new Error('User not found');
    }
    const updated = { ...existing, ...user, updatedAt: new Date() };
    return of(updated).pipe(delay(300));
  }
}
