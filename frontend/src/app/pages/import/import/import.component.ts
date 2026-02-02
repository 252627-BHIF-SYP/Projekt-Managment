import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ImportService } from '../../services/import.service';

enum ImportType {
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  PROJECTS = 'PROJECTS'
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ row: number; message: string }>;
  preview: {
    headers: string[];
    rows: string[][];
    totalRows: number;
  };
}

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTableModule
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent implements OnInit {
  ImportType = ImportType;

  selectedFile: File | null = null;
  selectedSchoolYearId: string | null = null;
  currentImportType: ImportType | null = null;
  validation: ValidationResult | null = null;
  importing = false;

  schoolYears: any[] = [];
  importLogs: any[] = [];
  displayedColumns: string[] = ['fileName', 'type', 'status', 'records', 'date'];

  constructor(private importService: ImportService) {}

  ngOnInit(): void {
    // TODO: Load school years
    // TODO: Load import history
  }

  downloadTemplate(type: ImportType): void {
    // TODO: Implement template download
  }

  handleFileInput(event: Event, type: ImportType): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.currentImportType = type;
      // TODO: Validate file
    }
  }

  performImport(type: ImportType): void {
    if (!this.selectedFile) return;

    this.importing = true;
    // TODO: Call import service
    setTimeout(() => {
      this.importing = false;
    }, 2000);
  }

  reset(): void {
    this.selectedFile = null;
    this.validation = null;
    this.currentImportType = null;
  }
}
