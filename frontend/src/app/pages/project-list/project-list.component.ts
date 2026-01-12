import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectFilter, SchoolYear, Class, Role } from '../../core/models';

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
    ProjectCardComponent,
    FilterBarComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Projects</h1>
        <button 
          mat-raised-button 
          color="primary"
          (click)="createProject()"
          *ngIf="canCreateProject()">
          <mat-icon>add</mat-icon>
          Create Project
        </button>
      </div>

      <div class="filter-section">
        <app-filter-bar
          [schoolYears]="schoolYears"
          [classes]="classes"
          (filterChange)="onFilterChange($event)">
        </app-filter-bar>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
      </div>

      <div class="card-grid" *ngIf="!loading && filteredProjects.length > 0">
        <app-project-card
          *ngFor="let project of filteredProjects"
          [project]="project"
          (cardClick)="viewProject($event)">
        </app-project-card>
      </div>

      <div class="no-projects" *ngIf="!loading && filteredProjects.length === 0">
        <mat-icon>folder_open</mat-icon>
        <h3>No projects found</h3>
        <p>Try adjusting your filters or create a new project</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .no-projects {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      color: rgba(0, 0, 0, 0.4);

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 24px;
        font-weight: 400;
        margin-bottom: 8px;
      }

      p {
        font-size: 16px;
      }
    }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  schoolYears: SchoolYear[] = [];
  classes: Class[] = [];
  loading = true;

  constructor(
    private projectService: ProjectService,
    private schoolYearService: SchoolYearService,
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load all data in parallel
    Promise.all([
      this.projectService.getProjects().toPromise(),
      this.schoolYearService.getSchoolYears().toPromise(),
      this.studentService.getClasses().toPromise()
    ]).then(([projects, schoolYears, classes]) => {
      this.projects = projects || [];
      this.filteredProjects = this.projects;
      this.schoolYears = schoolYears || [];
      this.classes = classes || [];
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading = false;
    });
  }

  onFilterChange(filter: ProjectFilter): void {
    this.loading = true;
    this.projectService.getProjectsFiltered(filter).subscribe({
      next: (projects) => {
        this.filteredProjects = projects;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error filtering projects:', error);
        this.loading = false;
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
    return this.authService.hasAnyRole([Role.PROFESSOR, Role.AV, Role.SYS_ADMIN]);
  }
}
