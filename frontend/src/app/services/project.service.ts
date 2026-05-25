import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateProjectPayload,
  Project,
  ProjectDTO,
  ProjectFilter,
  ProjectPermission,
  ProjectStatus,
  ProjectStudent,
  ProjectStudentDTO,
  ProjectSupervisor,
  ProjectSupervisorDTO,
  UpdateProjectPayload
} from '../core/models';
import { ApiService } from '../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiService = inject(ApiService);

  /** Cached project list as a signal (POSE-style state). */
  private readonly projectsState = signal<Project[]>([]);
  readonly projects = computed(() => this.projectsState());

  getProjects(): Observable<Project[]> {
    return this.apiService.get<ProjectDTO[]>('/Project/All').pipe(
      map(dtos => dtos.map(dto => this.mapProjectDto(dto))),
      tap(projects => this.projectsState.set(projects))
    );
  }

  getProjectsFiltered(filter: ProjectFilter): Observable<Project[]> {
    return this.apiService.get<ProjectDTO[]>('/Project/All', {
      searchTerm: filter.searchTerm,
      schoolYearId: filter.schoolYearId,
      classId: filter.classId,
      supervisorId: filter.supervisorId,
      projectType: filter.projectType,
      status: filter.status
    }).pipe(
      map(dtos => dtos.map(dto => this.mapProjectDto(dto))),
      tap(projects => this.projectsState.set(projects))
    );
  }

  getMyProjects(filter: ProjectFilter = {}): Observable<Project[]> {
    return this.apiService.get<ProjectDTO[]>('/Project/My', {
      searchTerm: filter.searchTerm,
      schoolYearId: filter.schoolYearId,
      projectType: filter.projectType,
      status: filter.status
    }).pipe(
      map(dtos => dtos.map(dto => this.mapProjectDto(dto)))
    );
  }

  getProjectById(id: string): Observable<Project> {
    return this.apiService.get<ProjectDTO>(`/Project/${id}`).pipe(
      map(dto => this.mapProjectDto(dto))
    );
  }

  createProject(payload: CreateProjectPayload): Observable<Project> {
    return this.apiService.post<ProjectDTO>('/Project/Add', payload).pipe(
      map(dto => this.mapProjectDto(dto)),
      tap(() => this.getProjects().subscribe())
    );
  }

  updateProject(id: string, payload: UpdateProjectPayload): Observable<Project> {
    return this.apiService.put<ProjectDTO>(`/Project/${id}`, payload).pipe(
      map(dto => this.mapProjectDto(dto)),
      tap(() => this.getProjects().subscribe())
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.apiService.delete<void>(`/Project/${id}`);
  }

  getProjectPermissions(id: string): Observable<ProjectPermission> {
    return this.apiService.get<ProjectPermission>(`/Project/${id}/Permissions`);
  }

  getProjectTypes(): Observable<string[]> {
    return this.apiService.get<string[]>('/Project/Types');
  }

  getProjectStatuses(): Observable<string[]> {
    return this.apiService.get<string[]>('/Project/Statuses');
  }

  private toUiStatus(status: string): ProjectStatus {
    switch (status) {
      case 'Pending': return ProjectStatus.PENDING;
      case 'OnGoing': return ProjectStatus.ON_GOING;
      case 'Completed': return ProjectStatus.COMPLETED;
      case 'Archived': return ProjectStatus.ARCHIVED;
      default: return ProjectStatus.NEW;
    }
  }

  private mapProjectStudentDto(dto: ProjectStudentDTO): ProjectStudent {
    return {
      id: String(dto.projectStudentId),
      projectId: '',
      historyId: dto.historyId,
      studentId: dto.studentId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      studentName: `${dto.firstName} ${dto.lastName}`,
      studentEmail: `${dto.studentId.toLowerCase()}@school.at`,
      className: dto.className,
      role: dto.role,
      joinedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapProjectSupervisorDto(dto: ProjectSupervisorDTO): ProjectSupervisor {
    return {
      id: String(dto.projectSupervisorId),
      projectId: '',
      supervisorId: dto.professorId,
      supervisorName: `${dto.firstName} ${dto.lastName}`,
      supervisorEmail: `${dto.professorId.toLowerCase()}@school.at`,
      role: dto.role,
      isPrimary: dto.role.toLowerCase().includes('primary') || dto.role.toLowerCase().includes('haupt'),
      assignedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  mapProjectDto(dto: ProjectDTO): Project {
    const schoolYearIds = dto.schoolYears?.map(year => String(year.schoolYearId)) || [];
    const firstSchoolYear = dto.schoolYears?.[0];
    const firstStudent = dto.students?.[0];

    return {
      projectId: dto.projectId,
      id: String(dto.projectId),
      title: dto.title,
      description: dto.description,
      schoolYearId: firstSchoolYear ? String(firstSchoolYear.schoolYearId) : '',
      schoolYearIds,
      schoolYear: dto.schoolYears?.map(year => year.year).join(', ') || '',
      classId: '',
      className: firstStudent ? firstStudent.className : '',
      status: this.toUiStatus(dto.status),
      githubUrl: dto.githubUrl,
      logoUrl: dto.logoUrl,
      technologies: dto.technology
        ? dto.technology.split(/[,;]/).map(item => item.trim()).filter(Boolean)
        : [],
      students: dto.students?.map(s => this.mapProjectStudentDto(s)) || [],
      supervisors: dto.supervisors?.map(s => this.mapProjectSupervisorDto(s)) || [],
      projectType: dto.projectType,
      maxStudents: dto.students?.length || 0,
      minStudents: 0,
      tags: dto.technology ? dto.technology.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
