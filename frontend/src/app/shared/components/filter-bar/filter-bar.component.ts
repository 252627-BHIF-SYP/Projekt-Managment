import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectFilter, ProjectStatus, SchoolYear } from '../../../core/models';

/**
 * Filter bar for projects
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss'
})
export class FilterBarComponent {
  @Input() schoolYears?: SchoolYear[];
  @Output() filterChange = new EventEmitter<ProjectFilter>();

  readonly allValue = 'ALL';
  filter: ProjectFilter = {
    schoolYearIds: [],
    statuses: [],
    projectTypes: []
  };
  ProjectStatus = ProjectStatus;
  projectTypes = ['SYP', 'Diplomarbeit', 'ProjectAward', 'Others'];
  statuses = [
    ProjectStatus.NEW,
    ProjectStatus.PENDING,
    ProjectStatus.ON_GOING,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED
  ];
  private lastSchoolYearIds: string[] = [];
  private lastStatuses: string[] = [];
  private lastProjectTypes: string[] = [];

  onFilterChange(): void {
    this.normalizeAllValues();
    this.filterChange.emit({ ...this.filter });
  }

  clearFilters(): void {
    this.filter = {
      schoolYearIds: [],
      statuses: [],
      projectTypes: []
    };
    this.onFilterChange();
  }

  private normalizeAllValues(): void {
    this.filter.schoolYearIds = this.normalizeSelection(this.filter.schoolYearIds || [], this.lastSchoolYearIds);
    this.filter.statuses = this.normalizeSelection(this.filter.statuses || [], this.lastStatuses);
    this.filter.projectTypes = this.normalizeSelection(this.filter.projectTypes || [], this.lastProjectTypes);

    this.lastSchoolYearIds = [...this.filter.schoolYearIds];
    this.lastStatuses = [...this.filter.statuses];
    this.lastProjectTypes = [...this.filter.projectTypes];
  }

  private normalizeSelection(selected: string[], previous: string[]): string[] {
    if (!selected.includes(this.allValue)) {
      return selected;
    }

    if (!previous.includes(this.allValue)) {
      return [this.allValue];
    }

    return selected.filter(value => value !== this.allValue);
  }
}

