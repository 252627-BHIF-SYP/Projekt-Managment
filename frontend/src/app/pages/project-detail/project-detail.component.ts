import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../services/project.service';
import { InvitationService } from '../../services/invitation.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectPermission, ProjectStatus, ProjectSupervisor, Role } from '../../core/models';

/**
 * Project detail page with approval and publishing workflow
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly invitationService = inject(InvitationService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly ProjectStatus = ProjectStatus;

  project = signal<Project | undefined>(undefined);
  permissions = signal<ProjectPermission>({ canEdit: false, canDelete: false });
  loading = signal(true);
  actionLoading = signal(false);
  projectId?: string;

  // Workflow Dialog State
  showActionModal = signal(false);
  currentAction = signal<'approve' | 'reject' | 'publish'>('approve');
  actionNote = signal('');

  readonly currentUser = this.authService.currentUser;

  readonly isSupervisorOrAdmin = computed(() => {
    const user = this.currentUser();
    if (!user) return true; // fallback for non-auth dev mode
    const hasRole = user.roles?.some(r => r === Role.PROFESSOR || r === Role.AV || r === Role.SYS_ADMIN);
    const p = this.project();
    const isAssigned = p?.supervisors?.some(s => s.supervisorId?.toLowerCase() === user.username?.toLowerCase() || s.supervisorId === user.id);
    return hasRole || isAssigned || false;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject(this.projectId);
      }
    });
  }

  loadProject(id: string): void {
    this.loading.set(true);

    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
        this.loadPermissions(id);
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.snackBar.open('Fehler beim Laden des Projekts', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  editProject(): void {
    if (this.projectId) {
      this.router.navigate(['/projects', this.projectId, 'edit']);
    }
  }

  deleteProject(): void {
    if (!this.projectId || !confirm('Projekt wirklich löschen?')) {
      return;
    }

    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.snackBar.open('Projekt gelöscht.', 'Schließen', { duration: 3000 });
        this.router.navigate(['/projects']);
      },
      error: error => {
        console.error('Error deleting project:', error);
        this.snackBar.open('Projekt konnte nicht gelöscht werden.', 'Schließen', { duration: 5000 });
      }
    });
  }

  // --- Workflow Actions ---
  submitForApproval(): void {
    if (!this.projectId) return;

    this.actionLoading.set(true);
    this.projectService.submitForApproval(this.projectId).subscribe({
      next: (updated) => {
        this.project.set(updated);
        this.actionLoading.set(false);
        this.snackBar.open('Projekt erfolgreich zur Genehmigung eingereicht!', 'OK', { duration: 3500 });
      },
      error: (err) => {
        console.error(err);
        this.actionLoading.set(false);
        this.snackBar.open('Einreichung fehlgeschlagen.', 'OK', { duration: 3500 });
      }
    });
  }

  openActionModal(action: 'approve' | 'reject' | 'publish'): void {
    this.currentAction.set(action);
    this.actionNote.set('');
    this.showActionModal.set(true);
  }

  closeActionModal(): void {
    this.showActionModal.set(false);
    this.actionNote.set('');
  }

  confirmModalAction(): void {
    if (!this.projectId) return;

    const action = this.currentAction();
    const note = this.actionNote().trim();

    this.actionLoading.set(true);

    if (action === 'approve') {
      this.projectService.approveProject(this.projectId, note).subscribe({
        next: (updated) => {
          this.project.set(updated);
          this.actionLoading.set(false);
          this.closeActionModal();
          this.snackBar.open('Projekt wurde genehmigt! Status ist nun "In Durchführung".', 'OK', { duration: 3500 });
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.snackBar.open('Genehmigung fehlgeschlagen.', 'OK', { duration: 3500 });
        }
      });
    } else if (action === 'reject') {
      if (!note) {
        this.snackBar.open('Bitte gib eine Begründung bzw. Feedback für die Schüler an.', 'OK', { duration: 3500 });
        this.actionLoading.set(false);
        return;
      }
      this.projectService.rejectProject(this.projectId, note).subscribe({
        next: (updated) => {
          this.project.set(updated);
          this.actionLoading.set(false);
          this.closeActionModal();
          this.snackBar.open('Projekt abgelehnt. Die Schüler wurden informiert.', 'OK', { duration: 3500 });
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.snackBar.open('Ablehnung fehlgeschlagen.', 'OK', { duration: 3500 });
        }
      });
    } else if (action === 'publish') {
      this.projectService.publishProject(this.projectId, note).subscribe({
        next: (updated) => {
          this.project.set(updated);
          this.actionLoading.set(false);
          this.closeActionModal();
          this.snackBar.open('Projekt veröffentlicht! Es ist nun für Wettbewerbe freigegeben.', 'OK', { duration: 3500 });
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.snackBar.open('Veröffentlichung fehlgeschlagen.', 'OK', { duration: 3500 });
        }
      });
    }
  }

  getStudentRoleLabel(role?: string): string {
    if (!role || role.toLowerCase() === 'member') {
      return 'Schüler/in';
    }
    return role;
  }

  getSupervisorRoleLabel(supervisor: ProjectSupervisor): string {
    return 'Betreuungslehrkraft';
  }

  toggleConsent(hasConsent: boolean): void {
    const proj = this.project();
    if (!proj || !this.projectId) return;

    const user = this.authService.currentUserValue;
    const confirmedBy = user ? `${user.firstName} ${user.lastName}` : 'Benutzer';

    this.actionLoading.set(true);
    this.invitationService.confirmConsent(Number(this.projectId), { confirmedBy, hasConsent }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.project.set({
          ...proj,
          hasConsent,
          consentConfirmedAtUtc: hasConsent ? new Date() : undefined,
          consentConfirmedBy: hasConsent ? confirmedBy : undefined
        });
        const msg = hasConsent
          ? '✓ Einverständniserklärung zur Veröffentlichung erteilt!'
          : 'Einverständniserklärung zurückgezogen.';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      },
      error: () => {
        this.actionLoading.set(false);
        this.snackBar.open('Fehler beim Aktualisieren der Einverständniserklärung.', 'OK', { duration: 3000 });
      }
    });
  }

  private loadPermissions(id: string): void {
    this.projectService.getProjectPermissions(id).subscribe({
      next: permissions => this.permissions.set(permissions),
      error: error => {
        console.error('Error loading project permissions:', error);
        this.permissions.set({ canEdit: false, canDelete: false });
      }
    });
  }
}
