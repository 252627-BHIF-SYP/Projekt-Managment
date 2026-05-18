import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Class, PersonCreatePayload, SchoolYear } from '../../core/models';
import { StudentService } from '../../services/student.service';
import { SchoolYearService } from '../../services/schoolyear.service';

@Component({
  selector: 'app-student-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './student-create.component.html',
  styleUrl: './student-create.component.scss'
})
export class StudentCreateComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  classes = signal<Class[]>([]);
  schoolYears = signal<SchoolYear[]>([]);
  saving = signal(false);
  student = {
    id: '',
    firstName: '',
    lastName: '',
    classId: undefined as string | undefined,
    schoolYearId: undefined as string | undefined
  };

  ngOnInit(): void {
    this.studentService.getClasses().subscribe(classes => {
      this.classes.set(classes);
    });
    this.schoolYearService.getSchoolYears().subscribe(years => {
      this.schoolYears.set(years);
    });
  }

  save(): void {
    if (!this.student.id || !this.student.firstName || !this.student.lastName) {
      return;
    }

    const payload: PersonCreatePayload = {
      id: this.student.id,
      firstName: this.student.firstName,
      lastName: this.student.lastName,
      personType: 'Student',
      classId: this.student.classId ? Number(this.student.classId) : undefined,
      schoolYearId: this.student.schoolYearId ? Number(this.student.schoolYearId) : undefined
    };

    this.saving.set(true);
    this.studentService.createStudent(payload).subscribe({
      next: () => {
        this.snackBar.open('Student created.', 'Close', { duration: 3000 });
        this.router.navigate(['/students']);
      },
      error: error => {
        console.error('Error creating student:', error);
        this.saving.set(false);
        this.snackBar.open('Student could not be created.', 'Close', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/students']);
  }
}
