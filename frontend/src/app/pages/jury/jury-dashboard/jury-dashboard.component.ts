import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EvaluationService } from '../../../services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { JurorCompetition } from '../../../core/models/competition.model';

@Component({
  selector: 'app-jury-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './jury-dashboard.component.html',
  styleUrls: ['./jury-dashboard.component.css']
})
export class JuryDashboardComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly competitions = signal<JurorCompetition[]>([]);
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadJurorCompetitions();
  }

  loadJurorCompetitions(): void {
    this.loading.set(true);
    this.evaluationService.getMyJurorCompetitions().subscribe({
      next: (list) => {
        this.competitions.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading juror competitions:', err);
        this.loading.set(false);
      }
    });
  }

  openEvaluation(competitionId: number): void {
    this.router.navigate(['/jury/evaluate', competitionId]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'InEvaluation': return 'status-in-eval';
      case 'Completed': return 'status-completed';
      case 'Published': return 'status-published';
      case 'Active': return 'status-active';
      default: return 'status-draft';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'InEvaluation': return 'In Live-Bewertung';
      case 'Completed': return 'Abgeschlossen';
      case 'Published': return 'Ergebnisse veröffentlicht';
      case 'Active': return 'Aktiv (Vorbereitung)';
      default: return 'Entwurf';
    }
  }

  getProgressPercentage(evaluated: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((evaluated / total) * 100);
  }
}
