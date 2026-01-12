import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Project, ProjectStatus } from '../../../core/models';

/**
 * Project card component for displaying project summary
 */
@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-card class="project-card" [class.clickable]="clickable" (click)="onCardClick()">
      <mat-card-header>
        <div mat-card-avatar class="project-avatar">
          <img *ngIf="project.logoUrl" [src]="project.logoUrl" alt="Project logo">
          <mat-icon *ngIf="!project.logoUrl">folder</mat-icon>
        </div>
        <mat-card-title>{{ project.title }}</mat-card-title>
        <mat-card-subtitle>{{ project.className }} • {{ project.schoolYear }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p class="description">{{ project.description | slice:0:120 }}{{ project.description.length > 120 ? '...' : '' }}</p>
        
        <div class="project-meta">
          <div class="meta-item">
            <mat-icon>person</mat-icon>
            <span>{{ project.createdByName }}</span>
          </div>
          <div class="meta-item">
            <mat-icon>group</mat-icon>
            <span>{{ project.students?.length || 0 }}/{{ project.maxStudents }} students</span>
          </div>
        </div>

        <div class="tags" *ngIf="project.tags && project.tags.length > 0">
          <mat-chip *ngFor="let tag of project.tags?.slice(0, 3)">{{ tag }}</mat-chip>
        </div>

        <div class="status-badge" [class]="'status-' + project.status.toLowerCase()">
          {{ getStatusLabel(project.status) }}
        </div>
      </mat-card-content>

      <mat-card-actions *ngIf="showActions">
        <button mat-button color="primary" [routerLink]="['/projects', project.id]">
          VIEW DETAILS
        </button>
        <a mat-button *ngIf="project.githubUrl" [href]="project.githubUrl" target="_blank">
          <mat-icon>code</mat-icon>
          GITHUB
        </a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .project-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }

      &.clickable {
        cursor: pointer;
      }
    }

    .project-avatar {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }

      mat-icon {
        color: #666;
      }
    }

    mat-card-content {
      flex: 1;
    }

    .description {
      color: rgba(0, 0, 0, 0.6);
      margin: 16px 0;
      line-height: 1.5;
    }

    .project-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;

      mat-chip {
        font-size: 12px;
        height: 24px;
      }
    }

    .status-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;

      &.status-draft {
        background: #e0e0e0;
        color: #616161;
      }

      &.status-open {
        background: #e3f2fd;
        color: #1976d2;
      }

      &.status-in_progress {
        background: #fff3e0;
        color: #f57c00;
      }

      &.status-completed {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.status-archived {
        background: #f5f5f5;
        color: #9e9e9e;
      }
    }
  `]
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() clickable = true;
  @Input() showActions = true;
  @Output() cardClick = new EventEmitter<Project>();

  onCardClick(): void {
    if (this.clickable) {
      this.cardClick.emit(this.project);
    }
  }

  getStatusLabel(status: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      [ProjectStatus.DRAFT]: 'Draft',
      [ProjectStatus.OPEN]: 'Open',
      [ProjectStatus.IN_PROGRESS]: 'In Progress',
      [ProjectStatus.COMPLETED]: 'Completed',
      [ProjectStatus.ARCHIVED]: 'Archived'
    };
    return labels[status] || status;
  }
}
