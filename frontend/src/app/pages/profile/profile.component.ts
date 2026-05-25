import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Project, ProjectFilter, ProjectStatus, SchoolYear, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ProjectCardComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly router = inject(Router);

  currentUser = signal<User | null>(null);
  projects = signal<Project[]>([]);
  schoolYears = signal<SchoolYear[]>([]);
  loadingProjects = signal(false);
  searchTerm = '';
  schoolYearId = '';
  status = '';
  projectType = '';
  projectStatuses = [
    ProjectStatus.NEW,
    ProjectStatus.PENDING,
    ProjectStatus.ON_GOING,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED
  ];
  projectTypes = ['SYP', 'Diplomarbeit', 'ProjectAward', 'Others'];

  ngOnInit(): void {
    this.authService.syncKeycloakUser().subscribe(user => {
      this.currentUser.set(user);
    });

    this.schoolYearService.getSchoolYears().subscribe({
      next: years => {
        this.schoolYears.set(years);
        this.schoolYearId = this.schoolYearService.getSelectedSchoolYear()?.id || '';
        this.loadProjects();
      },
      error: error => {
        console.error('Error loading school years:', error);
        this.loadProjects();
      }
    });
  }

  loadProjects(): void {
    this.loadingProjects.set(true);

    this.projectService.getMyProjects(this.createFilter()).subscribe({
      next: projects => {
        this.projects.set(projects);
        this.loadingProjects.set(false);
      },
      error: error => {
        console.error('Error loading profile projects:', error);
        this.projects.set([]);
        this.loadingProjects.set(false);
      }
    });
  }

  clearProjectFilters(): void {
    this.searchTerm = '';
    this.schoolYearId = '';
    this.status = '';
    this.projectType = '';
    this.loadProjects();
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  private createFilter(): ProjectFilter {
    return {
      searchTerm: this.searchTerm.trim() || undefined,
      schoolYearId: this.schoolYearId || undefined,
      status: this.status ? this.status as ProjectStatus : undefined,
      projectType: this.projectType || undefined
    };
  }
}
