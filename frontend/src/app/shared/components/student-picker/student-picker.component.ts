import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class StudentPickerComponent implements OnInit {
  @Input() schoolYearId?: string;
  @Input() maxStudents?: number;
  @Input() showStatus = true;
  @Output() studentsSelected = new EventEmitter<StudentProfile[]>();

  students: StudentProfile[] = [];
  filteredStudents: StudentProfile[] = [];
  selectedStudents: StudentProfile[] = [];
  classes: Class[] = [];
  selectedClassId?: string;
  searchTerm = '';

  constructor(private studentService: StudentService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
  }

  loadStudents(): void {
    const canViewAll = this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV, Role.PROFESSOR]);

    if (!canViewAll && this.schoolYearId) {
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
    const canViewAll = this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV, Role.PROFESSOR]);

    if (!canViewAll && this.schoolYearId) {
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
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredStudents = this.students.filter(student => {
      if (this.selectedClassId && student.classId !== this.selectedClassId) {
        return false;
      }

      if (!term) return true;

      const haystack = `${student.firstName} ${student.lastName} ${student.email} ${student.studentNumber}`.toLowerCase();
      return haystack.includes(term);
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

