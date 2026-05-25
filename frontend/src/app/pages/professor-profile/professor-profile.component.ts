import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ProfessorProfileDetail, Project, ProjectFilter, ProjectStatus, SchoolYear } from '../../core/models';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { SchoolYearService } from '../../services/schoolyear.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-professor-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ProjectCardComponent
  ],
  templateUrl: './professor-profile.component.html',
  styleUrl: './professor-profile.component.scss'
})
export class ProfessorProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly userService = inject(UserService);

  professor = signal<ProfessorProfileDetail | null>(null);
  schoolYears = signal<SchoolYear[]>([]);
  loading = signal(false);
  notFound = signal(false);
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
    this.schoolYearService.getSchoolYears().subscribe(years => {
      this.schoolYears.set(years);
    });

    this.loadProfessorProfile();
  }

  loadProfessorProfile(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      return;
    }

    this.loading.set(true);
    this.userService.getProfessorProfile(id, this.createFilter()).subscribe({
      next: professor => {
        this.professor.set(professor);
        this.notFound.set(false);
        this.loading.set(false);
      },
      error: error => {
        console.error('Error loading professor profile:', error);
        this.professor.set(null);
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  clearProjectFilters(): void {
    this.searchTerm = '';
    this.schoolYearId = '';
    this.status = '';
    this.projectType = '';
    this.loadProfessorProfile();
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  goBack(): void {
    this.router.navigate(['/professors']);
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
