import { Component, inject, OnInit, signal } from '@angular/core';
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  credentials: LoginCredentials = {
    username: '',
    password: ''
  };

  loading = signal(false);
  errorMessage = signal('');
  readonly useKeycloak = this.authService.isKeycloakEnabled();

  demoAccounts = [
    { role: 'Admin', username: 'admin' },
    { role: 'AV', username: 'av' },
    { role: 'Professor', username: 'bschroedt' },
    { role: 'Student', username: 'IF210025' }
  ];

  fillDemo(username: string): void {
    this.credentials.username = username;
    this.credentials.password = 'password';
  }

  ngOnInit(): void {
    // If returning from Keycloak and already authenticated, move to projects
    if (this.authService.isAuthenticated()) {
      if (!this.authService.isKeycloakEnabled()) {
        this.router.navigate(['/projects']);
        return;
      }

      this.authService.syncKeycloakUser().subscribe({
        next: user => {
          if (user) {
            this.router.navigate(['/projects']);
          }
        },
        error: () => {
          this.loading.set(false);
        }
      });

      this.authService.currentUser$.subscribe(user => {
        if (user && this.authService.isAuthenticated()) {
          this.router.navigate(['/projects']);
        }
      });
    }
  }

  login(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Login failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Login with Keycloak
   */
  loginWithKeycloak(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.loginWithKeycloak().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Keycloak login failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}


