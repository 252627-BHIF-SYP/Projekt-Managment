/**
 * Import type enum
 */
export enum ImportType {
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  PROJECTS = 'PROJECTS'
}

/**
 * Import status
 */
export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED'
}

/**
 * Import log interface
 */
export interface ImportLog {
  id: string;
  type: ImportType;
  fileName: string;
  schoolYearId?: string;
  importedById: string;
  importedByName?: string;
  status: ImportStatus;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors?: ImportError[];
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Import error details
 */
export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

/**
 * CSV preview data
 */
export interface CsvPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/**
 * Import validation result
 */
export interface ImportValidation {
  isValid: boolean;
  errors: ImportError[];
  warnings: string[];
  preview: CsvPreview;
}
