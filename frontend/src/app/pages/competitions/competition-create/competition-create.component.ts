import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompetitionService } from '../../../services/competition.service';
import { CompetitionType, CreateCompetitionPayload, UpdateCompetitionPayload } from '../../../core/models';

@Component({
  selector: 'app-competition-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './competition-create.component.html',
  styleUrl: './competition-create.component.css'
})
export class CompetitionCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly competitionService = inject(CompetitionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode = signal(false);
  readonly competitionId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  readonly competitionTypes: { label: string; value: CompetitionType }[] = [
    { label: 'WMC-3 Wettbewerb', value: 'Wmc3' },
    { label: 'Project Award', value: 'ProjectAward' },
    { label: 'Diplomarbeiten-Vorstellung', value: 'Dipl' },
    { label: 'SYP-Vorstellung', value: 'Syp' },
    { label: 'ITP-Wettbewerb', value: 'Itp' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    competitionType: ['Wmc3' as CompetitionType, Validators.required],
    startDate: [new Date().toISOString().slice(0, 10), Validators.required],
    endDate: [''],
    presentationDurationMinutes: [10, [Validators.required, Validators.min(1), Validators.max(180)]],
    breakDurationMinutes: [5, [Validators.required, Validators.min(0), Validators.max(120)]],
    allowedClassTypes: ['Alle', Validators.maxLength(100)]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        this.isEditMode.set(true);
        this.competitionId.set(id);
        this.loadCompetition(id);
      }
    }
  }

  private loadCompetition(id: number): void {
    this.loading.set(true);
    this.competitionService.getCompetitionById(id).subscribe({
      next: (competition) => {
        this.form.patchValue({
          name: competition.name,
          competitionType: competition.competitionType,
          startDate: competition.startDate,
          endDate: competition.endDate || '',
          presentationDurationMinutes: competition.presentationDurationMinutes,
          breakDurationMinutes: competition.breakDurationMinutes,
          allowedClassTypes: competition.allowedClassTypes
        });
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Fehler beim Laden des Wettbewerbs', 'Schließen', { duration: 3000 });
        this.router.navigate(['/competitions']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formVal = this.form.value;

    const payload: CreateCompetitionPayload = {
      name: formVal.name.trim(),
      competitionType: formVal.competitionType,
      startDate: formVal.startDate,
      endDate: formVal.endDate ? formVal.endDate : null,
      presentationDurationMinutes: Number(formVal.presentationDurationMinutes),
      breakDurationMinutes: Number(formVal.breakDurationMinutes),
      allowedClassTypes: formVal.allowedClassTypes ? formVal.allowedClassTypes.trim() : 'Alle'
    };

    if (this.isEditMode() && this.competitionId()) {
      const updatePayload: UpdateCompetitionPayload = { ...payload };
      this.competitionService.updateCompetition(this.competitionId()!, updatePayload).subscribe({
        next: (comp) => {
          this.snackBar.open('Wettbewerb erfolgreich aktualisiert!', 'OK', { duration: 3000 });
          this.router.navigate(['/competitions', comp.competitionId]);
        },
        error: () => {
          this.snackBar.open('Fehler beim Aktualisieren des Wettbewerbs', 'Schließen', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    } else {
      this.competitionService.createCompetition(payload).subscribe({
        next: (comp) => {
          this.snackBar.open('Wettbewerb erfolgreich erstellt!', 'OK', { duration: 3000 });
          this.router.navigate(['/competitions', comp.competitionId]);
        },
        error: () => {
          this.snackBar.open('Fehler beim Erstellen des Wettbewerbs', 'Schließen', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    }
  }
}
