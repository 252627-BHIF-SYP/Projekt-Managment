import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ImportLog, ImportType, ImportStatus, ImportValidation, CsvPreview } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * Import service for managing CSV imports
 */
@Injectable({
  providedIn: 'root'
})
export class ImportService {
  // Mock data
  private mockImportLogs: ImportLog[] = [
    {
      id: '1',
      type: ImportType.STUDENTS,
      fileName: 'students_2024.csv',
      schoolYearId: '1',
      importedById: '1',
      importedByName: 'Admin User',
      status: ImportStatus.COMPLETED,
      totalRecords: 150,
      successfulRecords: 148,
      failedRecords: 2,
      errors: [
        { row: 45, field: 'email', message: 'Invalid email format' },
        { row: 87, field: 'studentNumber', message: 'Duplicate student number' }
      ],
      startedAt: new Date('2024-09-01T10:00:00'),
      completedAt: new Date('2024-09-01T10:05:00'),
      createdAt: new Date('2024-09-01T10:00:00'),
      updatedAt: new Date('2024-09-01T10:05:00')
    },
    {
      id: '2',
      type: ImportType.TEACHERS,
      fileName: 'teachers_2024.csv',
      importedById: '2',
      importedByName: 'AV Schmidt',
      status: ImportStatus.COMPLETED,
      totalRecords: 45,
      successfulRecords: 45,
      failedRecords: 0,
      errors: [],
      startedAt: new Date('2024-08-28T14:00:00'),
      completedAt: new Date('2024-08-28T14:02:00'),
      createdAt: new Date('2024-08-28T14:00:00'),
      updatedAt: new Date('2024-08-28T14:02:00')
    }
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Get all import logs
   */
  getImportLogs(): Observable<ImportLog[]> {
    // TODO: Replace with API call
    // return this.apiService.get<ImportLog[]>('/imports');
    return of(this.mockImportLogs).pipe(delay(200));
  }

  /**
   * Get import logs by type
   */
  getImportLogsByType(type: ImportType): Observable<ImportLog[]> {
    // TODO: Replace with API call
    // return this.apiService.get<ImportLog[]>(`/imports?type=${type}`);
    return of(this.mockImportLogs.filter(log => log.type === type)).pipe(delay(200));
  }

  /**
   * Get import log by ID
   */
  getImportLogById(id: string): Observable<ImportLog> {
    // TODO: Replace with API call
    // return this.apiService.get<ImportLog>(`/imports/${id}`);
    const log = this.mockImportLogs.find(l => l.id === id);
    if (!log) {
      throw new Error('Import log not found');
    }
    return of(log).pipe(delay(200));
  }

  /**
   * Validate CSV file
   */
  validateCsv(file: File, type: ImportType): Observable<ImportValidation> {
    // TODO: Replace with API call
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('type', type);
    // return this.apiService.upload<ImportValidation>('/imports/validate', formData);

    // Mock validation
    return this.parseCsvFile(file).pipe(
      delay(500),
      map(preview => {
        const validation: ImportValidation = {
          isValid: preview.rows.length > 0,
          errors: [],
          warnings: [],
          preview
        };

        // Mock validation rules
        if (preview.rows.length === 0) {
          validation.errors.push({
            row: 0,
            message: 'File is empty'
          });
        }

        if (type === ImportType.STUDENTS) {
          const requiredHeaders = ['firstName', 'lastName', 'email', 'studentNumber'];
          const missingHeaders = requiredHeaders.filter(h => !preview.headers.includes(h));
          if (missingHeaders.length > 0) {
            validation.isValid = false;
            validation.errors.push({
              row: 0,
              message: `Missing required headers: ${missingHeaders.join(', ')}`
            });
          }
        }

        return validation;
      })
    );
  }

  /**
   * Import CSV file
   */
  importCsv(file: File, type: ImportType, schoolYearId?: string): Observable<ImportLog> {
    // TODO: Replace with API call
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('type', type);
    // if (schoolYearId) formData.append('schoolYearId', schoolYearId);
    // return this.apiService.upload<ImportLog>('/imports', formData);

    // Mock import
    const importLog: ImportLog = {
      id: String(this.mockImportLogs.length + 1),
      type,
      fileName: file.name,
      schoolYearId,
      importedById: '1', // Current user
      importedByName: 'Current User',
      status: ImportStatus.COMPLETED,
      totalRecords: 100,
      successfulRecords: 98,
      failedRecords: 2,
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(importLog).pipe(delay(2000));
  }

  /**
   * Parse CSV file for preview (client-side)
   */
  private parseCsvFile(file: File): Observable<CsvPreview> {
    return new Observable(observer => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const text = e.target.result;
        const lines = text.split('\n').filter((line: string) => line.trim());
        
        if (lines.length === 0) {
          observer.next({
            headers: [],
            rows: [],
            totalRows: 0
          });
          observer.complete();
          return;
        }

        const headers = lines[0].split(',').map((h: string) => h.trim());
        const rows = lines.slice(1, Math.min(11, lines.length)).map((line: string) => 
          line.split(',').map((cell: string) => cell.trim())
        );

        observer.next({
          headers,
          rows,
          totalRows: lines.length - 1
        });
        observer.complete();
      };

      reader.onerror = () => {
        observer.error(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Download import template
   */
  downloadTemplate(type: ImportType): void {
    let headers: string[] = [];

    switch (type) {
      case ImportType.STUDENTS:
        headers = ['studentNumber', 'firstName', 'lastName', 'email', 'className'];
        break;
      case ImportType.TEACHERS:
        headers = ['firstName', 'lastName', 'email', 'department'];
        break;
      case ImportType.PROJECTS:
        headers = ['title', 'description', 'className', 'maxStudents', 'githubUrl'];
        break;
    }

    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type.toLowerCase()}_template.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
