/**
 * Import type enum
 */
export enum ImportType {
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS'
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

export interface ImportResultDTO {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  rows: ImportRowResultDTO[];
}

export interface ImportRowResultDTO {
  rowNumber: number;
  status: 'Imported' | 'Skipped' | 'Failed';
  identifier?: string;
  reason?: string;
}
