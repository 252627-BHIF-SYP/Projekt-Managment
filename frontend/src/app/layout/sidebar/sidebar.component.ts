import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: Role[];
}

/**
 * Sidebar navigation. Items are filtered against the current user roles.
 */
@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  // Re-evaluate when current user changes.
  private readonly user = toSignal(this.authService.currentUser$, { initialValue: null });

  private readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Projekte', icon: 'folder', route: '/projects' },
    { label: 'Wettbewerbe', icon: 'emoji_events', route: '/competitions' },
    { label: 'Jury-Portal', icon: 'gavel', route: '/jury' },
    { label: 'Partnerschulen', icon: 'domain', route: '/external-portal' },
    { label: 'Projekt anlegen', icon: 'add_circle', route: '/projects/create' },
    { label: 'Schüler', icon: 'school', route: '/students', roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN] },
    { label: 'Schüler erfassen', icon: 'person_add', route: '/students/create', roles: [Role.AV, Role.SYS_ADMIN] },
    { label: 'Betreuer / Professoren', icon: 'groups', route: '/professors', roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN] },
    { label: 'Betreuer erfassen', icon: 'person_add', route: '/professors/create', roles: [Role.AV, Role.SYS_ADMIN] },
    { label: 'Administration', icon: 'admin_panel_settings', route: '/admin-dashboard', roles: [Role.SYS_ADMIN, Role.AV] },
    { label: 'Mein Profil', icon: 'account_circle', route: '/profile' }
  ];

  readonly visibleMenuItems = computed<MenuItem[]>(() => {
    // Touch the user signal so this recomputes on login/logout.
    this.user();
    return this.menuItems.filter(item =>
      !item.roles || item.roles.length === 0 || this.authService.hasAnyRole(item.roles)
    );
  });
}
