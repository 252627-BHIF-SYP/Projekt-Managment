import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentPickerComponent } from '../../shared/components/student-picker/student-picker.component';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { UserService } from '../../services/user.service';
import { Project, SchoolYear, User, StudentProfile, ProjectStatus } from '../../core/models';

/**
 * Create project page
 */
@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSnackBarModule,
    StudentPickerComponent
  ],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent implements OnInit {
  project: Partial<Project> = {
    title: '',
    description: '',
    githubUrl: '',
    minStudents: 2,
    maxStudents: 4,
    status: ProjectStatus.NEW
  };

  schoolYears: SchoolYear[] = [];
  supervisors: User[] = [];
  selectedStudents: StudentProfile[] = [];
  primarySupervisorId = '';
  additionalSupervisors: string[] = [];
  saving = false;
  ProjectStatus = ProjectStatus;
  projectStatuses: ProjectStatus[] = [
    ProjectStatus.NEW,
    ProjectStatus.PENDING,
    ProjectStatus.ON_GOING,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED
  ];
  technologiesText = '';

  constructor(
    private projectService: ProjectService,
    private schoolYearService: SchoolYearService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Preselect currently selected/active year immediately (before async load)
    const preselected = this.schoolYearService.getSelectedSchoolYear();
    if (preselected) {
      this.project.schoolYearId = preselected.id;
    }
    this.loadData();
  }

  loadData(): void {
    this.schoolYearService.getSchoolYears().subscribe({
      next: (years) => {
        this.schoolYears = years || [];
        const activeYear = this.schoolYears.find(y => y.isActive);
        if (activeYear) {
          this.project.schoolYearId = activeYear.id;
        } else if (this.schoolYears.length > 0 && !this.project.schoolYearId) {
          this.project.schoolYearId = this.schoolYears[0].id;
        } else {
          // Fallback: try to fetch active year directly
          this.schoolYearService.getActiveSchoolYear().subscribe((sy) => {
            if (sy) {
              this.schoolYears = [sy];
              this.project.schoolYearId = sy.id;
            }
          });
        }
      },
      error: () => {
        // Final fallback: attempt active year, else leave empty
        this.schoolYearService.getActiveSchoolYear().subscribe((sy) => {
          if (sy) {
            this.schoolYears = [sy];
            this.project.schoolYearId = sy.id;
          }
        });
      }
    });

    this.userService.getSupervisors().subscribe(supervisors => {
      this.supervisors = supervisors;
    });
  }

  isBasicInfoComplete(): boolean {
    return !!(
      this.project.title &&
      this.project.description &&
      this.project.schoolYearId &&
      this.project.status &&
      this.project.minStudents &&
      this.project.maxStudents
    );
  }

  onStudentsSelected(students: StudentProfile[]): void {
    this.selectedStudents = students;
  }

  getSupervisorName(id: string): string {
    const supervisor = this.supervisors.find(s => s.id === id);
    return supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '';
  }

  getAdditionalSupervisorNames(): string {
    return this.additionalSupervisors
      .map(id => this.getSupervisorName(id))
      .join(', ');
  }

  addAdditionalSupervisor(): void {
    this.additionalSupervisors.push('');
  }

  removeAdditionalSupervisor(index: number): void {
    this.additionalSupervisors.splice(index, 1);
  }

  onAdditionalSupervisorChange(): void {
    // Placeholder for change detection
  }

  createProject(): void {
    this.saving = true;

    if (this.technologiesText) {
      this.project.technologies = this.technologiesText
        .split(/[,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }

    this.projectService.createProject(this.project).subscribe({
      next: (createdProject) => {
        this.snackBar.open('Project created successfully!', 'Close', {
          duration: 3000
        });
        this.router.navigate(['/projects', createdProject.id]);
      },
      error: (error) => {
        console.error('Error creating project:', error);
        this.snackBar.open('Failed to create project. Please try again.', 'Close', {
          duration: 5000
        });
        this.saving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

