import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../services/user.service';
import { StudentService } from '../../services/student.service';
import { User, StudentProfile, Role } from '../../core/models';
import { firstValueFrom } from 'rxjs';

/**
 * Profile page component
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly studentService = inject(StudentService);
  private readonly snackBar = inject(MatSnackBar);

  currentUser = signal<User | null>(null);
  studentProfile = signal<StudentProfile | undefined>(undefined);
  editing = signal(false);
  saving = signal(false);

  editableUser: User | null = null;
  editableStudent?: StudentProfile;

  private originalUser?: User;
  private originalStudent?: StudentProfile;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      this.editableUser = user ? { ...user } : null;
      if (user && this.isStudent()) {
        this.loadStudentProfile(user.username || user.id);
      }
    });
  }

  loadStudentProfile(userId: string): void {
    this.studentService.getStudents().subscribe(students => {
      const student = students.find(s => s.userId === userId || s.studentNumber === userId);
      this.studentProfile.set(student);
      this.editableStudent = student ? { ...student } : undefined;
    });
  }

  isStudent(): boolean {
    return this.authService.hasRole(Role.STUDENT);
  }

  startEditing(): void {
    this.editing.set(true);
    if (this.editableUser) {
      this.originalUser = { ...this.editableUser };
    }
    if (this.editableStudent) {
      this.originalStudent = { ...this.editableStudent };
    }
  }

  cancelEditing(): void {
    this.editing.set(false);
    if (this.originalUser) {
      this.editableUser = { ...this.originalUser };
    }
    if (this.originalStudent && this.editableStudent) {
      this.editableStudent = { ...this.originalStudent };
    }
  }

  updateSkills(event: Event): void {
    if (!this.editableStudent) return;
    const input = event.target as HTMLInputElement;
    this.editableStudent.skills = input.value.split(',').map(s => s.trim()).filter(s => s);
  }

  saveProfile(): void {
    if (!this.editableUser) return;

    this.saving.set(true);

    const promises: Promise<unknown>[] = [
      firstValueFrom(this.userService.updateUser(this.editableUser.id, this.editableUser))
    ];

    if (this.editableStudent && this.isStudent()) {
      promises.push(
        firstValueFrom(this.studentService.updateStudent(this.editableStudent.id, this.editableStudent))
      );
    }

    Promise.all(promises).then(() => {
      this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      this.currentUser.set(this.editableUser ? { ...this.editableUser } : null);
      this.studentProfile.set(this.editableStudent ? { ...this.editableStudent } : undefined);
      this.editing.set(false);
      this.saving.set(false);
    }).catch(error => {
      console.error('Error updating profile:', error);
      this.snackBar.open('Failed to update profile. Please try again.', 'Close', { duration: 5000 });
      this.saving.set(false);
    });
  }
}

