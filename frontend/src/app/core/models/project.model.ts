/**
 * Project status enum
 */
export enum ProjectStatus {
  // Backend enum string representations (must match C# backend exactly)
  NEW = 'New',
  PENDING = 'Pending',
  ON_GOING = 'OnGoing',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived',
  // Legacy frontend values kept for compatibility
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS'
}

/**
 * Project interface
 */
export interface Project {
  // Backend entity identifier is ProjectId (number)
  projectId?: number;
  id: string;
  title: string;
  description: string;
  schoolYearId: string;
  schoolYear?: string;
  classId: string;
  className?: string;
  status: ProjectStatus;
  githubUrl?: string;
  logoUrl?: string;
  maxStudents: number;
  minStudents: number;
  createdById: string;
  createdByName?: string;
  students?: ProjectStudent[];
  supervisors?: ProjectSupervisor[];
  tags?: string[];
  technologies?: string[];
  projectType?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backend API DTO from ProjectController
 */
export interface ProjectDTO {
  title: string;
  description: string;
  githubURL: string;
  logoURL: string;
  schoolYearId: number;
  projectStatus: string;
  technologies: string;
  projectType: string;
  students: ProjectStudentDTO[];
  supervisors: ProjectSupervisorDTO[];
}

/**
 * Payload used when creating a project (matches backend ProjectDTO exactly)
 */
export interface CreateProjectPayload extends ProjectDTO {}

/**
 * Backend API DTO for project-student assignment
 */
export interface ProjectStudentDTO {
  historyId: number;
  role: string;
}

/**
 * Backend API DTO for project-supervisor assignment
 */
export interface ProjectSupervisorDTO {
  professorId: string;
  role: string;
}

/**
 * Project student relationship
 */
export interface ProjectStudent {
  id: string;
  projectId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  role?: string; // e.g., "Frontend Developer", "Backend Developer"
  joinedAt: Date;
  status: 'ACTIVE' | 'LEFT' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project supervisor relationship
 */
export interface ProjectSupervisor {
  id: string;
  projectId: string;
  supervisorId: string;
  supervisorName?: string;
  supervisorEmail?: string;
  isPrimary: boolean;
  assignedAt: Date;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project filter criteria
 */
export interface ProjectFilter {
  searchTerm?: string;
  schoolYearId?: string;
  classId?: string;
  supervisorId?: string;
  status?: ProjectStatus;
  tags?: string[];
}
