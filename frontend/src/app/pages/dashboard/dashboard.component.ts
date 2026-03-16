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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
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
