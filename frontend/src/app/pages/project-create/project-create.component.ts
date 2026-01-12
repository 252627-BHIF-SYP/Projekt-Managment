import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentPickerComponent } from '../../shared/components/student-picker/student-picker.component';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { UserService } from '../../services/user.service';
import { Project, SchoolYear, User, StudentProfile } from '../../core/models';

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
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSnackBarModule,
    StudentPickerComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Create New Project</h1>
      </div>

      <mat-stepper linear #stepper>
        <!-- Step 1: Basic Information -->
        <mat-step [completed]="isBasicInfoComplete()">
          <ng-template matStepLabel>Basic Information</ng-template>
          <div class="step-content">
            <mat-card>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Project Title</mat-label>
                  <input matInput [(ngModel)]="project.title" required>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea 
                    matInput 
                    [(ngModel)]="project.description" 
                    rows="6"
                    required>
                  </textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>GitHub URL</mat-label>
                  <input matInput [(ngModel)]="project.githubUrl" type="url">
                  <mat-icon matPrefix>code</mat-icon>
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Minimum Students</mat-label>
                    <input matInput type="number" [(ngModel)]="project.minStudents" min="1">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Maximum Students</mat-label>
                    <input matInput type="number" [(ngModel)]="project.maxStudents" min="1">
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>School Year</mat-label>
                  <mat-select [(ngModel)]="project.schoolYearId" required>
                    <mat-option *ngFor="let year of schoolYears" [value]="year.id">
                      {{ year.year }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext [disabled]="!isBasicInfoComplete()">
                    Next
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-step>

        <!-- Step 2: Select Students -->
        <mat-step>
          <ng-template matStepLabel>Select Students</ng-template>
          <div class="step-content">
            <mat-card>
              <mat-card-content>
                <app-student-picker
                  [schoolYearId]="project.schoolYearId"
                  [maxStudents]="project.maxStudents"
                  (studentsSelected)="onStudentsSelected($event)">
                </app-student-picker>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext>
                    Next
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-step>

        <!-- Step 3: Assign Supervisors -->
        <mat-step>
          <ng-template matStepLabel>Assign Supervisors</ng-template>
          <div class="step-content">
            <mat-card>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Primary Supervisor</mat-label>
                  <mat-select [(ngModel)]="primarySupervisorId" required>
                    <mat-option *ngFor="let supervisor of supervisors" [value]="supervisor.id">
                      {{ supervisor.firstName }} {{ supervisor.lastName }} ({{ supervisor.email }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Additional Supervisors (Optional)</mat-label>
                  <mat-select [(ngModel)]="additionalSupervisorIds" multiple>
                    <mat-option *ngFor="let supervisor of supervisors" [value]="supervisor.id">
                      {{ supervisor.firstName }} {{ supervisor.lastName }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext [disabled]="!primarySupervisorId">
                    Next
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-step>

        <!-- Step 4: Review & Create -->
        <mat-step>
          <ng-template matStepLabel>Review & Create</ng-template>
          <div class="step-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Review Project Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="review-section">
                  <h3>Project Information</h3>
                  <div class="review-item">
                    <span class="label">Title:</span>
                    <span class="value">{{ project.title }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Description:</span>
                    <span class="value">{{ project.description }}</span>
                  </div>
                  <div class="review-item" *ngIf="project.githubUrl">
                    <span class="label">GitHub:</span>
                    <span class="value">{{ project.githubUrl }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Team Size:</span>
                    <span class="value">{{ project.minStudents }}-{{ project.maxStudents }} students</span>
                  </div>
                </div>

                <div class="review-section">
                  <h3>Selected Students ({{ selectedStudents.length }})</h3>
                  <ul *ngIf="selectedStudents.length > 0">
                    <li *ngFor="let student of selectedStudents">
                      {{ student.firstName }} {{ student.lastName }} ({{ student.className }})
                    </li>
                  </ul>
                  <p *ngIf="selectedStudents.length === 0" class="no-data">No students selected</p>
                </div>

                <div class="review-section">
                  <h3>Supervisors</h3>
                  <div class="review-item">
                    <span class="label">Primary:</span>
                    <span class="value">{{ getSupervisorName(primarySupervisorId) }}</span>
                  </div>
                  <div class="review-item" *ngIf="additionalSupervisorIds.length > 0">
                    <span class="label">Additional:</span>
                    <span class="value">{{ getAdditionalSupervisorNames() }}</span>
                  </div>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button 
                    mat-raised-button 
                    color="primary" 
                    (click)="createProject()"
                    [disabled]="saving">
                    {{ saving ? 'Creating...' : 'Create Project' }}
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .step-content {
      padding: 24px 0;

      mat-card {
        max-width: 800px;
        margin: 0 auto;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .step-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .review-section {
      margin-bottom: 24px;

      h3 {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 16px;
        color: rgba(0, 0, 0, 0.87);
      }

      .review-item {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;

        .label {
          font-weight: 500;
          min-width: 120px;
          color: rgba(0, 0, 0, 0.6);
        }

        .value {
          color: rgba(0, 0, 0, 0.87);
        }
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          padding: 4px 0;
        }
      }

      .no-data {
        color: rgba(0, 0, 0, 0.4);
        font-style: italic;
      }
    }
  `]
})
export class ProjectCreateComponent implements OnInit {
  project: Partial<Project> = {
    title: '',
    description: '',
    githubUrl: '',
    minStudents: 2,
    maxStudents: 4
  };

  schoolYears: SchoolYear[] = [];
  supervisors: User[] = [];
  selectedStudents: StudentProfile[] = [];
  primarySupervisorId = '';
  additionalSupervisorIds: string[] = [];
  saving = false;

  constructor(
    private projectService: ProjectService,
    private schoolYearService: SchoolYearService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.schoolYearService.getSchoolYears().subscribe(years => {
      this.schoolYears = years;
      
      // Select active year by default
      const activeYear = years.find(y => y.isActive);
      if (activeYear) {
        this.project.schoolYearId = activeYear.id;
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
    return this.additionalSupervisorIds
      .map(id => this.getSupervisorName(id))
      .join(', ');
  }

  createProject(): void {
    this.saving = true;

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
