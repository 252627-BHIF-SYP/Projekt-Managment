import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Project, ProjectFilter, ProjectStatus, ProjectStudent, ProjectSupervisor } from '../core/models';
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
      status: ProjectStatus.IN_PROGRESS,
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
      status: ProjectStatus.OPEN,
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

  /**
   * Get all projects
   */
  getProjects(): Observable<Project[]> {
    // TODO: Replace with API call
    // return this.apiService.get<Project[]>('/projects');
    return of(this.mockProjects).pipe(delay(300));
  }

  /**
   * Get projects with filters
   */
  getProjectsFiltered(filter: ProjectFilter): Observable<Project[]> {
    // TODO: Replace with API call
    // return this.apiService.get<Project[]>('/projects', filter);
    
    return of(this.mockProjects).pipe(
      delay(300),
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
    // TODO: Replace with API call
    // return this.apiService.get<Project>(`/projects/${id}`);
    
    const project = this.mockProjects.find(p => p.id === id);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Add mock students and supervisors
    const projectWithDetails: Project = {
      ...project,
      students: [
        {
          id: '1',
          projectId: id,
          studentId: '4',
          studentName: 'Anna Weber',
          studentEmail: 'student1@school.at',
          role: 'Frontend Developer',
          joinedAt: new Date('2024-09-15'),
          status: 'ACTIVE',
          createdAt: new Date('2024-09-15'),
          updatedAt: new Date('2024-09-15')
        }
      ],
      supervisors: [
        {
          id: '1',
          projectId: id,
          supervisorId: '3',
          supervisorName: 'Max Müller',
          supervisorEmail: 'professor@school.at',
          isPrimary: true,
          assignedAt: new Date('2024-09-01'),
          status: 'ACTIVE',
          createdAt: new Date('2024-09-01'),
          updatedAt: new Date('2024-09-01')
        }
      ]
    };

    return of(projectWithDetails).pipe(delay(300));
  }

  /**
   * Create new project
   */
  createProject(project: Partial<Project>): Observable<Project> {
    // TODO: Replace with API call
    // return this.apiService.post<Project>('/projects', project);
    
    const newProject: Project = {
      id: String(this.mockProjects.length + 1),
      title: project.title || '',
      description: project.description || '',
      schoolYearId: project.schoolYearId || '',
      classId: project.classId || '',
      status: ProjectStatus.DRAFT,
      maxStudents: project.maxStudents || 4,
      minStudents: project.minStudents || 2,
      createdById: '3', // Current user ID
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
