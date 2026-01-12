/**
 * Change request status
 */
export enum ChangeRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

/**
 * Change request type
 */
export enum ChangeRequestType {
  ADD_STUDENT = 'ADD_STUDENT',
  REMOVE_STUDENT = 'REMOVE_STUDENT',
  CHANGE_SUPERVISOR = 'CHANGE_SUPERVISOR',
  MODIFY_PROJECT = 'MODIFY_PROJECT',
  CHANGE_DEADLINE = 'CHANGE_DEADLINE',
  OTHER = 'OTHER'
}

/**
 * Change request interface
 */
export interface ChangeRequest {
  id: string;
  projectId: string;
  projectTitle?: string;
  type: ChangeRequestType;
  requestedById: string;
  requestedByName?: string;
  status: ChangeRequestStatus;
  title: string;
  description: string;
  requestData?: any; // JSON data for the specific change
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}
