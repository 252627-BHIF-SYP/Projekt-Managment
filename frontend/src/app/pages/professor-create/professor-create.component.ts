import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PersonCreatePayload } from '../../core/models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-professor-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './professor-create.component.html',
  styleUrl: './professor-create.component.scss'
})
export class ProfessorCreateComponent {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  saving = signal(false);
  professor = {
    id: '',
    firstName: '',
    lastName: ''
  };

  save(): void {
    if (!this.professor.id || !this.professor.firstName || !this.professor.lastName) {
      return;
    }

    const payload: PersonCreatePayload = {
      id: this.professor.id,
      firstName: this.professor.firstName,
      lastName: this.professor.lastName,
      personType: 'Professor'
    };

    this.saving.set(true);
    this.userService.createProfessor(payload).subscribe({
      next: () => {
        this.snackBar.open('Professor created.', 'Close', { duration: 3000 });
        this.router.navigate(['/professors']);
      },
      error: error => {
        console.error('Error creating professor:', error);
        this.saving.set(false);
        this.snackBar.open('Professor could not be created.', 'Close', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/professors']);
  }
}
