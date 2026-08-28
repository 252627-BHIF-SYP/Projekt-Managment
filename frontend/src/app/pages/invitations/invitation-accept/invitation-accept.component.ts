import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { InvitationService } from '../../../services/invitation.service';
import { Invitation } from '../../../core/models/invitation.model';

@Component({
  selector: 'app-invitation-accept',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './invitation-accept.component.html',
  styleUrls: ['./invitation-accept.component.css']
})
export class InvitationAcceptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invitationService = inject(InvitationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly invitation = signal<Invitation | null>(null);
  readonly loading = signal<boolean>(true);
  readonly accepting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  token = '';

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.paramMap.get('token');
    if (!tokenParam) {
      this.error.set('Ungültiger oder fehlender Einladungs-Token.');
      this.loading.set(false);
      return;
    }

    this.token = tokenParam;
    this.invitationService.validateToken(this.token).subscribe({
      next: (inv) => {
        this.invitation.set(inv);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Diese Einladung ist ungültig, abgelaufen oder wurde widerrufen.');
        this.loading.set(false);
      }
    });
  }

  acceptAndProceed(): void {
    const inv = this.invitation();
    if (!inv) return;

    this.accepting.set(true);
    this.invitationService.acceptInvitation(this.token).subscribe({
      next: (updatedInv) => {
        this.accepting.set(false);
        this.snackBar.open('✓ Einladung erfolgreich angenommen!', 'Super', { duration: 3000 });

        if (inv.targetRole === 'ExternalJuror' && inv.competitionId) {
          sessionStorage.setItem('external_juror_email', inv.email);
          sessionStorage.setItem('external_juror_name', inv.recipientName);
          this.router.navigate(['/jury/evaluate', inv.competitionId]);
        } else if (inv.targetRole === 'ExternalTeacher') {
          // Store token in session storage for external portal
          sessionStorage.setItem('external_invitation_token', this.token);
          sessionStorage.setItem('external_teacher_name', inv.recipientName);
          sessionStorage.setItem('external_school_name', inv.schoolName || '');
          if (inv.competitionId) {
            sessionStorage.setItem('external_competition_id', String(inv.competitionId));
          }
          this.router.navigate(['/external-portal']);
        } else {
          this.router.navigate(['/projects']);
        }
      },
      error: (err) => {
        this.accepting.set(false);
        this.snackBar.open('Fehler beim Annehmen der Einladung.', 'OK', { duration: 3000 });
      }
    });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ExternalTeacher': return 'Externe betreuende Lehrkraft';
      case 'ExternalJuror': return 'Gastjuror / Externe Jury';
      case 'ExternalStudent': return 'Externe/r Schüler/in';
      default: return role;
    }
  }
}
