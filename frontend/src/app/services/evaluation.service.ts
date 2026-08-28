import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import {
  EvaluationCriterion,
  CreateEvaluationCriterionPayload,
  JuryMember,
  AddJuryMemberPayload,
  ProjectEvaluation,
  SubmitEvaluationPayload,
  BatchSubmitEvaluationPayload,
  Leaderboard,
  CompetitionAward,
  CreateAwardPayload,
  AssignAwardWinnerPayload,
  CompetitionStatus,
  JurorCompetition
} from '../core/models/competition.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private readonly api = inject(ApiService);

  // Juror Portal
  getMyJurorCompetitions(): Observable<JurorCompetition[]> {
    return this.api.get<JurorCompetition[]>('/Competition/MyJurorCompetitions');
  }

  // Criteria
  getCriteria(competitionId: number): Observable<EvaluationCriterion[]> {
    return this.api.get<EvaluationCriterion[]>(`/Competition/${competitionId}/Criteria`);
  }

  createCriterion(competitionId: number, payload: CreateEvaluationCriterionPayload): Observable<EvaluationCriterion> {
    return this.api.post<EvaluationCriterion>(`/Competition/${competitionId}/Criteria`, payload);
  }

  updateCriterion(
    competitionId: number,
    criterionId: number,
    payload: CreateEvaluationCriterionPayload
  ): Observable<EvaluationCriterion> {
    return this.api.put<EvaluationCriterion>(`/Competition/${competitionId}/Criteria/${criterionId}`, payload);
  }

  deleteCriterion(competitionId: number, criterionId: number): Observable<void> {
    return this.api.delete<void>(`/Competition/${competitionId}/Criteria/${criterionId}`);
  }

  // Jury
  getJuryMembers(competitionId: number): Observable<JuryMember[]> {
    return this.api.get<JuryMember[]>(`/Competition/${competitionId}/Jury`);
  }

  addJuryMember(competitionId: number, payload: AddJuryMemberPayload): Observable<JuryMember> {
    return this.api.post<JuryMember>(`/Competition/${competitionId}/Jury`, payload);
  }

  removeJuryMember(competitionId: number, juryMemberId: number): Observable<void> {
    return this.api.delete<void>(`/Competition/${competitionId}/Jury/${juryMemberId}`);
  }

  // Evaluations
  getEvaluations(
    competitionId: number,
    juryMemberId?: number,
    projectId?: number
  ): Observable<ProjectEvaluation[]> {
    const params: Record<string, string> = {};
    if (juryMemberId !== undefined) params['juryMemberId'] = juryMemberId.toString();
    if (projectId !== undefined) params['projectId'] = projectId.toString();
    return this.api.get<ProjectEvaluation[]>(`/Competition/${competitionId}/Evaluations`, params);
  }

  submitEvaluation(competitionId: number, payload: SubmitEvaluationPayload): Observable<ProjectEvaluation> {
    return this.api.post<ProjectEvaluation>(`/Competition/${competitionId}/Evaluations`, payload);
  }

  batchSubmitEvaluations(competitionId: number, payload: BatchSubmitEvaluationPayload): Observable<void> {
    return this.api.post<void>(`/Competition/${competitionId}/Evaluations/Batch`, payload);
  }

  // Leaderboard
  getLeaderboard(competitionId: number): Observable<Leaderboard> {
    return this.api.get<Leaderboard>(`/Competition/${competitionId}/Leaderboard`);
  }

  // Awards
  getAwards(competitionId: number): Observable<CompetitionAward[]> {
    return this.api.get<CompetitionAward[]>(`/Competition/${competitionId}/Awards`);
  }

  createAward(competitionId: number, payload: CreateAwardPayload): Observable<CompetitionAward> {
    return this.api.post<CompetitionAward>(`/Competition/${competitionId}/Awards`, payload);
  }

  deleteAward(competitionId: number, awardId: number): Observable<void> {
    return this.api.delete<void>(`/Competition/${competitionId}/Awards/${awardId}`);
  }

  assignAwardWinner(
    competitionId: number,
    awardId: number,
    payload: AssignAwardWinnerPayload
  ): Observable<CompetitionAward> {
    return this.api.put<CompetitionAward>(`/Competition/${competitionId}/Awards/${awardId}/Winner`, payload);
  }

  // Status
  updateStatus(competitionId: number, status: CompetitionStatus): Observable<void> {
    return this.api.put<void>(`/Competition/${competitionId}/Status`, { status });
  }
}
