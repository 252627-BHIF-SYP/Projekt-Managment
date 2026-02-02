import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectFilter, ProjectStatus, SchoolYear, Class } from '../../../../core/models';

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
  @Input() classes?: Class[];
  @Output() filterChange = new EventEmitter<ProjectFilter>();

  filter: ProjectFilter = {};
  ProjectStatus = ProjectStatus;

  onFilterChange(): void {
    this.filterChange.emit({ ...this.filter });
  }

  clearFilters(): void {
    this.filter = {};
    this.onFilterChange();
  }
}
