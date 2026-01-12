import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { StudentProfile, Class } from '../../../core/models';
import { StudentService } from '../../../services/student.service';

/**
 * Component for selecting students with class filter
 */
@Component({
  selector: 'app-student-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="student-picker">
      <div class="picker-header">
        <mat-form-field appearance="outline" class="class-filter">
          <mat-label>Filter by Class</mat-label>
          <mat-select [(ngModel)]="selectedClassId" (ngModelChange)="onClassFilterChange()">
            <mat-option [value]="undefined">All Classes</mat-option>
            <mat-option *ngFor="let class of classes" [value]="class.id">
              {{ class.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="selection-info">
          {{ selectedStudents.length }} student(s) selected
          <span *ngIf="maxStudents"> (max: {{ maxStudents }})</span>
        </div>
      </div>

      <!-- Selected Students Chips -->
      <div class="selected-chips" *ngIf="selectedStudents.length > 0">
        <mat-chip-set>
          <mat-chip *ngFor="let student of selectedStudents" (removed)="toggleStudent(student)">
            {{ student.firstName }} {{ student.lastName }}
            <button matChipRemove>
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip>
        </mat-chip-set>
      </div>

      <!-- Student List -->
      <mat-selection-list [(ngModel)]="selectedStudents" (ngModelChange)="onSelectionChange()">
        <mat-list-option 
          *ngFor="let student of filteredStudents" 
          [value]="student"
          [disabled]="isStudentDisabled(student)">
          <div class="student-item">
            <div class="student-info">
              <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
              <div class="student-meta">
                {{ student.studentNumber }} • {{ student.className }} • {{ student.email }}
              </div>
            </div>
            <div class="student-status" [class]="'status-' + student.status.toLowerCase()">
              {{ student.status }}
            </div>
          </div>
        </mat-list-option>
      </mat-selection-list>

      <div class="no-students" *ngIf="filteredStudents.length === 0">
        <mat-icon>info</mat-icon>
        <p>No students available</p>
      </div>
    </div>
  `,
  styles: [`
    .student-picker {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      .class-filter {
        flex: 1;
        max-width: 300px;
      }

      .selection-info {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .selected-chips {
      mat-chip-set {
        display: flex;
        flex-wrap: wrap;
      }
    }

    mat-selection-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 0;

      .student-info {
        flex: 1;

        .student-name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .student-meta {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      .student-status {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;

        &.status-searching {
          background: #e3f2fd;
          color: #1976d2;
        }

        &.status-assigned {
          background: #fff3e0;
          color: #f57c00;
        }

        &.status-completed {
          background: #e8f5e9;
          color: #388e3c;
        }
      }
    }

    .no-students {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: rgba(0, 0, 0, 0.4);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }
  `]
})
export class StudentPickerComponent implements OnInit {
  @Input() schoolYearId?: string;
  @Input() maxStudents?: number;
  @Output() studentsSelected = new EventEmitter<StudentProfile[]>();

  students: StudentProfile[] = [];
  filteredStudents: StudentProfile[] = [];
  selectedStudents: StudentProfile[] = [];
  classes: Class[] = [];
  selectedClassId?: string;

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
  }

  loadStudents(): void {
    if (this.schoolYearId) {
      this.studentService.getStudentsBySchoolYear(this.schoolYearId).subscribe(students => {
        this.students = students;
        this.applyFilter();
      });
    } else {
      this.studentService.getStudents().subscribe(students => {
        this.students = students;
        this.applyFilter();
      });
    }
  }

  loadClasses(): void {
    if (this.schoolYearId) {
      this.studentService.getClassesBySchoolYear(this.schoolYearId).subscribe(classes => {
        this.classes = classes;
      });
    } else {
      this.studentService.getClasses().subscribe(classes => {
        this.classes = classes;
      });
    }
  }

  onClassFilterChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredStudents = this.students.filter(student => {
      if (this.selectedClassId && student.classId !== this.selectedClassId) {
        return false;
      }
      return true;
    });
  }

  onSelectionChange(): void {
    this.studentsSelected.emit(this.selectedStudents);
  }

  toggleStudent(student: StudentProfile): void {
    const index = this.selectedStudents.findIndex(s => s.id === student.id);
    if (index >= 0) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(student);
    }
    this.onSelectionChange();
  }

  isStudentDisabled(student: StudentProfile): boolean {
    if (!this.maxStudents) return false;
    
    const isSelected = this.selectedStudents.some(s => s.id === student.id);
    return !isSelected && this.selectedStudents.length >= this.maxStudents;
  }
}
