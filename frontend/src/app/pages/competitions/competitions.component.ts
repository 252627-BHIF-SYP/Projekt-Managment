import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CompetitionService } from '../../services/competition.service';
import { CompetitionSummary, CompetitionType } from '../../core/models';

@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.scss'
})
export class CompetitionsComponent implements OnInit {
  private readonly competitionService = inject(CompetitionService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly competitions = signal<CompetitionSummary[]>([]);
  readonly selectedType = signal<CompetitionType | 'ALL'>('ALL');
  readonly searchTerm = signal<string>('');

  readonly competitionTypes: { label: string; value: CompetitionType | 'ALL' }[] = [
    { label: 'Alle', value: 'ALL' },
    { label: 'WMC-3', value: 'Wmc3' },
    { label: 'Project Award', value: 'ProjectAward' },
    { label: 'Diplomarbeiten', value: 'Dipl' },
    { label: 'SYP', value: 'Syp' },
    { label: 'ITP', value: 'Itp' }
  ];

  readonly filteredCompetitions = computed(() => {
    const list = this.competitions();
    const type = this.selectedType();
    const search = this.searchTerm().trim().toLowerCase();

    return list.filter(c => {
      const matchesType = type === 'ALL' || c.competitionType === type;
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search) ||
        c.allowedClassTypes.toLowerCase().includes(search) ||
        this.getTypeLabel(c.competitionType).toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadCompetitions();
  }

  loadCompetitions(): void {
    this.loading.set(true);
    this.competitionService.getCompetitions().subscribe({
      next: (data) => {
        this.competitions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Fehler beim Laden der Wettbewerbe', 'Schließen', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onTypeSelect(type: CompetitionType | 'ALL'): void {
    this.selectedType.set(type);
  }

  getTypeLabel(type: CompetitionType): string {
    switch (type) {
      case 'Wmc3': return 'WMC-3 Wettbewerb';
      case 'ProjectAward': return 'Project Award';
      case 'Dipl': return 'Diplomarbeiten';
      case 'Syp': return 'SYP Vorstellungen';
      case 'Itp': return 'ITP Wettbewerb';
      default: return type;
    }
  }

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

  downloadPdf(competitionId: number, event: Event): void {
    event.stopPropagation();
    this.snackBar.open('PDF wird erstellt...', '', { duration: 2000 });
    this.competitionService.downloadSchedulePdf(competitionId).subscribe({
      next: () => {
        this.snackBar.open('PDF erfolgreich heruntergeladen!', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Fehler beim Generieren des PDFs', 'Schließen', { duration: 3000 });
      }
    });
  }

  deleteCompetition(competition: CompetitionSummary, event: Event): void {
    event.stopPropagation();
    if (confirm(`Möchtest du den Wettbewerb "${competition.name}" wirklich löschen?`)) {
      this.competitionService.deleteCompetition(competition.competitionId).subscribe({
        next: () => {
          this.snackBar.open('Wettbewerb gelöscht', 'OK', { duration: 3000 });
          this.loadCompetitions();
        },
        error: () => {
          this.snackBar.open('Fehler beim Löschen des Wettbewerbs', 'Schließen', { duration: 3000 });
        }
      });
    }
  }
}
