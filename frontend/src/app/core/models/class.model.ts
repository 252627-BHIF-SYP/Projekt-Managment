/**
 * Class/Grade level
 */
export interface Class {
  // Backend DTO field (StudentClassDTO)
  classId?: number;
  studentClassId?: number;
  id: string;
  name: string; // e.g., "5AHIF"
  schoolYearId: string;
  branch?: string;
  department?: string;
  year: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backend API DTO from StudentClassController
 */
export interface StudentClassDTO {
  classId: number;
  studentClassId?: number;
  name: string;
  branch: string;
}

export interface CreateStudentClassPayload {
  name: string;
  branch: string;
}
