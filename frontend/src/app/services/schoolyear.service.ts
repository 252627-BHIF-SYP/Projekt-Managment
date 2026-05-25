import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CreateSchoolYearPayload, SchoolYear, SchoolYearDTO } from '../core/models';
import { ApiService } from '../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SchoolYearService {
  private readonly apiService = inject(ApiService);

  private readonly selectedSchoolYear = signal<SchoolYear | null>(null);
  readonly selectedSchoolYearSignal = computed(() => this.selectedSchoolYear());
  readonly selectedSchoolYear$: Observable<SchoolYear | null> = toObservable(this.selectedSchoolYear);

  getSchoolYears(): Observable<SchoolYear[]> {
    return this.apiService.get<SchoolYearDTO[]>('/SchoolYear/All').pipe(
      map(dtos => dtos.map(dto => this.mapSchoolYearDto(dto))),
      tap(years => {
        this.ensureSelectedSchoolYear(years);
      })
    );
  }

  getSchoolYearById(id: string): Observable<SchoolYear> {
    return this.apiService.get<SchoolYearDTO>(`/SchoolYear/${id}`).pipe(
      map(dto => this.mapSchoolYearDto(dto))
    );
  }

  getActiveSchoolYear(): Observable<SchoolYear | null> {
    return this.getSchoolYears().pipe(
      map(years => this.findDefaultSchoolYear(years)),
      tap(year => {
        if (year) {
          this.selectSchoolYear(year);
        }
      })
    );
  }

  selectSchoolYear(schoolYear: SchoolYear): void {
    this.selectedSchoolYear.set(schoolYear);
  }

  getSelectedSchoolYear(): SchoolYear | null {
    return this.selectedSchoolYear();
  }

  createSchoolYear(schoolYear: Partial<SchoolYear>): Observable<SchoolYear> {
    const payload: CreateSchoolYearPayload = {
      year: schoolYear.year || ''
    };
    return this.apiService.post<SchoolYearDTO>('/SchoolYear/Add', payload).pipe(
      map(dto => this.mapSchoolYearDto(dto))
    );
  }

  updateSchoolYear(id: string, schoolYear: Partial<SchoolYear>): Observable<SchoolYear> {
    throw new Error('School year update is not implemented in the backend yet.');
  }

  private mapSchoolYearDto(dto: SchoolYearDTO): SchoolYear {
    return {
      schoolYearId: dto.schoolYearId,
      id: String(dto.schoolYearId),
      year: dto.year,
      startDate: new Date(),
      endDate: new Date(),
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private ensureSelectedSchoolYear(years: SchoolYear[]): void {
    if (years.length === 0) {
      this.selectedSchoolYear.set(null);
      return;
    }

    const selected = this.selectedSchoolYear();
    const stillAvailable = years.find(year => year.id === selected?.id);
    if (stillAvailable) {
      this.selectedSchoolYear.set(stillAvailable);
      return;
    }

    const defaultYear = this.findDefaultSchoolYear(years);
    this.selectedSchoolYear.set(defaultYear);
  }

  private findDefaultSchoolYear(years: SchoolYear[]): SchoolYear | null {
    const currentSchoolStartYear = this.getCurrentSchoolStartYear();
    const currentYear = years.find(year => this.getStartYear(year.year) === currentSchoolStartYear);
    if (currentYear) {
      return currentYear;
    }

    return [...years].sort((a, b) => this.getStartYear(b.year) - this.getStartYear(a.year))[0] || null;
  }

  private getCurrentSchoolStartYear(): number {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return month >= 8 ? year : year - 1;
  }

  private getStartYear(year: string): number {
    const match = year.match(/\d{4}/);
    return match ? Number(match[0]) : 0;
  }
}
