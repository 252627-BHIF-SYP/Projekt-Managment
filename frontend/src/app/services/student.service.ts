import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { StudentProfile, StudentStatus, StudentEnrollment, Class, CsvPreview, StudentDTO, StudentClassDTO } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * Student service for managing students
 */
@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly studentsStorageKey = 'spm_mock_students';
  private readonly classesStorageKey = 'spm_mock_classes';

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

  constructor(private apiService: ApiService, private http: HttpClient) {
    this.loadFromStorage();
  }

  private mapStudentDto(dto: StudentDTO): StudentProfile {
    const id = dto.studentID ?? dto.studentId ?? '';
    return {
      id,
      userId: id,
      studentNumber: id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: `${id.toLowerCase()}@school.at`,
      classId: '',
      schoolYearId: '',
      status: StudentStatus.SEARCHING,
      skills: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapStudentClassDto(dto: StudentClassDTO): Class {
    return {
      studentClassId: dto.studentClassId,
      id: String(dto.studentClassId),
      name: dto.name,
      branch: dto.branch,
      schoolYearId: '',
      year: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private loadFromStorage(): void {
    const storedStudents = localStorage.getItem(this.studentsStorageKey);
    const storedClasses = localStorage.getItem(this.classesStorageKey);

    if (storedStudents) {
      const parsed: StudentProfile[] = JSON.parse(storedStudents);
      this.mockStudents = parsed.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
    }

    if (storedClasses) {
      const parsed: Class[] = JSON.parse(storedClasses);
      this.mockClasses = parsed.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));
    }
  }

  private persistToStorage(): void {
    localStorage.setItem(this.studentsStorageKey, JSON.stringify(this.mockStudents));
    localStorage.setItem(this.classesStorageKey, JSON.stringify(this.mockClasses));
  }

  /**
   * Import students from parsed CSV preview into in-memory data source.
   */
  importStudentsFromCsv(preview: CsvPreview, schoolYearId?: string): { total: number; success: number; failed: number } {
    const indexByHeader = new Map<string, number>();
    preview.headers.forEach((h, i) => indexByHeader.set(h.trim().toLowerCase(), i));

    const pick = (row: string[], aliases: string[]): string => {
      for (const alias of aliases) {
        const idx = indexByHeader.get(alias);
        if (idx !== undefined) {
          return (row[idx] || '').trim();
        }
      }
      return '';
    };

    let success = 0;
    let failed = 0;

    for (const row of preview.rows) {
      const firstName = pick(row, ['first_name', 'vorname', 'firstname', 'first name']);
      const lastName = pick(row, ['last_name', 'nachname', 'lastname', 'last name']);
      const studentNumber = pick(row, ['if_name', 'studentid', 'if', 'ifname']);
      const className = pick(row, ['class', 'klasse']) || 'Imported';

      if (!firstName || !lastName || !studentNumber) {
        failed++;
        continue;
      }

      // Avoid duplicates by student number.
      const exists = this.mockStudents.some(s => s.studentNumber.toLowerCase() === studentNumber.toLowerCase());
      if (exists) {
        failed++;
        continue;
      }

      let targetClass = this.mockClasses.find(c => c.name.toLowerCase() === className.toLowerCase());
      if (!targetClass) {
        targetClass = {
          id: String(this.mockClasses.length + 1),
          name: className,
          schoolYearId: schoolYearId || '1',
          department: 'Imported',
          year: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.mockClasses.push(targetClass);
      }

      const id = String(this.mockStudents.length + 1);
      this.mockStudents.push({
        id,
        userId: `imported-${id}`,
        studentNumber,
        firstName,
        lastName,
        email: `${studentNumber.toLowerCase()}@school.at`,
        classId: targetClass.id,
        className: targetClass.name,
        schoolYearId: schoolYearId || targetClass.schoolYearId,
        status: StudentStatus.SEARCHING,
        skills: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      success++;
    }

    this.persistToStorage();

    return {
      total: preview.totalRows,
      success,
      failed
    };
  }

  /**
   * Get all students
   */
  getStudents(): Observable<StudentProfile[]> {
    return this.apiService.get<StudentDTO[]>('/Student/All').pipe(
      map(dtos => dtos.map(dto => this.mapStudentDto(dto))),
      catchError(() => of(this.mockStudents).pipe(delay(200)))
    );
  }

  /**
   * Get students by class
   */
  getStudentsByClass(classId: string): Observable<StudentProfile[]> {
    return this.getStudents().pipe(
      map(students => students.filter(s => s.classId === classId))
    );
  }

  /**
   * Get students by school year
   */
  getStudentsBySchoolYear(schoolYearId: string): Observable<StudentProfile[]> {
    return this.getStudents().pipe(
      map(students => students.filter(s => s.schoolYearId === schoolYearId))
    );
  }

  /**
   * Get students by status
   */
  getStudentsByStatus(status: StudentStatus): Observable<StudentProfile[]> {
    return this.getStudents().pipe(
      map(students => students.filter(s => s.status === status))
    );
  }

  /**
   * Get student by ID
   */
  getStudentById(id: string): Observable<StudentProfile> {
    return this.apiService.get<StudentDTO>(`/Student/${id}`).pipe(
      map(dto => this.mapStudentDto(dto)),
      catchError(() => {
        const student = this.mockStudents.find(s => s.id === id);
        if (!student) {
          throw new Error('Student not found');
        }
        return of(student).pipe(delay(200));
      })
    );
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
    const idx = this.mockStudents.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.mockStudents[idx] = updated;
      this.persistToStorage();
    }
    return of(updated).pipe(delay(300));
  }

  /**
   * Get all classes
   */
  getClasses(): Observable<Class[]> {
    return this.apiService.get<StudentClassDTO[]>('/StudentClass/All').pipe(
      map(dtos => dtos.map(dto => this.mapStudentClassDto(dto))),
      catchError(() => of(this.mockClasses).pipe(delay(200)))
    );
  }

  /**
   * Get classes by school year
   */
  getClassesBySchoolYear(schoolYearId: string): Observable<Class[]> {
    // TODO: Replace with API call
    // return this.apiService.get<Class[]>(`/classes?schoolYearId=${schoolYearId}`);
    return of(this.mockClasses.filter(c => c.schoolYearId === schoolYearId)).pipe(delay(200));
  }

  /**
   * Get history ID by student ID
   * Calls backend directly - bypasses proxy issues with Vite
   */
  getHistoryIdByStudentId(studentId: string): Observable<number> {
    const backendUrl = `https://localhost:7113/Student/${studentId}/historyId`;
    console.debug(`[StudentService] Fetching from backend: ${backendUrl}`);
    
    // Use responseType: 'text' because backend returns plain number
    return this.http.get(backendUrl, { 
      responseType: 'text',
      withCredentials: false  // Important: no credentials for plain text
    }).pipe(
      map((response: string) => {
        console.debug(`[StudentService] Raw response for ${studentId}:`, response);
        
        // Parse the plain text response as a number
        const numValue = Number(response.trim());
        
        if (!isNaN(numValue) && numValue > 0) {
          console.debug(`[StudentService] Parsed historyId: ${numValue}`);
          return numValue;
        }
        
        console.warn(`[StudentService] Could not parse historyId from response: "${response}"`);
        return 0;
      }),
      catchError((error) => {
        console.error(`Failed to fetch historyId for student ${studentId}:`, error);
        // Fallback: return 0 which will be filtered out
        return of(0);
      })
    );
  }
}
