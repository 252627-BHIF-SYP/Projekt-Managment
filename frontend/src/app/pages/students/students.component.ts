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
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  StudentClassHistoryDTO,
  StudentProfile,
  Class,
  Role,
  SchoolYear,
  PersonCreatePayload
} from '../../core/models';
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
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

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

  canCreateStudent(): boolean {
    return this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV]);
  }

  openCreateStudentDialog(): void {
    const dialogRef = this.dialog.open(StudentCreateDialogComponent, {
      width: '720px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        classes: this.classes(),
        schoolYears: this.schoolYears()
      }
    });

    dialogRef.afterClosed().subscribe((created?: StudentProfile) => {
      if (!created) {
        return;
      }

      this.snackBar.open('Schüler wurde angelegt.', 'Schließen', { duration: 3000 });
      this.loadData();
    });
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

interface StudentCreateDialogData {
  classes: Class[];
  schoolYears: SchoolYear[];
}

@Component({
  selector: 'app-student-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Schüler anlegen</h2>

    <mat-dialog-content>
      <div class="dialog-grid">
        <mat-form-field appearance="outline" class="wide">
          <mat-label>IF-Name / Benutzername</mat-label>
          <input matInput [(ngModel)]="student.id" required>
          <mat-error *ngIf="submitted() && !student.id.trim()">IF-Name ist erforderlich.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Vorname</mat-label>
          <input matInput [(ngModel)]="student.firstName" required>
          <mat-error *ngIf="submitted() && !student.firstName.trim()">Vorname ist erforderlich.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nachname</mat-label>
          <input matInput [(ngModel)]="student.lastName" required>
          <mat-error *ngIf="submitted() && !student.lastName.trim()">Nachname ist erforderlich.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Klasse</mat-label>
          <mat-select [(ngModel)]="student.classId" required>
            <mat-option *ngFor="let c of data.classes" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="submitted() && !student.classId">Klasse ist erforderlich.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Schuljahr</mat-label>
          <mat-select [(ngModel)]="student.schoolYearId" required>
            <mat-option *ngFor="let year of data.schoolYears" [value]="year.id">{{ year.year }}</mat-option>
          </mat-select>
          <mat-error *ngIf="submitted() && !student.schoolYearId">Schuljahr ist erforderlich.</mat-error>
        </mat-form-field>
      </div>

      <div class="dialog-error" *ngIf="errorMessage()">
        <mat-icon>error</mat-icon>
        <span>{{ errorMessage() }}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="saving()" mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="primary" type="button" [disabled]="saving()" (click)="save()">
        <mat-icon>person_add</mat-icon>
        {{ saving() ? 'Speichern...' : 'Anlegen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      padding-top: 8px;
    }

    .wide {
      grid-column: 1 / -1;
    }

    .dialog-error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      color: #b00020;
    }

    @media (max-width: 640px) {
      .dialog-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentCreateDialogComponent {
  private readonly studentService = inject(StudentService);
  private readonly dialogRef = inject(MatDialogRef<StudentCreateDialogComponent>);
  readonly data = inject<StudentCreateDialogData>(MAT_DIALOG_DATA);

  saving = signal(false);
  submitted = signal(false);
  errorMessage = signal('');
  student = {
    id: '',
    firstName: '',
    lastName: '',
    classId: undefined as string | undefined,
    schoolYearId: undefined as string | undefined
  };

  save(): void {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (this.isInvalid()) {
      return;
    }

    const payload: PersonCreatePayload = {
      id: this.student.id.trim(),
      firstName: this.student.firstName.trim(),
      lastName: this.student.lastName.trim(),
      personType: 'Student',
      classId: Number(this.student.classId),
      schoolYearId: Number(this.student.schoolYearId)
    };

    this.saving.set(true);
    this.studentService.createStudent(payload).subscribe({
      next: created => this.dialogRef.close(created),
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(this.toErrorMessage(error));
      }
    });
  }

  private isInvalid(): boolean {
    return !this.student.id.trim() ||
      !this.student.firstName.trim() ||
      !this.student.lastName.trim() ||
      !this.student.classId ||
      !this.student.schoolYearId;
  }

  private toErrorMessage(error: unknown): string {
    const apiError = error as { error?: { detail?: string; title?: string; message?: string } };
    return apiError.error?.detail ||
      apiError.error?.message ||
      apiError.error?.title ||
      'Schüler konnte nicht angelegt werden.';
  }
}

