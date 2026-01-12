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
