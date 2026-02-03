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

        // Header checks per import type to match PlantUML data model
        const hasHeaders = (expected: string[]) => expected.filter(h => !preview.headers.includes(h));
        switch (type) {
          case ImportType.STUDENTS: {
            // Data model Student: first_name, last_name, if_name
            const required = ['first_name', 'last_name', 'if_name'];
            const missing = hasHeaders(required);
            if (missing.length > 0) {
              validation.isValid = false;
              validation.errors.push({
                row: 0,
                message: `Missing required headers: ${missing.join(', ')}`
              });
            }
            break;
          }
          case ImportType.TEACHERS: {
            // Data model Professor: first_name, last_name
            const required = ['first_name', 'last_name'];
            const missing = hasHeaders(required);
            if (missing.length > 0) {
              validation.isValid = false;
              validation.errors.push({
                row: 0,
                message: `Missing required headers: ${missing.join(', ')}`
              });
            }
            break;
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
        let text: string = e.target.result || '';
        // Strip UTF-8 BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }
        // Support CRLF and LF line endings
        const lines = text.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
        
        if (lines.length === 0) {
          observer.next({
            headers: [],
            rows: [],
            totalRows: 0
          });
          observer.complete();
          return;
        }

        // Auto-detect delimiter: prefer the one with higher count in header
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semicolonCount = (headerLine.match(/;/g) || []).length;
        const delimiter = semicolonCount > commaCount ? ';' : ',';

        // Simple CSV line splitter supporting quoted fields
        const splitLine = (line: string, delim: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              // Toggle quote state or handle escaped quotes
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // skip escaped quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delim && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          // Strip wrapping quotes
          return result.map(cell => {
            if (cell.startsWith('"') && cell.endsWith('"')) {
              return cell.slice(1, -1);
            }
            return cell;
          });
        };

        const headers = splitLine(headerLine, delimiter).map((h: string) => h.trim().toLowerCase());
        const rows = lines
          .slice(1, Math.min(11, lines.length))
          .map((line: string) => splitLine(line, delimiter).map((cell: string) => cell.trim()));

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
        headers = ['first_name', 'last_name', 'if_name'];
        break;
      case ImportType.TEACHERS:
        headers = ['first_name', 'last_name'];
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
