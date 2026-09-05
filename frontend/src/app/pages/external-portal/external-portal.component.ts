import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InvitationService } from '../../services/invitation.service';
import { CompetitionService } from '../../services/competition.service';
import { ProjectService } from '../../services/project.service';
import { CompetitionSummary } from '../../core/models/competition.model';
import { Project, ProjectStatus } from '../../core/models/project.model';
import { CreateExternalProjectPayload } from '../../core/models/invitation.model';

@Component({
  selector: 'app-external-portal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './external-portal.component.html',
  styleUrl: './external-portal.component.scss'
})
export class ExternalPortalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly invitationService = inject(InvitationService);
  private readonly competitionService = inject(CompetitionService);
  private readonly projectService = inject(ProjectService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  token = '';
  teacherName = '';
  schoolName = '';
  targetCompetitionId: number | null = null;

  readonly competitions = signal<CompetitionSummary[]>([]);
  readonly submittedProjects = signal<Project[]>([]);
  readonly submitting = signal<boolean>(false);
  readonly showSubmissionForm = signal<boolean>(true);

  projectForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required]],
    technology: [''],
    githubUrl: [''],
    logoUrl: [''],
    schoolName: ['', Validators.required],
    competitionId: [null],
    consent: [true, Validators.requiredTrue],
    students: this.fb.array([])
  });

  get studentsArray(): FormArray {
    return this.projectForm.get('students') as FormArray;
  }

  ngOnInit(): void {
    this.token = sessionStorage.getItem('external_invitation_token') || '';
    this.teacherName = sessionStorage.getItem('external_teacher_name') || 'Externe Lehrkraft';
    this.schoolName = sessionStorage.getItem('external_school_name') || 'Partnerschule';
    const compIdStr = sessionStorage.getItem('external_competition_id');
    if (compIdStr) {
      this.targetCompetitionId = parseInt(compIdStr, 10);
    }

    this.projectForm.patchValue({
      schoolName: this.schoolName,
      competitionId: this.targetCompetitionId
    });

    // Add 2 initial student rows
    this.addStudentRow();
    this.addStudentRow();

    this.loadCompetitions();
    this.loadExternalProjects();
  }

  loadCompetitions(): void {
    this.competitionService.getCompetitions().subscribe({
      next: (list) => {
        this.competitions.set(list);
      }
    });
  }

  loadExternalProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (list) => {
        const external = list.filter(p => p.isExternal || (p.externalSchoolName && p.externalSchoolName.length > 0));
        this.submittedProjects.set(external);
      }
    });
  }

  addStudentRow(): void {
    const studentGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [''],
      classGrade: ['']
    });
    this.studentsArray.push(studentGroup);
  }

  removeStudentRow(index: number): void {
    if (this.studentsArray.length > 1) {
      this.studentsArray.removeAt(index);
    }
  }

  submitProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.snackBar.open('Bitte fülle alle Pflichtfelder aus.', 'OK', { duration: 3000 });
      return;
    }

    const formVal = this.projectForm.value;
    const payload: CreateExternalProjectPayload = {
      token: this.token || 'external_demo',
      title: formVal.title,
      description: formVal.description,
      technology: formVal.technology || null,
      githubUrl: formVal.githubUrl || null,
      logoUrl: formVal.logoUrl || null,
      schoolName: formVal.schoolName,
      competitionId: formVal.competitionId ? Number(formVal.competitionId) : this.targetCompetitionId,
      students: formVal.students
    };

    this.submitting.set(true);
    this.invitationService.submitExternalProject(payload).subscribe({
      next: (newProject) => {
        this.submitting.set(false);
        this.snackBar.open('✓ Externes Projekt erfolgreich eingereicht!', 'Super', { duration: 3000 });
        this.loadExternalProjects();
        this.projectForm.reset({
          schoolName: this.schoolName,
          competitionId: this.targetCompetitionId,
          consent: true
        });
        this.studentsArray.clear();
        this.addStudentRow();
        this.addStudentRow();
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open('Fehler beim Einreichen des Projekts.', 'OK', { duration: 3000 });
      }
    });
  }

  getStatusClass(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.PUBLISHED: return 'status-published';
      case ProjectStatus.ON_GOING: return 'status-approved';
      case ProjectStatus.REJECTED: return 'status-rejected';
      case ProjectStatus.PENDING: return 'status-pending';
      default: return 'status-new';
    }
  }

  getStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.PUBLISHED: return 'Veröffentlicht';
      case ProjectStatus.ON_GOING: return 'Genehmigt / In Durchführung';
      case ProjectStatus.REJECTED: return 'Überarbeitung nötig';
      case ProjectStatus.PENDING: return 'Eingereicht / In Prüfung';
      default: return 'Neu';
    }
  }
}
