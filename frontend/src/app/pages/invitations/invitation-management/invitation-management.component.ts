import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ClipboardModule, Clipboard } from '@angular/cdk/clipboard';

import { InvitationService } from '../../../services/invitation.service';
import { Invitation, InvitationRole, InvitationStatus, CreateInvitationPayload } from '../../../core/models/invitation.model';

@Component({
  selector: 'app-invitation-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    ClipboardModule
  ],
  templateUrl: './invitation-management.component.html',
  styleUrls: ['./invitation-management.component.css']
})
export class InvitationManagementComponent implements OnInit {
  @Input() competitionId?: number;
  @Input() competitionName?: string;

  private readonly fb = inject(FormBuilder);
  private readonly invitationService = inject(InvitationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal<boolean>(false);
  readonly sending = signal<boolean>(false);
  readonly showCreateForm = signal<boolean>(false);

  inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    recipientName: ['', Validators.required],
    schoolName: [''],
    targetRole: ['ExternalTeacher', Validators.required]
  });

  displayedColumns: string[] = ['recipient', 'school', 'role', 'status', 'expires', 'actions'];

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations(): void {
    this.loading.set(true);
    this.invitationService.getInvitations(this.competitionId).subscribe({
      next: (list) => {
        this.invitations.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  sendInvitation(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const val = this.inviteForm.value;
    const payload: CreateInvitationPayload = {
      email: val.email,
      recipientName: val.recipientName,
      schoolName: val.schoolName || null,
      targetRole: val.targetRole as InvitationRole,
      competitionId: this.competitionId || null
    };

    this.sending.set(true);
    this.invitationService.createInvitation(payload).subscribe({
      next: (created) => {
        this.sending.set(false);
        this.snackBar.open('✓ Einladung erfolgreich erstellt & Token generiert!', 'OK', { duration: 3000 });
        this.inviteForm.reset({ targetRole: 'ExternalTeacher' });
        this.showCreateForm.set(false);
        this.loadInvitations();
      },
      error: () => {
        this.sending.set(false);
        this.snackBar.open('Fehler beim Erstellen der Einladung.', 'OK', { duration: 3000 });
      }
    });
  }

  copyLink(token: string): void {
    const link = this.invitationService.getInvitationLink(token);
    this.clipboard.copy(link);
    this.snackBar.open('✓ Einladungslink in die Zwischenablage kopiert!', 'Super', { duration: 2500 });
  }

  revoke(id: number): void {
    if (confirm('Möchtest du diese Einladung wirklich widerrufen?')) {
      this.invitationService.revokeInvitation(id).subscribe({
        next: () => {
          this.snackBar.open('Einladung wurde widerrufen.', 'OK', { duration: 2500 });
          this.loadInvitations();
        }
      });
    }
  }

  getRoleLabel(role: InvitationRole): string {
    switch (role) {
      case 'ExternalTeacher': return 'Externe Lehrkraft';
      case 'ExternalJuror': return 'Gastjuror';
      case 'ExternalStudent': return 'Externe/r Schüler/in';
      default: return role;
    }
  }

  getStatusClass(status: InvitationStatus): string {
    switch (status) {
      case 'Accepted': return 'status-accepted';
      case 'Pending': return 'status-pending';
      case 'Revoked': return 'status-revoked';
      case 'Expired': return 'status-expired';
      default: return '';
    }
  }

  getStatusLabel(status: InvitationStatus): string {
    switch (status) {
      case 'Accepted': return 'Angenommen';
      case 'Pending': return 'Ausstehend';
      case 'Revoked': return 'Widerrufen';
      case 'Expired': return 'Abgelaufen';
      default: return status;
    }
  }
}
