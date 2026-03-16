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
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss'
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
      [ProjectStatus.ARCHIVED]: 'Archived',
      [ProjectStatus.NEW]: 'New',
      [ProjectStatus.PENDING]: 'Pending',
      [ProjectStatus.ON_GOING]: 'On Going'
    };
    return labels[status] || status;
  }
}

