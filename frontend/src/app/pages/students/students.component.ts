import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { StudentProfile, Class, Role } from '../../core/models';
import { StudentService } from '../../services/student.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatListModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Students</h1>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="filter-item">
              <mat-label>Class</mat-label>
              <mat-select [(ngModel)]="selectedClassId" (ngModelChange)="applyFilter()">
                <mat-option [value]="undefined">All Classes</mat-option>
                <mat-option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-item search">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" placeholder="Name, email, number">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <mat-list *ngIf="filteredStudents.length > 0">
            <mat-list-item *ngFor="let s of filteredStudents">
              <div matListItemTitle>{{ s.firstName }} {{ s.lastName }}</div>
              <div matListItemLine>{{ s.studentNumber }} • {{ s.className }} • {{ s.email }}</div>
            </mat-list-item>
          </mat-list>

          <div class="no-data" *ngIf="filteredStudents.length === 0">
            <mat-icon>info</mat-icon>
            <p>No students found</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .filter-item { min-width: 220px; }
    .filter-item.search { flex: 1; }
    .no-data { display: flex; flex-direction: column; align-items: center; padding: 32px; color: rgba(0,0,0,0.4); }
    .no-data mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
  `]
})
export class StudentsComponent implements OnInit {
  students: StudentProfile[] = [];
  filteredStudents: StudentProfile[] = [];
  classes: Class[] = [];
  selectedClassId?: string;
  searchTerm = '';

  constructor(
    private studentService: StudentService,
    private schoolYearService: SchoolYearService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const canViewAll = this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV, Role.PROFESSOR]);
    const selectedYear = this.schoolYearService.getSelectedSchoolYear();

    if (canViewAll) {
      this.studentService.getStudents().subscribe(students => {
        this.students = students;
        this.applyFilter();
      });
      this.studentService.getClasses().subscribe(classes => this.classes = classes);
    } else if (selectedYear) {
      this.studentService.getStudentsBySchoolYear(selectedYear.id).subscribe(students => {
        this.students = students;
        this.applyFilter();
      });
      this.studentService.getClassesBySchoolYear(selectedYear.id).subscribe(classes => this.classes = classes);
    } else {
      // Fallback to all
      this.studentService.getStudents().subscribe(students => {
        this.students = students;
        this.applyFilter();
      });
      this.studentService.getClasses().subscribe(classes => this.classes = classes);
    }
  }

  applyFilter(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    this.filteredStudents = this.students.filter(s => {
      if (this.selectedClassId && s.classId !== this.selectedClassId) return false;
      if (!term) return true;
      const haystack = `${s.firstName} ${s.lastName} ${s.email} ${s.studentNumber}`.toLowerCase();
      return haystack.includes(term);
    });
  }
}
