import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectSupervisor, Role } from '../../core/models';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  project?: Project;
  loading = true;
  projectId?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject(this.projectId);
      }
    });
  }

  loadProject(id: string): void {
    this.loading = true;

    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
      this.project = project;
      this.loading = false;
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  canAdministrate(): boolean {
    return this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV]);
  }

  canEditProject(): boolean {
    if (this.canAdministrate() || this.isAssignedSupervisor()) {
      return true;
    }

    return this.isAssignedStudent();
  }

  canDeleteProject(): boolean {
    return this.canAdministrate() || this.isAssignedSupervisor();
  }

  getSupervisorRoleLabel(supervisor: ProjectSupervisor): string {
    return supervisor.isPrimary ? 'Betreuer' : 'Nebenbetreuer';
  }

  private isAssignedStudent(): boolean {
    const user = this.authService.currentUserValue;
    if (!this.project || !user || !this.authService.hasRole(Role.STUDENT)) {
      return false;
    }

    return this.project.students?.some(student =>
      this.matchesCurrentUser(student.studentId)) || false;
  }

  private isAssignedSupervisor(): boolean {
    const user = this.authService.currentUserValue;
    if (!this.project || !user || !this.authService.hasRole(Role.PROFESSOR)) {
      return false;
    }

    return this.project.supervisors?.some(supervisor =>
      this.matchesCurrentUser(supervisor.supervisorId)) || false;
  }

  private matchesCurrentUser(id: string): boolean {
    const user = this.authService.currentUserValue;
    if (!user) {
      return false;
    }

    const normalizedId = this.normalizeIdentity(id);
    const candidates = [
      user.id,
      user.username,
      user.email,
      user.email?.split('@')[0]
    ].map(value => this.normalizeIdentity(value || ''));

    return candidates.includes(normalizedId);
  }

  private normalizeIdentity(value: string): string {
    return value.trim().toLowerCase();
  }

  editProject(): void {
    if (!this.project || !this.canEditProject()) return;

    this.router.navigate(['/projects', this.project.id, 'edit']);
  }

  deleteProject(): void {
    if (!this.project || !this.canDeleteProject()) return;

    this.projectService.deleteProject(this.project.id).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: error => console.error('Error deleting project:', error)
    });
  }
}

