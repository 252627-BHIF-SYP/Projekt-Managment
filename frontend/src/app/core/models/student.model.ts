import { Role } from './user.model';

/**
 * Backend API DTO from StudentController
 *
 * The backend uses System.Text.Json camel casing (e.g. StudentID -> studentID),
 * but older clients may use studentId. Support both.
 */
export interface StudentDTO {
  studentID?: string;
  studentId?: string;
  firstName: string;
  lastName: string;
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
  createdAt: Date;
  updatedAt: Date;
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
