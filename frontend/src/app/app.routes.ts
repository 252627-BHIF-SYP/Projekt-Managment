import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { Role } from './core/models';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ProjectCreateComponent } from './pages/project-create/project-create.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ImportComponent } from './pages/import/import.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

/**
 * Application routes
 */
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'projects',
        component: ProjectListComponent
      },
      {
        path: 'projects/create',
        component: ProjectCreateComponent,
        canActivate: [roleGuard],
        data: { roles: [Role.PROFESSOR, Role.AV, Role.SYS_ADMIN] }
      },
      {
        path: 'projects/:id',
        component: ProjectDetailComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'import',
        component: ImportComponent,
        canActivate: [roleGuard],
        data: { roles: [Role.SYS_ADMIN, Role.AV] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
