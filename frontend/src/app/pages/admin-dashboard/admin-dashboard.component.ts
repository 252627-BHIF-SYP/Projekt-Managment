import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminService, AdminStats, TrendData } from '../../services/admin.service';
import { ImportComponent } from '../import/import.component';
import { Observable } from 'rxjs';

/**
 * Admin Dashboard Component
 * Zeigt Systemstatistiken und Überblick
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    ImportComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private readonly adminService = inject(AdminService);

  stats$: Observable<AdminStats> = this.adminService.getAdminStats();
  trendData$: Observable<TrendData> = this.adminService.getTrendData();

  generateLinePath(data: { year: string; value: number }[], width: number, height: number, padding: number): string {
    if (!data || data.length === 0) return '';

    const maxValue = Math.max(1, ...data.map(d => d.value));
    const xStep = data.length > 1 ? (width - 2 * padding) / (data.length - 1) : 0;
    const points = data.map((point, index) => {
      const x = data.length > 1 ? padding + index * xStep : width / 2;
      const y = height - padding - (point.value / maxValue) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  getCircles(data: { year: string; value: number }[], width: number, height: number, padding: number) {
    if (!data || data.length === 0) return [];

    const maxValue = Math.max(1, ...data.map(d => d.value));
    const xStep = data.length > 1 ? (width - 2 * padding) / (data.length - 1) : 0;
    return data.map((point, index) => ({
      cx: data.length > 1 ? padding + index * xStep : width / 2,
      cy: height - padding - (point.value / maxValue) * (height - 2 * padding),
      value: point.value
    }));
  }

  getYAxisLabels(data: { year: string; value: number }[], height: number, padding: number): Array<{ y: number; label: string }> {
    if (!data || data.length === 0) return [];

    const maxValue = Math.max(1, ...data.map(d => d.value));
    const middleValue = Math.round(maxValue / 2);

    return [
      { y: padding + 4, label: maxValue.toString() },
      { y: height / 2 + 4, label: middleValue.toString() },
      { y: height - padding + 4, label: '0' }
    ];
  }

  getXAxisLabels(data: { year: string; value: number }[], width: number, padding: number) {
    if (!data || data.length === 0) return [];

    const xStep = data.length > 1 ? (width - 2 * padding) / (data.length - 1) : 0;
    return data.map((point, index) => ({
      x: data.length > 1 ? padding + index * xStep : width / 2,
      label: point.year
    }));
  }

  getGridLines(height: number, padding: number): number[] {
    const plotHeight = height - 2 * padding;
    return [0, 1, 2, 3, 4].map(index => padding + (plotHeight / 4) * index);
  }

  scrollToImportSection(): void {
    document.getElementById('csv-import')?.scrollIntoView({ behavior: 'smooth' });
  }
}

