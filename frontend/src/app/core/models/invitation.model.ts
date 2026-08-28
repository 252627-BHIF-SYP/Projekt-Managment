export type InvitationRole = 'ExternalTeacher' | 'ExternalJuror' | 'ExternalStudent';

export type InvitationStatus = 'Pending' | 'Accepted' | 'Revoked' | 'Expired';

export interface Invitation {
  invitationId: number;
  email: string;
  recipientName: string;
  schoolName?: string | null;
  targetRole: InvitationRole;
  competitionId?: number | null;
  competitionName?: string | null;
  projectId?: number | null;
  projectTitle?: string | null;
  token: string;
  status: InvitationStatus;
  createdAtUtc: string;
  expiresAtUtc: string;
  acceptedAtUtc?: string | null;
  createdByUserId?: string | null;
}

export interface CreateInvitationPayload {
  email: string;
  recipientName: string;
  schoolName?: string | null;
  targetRole: InvitationRole;
  competitionId?: number | null;
  projectId?: number | null;
}

export interface ExternalStudentInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  classGrade?: string | null;
}

export interface CreateExternalProjectPayload {
  token: string;
  title: string;
  description: string;
  technology?: string | null;
  githubUrl?: string | null;
  logoUrl?: string | null;
  schoolName: string;
  competitionId?: number | null;
  students: ExternalStudentInput[];
}

export interface ConfirmConsentPayload {
  confirmedBy: string;
  hasConsent: boolean;
}
