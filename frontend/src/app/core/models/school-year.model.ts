/**
 * School year interface
 */
export interface SchoolYear {
  id: string;
  year: string; // e.g., "2024/2025"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
