import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { SchoolYearService } from '../../../services/schoolyear.service';
import { User, SchoolYear } from '../../../core/models';
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
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
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
