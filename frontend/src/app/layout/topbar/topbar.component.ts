import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { User, SchoolYear } from '../../core/models';
import { Observable } from 'rxjs';

/**
 * Topbar component with user menu and school year selector
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary" class="topbar">
      <span class="app-title">School Project Management</span>
      
      <span class="spacer"></span>

      <!-- School Year Selector -->
      <div class="school-year-selector" *ngIf="schoolYears$ | async as schoolYears">
        <mat-icon>calendar_today</mat-icon>
        <select 
          class="year-select"
          [value]="(selectedSchoolYear$ | async)?.id"
          (change)="onSchoolYearChange($event)">
          <option *ngFor="let year of schoolYears" [value]="year.id">
            {{ year.year }}
          </option>
        </select>
      </div>

      <!-- User Menu -->
      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="user-info" mat-menu-item disabled>
          <div class="user-name">{{ (currentUser$ | async)?.firstName }} {{ (currentUser$ | async)?.lastName }}</div>
          <div class="user-email">{{ (currentUser$ | async)?.email }}</div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/profile">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .app-title {
      font-size: 20px;
      font-weight: 500;
    }

    .school-year-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 16px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .year-select {
        background: transparent;
        border: none;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        outline: none;

        option {
          color: black;
        }
      }
    }

    .user-info {
      cursor: default !important;
      
      .user-name {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .user-email {
        font-size: 12px;
        opacity: 0.7;
      }
    }
  `]
})
export class TopbarComponent implements OnInit {
  currentUser$: Observable<User | null>;
  selectedSchoolYear$: Observable<SchoolYear | null>;
  schoolYears$: Observable<SchoolYear[]>;

  constructor(
    private authService: AuthService,
    private schoolYearService: SchoolYearService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.selectedSchoolYear$ = this.schoolYearService.selectedSchoolYear$;
    this.schoolYears$ = this.schoolYearService.getSchoolYears();
  }

  ngOnInit(): void {}

  onSchoolYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const yearId = select.value;
    
    this.schoolYears$.subscribe(years => {
      const selectedYear = years.find(y => y.id === yearId);
      if (selectedYear) {
        this.schoolYearService.selectSchoolYear(selectedYear);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
