import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminService, AdminStats, TrendData } from '../../services/admin.service';
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
    MatButtonModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  stats$: Observable<AdminStats>;
  trendData$: Observable<TrendData>;

  constructor(private adminService: AdminService) {
    this.stats$ = this.adminService.getAdminStats();
    this.trendData$ = this.adminService.getTrendData();
  }

  ngOnInit(): void {}

  generateLinePath(data: { year: number; value: number }[], width: number, height: number, padding: number): string {
    if (!data || data.length === 0) return '';

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = 0;
    const range = maxValue - minValue;

    const xStep = (width - 2 * padding) / (data.length - 1);
    const points = data.map((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - ((point.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  getCircles(data: { year: number; value: number }[], width: number, height: number, padding: number) {
    if (!data || data.length === 0) return [];

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = 0;
    const range = maxValue - minValue;

    const xStep = (width - 2 * padding) / (data.length - 1);
    return data.map((point, index) => ({
      cx: padding + index * xStep,
      cy: height - padding - ((point.value - minValue) / range) * (height - 2 * padding),
      value: point.value
    }));
  }

  getYAxisLabels(data: { year: number; value: number }[], height: number, padding: number): Array<{ y: number; label: string }> {
    if (!data || data.length === 0) return [];

    const maxValue = Math.max(...data.map(d => d.value));
    const step = Math.ceil(maxValue / 5);
    const labels = [];

    for (let i = 0; i <= 5; i++) {
      const value = i * step;
      const y = height - padding - (value / maxValue) * (height - 2 * padding);
      labels.push({ y, label: value.toString() });
    }

    return labels;
  }

  getXAxisLabels(data: { year: number; value: number }[], width: number, padding: number) {
    if (!data || data.length === 0) return [];

    const xStep = (width - 2 * padding) / (data.length - 1);
    return data.map((point, index) => ({
      x: padding + index * xStep,
      label: point.year.toString()
    }));
  }
}
