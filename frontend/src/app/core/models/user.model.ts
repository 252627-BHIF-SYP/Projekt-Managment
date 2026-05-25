import { Project, ProjectDTO } from './project.model';

/**
 * User roles in the system
 */
export enum Role {
  SYS_ADMIN = 'SYS_ADMIN',
  AV = 'AV',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT'
}

/**
 * User interface representing authenticated users
 */
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

/**
 * Backend API DTO from ProfessorController
 *
 * The backend uses System.Text.Json camel casing (e.g. ProfessorID -> professorID),
 * but older clients may use professorId. Support both.
 */
export interface ProfessorDTO {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ProfessorProfileDetailDTO extends ProfessorDTO {
  username: string;
  projects: ProjectDTO[];
}

export interface ProfessorProfileDetail extends User {
  projects: Project[];
}

export interface PersonCreatePayload {
  id: string;
  firstName: string;
  lastName: string;
  personType: 'Student' | 'Professor';
  classId?: number;
  schoolYearId?: number;
}
