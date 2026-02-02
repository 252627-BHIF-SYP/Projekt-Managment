import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChangeRequest } from '../../../core/models';

@Component({
  selector: 'app-change-request-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './change-request-list.component.html',
  styleUrl: './change-request-list.component.scss'
})
export class ChangeRequestListComponent {
  @Input() changeRequests: ChangeRequest[] = [];
  @Input() showActions = false;

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      TEAM_CHANGE: 'people',
      SCOPE_CHANGE: 'description',
      SCHEDULE_CHANGE: 'calendar_today',
      OTHER: 'edit'
    };
    return iconMap[type] || 'edit';
  }

  getTypeLabel(type: string): string {
    const labelMap: { [key: string]: string } = {
      TEAM_CHANGE: 'Team Change',
      SCOPE_CHANGE: 'Scope Change',
      SCHEDULE_CHANGE: 'Schedule Change',
      OTHER: 'Other'
    };
    return labelMap[type] || type;
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled'
    };
    return labelMap[status] || status;
  }
}
