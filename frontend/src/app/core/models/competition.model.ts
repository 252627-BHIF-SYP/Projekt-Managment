export type CompetitionType = 'Itp' | 'Wmc3' | 'ProjectAward' | 'Dipl' | 'Syp';

export type CompetitionStatus = 'Draft' | 'Active' | 'InEvaluation' | 'Completed' | 'Published';

export type ScheduleSlotType = 'Presentation' | 'Break' | 'Info';

export interface JurorCompetition {
  competitionId: number;
  name: string;
  competitionType: CompetitionType;
  startDate: string;
  endDate?: string | null;
  status: CompetitionStatus;
  juryMemberId: number;
  jurorName: string;
  jurorRole: string;
  totalProjects: number;
  evaluatedProjects: number;
}

export interface CompetitionProject {
  projectId: number;
  title: string;
  description: string;
  githubUrl?: string | null;
  logoUrl?: string | null;
  status: string;
  projectType: string;
  technology?: string | null;
  joinedAtUtc: string;
  note?: string | null;
}

export interface ScheduleSlot {
  scheduleSlotId: number;
  competitionId: number;
  projectId?: number | null;
  projectTitle?: string | null;
  slotType: ScheduleSlotType;
  date: string;
  startTime: string;
  durationMinutes: number;
  title: string;
  note?: string | null;
}

export interface EvaluationCriterion {
  criterionId: number;
  competitionId: number;
  name: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
  weight: number;
  orderIndex: number;
}

export interface CreateEvaluationCriterionPayload {
  name: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
  weight: number;
  orderIndex: number;
}

export interface JuryMember {
  juryMemberId: number;
  competitionId: number;
  professorId?: string | null;
  professorName?: string | null;
  externalName?: string | null;
  externalEmail?: string | null;
  role: string;
  addedAtUtc: string;
}

export interface AddJuryMemberPayload {
  professorId?: string | null;
  externalName?: string | null;
  externalEmail?: string | null;
  role: string;
}

export interface ProjectEvaluation {
  evaluationId: number;
  competitionId: number;
  projectId: number;
  projectTitle: string;
  juryMemberId: number;
  jurorName: string;
  criterionId: number;
  criterionName: string;
  score: number;
  note?: string | null;
  updatedAtUtc: string;
}

export interface SubmitEvaluationPayload {
  projectId: number;
  juryMemberId: number;
  criterionId: number;
  score: number;
  note?: string | null;
}

export interface CriterionScoreInput {
  criterionId: number;
  score: number;
}

export interface BatchSubmitEvaluationPayload {
  projectId: number;
  juryMemberId: number;
  scores: CriterionScoreInput[];
  note?: string | null;
}

export interface CriterionAverage {
  criterionId: number;
  criterionName: string;
  averageScore: number;
  maxScore: number;
  weight: number;
}

export interface LeaderboardEntry {
  rank: number;
  projectId: number;
  projectTitle: string;
  technology?: string | null;
  projectType: string;
  totalWeightedScore: number;
  maxPossibleWeightedScore: number;
  evaluatedJurorCount: number;
  totalJurorCount: number;
  criterionAverages: CriterionAverage[];
  awardName?: string | null;
}

export interface Leaderboard {
  competitionId: number;
  competitionName: string;
  status: CompetitionStatus;
  totalProjects: number;
  totalJuryMembers: number;
  entries: LeaderboardEntry[];
}

export interface CompetitionAward {
  awardId: number;
  competitionId: number;
  name: string;
  rank?: number | null;
  prizeDetails?: string | null;
  winningProjectId?: number | null;
  winningProjectTitle?: string | null;
  awardedAtUtc?: string | null;
}

export interface CreateAwardPayload {
  name: string;
  rank?: number | null;
  prizeDetails?: string | null;
}

export interface AssignAwardWinnerPayload {
  winningProjectId: number | null;
}

export interface CompetitionSummary {
  competitionId: number;
  name: string;
  competitionType: CompetitionType;
  startDate: string;
  endDate?: string | null;
  presentationDurationMinutes: number;
  breakDurationMinutes: number;
  allowedClassTypes: string;
  status?: CompetitionStatus;
  createdAtUtc: string;
  projectCount: number;
  slotCount: number;
}

export interface Competition {
  competitionId: number;
  name: string;
  competitionType: CompetitionType;
  startDate: string;
  endDate?: string | null;
  presentationDurationMinutes: number;
  breakDurationMinutes: number;
  allowedClassTypes: string;
  status: CompetitionStatus;
  createdAtUtc: string;
  projects: CompetitionProject[];
  scheduleSlots: ScheduleSlot[];
}

export interface CreateCompetitionPayload {
  name: string;
  competitionType: CompetitionType;
  startDate: string;
  endDate?: string | null;
  presentationDurationMinutes: number;
  breakDurationMinutes: number;
  allowedClassTypes: string;
}

export interface UpdateCompetitionPayload {
  name: string;
  competitionType: CompetitionType;
  startDate: string;
  endDate?: string | null;
  presentationDurationMinutes: number;
  breakDurationMinutes: number;
  allowedClassTypes: string;
}

export interface SetCompetitionProjectsPayload {
  projectIds: number[];
}

export interface CreateScheduleSlotPayload {
  projectId?: number | null;
  slotType: ScheduleSlotType;
  date: string;
  startTime: string;
  durationMinutes: number;
  title: string;
  note?: string | null;
}

export interface UpdateScheduleSlotPayload {
  projectId?: number | null;
  slotType: ScheduleSlotType;
  date: string;
  startTime: string;
  durationMinutes: number;
  title: string;
  note?: string | null;
}

export interface AutoScheduleOptions {
  startTime: string;
  presentationDurationMinutes: number;
  breakDurationMinutes: number;
  breakEveryNProjects: number;
  date: string;
  includeIntro: boolean;
  introTitle?: string;
  introDurationMinutes?: number;
  includeOutro: boolean;
  outroTitle?: string;
  outroDurationMinutes?: number;
}
