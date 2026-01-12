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
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>My Profile</h1>
      </div>

      <div class="profile-content">
        <!-- User Information Card -->
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="profile-avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <mat-card-title>{{ currentUser?.firstName }} {{ currentUser?.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ currentUser?.email }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="info-section">
              <h3>Account Information</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>First Name</mat-label>
                <input matInput [(ngModel)]="currentUser!.firstName" [disabled]="!editing">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Last Name</mat-label>
                <input matInput [(ngModel)]="currentUser!.lastName" [disabled]="!editing">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput [(ngModel)]="currentUser!.email" type="email" [disabled]="!editing">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Username</mat-label>
                <input matInput [value]="currentUser!.username" disabled>
              </mat-form-field>

              <div class="roles-section">
                <label>Roles:</label>
                <mat-chip-set>
                  <mat-chip *ngFor="let role of currentUser?.roles">{{ role }}</mat-chip>
                </mat-chip-set>
              </div>
            </div>

            <!-- Student-specific information -->
            <div class="info-section" *ngIf="isStudent() && studentProfile">
              <h3>Student Information</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Student Number</mat-label>
                <input matInput [value]="studentProfile.studentNumber" disabled>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Class</mat-label>
                <input matInput [value]="studentProfile.className" disabled>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>GitHub</mat-label>
                <input matInput [(ngModel)]="studentProfile.github" [disabled]="!editing" type="url">
                <mat-icon matPrefix>code</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>LinkedIn</mat-label>
                <input matInput [(ngModel)]="studentProfile.linkedin" [disabled]="!editing" type="url">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Bio</mat-label>
                <textarea 
                  matInput 
                  [(ngModel)]="studentProfile.bio" 
                  [disabled]="!editing"
                  rows="4">
                </textarea>
              </mat-form-field>

              <div class="skills-section">
                <label>Skills:</label>
                <mat-chip-set *ngIf="!editing">
                  <mat-chip *ngFor="let skill of studentProfile.skills">{{ skill }}</mat-chip>
                </mat-chip-set>
                <mat-form-field appearance="outline" class="full-width" *ngIf="editing">
                  <mat-label>Skills (comma-separated)</mat-label>
                  <input matInput [value]="studentProfile.skills?.join(', ')" (change)="updateSkills($event)">
                </mat-form-field>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="primary" *ngIf="!editing" (click)="startEditing()">
              <mat-icon>edit</mat-icon>
              Edit Profile
            </button>
            <button mat-raised-button color="primary" *ngIf="editing" (click)="saveProfile()" [disabled]="saving">
              <mat-icon>save</mat-icon>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button mat-button *ngIf="editing" (click)="cancelEditing()">
              Cancel
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .profile-card {
      .profile-avatar {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 50%;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #666;
        }
      }
    }

    .info-section {
      margin-bottom: 32px;

      h3 {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 16px;
        color: rgba(0, 0, 0, 0.87);
      }

      .roles-section,
      .skills-section {
        margin-top: 16px;

        label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
          color: rgba(0, 0, 0, 0.6);
        }
      }
    }
  `]
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
