import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/user.model';

interface StudentProfile {
  studentNumber: string;
  className: string;
  github?: string;
  linkedin?: string;
  bio?: string;
  skills?: string[];
}

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
    MatChipsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  studentProfile: StudentProfile | null = null;
  editing = false;
  saving = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (this.isStudent()) {
        // TODO: Load student profile data
        this.studentProfile = {
          studentNumber: '',
          className: ''
        };
      }
    });
  }

  isStudent(): boolean {
    return this.currentUser?.roles.includes(Role.STUDENT) ?? false;
  }

  startEditing(): void {
    this.editing = true;
  }

  cancelEditing(): void {
    this.editing = false;
    // TODO: Reload original data
  }

  saveProfile(): void {
    if (!this.currentUser) return;

    this.saving = true;
    // TODO: Call API to update profile
    setTimeout(() => {
      this.saving = false;
      this.editing = false;
    }, 1000);
  }

  updateSkills(event: Event): void {
    if (!this.studentProfile) return;
    const input = event.target as HTMLInputElement;
    this.studentProfile.skills = input.value.split(',').map((s) => s.trim());
  }
}
