import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

/**
 * Main layout component with sidebar and topbar
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    TopbarComponent,
    SidebarComponent
  ],
  template: `
    <div class="layout-container">
      <app-topbar></app-topbar>
      
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav 
          mode="side" 
          opened 
          class="sidenav">
          <app-sidebar></app-sidebar>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .layout-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .sidenav-container {
      flex: 1;
      overflow: hidden;
    }

    .sidenav {
      width: 250px;
      border-right: 1px solid rgba(0, 0, 0, 0.12);
    }

    .main-content {
      background-color: #f5f5f5;
      overflow: auto;
    }
  `]
})
export class MainLayoutComponent {}
