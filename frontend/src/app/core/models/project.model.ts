/**
 * Project status enum
 */
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Project interface
 */
export interface Project {
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
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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
