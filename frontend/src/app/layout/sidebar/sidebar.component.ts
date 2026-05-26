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
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  // Re-evaluate when current user changes.
  private readonly user = toSignal(this.authService.currentUser$, { initialValue: null });

  private readonly menuItems: MenuItem[] = [
    { label: 'Projects', icon: 'folder', route: '/projects' },
    { label: 'Create Project', icon: 'add_circle', route: '/projects/create', roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN, Role.STUDENT] },
    { label: 'Students', icon: 'school', route: '/students', roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN] },
    { label: 'Create Student', icon: 'person_add', route: '/students/create', roles: [Role.AV, Role.SYS_ADMIN] },
    { label: 'Professors', icon: 'groups', route: '/professors', roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN] },
    { label: 'Create Professor', icon: 'person_add', route: '/professors/create', roles: [Role.AV, Role.SYS_ADMIN] },
    { label: 'Admin Dashboard', icon: 'admin_panel_settings', route: '/admin-dashboard', roles: [Role.SYS_ADMIN, Role.AV] },
    { label: 'Profile', icon: 'person', route: '/profile' }
  ];

  readonly visibleMenuItems = computed<MenuItem[]>(() => {
    // Touch the user signal so this recomputes on login/logout.
    this.user();
    return this.menuItems.filter(item =>
      !item.roles || item.roles.length === 0 || this.authService.hasAnyRole(item.roles)
    );
  });
}
