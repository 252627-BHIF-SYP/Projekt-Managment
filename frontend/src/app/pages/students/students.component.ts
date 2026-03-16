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
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
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

