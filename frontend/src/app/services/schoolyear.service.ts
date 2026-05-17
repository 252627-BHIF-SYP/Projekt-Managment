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
        if (years.length > 0 && !this.selectedSchoolYear()) {
          this.selectedSchoolYear.set(years[0]);
        }
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
      map(years => years[0] || null),
      tap(year => {
        if (year) {
          this.selectedSchoolYear.set(year);
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
}
