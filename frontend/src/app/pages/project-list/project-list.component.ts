import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectFilter, SchoolYear, Role } from '../../core/models';
import { firstValueFrom } from 'rxjs';

/**
 * Projects list page
 */
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    ProjectCardComponent,
    FilterBarComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  projects = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);
  schoolYears = signal<SchoolYear[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    Promise.all([
      firstValueFrom(this.projectService.getProjects()),
      firstValueFrom(this.schoolYearService.getSchoolYears())
    ]).then(([projects, schoolYears]) => {
      this.projects.set(projects);
      this.filteredProjects.set(projects);
      this.schoolYears.set(schoolYears);
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading.set(false);
    });
  }

  onFilterChange(filter: ProjectFilter): void {
    this.loading.set(true);
    this.projectService.getProjectsFiltered(filter).subscribe({
      next: (projects) => {
        this.filteredProjects.set(projects);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error filtering projects:', error);
        this.loading.set(false);
      }
    });
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  createProject(): void {
    this.router.navigate(['/projects/create']);
  }

  canCreateProject(): boolean {
    return this.authService.hasAnyRole([
      Role.PROFESSOR,
      Role.AV,
      Role.SYS_ADMIN,
      Role.STUDENT
    ]);
  }
}

