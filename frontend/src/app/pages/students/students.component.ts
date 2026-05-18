import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { StudentClassHistoryDTO, StudentProfile, Class, Role, SchoolYear } from '../../core/models';
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
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly authService = inject(AuthService);

  students = signal<StudentProfile[]>([]);
  filteredStudents = signal<StudentProfile[]>([]);
  classes = signal<Class[]>([]);
  schoolYears = signal<SchoolYear[]>([]);
  selectedClassId?: string;
  selectedSchoolYearId?: string;
  searchTerm = '';

  availableClasses = computed<Class[]>(() => {
    const classIds = new Set(
      this.students()
        .filter(student => this.matchesSearch(student))
        .map(student => String(this.getVisibleHistory(student)?.classId ?? student.classId))
        .filter(Boolean)
    );

    return this.classes().filter(studentClass => classIds.has(studentClass.id));
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const canViewAll = this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV, Role.PROFESSOR]);
    const selectedYear = this.schoolYearService.getSelectedSchoolYear();

    if (canViewAll) {
      this.studentService.getStudents().subscribe(students => {
        this.students.set(students);
        this.applyFilter();
      });
      this.studentService.getClasses().subscribe(classes => {
        this.classes.set(classes);
      });
      this.schoolYearService.getSchoolYears().subscribe(years => {
        this.schoolYears.set(years);
      });
    } else if (selectedYear) {
      this.studentService.getStudentsBySchoolYear(selectedYear.id).subscribe(students => {
        this.students.set(students);
        this.applyFilter();
      });
      this.studentService.getClassesBySchoolYear(selectedYear.id).subscribe(classes => {
        this.classes.set(classes);
      });
    } else {
      this.studentService.getStudents().subscribe(students => {
        this.students.set(students);
        this.applyFilter();
      });
      this.studentService.getClasses().subscribe(classes => {
        this.classes.set(classes);
      });
      this.schoolYearService.getSchoolYears().subscribe(years => {
        this.schoolYears.set(years);
      });
    }
  }

  applyFilter(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    const filtered = this.students().filter(s => {
      const visibleHistory = this.getVisibleHistory(s);
      const visibleClassId = String(visibleHistory?.classId ?? s.classId);
      const visibleSchoolYearId = String(visibleHistory?.schoolYearId ?? s.schoolYearId);

      if (this.selectedClassId && visibleClassId !== this.selectedClassId) return false;
      if (this.selectedSchoolYearId && visibleSchoolYearId !== this.selectedSchoolYearId) return false;
      if (!term) return true;
      return this.matchesSearch(s);
    });

    this.filteredStudents.set(filtered);
  }

  getDisplayClassName(student: StudentProfile): string {
    return this.getVisibleHistory(student)?.className || student.className || '';
  }

  private getVisibleHistory(student: StudentProfile): StudentClassHistoryDTO | undefined {
    if (!student.histories || student.histories.length === 0) {
      return undefined;
    }

    if (this.selectedSchoolYearId) {
      const historyForYear = student.histories.find(history => String(history.schoolYearId) === this.selectedSchoolYearId);
      if (historyForYear) {
        return historyForYear;
      }
    }

    if (student.historyId) {
      const currentHistory = student.histories.find(history => history.historyId === student.historyId);
      if (currentHistory) {
        return currentHistory;
      }
    }

    return student.histories[0];
  }

  private matchesSearch(student: StudentProfile): boolean {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      return true;
    }

    const haystack = `${student.firstName} ${student.lastName} ${student.email} ${student.studentNumber}`.toLowerCase();
    return haystack.includes(term);
  }
}

