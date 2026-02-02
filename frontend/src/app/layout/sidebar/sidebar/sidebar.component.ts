import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: Role[];
}

/**
 * Sidebar navigation component
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Projects',
      icon: 'folder',
      route: '/projects'
    },
    {
      label: 'Create Project',
      icon: 'add_circle',
      route: '/projects/create',
      roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN]
    },
    {
      label: 'Students',
      icon: 'school',
      route: '/students',
      roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN]
    },
    {
      label: 'Import',
      icon: 'upload_file',
      route: '/import',
      roles: [Role.SYS_ADMIN, Role.AV]
    },
    {
      label: 'Profile',
      icon: 'person',
      route: '/profile'
    }
  ];

  visibleMenuItems: MenuItem[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.updateVisibleMenuItems();
    
    // Update menu when user changes
    this.authService.currentUser$.subscribe(() => {
      this.updateVisibleMenuItems();
    });
  }

  private updateVisibleMenuItems(): void {
    this.visibleMenuItems = this.menuItems.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return this.authService.hasAnyRole(item.roles);
    });
  }
}
