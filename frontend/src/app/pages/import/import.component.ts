import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ImportService } from '../../services/import.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { ImportType, ImportLog, ImportValidation, SchoolYear } from '../../core/models';

/**
 * Import page for importing students, teachers, and projects
 */
@Component({
  selector: 'app-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent implements OnInit {
  ImportType = ImportType;
  
  schoolYears: SchoolYear[] = [];
  importLogs: ImportLog[] = [];
  selectedFile?: File;
  selectedSchoolYearId?: string;
  validation?: ImportValidation;
  importing = false;
  currentImportType?: ImportType;

  displayedColumns = ['fileName', 'type', 'status', 'records', 'date'];

  constructor(
    private importService: ImportService,
    private schoolYearService: SchoolYearService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSchoolYears();
    this.loadImportHistory();
  }

  loadSchoolYears(): void {
    this.schoolYearService.getSchoolYears().subscribe(years => {
      this.schoolYears = years;
      const active = years.find(y => y.isActive);
      if (active) {
        this.selectedSchoolYearId = active.id;
      }
    });
  }

  loadImportHistory(): void {
    this.importService.getImportLogs().subscribe(logs => {
      this.importLogs = logs;
    });
  }

  downloadTemplate(type: ImportType): void {
    this.importService.downloadTemplate(type);
  }

  handleFileInput(event: Event, type: ImportType): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.currentImportType = type;
      this.validateFile(this.selectedFile, type);

      // Allow selecting the same file again (browser otherwise may not fire change).
      input.value = '';
    }
  }

  validateFile(file: File, type: ImportType): void {
    this.importService.validateCsv(file, type).subscribe({
      next: (validation) => {
        this.validation = validation;
        if (!validation.isValid) {
          this.snackBar.open('Validation errors found. Please fix them before importing.', 'Close', {
            duration: 5000
          });
        }
      },
      error: (error) => {
        console.error('Validation error:', error);
        this.snackBar.open('Failed to validate file. Please try again.', 'Close', {
          duration: 5000
        });
      }
    });
  }

  performImport(type: ImportType): void {
    if (!this.selectedFile || !this.validation?.isValid) return;

    this.importing = true;

    this.importService.importCsv(this.selectedFile, type, this.selectedSchoolYearId).subscribe({
      next: (log) => {
        this.snackBar.open(
          `Import completed! ${log.successfulRecords}/${log.totalRecords} records imported successfully.`,
          'Close',
          { duration: 5000 }
        );
        this.reset();
        this.loadImportHistory();
      },
      error: (error) => {
        console.error('Import error:', error);
        this.snackBar.open('Import failed. Please try again.', 'Close', {
          duration: 5000
        });
        this.importing = false;
      }
    });
  }

  reset(): void {
    this.selectedFile = undefined;
    this.validation = undefined;
    this.importing = false;
    this.currentImportType = undefined;
  }
}

