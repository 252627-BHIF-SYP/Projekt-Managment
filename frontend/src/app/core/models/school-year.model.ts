/**
 * School year interface
 */
export interface SchoolYear {
  // Backend DTO field (SchoolYearDTO)
  schoolYearId?: number;
  id: string;
  year: string; // e.g., "2024/2025"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backend API DTO from SchoolYearController
 */
export interface SchoolYearDTO {
  schoolYearId: number;
  year: string;
}
