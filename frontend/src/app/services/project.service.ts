import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { Project, ProjectDTO, ProjectFilter, ProjectStatus, ProjectStudent, ProjectStudentDTO, ProjectSupervisor, ProjectSupervisorDTO } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * Project service for managing projects
 * Uses mock data for development, ready for API integration
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  // Mock data
  private mockProjects: Project[] = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce platform with Angular frontend and Spring Boot backend',
      schoolYearId: '1',
      schoolYear: '2024/2025',
      classId: '1',
      className: '5AHIF',
      status: ProjectStatus.ON_GOING,
      githubUrl: 'https://github.com/example/ecommerce',
      maxStudents: 4,
      minStudents: 2,
      createdById: '3',
      createdByName: 'Max Müller',
      tags: ['Angular', 'Spring Boot', 'PostgreSQL'],
      technologies: ['Angular', 'Spring Boot', 'PostgreSQL', 'Docker'],
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-15')
    },
    {
      id: '2',
      title: 'School Management System',
      description: 'Digital platform for managing school projects, students, and supervisors',
      schoolYearId: '1',
      schoolYear: '2024/2025',
      classId: '2',
      className: '5BHIF',
      status: ProjectStatus.PENDING,
      githubUrl: 'https://github.com/example/school-mgmt',
      maxStudents: 3,
      minStudents: 2,
      createdById: '3',
      createdByName: 'Max Müller',
      tags: ['Angular', 'Node.js', 'MongoDB'],
      technologies: ['Angular', 'Express', 'MongoDB'],
      createdAt: new Date('2024-09-10'),
      updatedAt: new Date('2024-09-10')
    },
    {
      id: '3',
      title: 'IoT Smart Home',
      description: 'IoT-based smart home automation system with mobile app',
      schoolYearId: '1',
      schoolYear: '2024/2025',
      classId: '1',
      className: '5AHIF',
      status: ProjectStatus.COMPLETED,
      githubUrl: 'https://github.com/example/smart-home',
      maxStudents: 3,
      minStudents: 2,
      createdById: '3',
      createdByName: 'Max Müller',
      tags: ['IoT', 'React Native', 'Raspberry Pi'],
      technologies: ['React Native', 'Python', 'MQTT', 'Raspberry Pi'],
      createdAt: new Date('2023-09-01'),
      updatedAt: new Date('2024-06-30')
    }
  ];

  constructor(private apiService: ApiService) {
    this.projectsSubject.next(this.mockProjects);
  }

  private toUiStatus(status: string): ProjectStatus {
    const normalized = status.toLowerCase();
    if (normalized === 'new') {
      return ProjectStatus.NEW;
    }
    if (normalized === 'pending') {
      return ProjectStatus.PENDING;
    }
    if (normalized === 'ongoing') {
      return ProjectStatus.ON_GOING;
    }
    if (normalized === 'completed') {
      return ProjectStatus.COMPLETED;
    }
    if (normalized === 'archived') {
      return ProjectStatus.ARCHIVED;
    }
    return ProjectStatus.NEW;
  }

  private toBackendStatus(status: ProjectStatus | undefined): string {
    switch (status) {
      case ProjectStatus.PENDING:
      case ProjectStatus.OPEN:
        return 'Pending';
      case ProjectStatus.ON_GOING:
      case ProjectStatus.IN_PROGRESS:
        return 'OnGoing';
      case ProjectStatus.COMPLETED:
        return 'Completed';
      case ProjectStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'New';
    }
  }

  private mapProjectStudentDto(dto: ProjectStudentDTO): ProjectStudent {
    return {
      id: String(dto.historyId),
      projectId: '',
      studentId: String(dto.historyId),
      role: dto.role,
      joinedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapProjectSupervisorDto(dto: ProjectSupervisorDTO): ProjectSupervisor {
    return {
      id: dto.professorId,
      projectId: '',
      supervisorId: dto.professorId,
      isPrimary: false,
      assignedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapProjectDto(dto: ProjectDTO, index: number): Project {
    return {
      id: String(index + 1),
      title: dto.title,
      description: dto.description,
      schoolYearId: String(dto.schoolYearId),
      classId: '',
      status: this.toUiStatus(dto.projectStatus),
      githubUrl: dto.githubURL,
      logoUrl: dto.logoURL,
      technologies: dto.technologies
        ? dto.technologies.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [],
      students: dto.students?.map(s => this.mapProjectStudentDto(s)) || [],
      supervisors: dto.supervisors?.map(s => this.mapProjectSupervisorDto(s)) || [],
      projectType: dto.projectType,
      createdById: '',
      maxStudents: 0,
      minStudents: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get all projects
   */
  getProjects(): Observable<Project[]> {
    return this.apiService.get<ProjectDTO[]>('/Project/All').pipe(
      map(dtos => dtos.map((dto, index) => this.mapProjectDto(dto, index))),
      tap(projects => this.projectsSubject.next(projects)),
      catchError(() => of(this.mockProjects).pipe(delay(300)))
    );
  }

  /**
   * Get projects with filters
   */
  getProjectsFiltered(filter: ProjectFilter): Observable<Project[]> {
    return this.getProjects().pipe(
      map(projects => {
        return projects.filter(project => {
          if (filter.searchTerm) {
            const search = filter.searchTerm.toLowerCase();
            if (!project.title.toLowerCase().includes(search) &&
                !project.description.toLowerCase().includes(search)) {
              return false;
            }
          }
          if (filter.schoolYearId && project.schoolYearId !== filter.schoolYearId) {
            return false;
          }
          if (filter.classId && project.classId !== filter.classId) {
            return false;
          }
          if (filter.status && project.status !== filter.status) {
            return false;
          }
          return true;
        });
      })
    );
  }

  /**
   * Get project by ID
   */
  getProjectById(id: string): Observable<Project> {
    return this.apiService.get<ProjectDTO>(`/Project/${id}`).pipe(
      map(dto => this.mapProjectDto(dto, Number(id) - 1)),
      catchError(() => {
        const project = this.mockProjects.find(p => p.id === id);
        if (!project) {
          throw new Error('Project not found');
        }
        return of(project).pipe(delay(300));
      })
    );
  }

  /**
   * Create new project
   */
  createProject(project: Partial<Project>): Observable<Project> {
    const payload: ProjectDTO = {
      title: project.title || '',
      description: project.description || '',
      githubURL: project.githubUrl || '',
      logoURL: project.logoUrl || '',
      schoolYearId: Number(project.schoolYearId || 0),
      projectStatus: this.toBackendStatus(project.status),
      technologies: (project.technologies || []).join(', '),
      projectType: project.projectType || 'General',
      students: [],
      supervisors: []
    };

    return this.apiService.post<ProjectDTO>('/Project/Add', payload).pipe(
      map(dto => this.mapProjectDto(dto, this.mockProjects.length)),
      tap(created => {
        this.mockProjects.push(created);
        this.projectsSubject.next(this.mockProjects);
      }),
      catchError(() => {
        const newProject: Project = {
          id: String(this.mockProjects.length + 1),
          title: project.title || '',
          description: project.description || '',
          schoolYearId: project.schoolYearId || '',
          classId: project.classId || '',
          status: project.status || ProjectStatus.NEW,
          maxStudents: project.maxStudents || 4,
          minStudents: project.minStudents || 2,
          createdById: '3',
          githubUrl: project.githubUrl,
          logoUrl: project.logoUrl,
          tags: project.tags || [],
          technologies: project.technologies || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return of(newProject).pipe(
          delay(500),
          tap(p => {
            this.mockProjects.push(p);
            this.projectsSubject.next(this.mockProjects);
          })
        );
      })
    );
  }

  /**
   * Update project
   */
  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    // TODO: Replace with API call
    // return this.apiService.put<Project>(`/projects/${id}`, project);
    
    const index = this.mockProjects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Project not found');
    }

    const updated = {
      ...this.mockProjects[index],
      ...project,
      updatedAt: new Date()
    };

    return of(updated).pipe(
      delay(500),
      tap(p => {
        this.mockProjects[index] = p;
        this.projectsSubject.next(this.mockProjects);
      })
    );
  }

  /**
   * Delete project
   */
  deleteProject(id: string): Observable<void> {
    // TODO: Replace with API call
    // return this.apiService.delete<void>(`/projects/${id}`);
    
    return of(void 0).pipe(
      delay(500),
      tap(() => {
        this.mockProjects = this.mockProjects.filter(p => p.id !== id);
        this.projectsSubject.next(this.mockProjects);
      })
    );
  }

  /**
   * Add student to project
   */
  addStudentToProject(projectId: string, studentId: string, role?: string): Observable<ProjectStudent> {
    // TODO: Replace with API call
    // return this.apiService.post<ProjectStudent>(`/projects/${projectId}/students`, { studentId, role });
    
    const projectStudent: ProjectStudent = {
      id: String(Date.now()),
      projectId,
      studentId,
      role,
      joinedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(projectStudent).pipe(delay(300));
  }

  /**
   * Remove student from project
   */
  removeStudentFromProject(projectId: string, studentId: string): Observable<void> {
    // TODO: Replace with API call
    // return this.apiService.delete<void>(`/projects/${projectId}/students/${studentId}`);
    return of(void 0).pipe(delay(300));
  }

  /**
   * Add supervisor to project
   */
  addSupervisorToProject(projectId: string, supervisorId: string, isPrimary: boolean = false): Observable<ProjectSupervisor> {
    // TODO: Replace with API call
    // return this.apiService.post<ProjectSupervisor>(`/projects/${projectId}/supervisors`, { supervisorId, isPrimary });
    
    const projectSupervisor: ProjectSupervisor = {
      id: String(Date.now()),
      projectId,
      supervisorId,
      isPrimary,
      assignedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(projectSupervisor).pipe(delay(300));
  }

  /**
   * Remove supervisor from project
   */
  removeSupervisorFromProject(projectId: string, supervisorId: string): Observable<void> {
    // TODO: Replace with API call
    // return this.apiService.delete<void>(`/projects/${projectId}/supervisors/${supervisorId}`);
    return of(void 0).pipe(delay(300));
  }
}
