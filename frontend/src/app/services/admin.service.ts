import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Project } from '../core/models';

export interface AdminStats {
  schoolYearsCount: number;
  projectsCount: number;
  projectsInProgress: number;
  projectsCompleted: number;
  studentsCount: number;
  professorsCount: number;
}

export interface TrendDataPoint {
  year: number;
  value: number;
}

export interface TrendData {
  projectsTrend: TrendDataPoint[];
  studentsTrend: TrendDataPoint[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://localhost:7113';

  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<AdminStats> {
    const schoolYearsCount$ = this.getSchoolYearsCount();
    const projectsCount$ = this.getProjectsCount();
    const studentsCount$ = this.getStudentsCount();
    const professorsCount$ = this.getProfessorsCount();

    return forkJoin([
      schoolYearsCount$,
      projectsCount$,
      studentsCount$,
      professorsCount$
    ]).pipe(
      map(([schoolYears, projects, students, professors]) => {
        // Für jetzt: In Progress und Completed sind Beispieldaten
        // Später könnten diese vom Backend kommen
        const projectsInProgress = Math.floor(projects * 0.3);
        const projectsCompleted = Math.floor(projects * 0.2);
        
        return {
          schoolYearsCount: schoolYears,
          projectsCount: projects,
          projectsInProgress: projectsInProgress,
          projectsCompleted: projectsCompleted,
          studentsCount: students,
          professorsCount: professors
        };
      }),
      catchError(error => {
        console.error('Error fetching admin stats:', error);
        return of({
          schoolYearsCount: 0,
          projectsCount: 0,
          projectsInProgress: 0,
          projectsCompleted: 0,
          studentsCount: 0,
          professorsCount: 0
        });
      })
    );
  }

  private getSchoolYearsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/SchoolYear/Count`).pipe(
      catchError(() => of(0))
    );
  }

  private getProjectsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/Project/Count`).pipe(
      catchError(() => of(0))
    );
  }

  private getStudentsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/Student/Count`).pipe(
      catchError(() => of(0))
    );
  }

  private getProfessorsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/Professor/Count`).pipe(
      catchError(() => of(0))
    );
  }

  getTrendData(): Observable<TrendData> {
    const projectsTrend$ = this.http.get<any[]>(`${this.apiUrl}/Project/ProjectCountPerYear`).pipe(
      catchError(() => of([]))
    );
    const studentsTrend$ = this.http.get<any[]>(`${this.apiUrl}/StudentClassHistory/StudentCountPerYear`).pipe(
      catchError(() => of([]))
    );

    return forkJoin([projectsTrend$, studentsTrend$]).pipe(
      map(([projectsTrendRaw, studentsTrendRaw]) => {
        // projectsTrendRaw: [{ Year, ClassCount }]
        // studentsTrendRaw: [{ Year, StudentCount }]
        const projectsTrend: TrendDataPoint[] = Array.isArray(projectsTrendRaw)
          ? projectsTrendRaw.map(item => ({ year: item.Year, value: item.ProjectCount }))
          : [];
        const studentsTrend: TrendDataPoint[] = Array.isArray(studentsTrendRaw)
          ? studentsTrendRaw.map(item => ({ year: item.Year, value: item.StudentCount }))
          : [];

        // Fallback: Wenn keine Daten, Dummy-Jahr
        const fallbackYear = new Date().getFullYear();
        return {
          projectsTrend: projectsTrend.length ? projectsTrend : [{ year: fallbackYear, value: 0 }],
          studentsTrend: studentsTrend.length ? studentsTrend : [{ year: fallbackYear, value: 0 }]
        };
      }),
      catchError(error => {
        console.error('Error fetching trend data:', error);
        const year = new Date().getFullYear();
        return of({
          projectsTrend: [{ year, value: 0 }],
          studentsTrend: [{ year, value: 0 }]
        });
      })
    );
  }
}
