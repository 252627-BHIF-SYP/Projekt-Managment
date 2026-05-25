import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PersonCreatePayload, Role, User } from '../../core/models';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-professors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './professors.component.html',
  styleUrl: './professors.component.scss'
})
export class ProfessorsComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  professors = signal<User[]>([]);
  filteredProfessors = signal<User[]>([]);
  searchTerm = '';

  ngOnInit(): void {
    this.loadProfessors();
  }

  canCreateProfessor(): boolean {
    return this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV]);
  }

  openCreateProfessorDialog(): void {
    const dialogRef = this.dialog.open(ProfessorCreateDialogComponent, {
      width: '640px',
      maxWidth: 'calc(100vw - 32px)'
    });

    dialogRef.afterClosed().subscribe((created?: User) => {
      if (!created) {
        return;
      }

      this.snackBar.open('Professor wurde angelegt.', 'Schliessen', { duration: 3000 });
      this.loadProfessors();
    });
  }

  private loadProfessors(): void {
    this.userService.getSupervisors().subscribe(professors => {
      this.professors.set(professors);
      this.applyFilter();
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.professors().filter(professor => {
      if (!term) {
        return true;
      }

      const haystack = `${professor.firstName} ${professor.lastName} ${professor.username} ${professor.email}`.toLowerCase();
      return haystack.includes(term);
    });

    this.filteredProfessors.set(filtered);
  }

  openProfessorProfile(professor: User): void {
    this.router.navigate(['/professors', professor.id, 'profile']);
  }
}

@Component({
  selector: 'app-professor-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Professor anlegen</h2>

    <mat-dialog-content>
      <div class="dialog-grid">
        <mat-form-field appearance="outline" class="wide">
          <mat-label>IF-Name / Benutzername</mat-label>
          <input matInput [(ngModel)]="professor.id" required>
          <mat-error *ngIf="submitted() && !professor.id.trim()">IF-Name ist erforderlich.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Vorname</mat-label>
          <input matInput [(ngModel)]="professor.firstName" required>
          <mat-error *ngIf="submitted() && !professor.firstName.trim()">Vorname ist erforderlich.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nachname</mat-label>
          <input matInput [(ngModel)]="professor.lastName" required>
          <mat-error *ngIf="submitted() && !professor.lastName.trim()">Nachname ist erforderlich.</mat-error>
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
export class ProfessorCreateDialogComponent {
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<ProfessorCreateDialogComponent>);

  saving = signal(false);
  submitted = signal(false);
  errorMessage = signal('');
  professor = {
    id: '',
    firstName: '',
    lastName: ''
  };

  save(): void {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (this.isInvalid()) {
      return;
    }

    const payload: PersonCreatePayload = {
      id: this.professor.id.trim(),
      firstName: this.professor.firstName.trim(),
      lastName: this.professor.lastName.trim(),
      personType: 'Professor'
    };

    this.saving.set(true);
    this.userService.createProfessor(payload).subscribe({
      next: created => this.dialogRef.close(created),
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(this.toErrorMessage(error));
      }
    });
  }

  private isInvalid(): boolean {
    return !this.professor.id.trim() ||
      !this.professor.firstName.trim() ||
      !this.professor.lastName.trim();
  }

  private toErrorMessage(error: unknown): string {
    const apiError = error as { error?: { detail?: string; title?: string; message?: string } };
    return apiError.error?.detail ||
      apiError.error?.message ||
      apiError.error?.title ||
      'Professor konnte nicht angelegt werden.';
  }
}
