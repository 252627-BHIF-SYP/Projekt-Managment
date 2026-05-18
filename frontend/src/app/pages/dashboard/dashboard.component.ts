import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, Project, Role, ProjectStatus } from '../../core/models';
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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  projects$: Observable<Project[]> = this.projectService.getProjects();
  projects = signal<Project[]>([]);

  ngOnInit(): void {
    this.projects$.subscribe(projects => {
      this.projects.set(projects);
    });
  }

  getInProgressCount(): number {
    return this.projects().filter(p => p.status === ProjectStatus.ON_GOING).length;
  }

  getCompletedCount(): number {
    return this.projects().filter(p => p.status === ProjectStatus.COMPLETED).length;
  }

  canCreateProject(): boolean {
    return this.authService.hasAnyRole([
      Role.PROFESSOR,
      Role.AV,
      Role.SYS_ADMIN,
      Role.STUDENT
    ]);
  }

  canImport(): boolean {
    return this.authService.hasAnyRole([Role.SYS_ADMIN, Role.AV]);
  }
}
