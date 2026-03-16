import { Component, OnInit } from '@angular/core';
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
  currentUser: User | null = null;
  studentProfile?: StudentProfile;
  editing = false;
  saving = false;

  private originalUser?: User;
  private originalStudent?: StudentProfile;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private studentService: StudentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && this.isStudent()) {
        this.loadStudentProfile(user.id);
      }
    });
  }

  loadStudentProfile(userId: string): void {
    // Mock: In real app, fetch student profile by userId
    this.studentService.getStudents().subscribe(students => {
      this.studentProfile = students.find(s => s.userId === userId);
    });
  }

  isStudent(): boolean {
    return this.authService.hasAnyRole([Role.STUDENT_SEARCHING, Role.STUDENT_PROJECT]);
  }

  startEditing(): void {
    this.editing = true;
    this.originalUser = { ...this.currentUser! };
    if (this.studentProfile) {
      this.originalStudent = { ...this.studentProfile };
    }
  }

  cancelEditing(): void {
    this.editing = false;
    if (this.originalUser) {
      this.currentUser = { ...this.originalUser };
    }
    if (this.originalStudent && this.studentProfile) {
      this.studentProfile = { ...this.originalStudent };
    }
  }

  updateSkills(event: Event): void {
    if (!this.studentProfile) return;
    const input = event.target as HTMLInputElement;
    this.studentProfile.skills = input.value.split(',').map(s => s.trim()).filter(s => s);
  }

  saveProfile(): void {
    if (!this.currentUser) return;

    this.saving = true;

    const promises: Promise<any>[] = [
      this.userService.updateUser(this.currentUser.id, this.currentUser).toPromise()
    ];

    if (this.studentProfile && this.isStudent()) {
      promises.push(
        this.studentService.updateStudent(this.studentProfile.id, this.studentProfile).toPromise()
      );
    }

    Promise.all(promises).then(() => {
      this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      this.editing = false;
      this.saving = false;
    }).catch(error => {
      console.error('Error updating profile:', error);
      this.snackBar.open('Failed to update profile. Please try again.', 'Close', { duration: 5000 });
      this.saving = false;
    });
  }
}

