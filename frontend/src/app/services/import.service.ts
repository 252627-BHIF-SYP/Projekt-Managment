import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import {
  CsvPreview,
  ImportLog,
  ImportResultDTO,
  ImportStatus,
  ImportType,
  ImportValidation
} from '../core/models';
import { ApiService } from '../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private readonly apiService = inject(ApiService);
  private importLogs: ImportLog[] = [];

  getImportLogs(): Observable<ImportLog[]> {
    return of(this.importLogs).pipe(delay(100));
  }

  getImportLogsByType(type: ImportType): Observable<ImportLog[]> {
    return of(this.importLogs.filter(log => log.type === type)).pipe(delay(100));
  }

  getImportLogById(id: string): Observable<ImportLog> {
    const log = this.importLogs.find(l => l.id === id);
    if (!log) {
      throw new Error('Import log not found');
    }
    return of(log).pipe(delay(100));
  }

  validateCsv(file: File, type: ImportType): Observable<ImportValidation> {
    return this.parseCsvFile(file).pipe(
      map(preview => {
        const validation: ImportValidation = {
          isValid: preview.rows.length > 0,
          errors: [],
          warnings: [],
          preview
        };

        if (preview.rows.length === 0) {
          validation.errors.push({ row: 0, message: 'File is empty' });
          validation.isValid = false;
          return validation;
        }

        const headers = preview.headers.map(h => h.trim().toLowerCase());
        const hasAnyAlias = (aliases: string[]) => aliases.some(a => headers.includes(a));
        const missingRequiredGroups = (requiredGroups: string[][]) =>
          requiredGroups.filter(group => !hasAnyAlias(group));

        const requiredGroups = type === ImportType.STUDENTS
          ? [
              ['first_name', 'vorname', 'firstname', 'first name'],
              ['last_name', 'nachname', 'lastname', 'last name'],
              ['if_name', 'studentid', 'student_id', 'if', 'ifname', 'username']
            ]
          : [
              ['first_name', 'vorname', 'firstname', 'first name'],
              ['last_name', 'nachname', 'lastname', 'last name']
            ];

        const missing = missingRequiredGroups(requiredGroups);
        if (missing.length > 0) {
          validation.isValid = false;
          validation.errors.push({
            row: 0,
            message: `Missing required headers: ${missing.map(g => g[0]).join(', ')}`
          });
        }

        return validation;
      })
    );
  }

  importCsv(file: File, type: ImportType, schoolYearId?: string): Observable<ImportLog> {
    const endpoint = type === ImportType.STUDENTS ? '/Student/Import' : '/Professor/Import';

    return this.parseCsvFile(file).pipe(
      switchMap(preview => {
        const formData = new FormData();
        formData.append('file', file);
        const startedAt = new Date();

        return this.apiService.upload<ImportResultDTO>(endpoint, formData).pipe(
          map(result => {
            const log: ImportLog = {
              id: String(Date.now()),
              type,
              fileName: file.name,
              schoolYearId,
              importedById: 'current-user',
              importedByName: 'Current User',
              status: result.failedCount > 0 ? ImportStatus.PARTIALLY_COMPLETED : ImportStatus.COMPLETED,
              totalRecords: result.totalRows || preview.totalRows,
              successfulRecords: result.importedCount,
              failedRecords: result.failedCount,
              errors: result.rows
                .filter(row => row.status === 'Failed')
                .map(row => ({ row: row.rowNumber, message: row.reason || 'Import failed' })),
              startedAt,
              completedAt: new Date(),
              createdAt: startedAt,
              updatedAt: new Date()
            };

            this.importLogs = [log, ...this.importLogs];
            return log;
          })
        );
      })
    );
  }

  private parseCsvFile(file: File): Observable<CsvPreview> {
    return new Observable(observer => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        let text: string = e.target.result || '';
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        const lines = text.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
        if (lines.length === 0) {
          observer.next({ headers: [], rows: [], totalRows: 0 });
          observer.complete();
          return;
        }

        const headerLine = lines[0];
        const delimiter = (headerLine.match(/;/g) || []).length >= (headerLine.match(/,/g) || []).length ? ';' : ',';
        const splitLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        observer.next({
          headers: splitLine(headerLine).map((h: string) => h.trim().toLowerCase()),
          rows: lines.slice(1, Math.min(11, lines.length)).map((line: string) => splitLine(line)),
          totalRows: lines.length - 1
        });
        observer.complete();
      };

      reader.onerror = () => observer.error(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  downloadTemplate(type: ImportType): void {
    const csv = type === ImportType.STUDENTS
      ? 'if_name;first_name;last_name;class;schoolyear;branch\n'
      : 'if_name;first_name;last_name\n';

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type.toLowerCase()}_template.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
