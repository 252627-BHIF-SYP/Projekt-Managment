import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectFilter, ProjectStatus, SchoolYear, Class } from '../../../core/models';

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
  template: `
    <div class="filter-bar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input 
          matInput 
          placeholder="Search projects..."
          [(ngModel)]="filter.searchTerm"
          (ngModelChange)="onFilterChange()">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" *ngIf="schoolYears && schoolYears.length > 0">
        <mat-label>School Year</mat-label>
        <mat-select 
          [(ngModel)]="filter.schoolYearId"
          (ngModelChange)="onFilterChange()">
          <mat-option [value]="undefined">All</mat-option>
          <mat-option *ngFor="let year of schoolYears" [value]="year.id">
            {{ year.year }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" *ngIf="classes && classes.length > 0">
        <mat-label>Class</mat-label>
        <mat-select 
          [(ngModel)]="filter.classId"
          (ngModelChange)="onFilterChange()">
          <mat-option [value]="undefined">All</mat-option>
          <mat-option *ngFor="let class of classes" [value]="class.id">
            {{ class.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select 
          [(ngModel)]="filter.status"
          (ngModelChange)="onFilterChange()">
          <mat-option [value]="undefined">All</mat-option>
          <mat-option [value]="ProjectStatus.DRAFT">Draft</mat-option>
          <mat-option [value]="ProjectStatus.OPEN">Open</mat-option>
          <mat-option [value]="ProjectStatus.IN_PROGRESS">In Progress</mat-option>
          <mat-option [value]="ProjectStatus.COMPLETED">Completed</mat-option>
          <mat-option [value]="ProjectStatus.ARCHIVED">Archived</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-raised-button (click)="clearFilters()">
        <mat-icon>clear</mat-icon>
        Clear
      </button>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      max-width: 900px;
      width: 100%;
      margin: 0 auto;
      justify-content: center;

      mat-form-field {
        min-width: 130px;
        font-size: 14px;

        ::ng-deep .mat-mdc-form-field-infix {
          padding-top: 10px !important;
          padding-bottom: 10px !important;
          display: flex;
          align-items: center;
        }

        ::ng-deep .mdc-text-field--filled {
          height: 42px;
        }

        ::ng-deep .mat-mdc-input-element {
          font-size: 16px;
        }

        ::ng-deep .mdc-floating-label,
        ::ng-deep .mdc-floating-label--float-above {
          font-size: 14px;
          line-height: 1;
        }
      }

      .search-field {
        min-width: 260px;
        flex: 1 1 260px;
      }

      button {
        font-size: 14px;
        padding: 6px 12px !important;
        height: 40px;
        min-width: auto;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }
  `]
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
