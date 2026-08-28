import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import {
  Invitation,
  InvitationStatus,
  CreateInvitationPayload,
  CreateExternalProjectPayload,
  ConfirmConsentPayload
} from '../core/models/invitation.model';
import { Project, ProjectDTO } from '../core/models/project.model';
import { map } from 'rxjs/operators';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly api = inject(ApiService);
  private readonly projectService = inject(ProjectService);

  getInvitations(competitionId?: number, status?: InvitationStatus): Observable<Invitation[]> {
    const params: Record<string, unknown> = {};
    if (competitionId !== undefined && competitionId !== null) {
      params['competitionId'] = competitionId;
    }
    if (status) {
      params['status'] = status;
    }
    return this.api.get<Invitation[]>('/Invitation', params);
  }

  createInvitation(payload: CreateInvitationPayload): Observable<Invitation> {
    return this.api.post<Invitation>('/Invitation', payload);
  }

  validateToken(token: string): Observable<Invitation> {
    return this.api.get<Invitation>(`/Invitation/validate/${encodeURIComponent(token)}`);
  }

  acceptInvitation(token: string, password?: string): Observable<Invitation> {
    return this.api.post<Invitation>(`/Invitation/accept/${encodeURIComponent(token)}`, { password });
  }

  revokeInvitation(id: number): Observable<void> {
    return this.api.delete<void>(`/Invitation/${id}`);
  }

  submitExternalProject(payload: CreateExternalProjectPayload): Observable<Project> {
    return this.api.post<ProjectDTO>('/Invitation/submit-external-project', payload).pipe(
      map(dto => this.projectService.mapProjectDto(dto))
    );
  }

  confirmConsent(projectId: number, payload: ConfirmConsentPayload): Observable<void> {
    return this.api.post<void>(`/Invitation/consent/${projectId}`, payload);
  }

  getInvitationLink(token: string): string {
    const origin = window.location.origin;
    return `${origin}/invitation/accept/${token}`;
  }
}
