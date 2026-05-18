import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CsvPreview,
  ImportResultDTO,
  ImportType,
  ImportValidation
} from '../core/models';
import { ApiService } from '../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private readonly apiService = inject(ApiService);

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

  importCsv(file: File, type: ImportType): Observable<ImportResultDTO> {
    const endpoint = type === ImportType.STUDENTS ? '/Student/Import' : '/Professor/Import';
    const formData = new FormData();
    formData.append('file', file);

    return this.apiService.upload<ImportResultDTO>(endpoint, formData);
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
