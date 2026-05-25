import { Component, Input, Output, EventEmitter, inject, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { StudentProfile, Class, Role } from '../../../core/models';
import { StudentService } from '../../../services/student.service';
import { AuthService } from '../../../core/services/auth.service';

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
    MatInputModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './student-picker.component.html',
  styleUrl: './student-picker.component.scss'
})
export class StudentPickerComponent implements OnChanges, OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  @Input() schoolYearId?: string;
  @Input() maxStudents?: number;
  @Input() showStatus = true;
  @Input() selectedStudentIds: string[] = [];
  @Output() studentsSelected = new EventEmitter<StudentProfile[]>();

  students = signal<StudentProfile[]>([]);
  filteredStudents = signal<StudentProfile[]>([]);
  selectedStudents: StudentProfile[] = [];
  classes = signal<Class[]>([]);
  selectedClassId?: string;
  searchTerm = '';
  private initialSelectionApplied = false;

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStudentIds']) {
      this.initialSelectionApplied = false;
      this.applyInitialSelection();
    }

    if (changes['schoolYearId'] && !changes['schoolYearId'].firstChange) {
      this.initialSelectionApplied = false;
      this.loadStudents();
      this.loadClasses();
    }
  }

  loadStudents(): void {
    const canViewAll = this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV, Role.PROFESSOR]);

    if (!canViewAll && this.schoolYearId) {
      this.studentService.getStudentsBySchoolYear(this.schoolYearId).subscribe(students => {
        this.students.set(students);
        this.applyFilter();
        this.applyInitialSelection();
      });
    } else {
      this.studentService.getStudents().subscribe(students => {
        this.students.set(students);
        this.applyFilter();
        this.applyInitialSelection();
      });
    }
  }

  loadClasses(): void {
    const canViewAll = this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV, Role.PROFESSOR]);

    if (!canViewAll && this.schoolYearId) {
      this.studentService.getClassesBySchoolYear(this.schoolYearId).subscribe(classes => {
        this.classes.set(classes);
      });
    } else {
      this.studentService.getClasses().subscribe(classes => {
        this.classes.set(classes);
      });
    }
  }

  onClassFilterChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const filtered = this.students().filter(student => {
      if (this.selectedClassId && student.classId !== this.selectedClassId) {
        return false;
      }

      if (!term) return true;

      const haystack = `${student.firstName} ${student.lastName} ${student.email} ${student.studentNumber}`.toLowerCase();
      return haystack.includes(term);
    });

    this.filteredStudents.set(filtered);
  }

  onSelectionChange(): void {
    this.studentsSelected.emit(this.selectedStudents);
  }

  compareStudents(first?: StudentProfile, second?: StudentProfile): boolean {
    if (!first || !second) {
      return first === second;
    }

    return this.sameStudentId(first.id, second.id) ||
      this.sameStudentId(first.studentNumber, second.studentNumber);
  }

  private applyInitialSelection(): void {
    if (this.initialSelectionApplied || this.students().length === 0 || this.selectedStudentIds.length === 0) {
      return;
    }

    const selectedIds = new Set(this.selectedStudentIds.map(id => this.normalizeId(id)));
    this.selectedStudents = this.students().filter(student =>
      selectedIds.has(this.normalizeId(student.id)) ||
      selectedIds.has(this.normalizeId(student.studentNumber)));
    this.initialSelectionApplied = true;
    this.onSelectionChange();
  }

  toggleStudent(student: StudentProfile): void {
    const index = this.selectedStudents.findIndex(s => this.compareStudents(s, student));
    if (index >= 0) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(student);
    }
    this.onSelectionChange();
  }

  isStudentSelected(student: StudentProfile): boolean {
    return this.selectedStudents.some(s => this.compareStudents(s, student));
  }

  isStudentDisabled(student: StudentProfile): boolean {
    if (!this.maxStudents) return false;
    
    const isSelected = this.isStudentSelected(student);
    return !isSelected && this.selectedStudents.length >= this.maxStudents;
  }

  private sameStudentId(first?: string, second?: string): boolean {
    const firstId = this.normalizeId(first);
    const secondId = this.normalizeId(second);

    return firstId.length > 0 && firstId === secondId;
  }

  private normalizeId(id?: string): string {
    return (id || '').trim().toLowerCase();
  }
}

