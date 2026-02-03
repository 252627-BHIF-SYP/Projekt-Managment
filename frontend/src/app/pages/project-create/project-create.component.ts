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

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Logo URL</mat-label>
                  <input matInput [(ngModel)]="project.logoUrl" type="url">
                  <mat-icon matPrefix>image</mat-icon>
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

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Status</mat-label>
                  <mat-select [(ngModel)]="project.status" required>
                    <mat-option *ngFor="let s of projectStatuses" [value]="s">{{ s }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Technologies (comma or semicolon separated)</mat-label>
                  <input matInput [(ngModel)]="technologiesText" placeholder="Angular; Spring Boot; PostgreSQL">
                  <mat-icon matPrefix>sell</mat-icon>
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

        <!-- Step 2: Select Students (Optional) -->
        <mat-step>
          <ng-template matStepLabel>Select Students (Optional)</ng-template>
          <div class="step-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Select Students for the Project</mat-card-title>
                <mat-card-subtitle>You can add students later if you prefer</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <app-student-picker
                  [schoolYearId]="project.schoolYearId"
                  [maxStudents]="project.maxStudents"
                  [showStatus]="false"
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
                <div class="supervisor-section">
                  <h3>Primary Supervisor <span class="required">*</span></h3>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Select Primary Supervisor</mat-label>
                    <mat-select [(ngModel)]="primarySupervisorId" required>
                      <mat-option *ngFor="let supervisor of supervisors" [value]="supervisor.id">
                        {{ supervisor.firstName }} {{ supervisor.lastName }} ({{ supervisor.email }})
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="additional-supervisors-section">
                  <div class="section-header">
                    <h3>Additional Supervisors (Optional)</h3>
                    <button mat-button color="primary" type="button" (click)="addAdditionalSupervisor()">
                      <mat-icon>add</mat-icon>
                      Add Supervisor
                    </button>
                  </div>

                  <div *ngIf="additionalSupervisors.length > 0" class="supervisors-list">
                    <div *ngFor="let supervisor of additionalSupervisors; let i = index" class="supervisor-item">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Select Supervisor</mat-label>
                        <mat-select [(ngModel)]="additionalSupervisors[i]" (ngModelChange)="onAdditionalSupervisorChange()">
                          <mat-option *ngFor="let sup of supervisors" [value]="sup.id">
                            {{ getSupervisorName(sup.id) }}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                      <button mat-icon-button type="button" (click)="removeAdditionalSupervisor(i)" color="warn">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                  <p *ngIf="additionalSupervisors.length === 0" class="info-text">No additional supervisors added yet</p>
                </div>

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
                  <div class="review-item" *ngIf="additionalSupervisors.length > 0">
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

    .supervisor-section {
      margin-bottom: 32px;

      h3 {
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 500;
      }

      .required {
        color: #f44336;
      }
    }

    .additional-supervisors-section {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }

        button {
          padding: 4px 8px;
          font-size: 13px;
        }
      }

      .supervisors-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 12px;

        .supervisor-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;

          mat-form-field {
            flex: 1;
          }

          button {
            margin-top: 8px;
          }
        }
      }

      .info-text {
        color: rgba(0, 0, 0, 0.4);
        font-style: italic;
        margin: 12px 0;
      }
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
    maxStudents: 4,
    status: ProjectStatus.DRAFT
  };

  schoolYears: SchoolYear[] = [];
  supervisors: User[] = [];
  selectedStudents: StudentProfile[] = [];
  primarySupervisorId = '';
  additionalSupervisors: string[] = [];
  saving = false;
  ProjectStatus = ProjectStatus;
  projectStatuses = Object.values(ProjectStatus);
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
