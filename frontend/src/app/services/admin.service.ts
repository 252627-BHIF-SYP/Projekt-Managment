import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/services/api.service';

export interface AdminStats {
  schoolYearsCount: number;
  studentClassesCount: number;
  projectsCount: number;
  projectsInProgress: number;
  projectsCompleted: number;
  studentsCount: number;
  professorsCount: number;
}

export interface TrendDataPoint {
  year: string;
  value: number;
}

export interface TrendData {
  projectsTrend: TrendDataPoint[];
  studentsTrend: TrendDataPoint[];
}

interface BackendTrendItem {
  schoolYearId: number;
  year: string;
  projectCount?: number;
  studentCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiService = inject(ApiService);

  getAdminStats(): Observable<AdminStats> {
    return this.apiService.get<AdminStats>('/Admin/Stats').pipe(
      catchError(() => of({
        schoolYearsCount: 0,
        studentClassesCount: 0,
        projectsCount: 0,
        projectsInProgress: 0,
        projectsCompleted: 0,
        studentsCount: 0,
        professorsCount: 0
      }))
    );
  }

  getTrendData(): Observable<TrendData> {
    const projectsTrend$ = this.apiService.get<BackendTrendItem[]>('/Project/ProjectCountPerYear').pipe(
      catchError(() => of([]))
    );
    const studentsTrend$ = this.apiService.get<BackendTrendItem[]>('/StudentClassHistory/StudentCountPerYear').pipe(
      catchError(() => of([]))
    );

    return forkJoin([projectsTrend$, studentsTrend$]).pipe(
      map(([projectsTrendRaw, studentsTrendRaw]) => {
        const fallbackYear = String(new Date().getFullYear());
        return {
          projectsTrend: projectsTrendRaw.length
            ? projectsTrendRaw.map(item => ({ year: item.year || String(item.schoolYearId), value: item.projectCount || 0 }))
            : [{ year: fallbackYear, value: 0 }],
          studentsTrend: studentsTrendRaw.length
            ? studentsTrendRaw.map(item => ({ year: item.year || String(item.schoolYearId), value: item.studentCount || 0 }))
            : [{ year: fallbackYear, value: 0 }]
        };
      })
    );
  }
}
