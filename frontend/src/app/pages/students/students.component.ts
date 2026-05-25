import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { StudentClassHistoryDTO, StudentProfile, Class, SchoolYear } from '../../core/models';
import { StudentService } from '../../services/student.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  students = signal<StudentProfile[]>([]);
  filteredStudents = signal<StudentProfile[]>([]);
  classes = signal<Class[]>([]);
  schoolYears = signal<SchoolYear[]>([]);
  selectedGlobalSchoolYearId = '';
  selectedClassIds: string[] = [];
  selectedSchoolYearIds: string[] = [];
  searchTerm = '';
  readonly allValue = 'ALL';
  private lastClassIds: string[] = [];
  private lastSchoolYearIds: string[] = [];

  ngOnInit(): void {
    this.schoolYearService.selectedSchoolYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(year => {
        this.selectedGlobalSchoolYearId = year?.id || '';
        this.applyFilter();
      });

    this.loadData();
  }

  availableClasses(): Class[] {
    const effectiveSchoolYearIds = this.getEffectiveSchoolYearIds();
    const classIds = new Set(
      this.students()
        .filter(student => this.matchesSearch(student))
        .filter(student => this.matchesSchoolYear(student, effectiveSchoolYearIds))
        .map(student => String(this.getVisibleHistory(student, effectiveSchoolYearIds)?.classId ?? student.classId))
        .filter(Boolean)
    );

    return this.classes().filter(studentClass => classIds.has(studentClass.id));
  }

  private loadData(): void {
    this.studentService.getStudents().subscribe(students => {
      this.students.set(students);
      this.applyFilter();
    });

    this.studentService.getClasses().subscribe(classes => {
      this.classes.set(classes);
    });

    this.schoolYearService.getSchoolYears().subscribe(years => {
      this.schoolYears.set(years);
      this.selectedGlobalSchoolYearId = this.schoolYearService.getSelectedSchoolYear()?.id || '';
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.normalizeAllValues();

    const term = (this.searchTerm || '').toLowerCase().trim();
    const effectiveSchoolYearIds = this.getEffectiveSchoolYearIds();
    const selectedClassIds = this.getSelectedValues(this.selectedClassIds);
    const availableClassIds = new Set(this.availableClasses().map(studentClass => studentClass.id));

    if (selectedClassIds) {
      this.selectedClassIds = selectedClassIds.filter(id => availableClassIds.has(id));
      this.lastClassIds = [...this.selectedClassIds];
    }

    const classIds = this.getSelectedValues(this.selectedClassIds);
    const filtered = this.students().filter(s => {
      const visibleHistory = this.getVisibleHistory(s, effectiveSchoolYearIds);
      const visibleClassId = String(visibleHistory?.classId ?? s.classId);

      if (classIds && !classIds.includes(visibleClassId)) return false;
      if (!this.matchesSchoolYear(s, effectiveSchoolYearIds)) return false;
      if (!term) return true;
      return this.matchesSearch(s);
    });

    this.filteredStudents.set(filtered);
  }

  getDisplayClassName(student: StudentProfile): string {
    return this.getVisibleHistory(student, this.getEffectiveSchoolYearIds())?.className || student.className || '';
  }

  openStudentProfile(student: StudentProfile): void {
    this.router.navigate(['/students', student.id, 'profile']);
  }

  private getVisibleHistory(student: StudentProfile, schoolYearIds?: string[]): StudentClassHistoryDTO | undefined {
    if (!student.histories || student.histories.length === 0) {
      return undefined;
    }

    if (schoolYearIds && schoolYearIds.length > 0) {
      const historyForYear = student.histories.find(history => schoolYearIds.includes(String(history.schoolYearId)));
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

  private getEffectiveSchoolYearIds(): string[] | undefined {
    const selectedYears = this.selectedSchoolYearIds || [];

    if (selectedYears.includes(this.allValue)) {
      return undefined;
    }

    if (selectedYears.length > 0) {
      return selectedYears;
    }

    if ((this.searchTerm || '').trim()) {
      return undefined;
    }

    const selectedYear = this.selectedGlobalSchoolYearId || this.schoolYearService.getSelectedSchoolYear()?.id;
    return selectedYear ? [selectedYear] : undefined;
  }

  private matchesSchoolYear(student: StudentProfile, schoolYearIds?: string[]): boolean {
    if (!schoolYearIds || schoolYearIds.length === 0) {
      return true;
    }

    return schoolYearIds.includes(student.schoolYearId) ||
      !!student.histories?.some(history => schoolYearIds.includes(String(history.schoolYearId)));
  }

  private matchesSearch(student: StudentProfile): boolean {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      return true;
    }

    const haystack = `${student.firstName} ${student.lastName} ${student.email} ${student.studentNumber}`.toLowerCase();
    return haystack.includes(term);
  }

  private getSelectedValues(values?: string[]): string[] | undefined {
    if (!values || values.length === 0 || values.includes(this.allValue)) {
      return undefined;
    }

    return values;
  }

  private normalizeAllValues(): void {
    this.selectedClassIds = this.normalizeSelection(this.selectedClassIds, this.lastClassIds);
    this.selectedSchoolYearIds = this.normalizeSelection(this.selectedSchoolYearIds, this.lastSchoolYearIds);

    this.lastClassIds = [...this.selectedClassIds];
    this.lastSchoolYearIds = [...this.selectedSchoolYearIds];
  }

  private normalizeSelection(selected: string[], previous: string[]): string[] {
    if (!selected.includes(this.allValue)) {
      return selected;
    }

    if (!previous.includes(this.allValue)) {
      return [this.allValue];
    }

    return selected.filter(value => value !== this.allValue);
  }
}

