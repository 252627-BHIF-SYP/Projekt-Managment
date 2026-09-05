import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Role, SchoolYear } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SchoolYearService } from '../../services/schoolyear.service';

/**
 * Topbar with right-aligned navigation matching HTL Leonding corporate design.
 */
@Component({
  selector: 'app-topbar',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly schoolYears = signal<SchoolYear[]>([]);
  protected selectedSchoolYearId = '';
  protected readonly mobileMenuOpen = signal<boolean>(false);

  readonly canManage = computed(() =>
    this.authService.hasAnyRole([Role.PROFESSOR, Role.AV, Role.SYS_ADMIN])
  );

  readonly isAdmin = computed(() =>
    this.authService.hasAnyRole([Role.AV, Role.SYS_ADMIN])
  );

  ngOnInit(): void {
    this.schoolYearService.selectedSchoolYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(year => {
        this.selectedSchoolYearId = year?.id || '';
      });

    this.schoolYearService.getSchoolYears().subscribe(years => {
      this.schoolYears.set(years);
      this.selectedSchoolYearId = this.schoolYearService.getSelectedSchoolYear()?.id || '';
    });
  }

  selectSchoolYear(id: string): void {
    const selectedYear = this.schoolYears().find(year => year.id === id);
    if (selectedYear) {
      this.schoolYearService.selectSchoolYear(selectedYear);
    }
  }

  getRoleLabel(roles?: Role[]): string {
    if (!roles || roles.length === 0) return 'Benutzer';
    const r = roles[0];
    switch (r) {
      case Role.SYS_ADMIN: return 'Admin';
      case Role.AV: return 'Abteilungsvorstand';
      case Role.PROFESSOR: return 'Professor';
      case Role.STUDENT: return 'Schüler';
      default: return r;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
