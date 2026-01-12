import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { StudentProfile, StudentStatus, StudentEnrollment, Class } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * Student service for managing students
 */
@Injectable({
  providedIn: 'root'
})
export class StudentService {
  // Mock data
  private mockStudents: StudentProfile[] = [
    {
      id: '1',
      userId: '4',
      studentNumber: 'S001',
      firstName: 'Anna',
      lastName: 'Weber',
      email: 'anna.weber@school.at',
      classId: '1',
      className: '5AHIF',
      schoolYearId: '1',
      github: 'https://github.com/annaweber',
      status: StudentStatus.SEARCHING,
      skills: ['Angular', 'TypeScript', 'Java'],
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-01')
    },
    {
      id: '2',
      userId: '5',
      studentNumber: 'S002',
      firstName: 'Tom',
      lastName: 'Fischer',
      email: 'tom.fischer@school.at',
      classId: '1',
      className: '5AHIF',
      schoolYearId: '1',
      github: 'https://github.com/tomfischer',
      status: StudentStatus.ASSIGNED,
      skills: ['React', 'Node.js', 'Python'],
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-15')
    },
    {
      id: '3',
      userId: '6',
      studentNumber: 'S003',
      firstName: 'Lisa',
      lastName: 'Schmidt',
      email: 'lisa.schmidt@school.at',
      classId: '2',
      className: '5BHIF',
      schoolYearId: '1',
      github: 'https://github.com/lisaschmidt',
      status: StudentStatus.SEARCHING,
      skills: ['Vue.js', 'Express', 'MongoDB'],
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-01')
    },
    {
      id: '4',
      userId: '7',
      studentNumber: 'S004',
      firstName: 'Paul',
      lastName: 'Bauer',
      email: 'paul.bauer@school.at',
      classId: '1',
      className: '5AHIF',
      schoolYearId: '1',
      status: StudentStatus.SEARCHING,
      skills: ['Java', 'Spring Boot', 'MySQL'],
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-01')
    }
  ];

  private mockClasses: Class[] = [
    {
      id: '1',
      name: '5AHIF',
      schoolYearId: '1',
      department: 'Informatik',
      year: 5,
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-01')
    },
    {
      id: '2',
      name: '5BHIF',
      schoolYearId: '1',
      department: 'Informatik',
      year: 5,
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-01')
    },
    {
      id: '3',
      name: '4AHIF',
      schoolYearId: '1',
      department: 'Informatik',
      year: 4,
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-09-01')
    }
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Get all students
   */
  getStudents(): Observable<StudentProfile[]> {
    // TODO: Replace with API call
    // return this.apiService.get<StudentProfile[]>('/students');
    return of(this.mockStudents).pipe(delay(200));
  }

  /**
   * Get students by class
   */
  getStudentsByClass(classId: string): Observable<StudentProfile[]> {
    // TODO: Replace with API call
    // return this.apiService.get<StudentProfile[]>(`/students?classId=${classId}`);
    return of(this.mockStudents.filter(s => s.classId === classId)).pipe(delay(200));
  }

  /**
   * Get students by school year
   */
  getStudentsBySchoolYear(schoolYearId: string): Observable<StudentProfile[]> {
    // TODO: Replace with API call
    // return this.apiService.get<StudentProfile[]>(`/students?schoolYearId=${schoolYearId}`);
    return of(this.mockStudents.filter(s => s.schoolYearId === schoolYearId)).pipe(delay(200));
  }

  /**
   * Get students by status
   */
  getStudentsByStatus(status: StudentStatus): Observable<StudentProfile[]> {
    // TODO: Replace with API call
    // return this.apiService.get<StudentProfile[]>(`/students?status=${status}`);
    return of(this.mockStudents.filter(s => s.status === status)).pipe(delay(200));
  }

  /**
   * Get student by ID
   */
  getStudentById(id: string): Observable<StudentProfile> {
    // TODO: Replace with API call
    // return this.apiService.get<StudentProfile>(`/students/${id}`);
    const student = this.mockStudents.find(s => s.id === id);
    if (!student) {
      throw new Error('Student not found');
    }
    return of(student).pipe(delay(200));
  }

  /**
   * Update student profile
   */
  updateStudent(id: string, student: Partial<StudentProfile>): Observable<StudentProfile> {
    // TODO: Replace with API call
    // return this.apiService.put<StudentProfile>(`/students/${id}`, student);
    const existing = this.mockStudents.find(s => s.id === id);
    if (!existing) {
      throw new Error('Student not found');
    }
    const updated = { ...existing, ...student, updatedAt: new Date() };
    return of(updated).pipe(delay(300));
  }

  /**
   * Get all classes
   */
  getClasses(): Observable<Class[]> {
    // TODO: Replace with API call
    // return this.apiService.get<Class[]>('/classes');
    return of(this.mockClasses).pipe(delay(200));
  }

  /**
   * Get classes by school year
   */
  getClassesBySchoolYear(schoolYearId: string): Observable<Class[]> {
    // TODO: Replace with API call
    // return this.apiService.get<Class[]>(`/classes?schoolYearId=${schoolYearId}`);
    return of(this.mockClasses.filter(c => c.schoolYearId === schoolYearId)).pipe(delay(200));
  }
}
