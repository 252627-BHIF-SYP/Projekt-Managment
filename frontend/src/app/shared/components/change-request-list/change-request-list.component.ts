import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChangeRequest, ChangeRequestStatus } from '../../../core/models';

/**
 * Component for displaying change requests
 */
@Component({
  selector: 'app-change-request-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="change-request-list">
      <mat-card *ngFor="let request of changeRequests" class="request-card">
        <mat-card-header>
          <mat-card-title>{{ request.title }}</mat-card-title>
          <mat-card-subtitle>
            Requested by {{ request.requestedByName }} • {{ request.createdAt | date:'short' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="request-type">
            <mat-icon>{{ getTypeIcon(request.type) }}</mat-icon>
            <span>{{ getTypeLabel(request.type) }}</span>
          </div>

          <p class="description">{{ request.description }}</p>

          <div class="status-chip" [class]="'status-' + request.status.toLowerCase()">
            {{ getStatusLabel(request.status) }}
          </div>

          <div class="review-info" *ngIf="request.reviewedById">
            <mat-icon>{{ request.status === 'APPROVED' ? 'check_circle' : 'cancel' }}</mat-icon>
            <span>
              {{ request.status === 'APPROVED' ? 'Approved' : 'Rejected' }} by {{ request.reviewedByName }}
              on {{ request.reviewedAt | date:'short' }}
            </span>
            <p *ngIf="request.reviewComment" class="review-comment">
              "{{ request.reviewComment }}"
            </p>
          </div>
        </mat-card-content>

        <mat-card-actions *ngIf="request.status === 'PENDING' && showActions">
          <button mat-raised-button color="primary">
            Approve
          </button>
          <button mat-raised-button color="warn">
            Reject
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="no-requests" *ngIf="!changeRequests || changeRequests.length === 0">
        <mat-icon>inbox</mat-icon>
        <p>No change requests</p>
      </div>
    </div>
  `,
  styles: [`
    .change-request-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .request-card {
      position: relative;
    }

    .request-type {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.6);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .description {
      margin: 12px 0;
      color: rgba(0, 0, 0, 0.8);
    }

    .status-chip {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;

      &.status-pending {
        background: #fff3e0;
        color: #f57c00;
      }

      &.status-approved {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.status-rejected {
        background: #ffebee;
        color: #d32f2f;
      }

      &.status-cancelled {
        background: #f5f5f5;
        color: #9e9e9e;
      }
    }

    .review-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;

      mat-icon {
        vertical-align: middle;
        margin-right: 8px;
      }

      .review-comment {
        margin: 8px 0 0 0;
        font-style: italic;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .no-requests {
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
  `]
})
export class ChangeRequestListComponent {
  @Input() changeRequests?: ChangeRequest[];
  @Input() showActions = false;

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'ADD_STUDENT': 'person_add',
      'REMOVE_STUDENT': 'person_remove',
      'CHANGE_SUPERVISOR': 'swap_horiz',
      'MODIFY_PROJECT': 'edit',
      'CHANGE_DEADLINE': 'schedule',
      'OTHER': 'help'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ADD_STUDENT': 'Add Student',
      'REMOVE_STUDENT': 'Remove Student',
      'CHANGE_SUPERVISOR': 'Change Supervisor',
      'MODIFY_PROJECT': 'Modify Project',
      'CHANGE_DEADLINE': 'Change Deadline',
      'OTHER': 'Other'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: ChangeRequestStatus): string {
    const labels: Record<ChangeRequestStatus, string> = {
      [ChangeRequestStatus.PENDING]: 'Pending',
      [ChangeRequestStatus.APPROVED]: 'Approved',
      [ChangeRequestStatus.REJECTED]: 'Rejected',
      [ChangeRequestStatus.CANCELLED]: 'Cancelled'
    };
    return labels[status] || status;
  }
}
