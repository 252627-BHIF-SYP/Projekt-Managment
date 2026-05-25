import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminService, AdminStats, TrendData } from '../../services/admin.service';
import { SchoolYear } from '../../core/models';
import { SchoolYearService } from '../../services/schoolyear.service';
import { StudentService } from '../../services/student.service';
import { Observable, combineLatest, map, shareReplay } from 'rxjs';
import { Class, StudentProfile } from '../../core/models';

interface ClassStudentEntry {
  id: string;
  firstName: string;
  lastName: string;
  historyId: number;
}

interface ClassDashboardItem {
  classId: string;
  name: string;
  branch: string;
  students: ClassStudentEntry[];
}

interface SchoolYearDashboardItem {
  schoolYearId: string;
  year: string;
  classes: ClassDashboardItem[];
}

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
export class AdminDashboardComponent {
  private readonly adminService = inject(AdminService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly studentService = inject(StudentService);

  stats$: Observable<AdminStats> = this.adminService.getAdminStats();
  trendData$: Observable<TrendData> = this.adminService.getTrendData();
  classDashboard$: Observable<SchoolYearDashboardItem[]> = combineLatest([
    this.schoolYearService.getSchoolYears(),
    this.studentService.getClasses(),
    this.studentService.getStudents()
  ]).pipe(
    map(([schoolYears, classes, students]) => this.buildClassDashboard(schoolYears, classes, students)),
    shareReplay(1)
  );

  private buildClassDashboard(
    schoolYears: SchoolYear[],
    classes: Class[],
    students: StudentProfile[]
  ): SchoolYearDashboardItem[] {
    const classLookup = new Map(classes.map(studentClass => [studentClass.id, studentClass]));
    const years = new Map<string, SchoolYearDashboardItem>();

    schoolYears.forEach(schoolYear => {
      years.set(schoolYear.id, {
        schoolYearId: schoolYear.id,
        year: schoolYear.year,
        classes: []
      });
    });

    const yearClassBuckets = new Map<string, Map<string, ClassDashboardItem & { studentIds: Set<string> }>>();

    const ensureYear = (schoolYearId: string, fallbackYearLabel?: string) => {
      if (!years.has(schoolYearId)) {
        years.set(schoolYearId, {
          schoolYearId,
          year: fallbackYearLabel || schoolYearId,
          classes: []
        });
      }

      if (!yearClassBuckets.has(schoolYearId)) {
        yearClassBuckets.set(schoolYearId, new Map());
      }

      return years.get(schoolYearId)!;
    };

    students.forEach(student => {
      const histories = student.histories || [];
      histories.forEach(history => {
        const schoolYearId = String(history.schoolYearId);
        const yearBucket = ensureYear(schoolYearId, history.schoolYear);
        const classBucketMap = yearClassBuckets.get(schoolYearId)!;
        const classId = String(history.classId);

        if (!classBucketMap.has(classId)) {
          const classEntity = classLookup.get(classId);
          classBucketMap.set(classId, {
            classId,
            name: history.className || classEntity?.name || `Klasse ${classId}`,
            branch: history.branch || classEntity?.branch || '',
            students: [],
            studentIds: new Set<string>()
          });
        }

        const bucket = classBucketMap.get(classId)!;
        if (!bucket.studentIds.has(student.id)) {
          bucket.studentIds.add(student.id);
          bucket.students.push({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            historyId: history.historyId
          });
        }

        yearBucket.classes = Array.from(classBucketMap.values())
          .map(({ studentIds, ...classItem }) => classItem)
          .sort((a, b) => this.sortText(a.branch || a.name, b.branch || b.name));
      });
    });

    return Array.from(years.values())
      .sort((a, b) => this.sortText(b.year, a.year))
      .map(year => ({
        ...year,
        classes: year.classes
          .map(classItem => ({
            ...classItem,
            students: [...classItem.students].sort((a, b) => this.sortText(`${a.lastName} ${a.firstName}`, `${b.lastName} ${b.firstName}`))
          }))
      }));
  }

  private sortText(left: string, right: string): number {
    return left.localeCompare(right, 'de', { numeric: true, sensitivity: 'base' });
  }

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
}
