import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  Competition,
  ScheduleSlot,
  ScheduleSlotType,
  CompetitionType,
  CompetitionStatus,
  EvaluationCriterion,
  CreateEvaluationCriterionPayload,
  JuryMember,
  AddJuryMemberPayload,
  ProjectEvaluation,
  Leaderboard,
  CompetitionAward,
  CreateAwardPayload,
  User,
  Project
} from '../../../core/models';
import { CompetitionService } from '../../../services/competition.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { ProjectService } from '../../../services/project.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../core/services/auth.service';

import { InvitationManagementComponent } from '../../invitations/invitation-management/invitation-management.component';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSliderModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    InvitationManagementComponent
  ],
  templateUrl: './competition-detail.component.html',
  styleUrls: ['./competition-detail.component.css']
})
export class CompetitionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly competitionService = inject(CompetitionService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly projectService = inject(ProjectService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  // Signals
  readonly competition = signal<Competition | null>(null);
  readonly allSchoolProjects = signal<Project[]>([]);
  readonly allProfessors = signal<User[]>([]);
  readonly selectedProjectIds = signal<Set<number>>(new Set());
  readonly projectSearchTerm = signal<string>('');

  // Evaluation Signals
  readonly criteria = signal<EvaluationCriterion[]>([]);
  readonly juryMembers = signal<JuryMember[]>([]);
  readonly leaderboard = signal<Leaderboard | null>(null);
  readonly awards = signal<CompetitionAward[]>([]);
  readonly evaluations = signal<ProjectEvaluation[]>([]);

  // UI state signals
  readonly loading = signal<boolean>(true);
  readonly savingProjects = signal<boolean>(false);
  readonly generatingSchedule = signal<boolean>(false);
  readonly submittingEvaluation = signal<boolean>(false);

  readonly showAutoScheduleDialog = signal<boolean>(false);
  readonly showAddSlotForm = signal<boolean>(false);
  readonly editingSlotId = signal<number | null>(null);

  readonly showAddCriterionForm = signal<boolean>(false);
  readonly showAddJuryForm = signal<boolean>(false);
  readonly showAddAwardForm = signal<boolean>(false);

  // Live scoring state
  readonly activeJurorId = signal<number | null>(null);
  readonly selectedEvaluationProjectId = signal<number | null>(null);
  readonly currentEvaluationScores = signal<{ [criterionId: number]: number }>({});
  readonly currentEvaluationNote = signal<string>('');

  // Forms
  readonly slotForm: FormGroup = this.fb.group({
    slotType: ['Presentation', Validators.required],
    projectId: [null],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    durationMinutes: [10, [Validators.required, Validators.min(1)]],
    title: ['', Validators.required],
    note: ['']
  });

  readonly autoScheduleForm: FormGroup = this.fb.group({
    date: ['', Validators.required],
    startTime: ['08:30', Validators.required],
    presentationDuration: [10, [Validators.required, Validators.min(1)]],
    breakDuration: [10, [Validators.required, Validators.min(0)]],
    breakEveryN: [3, [Validators.required, Validators.min(1)]],
    includeIntro: [true],
    introTitle: ['Eröffnung & Begrüßung'],
    introDuration: [15],
    includeOutro: [true],
    outroTitle: ['Juryberatung & Siegerehrung'],
    outroDuration: [20]
  });

  readonly criterionForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    minScore: [0, [Validators.required, Validators.min(0)]],
    maxScore: [10, [Validators.required, Validators.min(1)]],
    weight: [1.0, [Validators.required, Validators.min(0.1)]],
    orderIndex: [0, Validators.required]
  });

  readonly juryForm: FormGroup = this.fb.group({
    isExternal: [false],
    professorId: [''],
    externalName: [''],
    externalEmail: [''],
    role: ['Juror', Validators.required]
  });

  readonly awardForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    rank: [null],
    prizeDetails: ['']
  });

  getProjectId(project: Project): number {
    return project.projectId ?? parseInt(project.id, 10);
  }

  // Computed Properties
  readonly filteredSchoolProjects = computed(() => {
    const list = this.allSchoolProjects();
    const search = this.projectSearchTerm().trim().toLowerCase();
    if (!search) return list;
    return list.filter(p =>
      p.title.toLowerCase().includes(search) ||
      (p.technologies && p.technologies.some(t => t.toLowerCase().includes(search))) ||
      (p.projectType && p.projectType.toLowerCase().includes(search))
    );
  });

  readonly sortedSlots = computed(() => {
    const comp = this.competition();
    if (!comp) return [];
    return [...comp.scheduleSlots].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  });

  readonly selectedEvaluationProject = computed(() => {
    const projId = this.selectedEvaluationProjectId();
    if (!projId) return null;
    return this.competition()?.projects.find(p => p.projectId === projId) || null;
  });

  readonly evaluatedProjectsCount = computed(() => {
    const jurorId = this.activeJurorId();
    if (!jurorId) return 0;
    const evals = this.evaluations().filter(e => e.juryMemberId === jurorId);
    const projectIds = new Set(evals.map(e => e.projectId));
    return projectIds.size;
  });

  readonly isProjectEvaluatedByActiveJuror = (projectId: number): boolean => {
    const jurorId = this.activeJurorId();
    if (!jurorId) return false;
    return this.evaluations().some(e => e.juryMemberId === jurorId && e.projectId === projectId);
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        this.loadData(id);
      }
    }
  }

  loadData(competitionId: number): void {
    this.loading.set(true);
    this.competitionService.getCompetitionById(competitionId).subscribe({
      next: (comp) => {
        this.competition.set(comp);
        const assignedIds = new Set(comp.projects.map(p => p.projectId));
        this.selectedProjectIds.set(assignedIds);

        // Auto-select first project for evaluation if available
        if (comp.projects.length > 0 && !this.selectedEvaluationProjectId()) {
          this.selectedEvaluationProjectId.set(comp.projects[0].projectId);
        }

        this.autoScheduleForm.patchValue({
          date: comp.startDate || new Date().toISOString().slice(0, 10),
          presentationDuration: comp.presentationDurationMinutes || 10,
          breakDuration: comp.breakDurationMinutes || 10
        });

        // Load supplementary data
        this.loadProjects();
        this.loadProfessors();
        this.loadEvaluationData(competitionId);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Fehler beim Laden des Wettbewerbs', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.allSchoolProjects.set(projects);
      }
    });
  }

  loadProfessors(): void {
    this.userService.getSupervisors().subscribe({
      next: (profs) => {
        this.allProfessors.set(profs);
      }
    });
  }

  loadEvaluationData(competitionId: number): void {
    // Criteria
    this.evaluationService.getCriteria(competitionId).subscribe({
      next: (critList) => {
        this.criteria.set(critList);
        this.initScoreForm(critList);
      }
    });

    // Jury
    this.evaluationService.getJuryMembers(competitionId).subscribe({
      next: (juryList) => {
        this.juryMembers.set(juryList);
        if (juryList.length > 0 && !this.activeJurorId()) {
          this.activeJurorId.set(juryList[0].juryMemberId);
          this.loadJurorEvaluations(competitionId, juryList[0].juryMemberId);
        }
      }
    });

    // Leaderboard
    this.evaluationService.getLeaderboard(competitionId).subscribe({
      next: (lb) => {
        this.leaderboard.set(lb);
      }
    });

    // Awards
    this.evaluationService.getAwards(competitionId).subscribe({
      next: (awardList) => {
        this.awards.set(awardList);
      }
    });
  }

  loadJurorEvaluations(competitionId: number, jurorId: number): void {
    this.evaluationService.getEvaluations(competitionId, jurorId).subscribe({
      next: (evals) => {
        this.evaluations.set(evals);
        this.populateCurrentEvaluation();
      }
    });
  }

  // --- Project Assignment Tab ---
  toggleProjectSelection(projectId: number): void {
    const current = new Set(this.selectedProjectIds());
    if (current.has(projectId)) {
      current.delete(projectId);
    } else {
      current.add(projectId);
    }
    this.selectedProjectIds.set(current);
  }

  isProjectSelected(projectId: number): boolean {
    return this.selectedProjectIds().has(projectId);
  }

  selectAllFilteredProjects(): void {
    const current = new Set(this.selectedProjectIds());
    this.filteredSchoolProjects().forEach(p => current.add(this.getProjectId(p)));
    this.selectedProjectIds.set(current);
  }

  deselectAllProjects(): void {
    this.selectedProjectIds.set(new Set());
  }

  saveProjectAssignments(): void {
    const comp = this.competition();
    if (!comp) return;

    this.savingProjects.set(true);
    const projectIds = Array.from(this.selectedProjectIds());

    this.competitionService.setCompetitionProjects(comp.competitionId, projectIds).subscribe({
      next: () => {
        this.snackBar.open('Projekt-Zuordnung erfolgreich gespeichert!', 'OK', { duration: 3000 });
        this.loadData(comp.competitionId);
        this.savingProjects.set(false);
      },
      error: () => {
        this.snackBar.open('Fehler beim Speichern der Zuordnung', 'OK', { duration: 3000 });
        this.savingProjects.set(false);
      }
    });
  }

  // --- Schedule Tab ---
  runAutoSchedule(): void {
    const comp = this.competition();
    if (!comp) return;

    if (comp.projects.length === 0) {
      this.snackBar.open('Bitte weise zuerst Projekte dem Wettbewerb zu!', 'OK', { duration: 3000 });
      return;
    }

    if (this.autoScheduleForm.invalid) {
      this.autoScheduleForm.markAllAsTouched();
      return;
    }

    this.generatingSchedule.set(true);
    const v = this.autoScheduleForm.value;

    this.competitionService.autoGenerateSchedule(comp.competitionId, {
      date: v.date,
      startTime: v.startTime,
      presentationDurationMinutes: v.presentationDuration,
      breakDurationMinutes: v.breakDuration,
      breakEveryNProjects: v.breakEveryN,
      includeIntro: v.includeIntro,
      introTitle: v.introTitle,
      introDurationMinutes: v.introDuration,
      includeOutro: v.includeOutro,
      outroTitle: v.outroTitle,
      outroDurationMinutes: v.outroDuration
    }).subscribe({
      next: (slots) => {
        this.snackBar.open(`${slots.length} Zeitplan-Slots erfolgreich generiert!`, 'OK', { duration: 3000 });
        this.competition.update(current => current ? { ...current, scheduleSlots: slots } : null);
        this.showAutoScheduleDialog.set(false);
        this.generatingSchedule.set(false);
      },
      error: () => {
        this.snackBar.open('Fehler beim automatischen Erstellen des Zeitplans', 'OK', { duration: 3000 });
        this.generatingSchedule.set(false);
      }
    });
  }

  onSlotDrop(event: CdkDragDrop<ScheduleSlot[]>): void {
    const comp = this.competition();
    if (!comp) return;

    const slots = [...this.sortedSlots()];
    moveItemInArray(slots, event.previousIndex, event.currentIndex);

    let currentTime = slots[0].startTime;
    const updatedSlots: ScheduleSlot[] = [];

    for (const slot of slots) {
      const updated = { ...slot, startTime: currentTime };
      updatedSlots.push(updated);
      currentTime = this.getSlotEndTime(currentTime, slot.durationMinutes);
    }

    this.competition.update(current => current ? { ...current, scheduleSlots: updatedSlots } : null);

    updatedSlots.forEach(slot => {
      this.competitionService.updateScheduleSlot(comp.competitionId, slot.scheduleSlotId, {
        projectId: slot.projectId,
        slotType: slot.slotType,
        date: slot.date,
        startTime: slot.startTime,
        durationMinutes: slot.durationMinutes,
        title: slot.title,
        note: slot.note
      }).subscribe();
    });

    this.snackBar.open('Zeitplanreihenfolge aktualisiert', 'OK', { duration: 2000 });
  }

  openAddSlotForm(): void {
    const comp = this.competition();
    this.editingSlotId.set(null);
    const slots = this.sortedSlots();
    let nextStartTime = '08:30';
    if (slots.length > 0) {
      const last = slots[slots.length - 1];
      nextStartTime = this.getSlotEndTime(last.startTime, last.durationMinutes);
    }

    this.slotForm.patchValue({
      slotType: 'Presentation',
      projectId: null,
      date: comp?.startDate || new Date().toISOString().slice(0, 10),
      startTime: nextStartTime,
      durationMinutes: comp?.presentationDurationMinutes || 10,
      title: '',
      note: ''
    });
    this.showAddSlotForm.set(true);
  }

  onSlotProjectChange(projectId: number | null): void {
    if (projectId) {
      const project = this.allSchoolProjects().find(p => this.getProjectId(p) === projectId);
      if (project) {
        this.slotForm.patchValue({
          title: project.title,
          slotType: 'Presentation'
        });
      }
    }
  }

  editSlot(slot: ScheduleSlot): void {
    this.editingSlotId.set(slot.scheduleSlotId);
    this.slotForm.patchValue({
      slotType: slot.slotType,
      projectId: slot.projectId,
      date: slot.date,
      startTime: slot.startTime,
      durationMinutes: slot.durationMinutes,
      title: slot.title,
      note: slot.note || ''
    });
    this.showAddSlotForm.set(true);
  }

  saveSlot(): void {
    const comp = this.competition();
    if (!comp) return;

    if (this.slotForm.invalid) {
      this.slotForm.markAllAsTouched();
      return;
    }

    const val = this.slotForm.value;
    const editingId = this.editingSlotId();

    if (editingId) {
      this.competitionService.updateScheduleSlot(comp.competitionId, editingId, val).subscribe({
        next: (updated) => {
          this.competition.update(c => c ? {
            ...c,
            scheduleSlots: c.scheduleSlots.map(s => s.scheduleSlotId === editingId ? updated : s)
          } : null);
          this.snackBar.open('Slot aktualisiert', 'OK', { duration: 3000 });
          this.showAddSlotForm.set(false);
          this.editingSlotId.set(null);
        }
      });
    } else {
      this.competitionService.createScheduleSlot(comp.competitionId, val).subscribe({
        next: (created) => {
          this.competition.update(c => c ? {
            ...c,
            scheduleSlots: [...c.scheduleSlots, created]
          } : null);
          this.snackBar.open('Slot hinzugefügt', 'OK', { duration: 3000 });
          this.showAddSlotForm.set(false);
        }
      });
    }
  }

  deleteSlot(slot: ScheduleSlot): void {
    const comp = this.competition();
    if (!comp) return;

    if (confirm(`Möchtest du den Slot "${slot.title}" löschen?`)) {
      this.competitionService.deleteScheduleSlot(comp.competitionId, slot.scheduleSlotId).subscribe({
        next: () => {
          this.competition.update(c => c ? {
            ...c,
            scheduleSlots: c.scheduleSlots.filter(s => s.scheduleSlotId !== slot.scheduleSlotId)
          } : null);
          this.snackBar.open('Slot gelöscht', 'OK', { duration: 2500 });
        }
      });
    }
  }

  downloadPdf(): void {
    const comp = this.competition();
    if (!comp) return;

    this.competitionService.downloadSchedulePdf(comp.competitionId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Programm_${comp.name.replace(/\s+/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Fehler beim Herunterladen des PDFs', 'OK', { duration: 3000 });
      }
    });
  }

  // --- Criteria & Jury Management Tab ---
  saveCriterion(): void {
    const comp = this.competition();
    if (!comp || this.criterionForm.invalid) {
      this.criterionForm.markAllAsTouched();
      return;
    }

    const payload: CreateEvaluationCriterionPayload = this.criterionForm.value;
    this.evaluationService.createCriterion(comp.competitionId, payload).subscribe({
      next: (crit) => {
        this.criteria.update(list => [...list, crit]);
        this.initScoreForm(this.criteria());
        this.showAddCriterionForm.set(false);
        this.criterionForm.reset({ minScore: 0, maxScore: 10, weight: 1.0, orderIndex: this.criteria().length });
        this.snackBar.open('Kriterium erfolgreich angelegt', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Fehler beim Anlegen des Kriteriums', 'OK', { duration: 3000 });
      }
    });
  }

  deleteCriterion(crit: EvaluationCriterion): void {
    const comp = this.competition();
    if (!comp) return;

    if (confirm(`Kriterium "${crit.name}" wirklich löschen?`)) {
      this.evaluationService.deleteCriterion(comp.competitionId, crit.criterionId).subscribe({
        next: () => {
          this.criteria.update(list => list.filter(c => c.criterionId !== crit.criterionId));
          this.snackBar.open('Kriterium gelöscht', 'OK', { duration: 2500 });
        }
      });
    }
  }

  saveJuryMember(): void {
    const comp = this.competition();
    if (!comp || this.juryForm.invalid) {
      this.juryForm.markAllAsTouched();
      return;
    }

    const v = this.juryForm.value;
    const payload: AddJuryMemberPayload = {
      professorId: v.isExternal ? null : (v.professorId || null),
      externalName: v.isExternal ? v.externalName : null,
      externalEmail: v.isExternal ? v.externalEmail : null,
      role: v.role
    };

    this.evaluationService.addJuryMember(comp.competitionId, payload).subscribe({
      next: (member) => {
        this.juryMembers.update(list => [...list, member]);
        if (!this.activeJurorId()) {
          this.activeJurorId.set(member.juryMemberId);
        }
        this.showAddJuryForm.set(false);
        this.juryForm.reset({ isExternal: false, role: 'Juror' });
        this.snackBar.open('Jury-Mitglied erfolgreich hinzugefügt', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Fehler beim Hinzufügen des Jury-Mitglieds', 'OK', { duration: 3000 });
      }
    });
  }

  deleteJuryMember(member: JuryMember): void {
    const comp = this.competition();
    if (!comp) return;

    const name = member.professorName || member.externalName || 'Juror';
    if (confirm(`Jury-Mitglied "${name}" wirklich entfernen?`)) {
      this.evaluationService.removeJuryMember(comp.competitionId, member.juryMemberId).subscribe({
        next: () => {
          this.juryMembers.update(list => list.filter(j => j.juryMemberId !== member.juryMemberId));
          if (this.activeJurorId() === member.juryMemberId) {
            const next = this.juryMembers()[0];
            this.activeJurorId.set(next ? next.juryMemberId : null);
          }
          this.snackBar.open('Jury-Mitglied entfernt', 'OK', { duration: 2500 });
        }
      });
    }
  }

  // --- Live Scoring Tab ---
  onJurorChange(jurorId: number): void {
    this.activeJurorId.set(jurorId);
    const comp = this.competition();
    if (comp) {
      this.loadJurorEvaluations(comp.competitionId, jurorId);
    }
  }

  selectProjectForEvaluation(projectId: number): void {
    this.selectedEvaluationProjectId.set(projectId);
    this.populateCurrentEvaluation();
  }

  initScoreForm(critList: EvaluationCriterion[]): void {
    const scores: { [key: number]: number } = {};
    for (const c of critList) {
      scores[c.criterionId] = Math.round((c.minScore + c.maxScore) / 2);
    }
    this.currentEvaluationScores.set(scores);
  }

  populateCurrentEvaluation(): void {
    const jurorId = this.activeJurorId();
    const projectId = this.selectedEvaluationProjectId();
    if (!jurorId || !projectId) return;

    const projectEvals = this.evaluations().filter(
      e => e.juryMemberId === jurorId && e.projectId === projectId
    );

    const scores: { [key: number]: number } = {};
    let note = '';

    for (const crit of this.criteria()) {
      const match = projectEvals.find(e => e.criterionId === crit.criterionId);
      scores[crit.criterionId] = match ? match.score : Math.round((crit.minScore + crit.maxScore) / 2);
      if (match?.note) note = match.note;
    }

    this.currentEvaluationScores.set(scores);
    this.currentEvaluationNote.set(note);
  }

  updateCriterionScore(criterionId: number, score: number): void {
    const current = { ...this.currentEvaluationScores() };
    current[criterionId] = score;
    this.currentEvaluationScores.set(current);
  }

  calculateCurrentTotalScore(): number {
    let total = 0;
    const scores = this.currentEvaluationScores();
    for (const crit of this.criteria()) {
      const score = scores[crit.criterionId] || 0;
      total += score * crit.weight;
    }
    return Math.round(total * 100) / 100;
  }

  calculateMaxTotalScore(): number {
    let max = 0;
    for (const crit of this.criteria()) {
      max += crit.maxScore * crit.weight;
    }
    return Math.round(max * 100) / 100;
  }

  submitCurrentEvaluation(): void {
    const comp = this.competition();
    const jurorId = this.activeJurorId();
    const projectId = this.selectedEvaluationProjectId();

    if (!comp || !jurorId || !projectId) {
      this.snackBar.open('Bitte wähle ein Jury-Mitglied und ein Projekt aus!', 'OK', { duration: 3000 });
      return;
    }

    this.submittingEvaluation.set(true);
    const scoresMap = this.currentEvaluationScores();
    const scoresInput = Object.entries(scoresMap).map(([critId, score]) => ({
      criterionId: parseInt(critId, 10),
      score
    }));

    this.evaluationService.batchSubmitEvaluations(comp.competitionId, {
      projectId,
      juryMemberId: jurorId,
      scores: scoresInput,
      note: this.currentEvaluationNote()
    }).subscribe({
      next: () => {
        this.snackBar.open('Bewertung erfolgreich gespeichert! ⭐', 'OK', { duration: 2500 });
        this.loadJurorEvaluations(comp.competitionId, jurorId);
        // Refresh leaderboard
        this.evaluationService.getLeaderboard(comp.competitionId).subscribe({
          next: (lb) => this.leaderboard.set(lb)
        });
        this.submittingEvaluation.set(false);
      },
      error: () => {
        this.snackBar.open('Fehler beim Speichern der Bewertung', 'OK', { duration: 3000 });
        this.submittingEvaluation.set(false);
      }
    });
  }

  // --- Leaderboard & Awards Tab ---
  saveAward(): void {
    const comp = this.competition();
    if (!comp || this.awardForm.invalid) {
      this.awardForm.markAllAsTouched();
      return;
    }

    const payload: CreateAwardPayload = this.awardForm.value;
    this.evaluationService.createAward(comp.competitionId, payload).subscribe({
      next: (award) => {
        this.awards.update(list => [...list, award]);
        this.showAddAwardForm.set(false);
        this.awardForm.reset();
        this.snackBar.open('Preis erfolgreich angelegt 🏆', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Fehler beim Anlegen des Preises', 'OK', { duration: 3000 });
      }
    });
  }

  deleteAward(award: CompetitionAward): void {
    const comp = this.competition();
    if (!comp) return;

    if (confirm(`Preis "${award.name}" wirklich entfernen?`)) {
      this.evaluationService.deleteAward(comp.competitionId, award.awardId).subscribe({
        next: () => {
          this.awards.update(list => list.filter(a => a.awardId !== award.awardId));
          this.snackBar.open('Preis gelöscht', 'OK', { duration: 2500 });
        }
      });
    }
  }

  assignWinner(award: CompetitionAward, projectId: number | null): void {
    const comp = this.competition();
    if (!comp) return;

    this.evaluationService.assignAwardWinner(comp.competitionId, award.awardId, {
      winningProjectId: projectId
    }).subscribe({
      next: (updated) => {
        this.awards.update(list => list.map(a => a.awardId === updated.awardId ? updated : a));
        // Refresh leaderboard
        this.evaluationService.getLeaderboard(comp.competitionId).subscribe({
          next: (lb) => this.leaderboard.set(lb)
        });
        this.snackBar.open('Gewinner erfolgreich zugewiesen! 🏅', 'OK', { duration: 3000 });
      }
    });
  }

  updateCompetitionStatus(newStatus: CompetitionStatus): void {
    const comp = this.competition();
    if (!comp) return;

    this.evaluationService.updateStatus(comp.competitionId, newStatus).subscribe({
      next: () => {
        this.competition.update(c => c ? { ...c, status: newStatus } : null);
        this.snackBar.open(`Status geändert auf "${this.getStatusLabel(newStatus)}"`, 'OK', { duration: 3000 });
      }
    });
  }

  // --- Helpers ---
  getTypeBadgeClass(type: CompetitionType): string {
    switch (type) {
      case 'Wmc3': return 'badge-wmc';
      case 'ProjectAward': return 'badge-award';
      case 'Dipl': return 'badge-dipl';
      case 'Syp': return 'badge-syp';
      case 'Itp': return 'badge-itp';
      default: return 'badge-default';
    }
  }

  getTypeLabel(type: CompetitionType): string {
    switch (type) {
      case 'Wmc3': return 'WMC-3';
      case 'ProjectAward': return 'Project Award';
      case 'Dipl': return 'Diplomarbeiten';
      case 'Syp': return 'SYP';
      case 'Itp': return 'ITP';
      default: return type;
    }
  }

  getStatusLabel(status?: CompetitionStatus): string {
    switch (status) {
      case 'Draft': return 'Entwurf';
      case 'Active': return 'Aktiv';
      case 'InEvaluation': return 'In Bewertung';
      case 'Completed': return 'Abgeschlossen';
      case 'Published': return 'Veröffentlicht';
      default: return 'Aktiv';
    }
  }

  getStatusBadgeClass(status?: CompetitionStatus): string {
    switch (status) {
      case 'Draft': return 'badge-draft';
      case 'Active': return 'badge-active';
      case 'InEvaluation': return 'badge-eval';
      case 'Completed': return 'badge-completed';
      case 'Published': return 'badge-published';
      default: return 'badge-active';
    }
  }

  getSlotBadgeClass(type: ScheduleSlotType): string {
    switch (type) {
      case 'Presentation': return 'slot-presentation';
      case 'Break': return 'slot-break';
      case 'Info': return 'slot-info';
      default: return '';
    }
  }

  getSlotTypeLabel(type: ScheduleSlotType): string {
    switch (type) {
      case 'Presentation': return 'Vortrag';
      case 'Break': return 'Pause';
      case 'Info': return 'Info';
      default: return type;
    }
  }

  getSlotEndTime(startTime: string, durationMinutes: number): string {
    const parts = startTime.split(':');
    if (parts.length < 2) return startTime;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  deleteCompetition(): void {
    const comp = this.competition();
    if (!comp) return;

    if (confirm(`Möchtest du den Wettbewerb "${comp.name}" wirklich unwiderruflich löschen?`)) {
      this.competitionService.deleteCompetition(comp.competitionId).subscribe({
        next: () => {
          this.snackBar.open('Wettbewerb gelöscht', 'OK', { duration: 3000 });
          this.router.navigate(['/competitions']);
        }
      });
    }
  }
}
