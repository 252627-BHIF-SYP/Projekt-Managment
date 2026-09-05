import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Competition,
  CompetitionProject,
  EvaluationCriterion,
  JuryMember,
  ProjectEvaluation,
  BatchSubmitEvaluationPayload
} from '../../../core/models/competition.model';
import { CompetitionService } from '../../../services/competition.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-jury-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './jury-evaluation.component.html',
  styleUrl: './jury-evaluation.component.scss'
})
export class JuryEvaluationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly competitionService = inject(CompetitionService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly authService = inject(AuthService);

  readonly competition = signal<Competition | null>(null);
  readonly criteria = signal<EvaluationCriterion[]>([]);
  readonly juryMembers = signal<JuryMember[]>([]);
  readonly activeJuror = signal<JuryMember | null>(null);
  readonly evaluations = signal<ProjectEvaluation[]>([]);
  readonly selectedProjectId = signal<number | null>(null);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);

  scoreForm: FormGroup = this.fb.group({
    note: ['']
  });

  readonly selectedProject = computed(() => {
    const pId = this.selectedProjectId();
    if (!pId) return null;
    return this.competition()?.projects.find(p => p.projectId === pId) || null;
  });

  readonly evaluatedProjectsCount = computed(() => {
    const juror = this.activeJuror();
    if (!juror) return 0;
    const jurorEvals = this.evaluations().filter(e => e.juryMemberId === juror.juryMemberId);
    const evaluatedIds = new Set(jurorEvals.map(e => e.projectId));
    return evaluatedIds.size;
  });

  readonly isCurrentProjectEvaluated = (projectId: number): boolean => {
    const juror = this.activeJuror();
    if (!juror) return false;
    return this.evaluations().some(e => e.juryMemberId === juror.juryMemberId && e.projectId === projectId);
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('competitionId');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        this.loadAllData(id);
      }
    }
  }

  loadAllData(competitionId: number): void {
    this.loading.set(true);

    this.competitionService.getCompetitionById(competitionId).subscribe({
      next: (comp) => {
        this.competition.set(comp);
        if (comp.projects.length > 0 && !this.selectedProjectId()) {
          this.selectedProjectId.set(comp.projects[0].projectId);
        }

        // Load Criteria, Jury & Evaluations
        this.evaluationService.getCriteria(competitionId).subscribe({
          next: (critList) => {
            this.criteria.set(critList);
            this.initScoreForm(critList);

            this.evaluationService.getJuryMembers(competitionId).subscribe({
              next: (jurors) => {
                this.juryMembers.set(jurors);

                // Auto-detect matching juror (check Keycloak user, sessionStorage external juror, or fallback)
                const currentUser = this.authService.currentUser();
                const storedJurorEmail = sessionStorage.getItem('external_juror_email');
                const storedJurorName = sessionStorage.getItem('external_juror_name');

                let matched = jurors.find(j =>
                  (storedJurorEmail && j.externalEmail?.toLowerCase() === storedJurorEmail.toLowerCase()) ||
                  (storedJurorName && j.externalName?.toLowerCase() === storedJurorName.toLowerCase()) ||
                  (currentUser?.username && j.professorId?.toLowerCase() === currentUser.username.toLowerCase()) ||
                  (currentUser?.email && j.externalEmail?.toLowerCase() === currentUser.email.toLowerCase())
                );
                if (!matched && jurors.length > 0) {
                  matched = jurors[0];
                }
                this.activeJuror.set(matched || null);

                // Load existing evaluations
                this.loadEvaluations(competitionId);
                this.loading.set(false);
              }
            });
          }
        });
      },
      error: () => {
        this.snackBar.open('Fehler beim Laden des Wettbewerbs', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadEvaluations(competitionId: number): void {
    this.evaluationService.getEvaluations(competitionId).subscribe({
      next: (evals) => {
        this.evaluations.set(evals);
        this.populateCurrentProjectScores();
      }
    });
  }

  initScoreForm(critList: EvaluationCriterion[]): void {
    const group: Record<string, any> = {
      note: ['']
    };
    critList.forEach(c => {
      group['crit_' + c.criterionId] = [Math.round((c.minScore + c.maxScore) / 2)];
    });
    this.scoreForm = this.fb.group(group);
  }

  selectProject(projectId: number): void {
    this.selectedProjectId.set(projectId);
    this.populateCurrentProjectScores();
  }

  populateCurrentProjectScores(): void {
    const juror = this.activeJuror();
    const projId = this.selectedProjectId();
    if (!juror || !projId) return;

    const existingEvals = this.evaluations().filter(e =>
      e.juryMemberId === juror.juryMemberId && e.projectId === projId
    );

    if (existingEvals.length > 0) {
      const patchObj: Record<string, any> = {
        note: existingEvals[0].note || ''
      };
      existingEvals.forEach(e => {
        patchObj['crit_' + e.criterionId] = e.score;
      });
      this.scoreForm.patchValue(patchObj);
    } else {
      // Default to midpoint
      const patchObj: Record<string, any> = { note: '' };
      this.criteria().forEach(c => {
        patchObj['crit_' + c.criterionId] = Math.round((c.minScore + c.maxScore) / 2);
      });
      this.scoreForm.patchValue(patchObj);
    }
  }

  calculateCurrentTotalScore(): number {
    let total = 0;
    this.criteria().forEach(c => {
      const val = this.scoreForm.get('crit_' + c.criterionId)?.value ?? 0;
      total += val * c.weight;
    });
    return Math.round(total * 10) / 10;
  }

  calculateMaxTotalScore(): number {
    let total = 0;
    this.criteria().forEach(c => {
      total += c.maxScore * c.weight;
    });
    return Math.round(total * 10) / 10;
  }

  saveEvaluation(advanceToNext = false): void {
    const comp = this.competition();
    const juror = this.activeJuror();
    const projId = this.selectedProjectId();

    if (!comp || !juror || !projId) {
      this.snackBar.open('Bitte Projekt und Juror auswählen', 'OK', { duration: 3000 });
      return;
    }

    const scores = this.criteria().map(c => ({
      criterionId: c.criterionId,
      score: this.scoreForm.get('crit_' + c.criterionId)?.value ?? 0
    }));

    const payload: BatchSubmitEvaluationPayload = {
      projectId: projId,
      juryMemberId: juror.juryMemberId,
      scores,
      note: this.scoreForm.get('note')?.value || null
    };

    this.saving.set(true);
    this.evaluationService.batchSubmitEvaluations(comp.competitionId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('✓ Bewertung erfolgreich gespeichert!', 'OK', { duration: 2500 });
        this.loadEvaluations(comp.competitionId);

        if (advanceToNext) {
          this.goToNextProject();
        }
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Fehler beim Speichern der Bewertung', 'OK', { duration: 3000 });
      }
    });
  }

  goToNextProject(): void {
    const comp = this.competition();
    if (!comp) return;
    const currentIndex = comp.projects.findIndex(p => p.projectId === this.selectedProjectId());
    if (currentIndex >= 0 && currentIndex < comp.projects.length - 1) {
      this.selectProject(comp.projects[currentIndex + 1].projectId);
    } else {
      this.snackBar.open('Alle Projekte wurden durchlaufen!', 'Super', { duration: 3000 });
    }
  }

  goBackToPortal(): void {
    this.router.navigate(['/jury']);
  }
}
