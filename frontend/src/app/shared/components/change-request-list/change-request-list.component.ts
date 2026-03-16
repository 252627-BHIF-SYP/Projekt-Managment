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
  templateUrl: './change-request-list.component.html',
  styleUrl: './change-request-list.component.scss'
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

