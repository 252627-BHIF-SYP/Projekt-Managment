import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SchoolYear } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * School year service
 */
@Injectable({
  providedIn: 'root'
})
export class SchoolYearService {
  private selectedSchoolYearSubject = new BehaviorSubject<SchoolYear | null>(null);
  public selectedSchoolYear$ = this.selectedSchoolYearSubject.asObservable();

  // Mock data
  private mockSchoolYears: SchoolYear[] = [
    {
      id: '1',
      year: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      year: '2023/2024',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
      isActive: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: '3',
      year: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: false,
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01')
    }
  ];

  constructor(private apiService: ApiService) {
    // Set active school year by default
    const activeYear = this.mockSchoolYears.find(sy => sy.isActive);
    if (activeYear) {
      this.selectedSchoolYearSubject.next(activeYear);
    }
  }

  /**
   * Get all school years
   */
  getSchoolYears(): Observable<SchoolYear[]> {
    // TODO: Replace with API call
    // return this.apiService.get<SchoolYear[]>('/school-years');
    return of(this.mockSchoolYears).pipe(delay(200));
  }

  /**
   * Get school year by ID
   */
  getSchoolYearById(id: string): Observable<SchoolYear> {
    // TODO: Replace with API call
    // return this.apiService.get<SchoolYear>(`/school-years/${id}`);
    const schoolYear = this.mockSchoolYears.find(sy => sy.id === id);
    if (!schoolYear) {
      throw new Error('School year not found');
    }
    return of(schoolYear).pipe(delay(200));
  }

  /**
   * Get active school year
   */
  getActiveSchoolYear(): Observable<SchoolYear | null> {
    // TODO: Replace with API call
    // return this.apiService.get<SchoolYear>('/school-years/active');
    const activeYear = this.mockSchoolYears.find(sy => sy.isActive);
    return of(activeYear || null).pipe(delay(200));
  }

  /**
   * Select school year globally
   */
  selectSchoolYear(schoolYear: SchoolYear): void {
    this.selectedSchoolYearSubject.next(schoolYear);
  }

  /**
   * Get currently selected school year
   */
  getSelectedSchoolYear(): SchoolYear | null {
    return this.selectedSchoolYearSubject.value;
  }

  /**
   * Create school year
   */
  createSchoolYear(schoolYear: Partial<SchoolYear>): Observable<SchoolYear> {
    // TODO: Replace with API call
    // return this.apiService.post<SchoolYear>('/school-years', schoolYear);
    const newSchoolYear: SchoolYear = {
      id: String(this.mockSchoolYears.length + 1),
      year: schoolYear.year || '',
      startDate: schoolYear.startDate || new Date(),
      endDate: schoolYear.endDate || new Date(),
      isActive: schoolYear.isActive || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return of(newSchoolYear).pipe(delay(300));
  }

  /**
   * Update school year
   */
  updateSchoolYear(id: string, schoolYear: Partial<SchoolYear>): Observable<SchoolYear> {
    // TODO: Replace with API call
    // return this.apiService.put<SchoolYear>(`/school-years/${id}`, schoolYear);
    const existing = this.mockSchoolYears.find(sy => sy.id === id);
    if (!existing) {
      throw new Error('School year not found');
    }
    const updated = { ...existing, ...schoolYear, updatedAt: new Date() };
    return of(updated).pipe(delay(300));
  }
}
