import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card.component';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar.component';
import { ProjectService } from '../../../services/project.service';
import { SchoolYearService } from '../../../services/schoolyear.service';
import { StudentService } from '../../../services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, ProjectFilter, SchoolYear, Class, Role } from '../../../core/models';

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
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatDividerModule,
    ProjectCardComponent,
    FilterBarComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  schoolYears: SchoolYear[] = [];
  classes: Class[] = [];
  loading = true;
  isFilterOpen = true;

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

  toggleFilters(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  createProject(): void {
    this.router.navigate(['/projects/create']);
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
}
