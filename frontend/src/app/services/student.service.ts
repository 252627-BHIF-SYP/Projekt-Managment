import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Class,
  PersonCreatePayload,
  ProjectFilter,
  StudentClassDTO,
  StudentDTO,
  StudentProfile,
  StudentProfileDetail,
  StudentProfileDetailDTO,
  StudentStatus
} from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly apiService = inject(ApiService);
  private readonly projectService = inject(ProjectService);

  private mapStudentDto(dto: StudentDTO): StudentProfile {
    const currentHistory = dto.histories?.[0];
    return {
      id: dto.id,
      userId: dto.id,
      studentNumber: dto.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: `${dto.id.toLowerCase()}@school.at`,
      classId: currentHistory ? String(currentHistory.classId) : '',
      className: currentHistory?.className,
      schoolYearId: currentHistory ? String(currentHistory.schoolYearId) : '',
      status: StudentStatus.SEARCHING,
      skills: [],
      historyId: currentHistory?.historyId,
      histories: dto.histories || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapStudentClassDto(dto: StudentClassDTO): Class {
    const id = dto.classId ?? dto.studentClassId ?? 0;
    return {
      classId: id,
      studentClassId: id,
      id: String(id),
      name: dto.name,
      branch: dto.branch,
      schoolYearId: '',
      year: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  getStudents(): Observable<StudentProfile[]> {
    return this.apiService.get<StudentDTO[]>('/Student/All').pipe(
      map(dtos => dtos.map(dto => this.mapStudentDto(dto)))
    );
  }

  getStudentsByClass(classId: string): Observable<StudentProfile[]> {
    return this.getStudents().pipe(
      map(students => students.filter(s => s.classId === classId))
    );
  }

  getStudentsBySchoolYear(schoolYearId: string): Observable<StudentProfile[]> {
    return this.getStudents().pipe(
      map(students => students.filter(s => s.schoolYearId === schoolYearId || s.histories?.some(h => String(h.schoolYearId) === schoolYearId)))
    );
  }

  getStudentsByStatus(status: StudentStatus): Observable<StudentProfile[]> {
    return this.getStudents().pipe(
      map(students => students.filter(s => s.status === status))
    );
  }

  getStudentById(id: string): Observable<StudentProfile> {
    return this.apiService.get<StudentDTO>(`/Student/${id}`).pipe(
      map(dto => this.mapStudentDto(dto))
    );
  }

  getStudentProfile(id: string, filter: ProjectFilter = {}): Observable<StudentProfileDetail> {
    return this.apiService.get<StudentProfileDetailDTO>(`/Student/${id}/Profile`, {
      searchTerm: filter.searchTerm,
      schoolYearId: filter.schoolYearId,
      projectType: filter.projectType,
      status: filter.status
    }).pipe(
      map(dto => {
        const student = this.mapStudentDto(dto);
        return {
          ...student,
          username: dto.username || dto.id,
          projects: (dto.projects || []).map(project => this.projectService.mapProjectDto(project))
        };
      })
    );
  }

  createStudent(payload: PersonCreatePayload): Observable<StudentProfile> {
    return this.apiService.post<StudentDTO>('/Student/Add', payload).pipe(
      map(dto => this.mapStudentDto(dto))
    );
  }

  updateStudent(id: string, student: Partial<StudentProfile>): Observable<StudentProfile> {
    throw new Error('Student update is not implemented in the backend yet.');
  }

  getClasses(): Observable<Class[]> {
    return this.apiService.get<StudentClassDTO[]>('/StudentClass/All').pipe(
      map(dtos => dtos.map(dto => this.mapStudentClassDto(dto)))
    );
  }

  getClassesBySchoolYear(schoolYearId: string): Observable<Class[]> {
    return this.getClasses();
  }

  getHistoryIdByStudentId(studentId: string, schoolYearId?: string): Observable<number> {
    return this.apiService.get<number>(`/Student/${studentId}/historyId`, {
      schoolYearId
    });
  }
}
