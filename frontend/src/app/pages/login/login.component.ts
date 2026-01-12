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
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>School Project Management</mat-card-title>
          <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="login()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input 
                matInput 
                [(ngModel)]="credentials.username" 
                name="username"
                required
                autocomplete="username">
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input 
                matInput 
                type="password"
                [(ngModel)]="credentials.password" 
                name="password"
                required
                autocomplete="current-password">
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </div>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              class="full-width"
              [disabled]="loading || !loginForm.valid">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>

          <div class="demo-accounts">
            <p class="demo-title">Demo Accounts:</p>
            <div class="demo-account" *ngFor="let demo of demoAccounts">
              <strong>{{ demo.role }}:</strong> {{ demo.username }} / password
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    mat-card-header {
      margin-bottom: 24px;
      text-align: center;

      mat-card-title {
        font-size: 24px;
        margin-bottom: 8px;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d32f2f;
      font-size: 14px;
      padding: 12px;
      background: #ffebee;
      border-radius: 4px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    button[type="submit"] {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;

      mat-spinner {
        display: inline-block;
        margin: 0 auto;
      }
    }

    .demo-accounts {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;

      .demo-title {
        font-weight: 500;
        margin-bottom: 12px;
        color: rgba(0, 0, 0, 0.6);
      }

      .demo-account {
        font-size: 13px;
        padding: 4px 0;
        color: rgba(0, 0, 0, 0.8);

        strong {
          color: rgba(0, 0, 0, 0.9);
        }
      }
    }
  `]
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
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
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
}
