import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { Project, ProjectFilter, ProjectStatus, SchoolYear } from '../../core/models';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly destroyRef = inject(DestroyRef);

  projects = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);
  schoolYears = signal<SchoolYear[]>([]);
  loading = signal(true);
  selectedGlobalSchoolYearId = '';
  activeQuickFilter = signal<string>('ALL');

  readonly pendingCount = computed(() =>
    this.projects().filter(p => p.status === ProjectStatus.PENDING).length
  );

  private readonly allValue = 'ALL';
  private currentFilter: ProjectFilter = {};
  private dataLoaded = false;

  ngOnInit(): void {
    this.schoolYearService.selectedSchoolYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(year => {
        this.selectedGlobalSchoolYearId = year?.id || '';
        if (this.dataLoaded) {
          this.applyFilter();
        }
      });

    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    Promise.all([
      firstValueFrom(this.schoolYearService.getSchoolYears())
    ]).then(([schoolYears]) => {
      this.schoolYears.set(schoolYears);
      this.selectedGlobalSchoolYearId = this.schoolYearService.getSelectedSchoolYear()?.id || '';
      this.loadProjects();
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading.set(false);
    });
  }

  onFilterChange(filter: ProjectFilter): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  private loadProjects(): void {
    this.loading.set(true);

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.dataLoaded = true;
        this.applyFilter();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading.set(false);
      }
    });
  }

  setQuickFilter(filter: string): void {
    this.activeQuickFilter.set(filter);
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = (this.currentFilter.searchTerm || '').toLowerCase().trim();
    const schoolYearIds = this.getEffectiveSchoolYearIds(term);
    const statuses = this.getSelectedValues(this.currentFilter.statuses);
    const projectTypes = this.getSelectedValues(this.currentFilter.projectTypes);
    const quick = this.activeQuickFilter();

    const filtered = this.projects().filter(project => {
      // Quick Status Filter
      if (quick === 'PENDING' && project.status !== ProjectStatus.PENDING) {
        return false;
      }
      if (quick === 'ON_GOING' && project.status !== ProjectStatus.ON_GOING && project.status !== ProjectStatus.COMPLETED) {
        return false;
      }
      if (quick === 'PUBLISHED' && project.status !== ProjectStatus.PUBLISHED) {
        return false;
      }

      if (schoolYearIds && !this.matchesSchoolYear(project, schoolYearIds)) {
        return false;
      }

      if (statuses && !statuses.includes(project.status)) {
        return false;
      }

      if (projectTypes && (!project.projectType || !projectTypes.includes(project.projectType))) {
        return false;
      }

      if (!term) {
        return true;
      }

      return this.matchesSearch(project, term);
    });

    this.filteredProjects.set(filtered);
  }

  private getEffectiveSchoolYearIds(searchTerm: string): string[] | undefined {
    const selectedYears = this.currentFilter.schoolYearIds || [];

    if (selectedYears.includes(this.allValue)) {
      return undefined;
    }

    if (selectedYears.length > 0) {
      return selectedYears;
    }

    if (searchTerm) {
      return undefined;
    }

    const selectedYear = this.schoolYearService.getSelectedSchoolYear();
    return selectedYear ? [selectedYear.id] : undefined;
  }

  private getSelectedValues(values?: string[]): string[] | undefined {
    if (!values || values.length === 0 || values.includes(this.allValue)) {
      return undefined;
    }

    return values;
  }

  private matchesSchoolYear(project: Project, schoolYearIds: string[]): boolean {
    const projectSchoolYearIds = project.schoolYearIds && project.schoolYearIds.length > 0
      ? project.schoolYearIds
      : [project.schoolYearId];

    return projectSchoolYearIds.some(id => schoolYearIds.includes(id));
  }

  private matchesSearch(project: Project, term: string): boolean {
    const supervisorNames = project.supervisors?.map(supervisor => supervisor.supervisorName).join(' ') || '';
    const studentNames = project.students?.map(student => student.studentName).join(' ') || '';
    const technologies = project.technologies?.join(' ') || '';
    const schoolYears = project.schoolYear || '';
    const haystack = `${project.title} ${project.description} ${project.projectType} ${project.status} ${technologies} ${schoolYears} ${supervisorNames} ${studentNames}`.toLowerCase();

    return haystack.includes(term);
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  createProject(): void {
    this.router.navigate(['/projects/create']);
  }

  canCreateProject(): boolean {
    return this.authService.isAuthenticated();
  }
}

