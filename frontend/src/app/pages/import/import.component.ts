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
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Import Data</h1>
      </div>

      <mat-tab-group>
        <!-- Import Students Tab -->
        <mat-tab label="Import Students">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Import Students</mat-card-title>
                <mat-card-subtitle>Upload a CSV file to import students</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="import-instructions">
                  <mat-icon>info</mat-icon>
                  <div>
                    <p><strong>Instructions:</strong></p>
                    <ul>
                      <li>Download the template file and fill in your data</li>
                      <li>Ensure all required fields are filled</li>
                      <li>Save as CSV format</li>
                      <li>Upload the file below</li>
                    </ul>
                  </div>
                </div>

                <button mat-raised-button (click)="downloadTemplate(ImportType.STUDENTS)">
                  <mat-icon>download</mat-icon>
                  Download Template
                </button>

                

                <div class="file-upload">
                  <input 
                    type="file" 
                    accept=".csv"
                    (change)="handleFileInput($event, ImportType.STUDENTS)"
                    #fileInputStudents
                    style="display: none;">
                  
                  <button mat-raised-button color="accent" (click)="fileInputStudents.click()">
                    <mat-icon>upload_file</mat-icon>
                    Choose CSV File
                  </button>

                  <span class="file-name" *ngIf="selectedFile">{{ selectedFile.name }}</span>
                </div>

                <div class="validation-result" *ngIf="validation && currentImportType === ImportType.STUDENTS">
                  <div class="validation-header" [class.valid]="validation.isValid" [class.invalid]="!validation.isValid">
                    <mat-icon>{{ validation.isValid ? 'check_circle' : 'error' }}</mat-icon>
                    <span>{{ validation.isValid ? 'File is valid' : 'Validation errors found' }}</span>
                  </div>

                  <div class="errors" *ngIf="validation.errors && validation.errors.length > 0">
                    <h4>Errors:</h4>
                    <ul>
                      <li *ngFor="let error of validation.errors">
                        Row {{ error.row }}: {{ error.message }}
                      </li>
                    </ul>
                  </div>

                  <div class="preview" *ngIf="validation.preview">
                    <h4>Preview (first 10 rows):</h4>
                    <table class="preview-table">
                      <thead>
                        <tr>
                          <th *ngFor="let header of validation.preview.headers">{{ header }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of validation.preview.rows">
                          <td *ngFor="let cell of row">{{ cell }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="total-rows">Total rows: {{ validation.preview.totalRows }}</p>
                  </div>
                </div>

                <mat-progress-bar mode="indeterminate" *ngIf="importing"></mat-progress-bar>
              </mat-card-content>

              <mat-card-actions>
                <button 
                  mat-raised-button 
                  color="primary"
                  [disabled]="!validation || !validation.isValid || importing || currentImportType !== ImportType.STUDENTS"
                  (click)="performImport(ImportType.STUDENTS)">
                  {{ importing ? 'Importing...' : 'Import Data' }}
                </button>
                <button mat-button (click)="reset()" [disabled]="importing">
                  Reset
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Import Professors Tab -->
        <mat-tab label="Import Professors">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Import Professors</mat-card-title>
                <mat-card-subtitle>Upload a CSV file to import professors</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="import-instructions">
                  <mat-icon>info</mat-icon>
                  <div>
                    <p><strong>Instructions:</strong></p>
                    <ul>
                      <li>Download the template file and fill in your data</li>
                      <li>Ensure all required fields are filled</li>
                      <li>Save as CSV format</li>
                      <li>Upload the file below</li>
                    </ul>
                  </div>
                </div>

                <button mat-raised-button (click)="downloadTemplate(ImportType.TEACHERS)">
                  <mat-icon>download</mat-icon>
                  Download Template
                </button>

                <div class="file-upload">
                  <input 
                    type="file" 
                    accept=".csv"
                    (change)="handleFileInput($event, ImportType.TEACHERS)"
                    #fileInputTeachers
                    style="display: none;">
                  
                  <button mat-raised-button color="accent" (click)="fileInputTeachers.click()">
                    <mat-icon>upload_file</mat-icon>
                    Choose CSV File
                  </button>

                  <span class="file-name" *ngIf="selectedFile">{{ selectedFile.name }}</span>
                </div>

                <div class="validation-result" *ngIf="validation && currentImportType === ImportType.TEACHERS">
                  <div class="validation-header" [class.valid]="validation.isValid" [class.invalid]="!validation.isValid">
                    <mat-icon>{{ validation.isValid ? 'check_circle' : 'error' }}</mat-icon>
                    <span>{{ validation.isValid ? 'File is valid' : 'Validation errors found' }}</span>
                  </div>

                  <div class="errors" *ngIf="validation.errors && validation.errors.length > 0">
                    <h4>Errors:</h4>
                    <ul>
                      <li *ngFor="let error of validation.errors">
                        Row {{ error.row }}: {{ error.message }}
                      </li>
                    </ul>
                  </div>

                  <div class="preview" *ngIf="validation.preview">
                    <h4>Preview (first 10 rows):</h4>
                    <table class="preview-table">
                      <thead>
                        <tr>
                          <th *ngFor="let header of validation.preview.headers">{{ header }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of validation.preview.rows">
                          <td *ngFor="let cell of row">{{ cell }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="total-rows">Total rows: {{ validation.preview.totalRows }}</p>
                  </div>
                </div>

                <mat-progress-bar mode="indeterminate" *ngIf="importing"></mat-progress-bar>
              </mat-card-content>

              <mat-card-actions>
                <button 
                  mat-raised-button 
                  color="primary"
                  [disabled]="!validation || !validation.isValid || importing || currentImportType !== ImportType.TEACHERS"
                  (click)="performImport(ImportType.TEACHERS)">
                  {{ importing ? 'Importing...' : 'Import Data' }}
                </button>
                <button mat-button (click)="reset()" [disabled]="importing">
                  Reset
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>


        <!-- Import History Tab -->
        <mat-tab label="Import History">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Import History</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="importLogs" class="full-width">
                  <ng-container matColumnDef="fileName">
                    <th mat-header-cell *matHeaderCellDef>File Name</th>
                    <td mat-cell *matCellDef="let log">{{ log.fileName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let log">{{ log.type }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let log">
                      <span class="status-badge" [class]="'status-' + log.status.toLowerCase()">
                        {{ log.status }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="records">
                    <th mat-header-cell *matHeaderCellDef>Records</th>
                    <td mat-cell *matCellDef="let log">
                      {{ log.successfulRecords }}/{{ log.totalRecords }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let log">{{ log.startedAt | date:'short' }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>

                <div class="no-data" *ngIf="importLogs.length === 0">
                  <mat-icon>history</mat-icon>
                  <p>No import history</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .tab-content {
      padding: 24px 0;
    }

    .import-instructions {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-bottom: 24px;

      mat-icon {
        color: #1976d2;
      }

      ul {
        margin: 8px 0;
        padding-left: 20px;
      }
    }

    .file-upload {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 24px 0;

      .file-name {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .validation-result {
      margin: 24px 0;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;

      .validation-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        margin-bottom: 16px;

        &.valid {
          color: #388e3c;
        }

        &.invalid {
          color: #d32f2f;
        }
      }

      h4 {
        font-size: 14px;
        font-weight: 500;
        margin: 16px 0 8px 0;
      }

      .errors {
        ul {
          margin: 0;
          padding-left: 20px;
          color: #d32f2f;
        }
      }

      .preview-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;

        th, td {
          border: 1px solid #e0e0e0;
          padding: 8px;
          text-align: left;
          font-size: 13px;
        }

        th {
          background: #f5f5f5;
          font-weight: 500;
        }
      }

      .total-rows {
        margin-top: 8px;
        font-size: 13px;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;

      &.status-completed {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.status-failed {
        background: #ffebee;
        color: #d32f2f;
      }

      &.status-processing {
        background: #fff3e0;
        color: #f57c00;
      }
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.4);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
    }
  `]
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
