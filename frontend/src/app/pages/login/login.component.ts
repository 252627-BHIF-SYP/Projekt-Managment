import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { LoginCredentials } from '../../core/models';

/**
 * Login page component
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  credentials: LoginCredentials = {
    username: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  demoAccounts = [
    { role: 'Admin', username: 'admin' },
    { role: 'AV', username: 'av' },
    { role: 'Professor', username: 'professor' },
    { role: 'Student', username: 'student1' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If returning from Keycloak and already authenticated, move to dashboard
    if (this.authService.isAuthenticated()) {
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.router.navigate(['/dashboard']);
        }
      });
    }
  }

  login(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Login with Keycloak
   */
  loginWithKeycloak(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithKeycloak().subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Keycloak login failed. Please try again.';
        this.loading = false;
      }
    });
  }
}


