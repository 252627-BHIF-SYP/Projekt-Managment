import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, Role, ProfessorDTO, PersonCreatePayload, ProfessorProfileDetail, ProfessorProfileDetailDTO, ProjectFilter } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiService = inject(ApiService);
  private readonly projectService = inject(ProjectService);

  private mapProfessorDtoToUser(dto: ProfessorDTO): User {
    return {
      id: dto.id,
      username: dto.id,
      email: `${dto.id.toLowerCase()}@school.at`,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roles: [Role.PROFESSOR],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  getUsers(): Observable<User[]> {
    return this.getSupervisors();
  }

  getUsersByRole(role: Role): Observable<User[]> {
    return this.getSupervisors().pipe(
      map(users => users.filter(user => user.roles.includes(role)))
    );
  }

  getSupervisors(): Observable<User[]> {
    return this.apiService.get<ProfessorDTO[]>('/Professor/All').pipe(
      map(professors => professors.map(p => this.mapProfessorDtoToUser(p)))
    );
  }

  createProfessor(payload: PersonCreatePayload): Observable<User> {
    return this.apiService.post<ProfessorDTO>('/Professor/Add', payload).pipe(
      map(dto => this.mapProfessorDtoToUser(dto))
    );
  }

  getUserById(id: string): Observable<User> {
    return this.apiService.get<ProfessorDTO>(`/Professor/${id}`).pipe(
      map(dto => this.mapProfessorDtoToUser(dto))
    );
  }

  getProfessorProfile(id: string, filter: ProjectFilter = {}): Observable<ProfessorProfileDetail> {
    return this.apiService.get<ProfessorProfileDetailDTO>(`/Professor/${id}/Profile`, {
      searchTerm: filter.searchTerm,
      schoolYearId: filter.schoolYearId,
      projectType: filter.projectType,
      status: filter.status
    }).pipe(
      map(dto => {
        const professor = this.mapProfessorDtoToUser(dto);
        return {
          ...professor,
          username: dto.username || dto.id,
          projects: (dto.projects || []).map(project => this.projectService.mapProjectDto(project))
        };
      })
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    throw new Error('Professor update is not implemented in the backend yet.');
  }
}
