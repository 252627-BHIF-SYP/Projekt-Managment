/**
 * Class/Grade level
 */
export interface Class {
  // Backend DTO field (StudentClassDTO)
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
  studentClassId: number;
  name: string;
  branch: string;
}
