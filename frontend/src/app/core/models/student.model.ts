import { Role } from './user.model';
import { Project, ProjectDTO } from './project.model';

/**
 * Backend API DTO from StudentController
 *
 * The backend uses System.Text.Json camel casing (e.g. StudentID -> studentID),
 * but older clients may use studentId. Support both.
 */
export interface StudentDTO {
  id: string;
  firstName: string;
  lastName: string;
  histories?: StudentClassHistoryDTO[];
}

export interface StudentProfileDetailDTO extends StudentDTO {
  username: string;
  projects: ProjectDTO[];
}

export interface StudentClassHistoryDTO {
  historyId: number;
  classId: number;
  className: string;
  branch: string;
  schoolYearId: number;
  schoolYear: string;
}

/**
 * Student profile information
 */
export interface StudentProfile {
  id: string;
  userId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  classId: string;
  className?: string;
  schoolYearId: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  bio?: string;
  skills?: string[];
  profileImageUrl?: string;
  status: StudentStatus;
  historyId?: number;
  histories?: StudentClassHistoryDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfileDetail extends StudentProfile {
  username: string;
  projects: Project[];
}

/**
 * Student status enum
 */
export enum StudentStatus {
  SEARCHING = 'SEARCHING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED'
}

/**
 * Student enrollment in a school year
 */
export interface StudentEnrollment {
  id: string;
  studentId: string;
  classId: string;
  schoolYearId: string;
  enrollmentDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  createdAt: Date;
  updatedAt: Date;
}
