import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AutoScheduleOptions,
  Competition,
  CompetitionSummary,
  CompetitionType,
  CreateCompetitionPayload,
  CreateScheduleSlotPayload,
  ScheduleSlot,
  SetCompetitionProjectsPayload,
  UpdateCompetitionPayload,
  UpdateScheduleSlotPayload
} from '../core/models';
import { ApiService } from '../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CompetitionService {
  private readonly apiService = inject(ApiService);

  private readonly competitionsState = signal<CompetitionSummary[]>([]);
  readonly competitions = computed(() => this.competitionsState());

  getCompetitions(type?: CompetitionType, fromDate?: string): Observable<CompetitionSummary[]> {
    const params: Record<string, unknown> = {};
    if (type) params['type'] = type;
    if (fromDate) params['fromDate'] = fromDate;

    return this.apiService.get<CompetitionSummary[]>('/Competition', params).pipe(
      tap(competitions => this.competitionsState.set(competitions))
    );
  }

  getCompetitionById(id: number): Observable<Competition> {
    return this.apiService.get<Competition>(`/Competition/${id}`);
  }

  createCompetition(payload: CreateCompetitionPayload): Observable<Competition> {
    return this.apiService.post<Competition>('/Competition', payload).pipe(
      tap(() => this.getCompetitions().subscribe())
    );
  }

  updateCompetition(id: number, payload: UpdateCompetitionPayload): Observable<Competition> {
    return this.apiService.put<Competition>(`/Competition/${id}`, payload).pipe(
      tap(() => this.getCompetitions().subscribe())
    );
  }

  deleteCompetition(id: number): Observable<void> {
    return this.apiService.delete<void>(`/Competition/${id}`).pipe(
      tap(() => this.getCompetitions().subscribe())
    );
  }

  setCompetitionProjects(competitionId: number, projectIds: number[]): Observable<void> {
    const payload: SetCompetitionProjectsPayload = { projectIds };
    return this.apiService.put<void>(`/Competition/${competitionId}/Projects`, payload);
  }

  autoGenerateSchedule(competitionId: number, options: AutoScheduleOptions): Observable<ScheduleSlot[]> {
    return this.apiService.post<ScheduleSlot[]>(`/Competition/${competitionId}/AutoSchedule`, options);
  }

  createScheduleSlot(competitionId: number, payload: CreateScheduleSlotPayload): Observable<ScheduleSlot> {
    return this.apiService.post<ScheduleSlot>(`/Competition/${competitionId}/ScheduleSlots`, payload);
  }

  updateScheduleSlot(
    competitionId: number,
    slotId: number,
    payload: UpdateScheduleSlotPayload
  ): Observable<ScheduleSlot> {
    return this.apiService.put<ScheduleSlot>(`/Competition/${competitionId}/ScheduleSlots/${slotId}`, payload);
  }

  deleteScheduleSlot(competitionId: number, slotId: number): Observable<void> {
    return this.apiService.delete<void>(`/Competition/${competitionId}/ScheduleSlots/${slotId}`);
  }

  downloadSchedulePdf(competitionId: number, fileName = `zeitplan-competition-${competitionId}.pdf`): Observable<Blob> {
    return this.apiService.getBlob(`/Competition/${competitionId}/Schedule.pdf`).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      })
    );
  }
}
