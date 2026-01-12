import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeRequestListComponent } from '../../shared/components/change-request-list/change-request-list.component';
import { ProjectService } from '../../services/project.service';
import { ChangeRequestService } from '../../services/change-request.service';
import { Project, ChangeRequest } from '../../core/models';

/**
 * Project detail page
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    ChangeRequestListComponent
  ],
  template: `
    <div class="page-container" *ngIf="project">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ project.title }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Overview Tab -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Project Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Status:</span>
                    <span class="value">
                      <mat-chip [class]="'status-' + project.status.toLowerCase()">
                        {{ project.status }}
                      </mat-chip>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">School Year:</span>
                    <span class="value">{{ project.schoolYear }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Class:</span>
                    <span class="value">{{ project.className }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Created By:</span>
                    <span class="value">{{ project.createdByName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Team Size:</span>
                    <span class="value">{{ project.minStudents }}-{{ project.maxStudents }} students</span>
                  </div>
                  <div class="info-item" *ngIf="project.githubUrl">
                    <span class="label">GitHub:</span>
                    <span class="value">
                      <a [href]="project.githubUrl" target="_blank">{{ project.githubUrl }}</a>
                    </span>
                  </div>
                </div>

                <div class="description-section">
                  <h3>Description</h3>
                  <p>{{ project.description }}</p>
                </div>

                <div class="technologies-section" *ngIf="project.technologies && project.technologies.length > 0">
                  <h3>Technologies</h3>
                  <mat-chip-set>
                    <mat-chip *ngFor="let tech of project.technologies">{{ tech }}</mat-chip>
                  </mat-chip-set>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Students Tab -->
        <mat-tab label="Students ({{ project.students?.length || 0 }})">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Team Members</mat-card-title>
                <button mat-icon-button color="primary">
                  <mat-icon>person_add</mat-icon>
                </button>
              </mat-card-header>
              <mat-card-content>
                <mat-list *ngIf="project.students && project.students.length > 0">
                  <mat-list-item *ngFor="let student of project.students">
                    <mat-icon matListItemIcon>person</mat-icon>
                    <div matListItemTitle>{{ student.studentName }}</div>
                    <div matListItemLine>{{ student.studentEmail }}{{ student.role ? ' • ' + student.role : '' }}</div>
                    <button mat-icon-button matListItemMeta>
                      <mat-icon>more_vert</mat-icon>
                    </button>
                  </mat-list-item>
                </mat-list>

                <div class="no-data" *ngIf="!project.students || project.students.length === 0">
                  <mat-icon>people_outline</mat-icon>
                  <p>No students assigned yet</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Supervisors Tab -->
        <mat-tab label="Supervisors ({{ project.supervisors?.length || 0 }})">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Project Supervisors</mat-card-title>
                <button mat-icon-button color="primary">
                  <mat-icon>person_add</mat-icon>
                </button>
              </mat-card-header>
              <mat-card-content>
                <mat-list *ngIf="project.supervisors && project.supervisors.length > 0">
                  <mat-list-item *ngFor="let supervisor of project.supervisors">
                    <mat-icon matListItemIcon>school</mat-icon>
                    <div matListItemTitle>
                      {{ supervisor.supervisorName }}
                      <mat-chip *ngIf="supervisor.isPrimary" class="primary-badge">Primary</mat-chip>
                    </div>
                    <div matListItemLine>{{ supervisor.supervisorEmail }}</div>
                    <button mat-icon-button matListItemMeta>
                      <mat-icon>more_vert</mat-icon>
                    </button>
                  </mat-list-item>
                </mat-list>

                <div class="no-data" *ngIf="!project.supervisors || project.supervisors.length === 0">
                  <mat-icon>supervisor_account</mat-icon>
                  <p>No supervisors assigned yet</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Change Requests Tab -->
        <mat-tab label="Change Requests ({{ changeRequests.length }})">
          <div class="tab-content">
            <app-change-request-list [changeRequests]="changeRequests" [showActions]="true">
            </app-change-request-list>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner></mat-spinner>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;

      h1 {
        flex: 1;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .info-item {
        display: flex;
        gap: 8px;

        .label {
          font-weight: 500;
          color: rgba(0, 0, 0, 0.6);
        }

        .value {
          color: rgba(0, 0, 0, 0.87);

          a {
            color: #3f51b5;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    .description-section,
    .technologies-section {
      margin-top: 24px;

      h3 {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
      }

      p {
        color: rgba(0, 0, 0, 0.8);
        line-height: 1.6;
      }
    }

    .primary-badge {
      margin-left: 8px;
      background: #3f51b5 !important;
      color: white !important;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.4);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project?: Project;
  changeRequests: ChangeRequest[] = [];
  loading = true;
  projectId?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private changeRequestService: ChangeRequestService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject(this.projectId);
      }
    });
  }

  loadProject(id: string): void {
    this.loading = true;

    Promise.all([
      this.projectService.getProjectById(id).toPromise(),
      this.changeRequestService.getChangeRequestsByProject(id).toPromise()
    ]).then(([project, changeRequests]) => {
      this.project = project;
      this.changeRequests = changeRequests || [];
      this.loading = false;
    }).catch(error => {
      console.error('Error loading project:', error);
      this.loading = false;
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
