import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, Project, Role } from '../../core/models';
import { Observable } from 'rxjs';

/**
 * Dashboard page component
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <div class="welcome-section" *ngIf="currentUser$ | async as user">
        <h2>Welcome back, {{ user.firstName }}! 👋</h2>
        <p>Here's what's happening with your projects today.</p>
      </div>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" style="background: #e3f2fd;">
              <mat-icon color="primary">folder</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ (projects$ | async)?.length || 0 }}</div>
              <div class="stat-label">Total Projects</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" style="background: #fff3e0;">
              <mat-icon style="color: #f57c00;">hourglass_empty</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ getInProgressCount() }}</div>
              <div class="stat-label">In Progress</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" style="background: #e8f5e9;">
              <mat-icon style="color: #388e3c;">check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ getCompletedCount() }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" style="background: #fce4ec;">
              <mat-icon style="color: #c2185b;">assignment</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">Pending Requests</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <button 
            mat-raised-button 
            color="primary" 
            routerLink="/projects"
            class="action-button">
            <mat-icon>folder</mat-icon>
            <span>View Projects</span>
          </button>

          <button 
            mat-raised-button 
            routerLink="/projects/create"
            class="action-button"
            *ngIf="canCreateProject()">
            <mat-icon>add</mat-icon>
            <span>Create Project</span>
          </button>

          <button 
            mat-raised-button 
            routerLink="/profile"
            class="action-button">
            <mat-icon>person</mat-icon>
            <span>My Profile</span>
          </button>

          <button 
            mat-raised-button 
            routerLink="/import"
            class="action-button"
            *ngIf="canImport()">
            <mat-icon>upload</mat-icon>
            <span>Import Data</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-section {
      margin-bottom: 32px;

      h2 {
        font-size: 28px;
        font-weight: 400;
        margin-bottom: 8px;
      }

      p {
        color: rgba(0, 0, 0, 0.6);
        font-size: 16px;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px !important;
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 32px;
          font-weight: 500;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
        }
      }
    }

    .quick-actions {
      h3 {
        font-size: 20px;
        font-weight: 400;
        margin-bottom: 16px;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }

      .action-button {
        height: 64px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser$: Observable<User | null>;
  projects$: Observable<Project[]>;
  projects: Project[] = [];

  constructor(
    private authService: AuthService,
    private projectService: ProjectService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.projects$ = this.projectService.getProjects();
  }

  ngOnInit(): void {
    this.projects$.subscribe(projects => {
      this.projects = projects;
    });
  }

  getInProgressCount(): number {
    return this.projects.filter(p => p.status === 'IN_PROGRESS').length;
  }

  getCompletedCount(): number {
    return this.projects.filter(p => p.status === 'COMPLETED').length;
  }

  canCreateProject(): boolean {
    return this.authService.hasAnyRole([
      Role.PROFESSOR,
      Role.AV,
      Role.SYS_ADMIN,
      Role.STUDENT_SEARCHING,
      Role.STUDENT_PROJECT
    ]);
  }

  canImport(): boolean {
    return this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV]);
  }
}
