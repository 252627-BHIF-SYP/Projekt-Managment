import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models';

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
  template: `
    <mat-nav-list>
      <a 
        mat-list-item 
        *ngFor="let item of visibleMenuItems"
        [routerLink]="item.route"
        routerLinkActive="active">
        <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
        <span matListItemTitle>{{ item.label }}</span>
      </a>
    </mat-nav-list>
  `,
  styles: [`
    mat-nav-list {
      padding-top: 8px;

      a {
        margin: 4px 8px;
        border-radius: 4px;
        
        &.active {
          background-color: rgba(63, 81, 181, 0.1);
          color: #3f51b5;
          
          mat-icon {
            color: #3f51b5;
          }
        }

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      }
    }
  `]
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
      roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN, Role.STUDENT_SEARCHING, Role.STUDENT_PROJECT]
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
