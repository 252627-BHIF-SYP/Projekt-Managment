/**
 * User roles in the system
 */
export enum Role {
  SYS_ADMIN = 'SYS_ADMIN',
  AV = 'AV',
  PROFESSOR = 'PROFESSOR',
  BETREUER = 'BETREUER',
  STUDENT_SEARCHING = 'STUDENT_SEARCHING',
  STUDENT_PROJECT = 'STUDENT_PROJECT'
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
  professorID?: string;
  professorId?: string;
  firstName: string;
  lastName: string;
}
