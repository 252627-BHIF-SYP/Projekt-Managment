/**
 * Class/Grade level
 */
export interface Class {
  id: string;
  name: string; // e.g., "5AHIF"
  schoolYearId: string;
  department?: string;
  year: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}
