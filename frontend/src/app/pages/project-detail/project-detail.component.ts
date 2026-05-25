import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectPermission, ProjectSupervisor } from '../../core/models';

/**
 * Project detail page
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly snackBar = inject(MatSnackBar);

  project = signal<Project | undefined>(undefined);
  permissions = signal<ProjectPermission>({ canEdit: false, canDelete: false });
  loading = signal(true);
  projectId?: string;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject(this.projectId);
      }
    });
  }

  loadProject(id: string): void {
    this.loading.set(true);

    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
        this.loadPermissions(id);
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  editProject(): void {
    if (this.projectId) {
      this.router.navigate(['/projects', this.projectId, 'edit']);
    }
  }

  deleteProject(): void {
    if (!this.projectId || !confirm('Delete this project?')) {
      return;
    }

    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.snackBar.open('Project deleted.', 'Close', {
          duration: 3000
        });
        this.router.navigate(['/projects']);
      },
      error: error => {
        console.error('Error deleting project:', error);
        this.snackBar.open('Project could not be deleted.', 'Close', {
          duration: 5000
        });
      }
    });
  }

  getStudentRoleLabel(role?: string): string {
    if (!role || role.toLowerCase() === 'member') {
      return 'Student';
    }

    return role;
  }

  getSupervisorRoleLabel(supervisor: ProjectSupervisor): string {
    return 'Supervisor';
  }

  private loadPermissions(id: string): void {
    this.projectService.getProjectPermissions(id).subscribe({
      next: permissions => this.permissions.set(permissions),
      error: error => {
        console.error('Error loading project permissions:', error);
        this.permissions.set({ canEdit: false, canDelete: false });
      }
    });
  }
}

